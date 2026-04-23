from __future__ import annotations

from datetime import datetime
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.exc import DBAPIError, OperationalError

from app.core.database import AsyncSessionLocal
from app.db.models import (
    Lote as DbLote,
    Mortalidad as DbMortalidad,
    CausaMortalidad as DbCausaMortalidad,
)
from app.domain.entities.pesaje import Mortalidad as DomainMortalidad
from app.application.dto.pesaje import MortalidadCreate, MortalidadUpdate


class _InMemoryMortalidadRepository:
    def __init__(self):
        self._rows: List[DomainMortalidad] = []

    async def get_all(self, lote_id: Optional[str] = None) -> List[DomainMortalidad]:
        return (
            list(self._rows)
            if not lote_id
            else [m for m in self._rows if m.lote_id == lote_id]
        )

    async def get_by_id(self, mortalidad_id: str) -> Optional[DomainMortalidad]:
        for m in self._rows:
            if m.id == mortalidad_id:
                return m
        return None

    async def create(self, data: MortalidadCreate) -> DomainMortalidad:
        mortalidad = DomainMortalidad(
            id=str(uuid.uuid4()),
            lote_id=data.lote_id,
            fecha=data.fecha,
            cantidad=data.cantidad,
            causa=data.causa.value,
            peso_estimado=data.peso_estimado,
            observaciones=data.observaciones,
            created_at=datetime.utcnow(),
            created_by=None,
        )
        self._rows.append(mortalidad)
        return mortalidad

    async def update(
        self, mortalidad_id: str, data: MortalidadUpdate
    ) -> Optional[DomainMortalidad]:
        for i, m in enumerate(self._rows):
            if m.id != mortalidad_id:
                continue

            if data.fecha is not None:
                m.fecha = data.fecha
            if data.cantidad is not None:
                m.cantidad = data.cantidad
            if data.causa is not None:
                m.causa = data.causa.value
            if data.observaciones is not None:
                m.observaciones = data.observaciones

            self._rows[i] = m
            return m
        return None

    async def delete(self, mortalidad_id: str) -> bool:
        for i, m in enumerate(self._rows):
            if m.id == mortalidad_id:
                self._rows.pop(i)
                return True
        return False


class MortalidadRepository:
    """Repositorio de mortalidad.

    Prioriza persistencia en BD. Si la BD no está disponible, cae a memoria.
    """

    def __init__(self):
        self._mem = _InMemoryMortalidadRepository()
        self._db_disabled = False

    def _disable_db(self, err: Exception) -> None:
        if not self._db_disabled:
            print(f"[WARN][Mortalidad] DB deshabilitada, usando memoria: {err}")
        self._db_disabled = True

    def _should_fallback_to_memory(self, err: Exception) -> bool:
        # Solo caer a memoria si la BD realmente no esta disponible.
        if isinstance(err, OperationalError):
            return True
        if isinstance(err, DBAPIError) and bool(
            getattr(err, "connection_invalidated", False)
        ):
            return True
        return False

    def _to_domain(self, row: DbMortalidad) -> DomainMortalidad:
        return DomainMortalidad(
            id=str(row.id),
            lote_id=str(row.lote_id),
            fecha=row.fecha,
            cantidad=row.cantidad,
            causa=row.causa.value if hasattr(row.causa, "value") else str(row.causa),
            peso_estimado=row.peso_estimado,
            observaciones=row.observaciones,
            created_at=row.created_at,
            created_by=row.created_by,
        )

    def _clamp_cantidad_actual(self, lote: DbLote) -> None:
        # Evita negativos y evita superar la cantidad inicial.
        if lote.cantidad_actual is None:
            return
        if lote.cantidad_actual < 0:
            lote.cantidad_actual = 0
        if (
            lote.cantidad_inicial is not None
            and lote.cantidad_actual > lote.cantidad_inicial
        ):
            lote.cantidad_actual = lote.cantidad_inicial

    async def get_all(self, lote_id: Optional[str] = None) -> List[DomainMortalidad]:
        if self._db_disabled:
            return await self._mem.get_all(lote_id)

        try:
            async with AsyncSessionLocal() as session:
                stmt = select(DbMortalidad).order_by(DbMortalidad.created_at.desc())
                if lote_id:
                    stmt = stmt.where(DbMortalidad.lote_id == lote_id)
                res = await session.execute(stmt)
                return [self._to_domain(r) for r in res.scalars().all()]
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.get_all(lote_id)
            raise

    async def get_by_id(self, mortalidad_id: str) -> Optional[DomainMortalidad]:
        if self._db_disabled:
            return await self._mem.get_by_id(mortalidad_id)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbMortalidad).where(DbMortalidad.id == mortalidad_id)
                )
                row = res.scalar_one_or_none()
                return self._to_domain(row) if row else None
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.get_by_id(mortalidad_id)
            raise

    async def create(self, data: MortalidadCreate) -> DomainMortalidad:
        if self._db_disabled:
            return await self._mem.create(data)

        try:
            async with AsyncSessionLocal() as session:
                lote_res = await session.execute(
                    select(DbLote).where(DbLote.id == data.lote_id)
                )
                lote = lote_res.scalar_one_or_none()
                if not lote:
                    raise ValueError("Lote no encontrado")

                # Ajuste de inventario vivo.
                lote.cantidad_actual = (lote.cantidad_actual or 0) - data.cantidad
                self._clamp_cantidad_actual(lote)

                peso_base = lote.peso_promedio_actual or 3.2
                peso_estimado = (
                    data.peso_estimado
                    if data.peso_estimado is not None
                    else (data.cantidad * float(peso_base))
                )

                row = DbMortalidad(
                    id=str(uuid.uuid4()),
                    lote_id=data.lote_id,
                    fecha=data.fecha,
                    cantidad=data.cantidad,
                    causa=DbCausaMortalidad(data.causa.value),
                    peso_estimado=peso_estimado,
                    observaciones=data.observaciones,
                    created_at=datetime.utcnow(),
                    created_by=None,
                )

                session.add(row)
                await session.commit()
                await session.refresh(row)
                return self._to_domain(row)
        except ValueError:
            # Error funcional (ej: lote inexistente). No deshabilitar DB.
            raise
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.create(data)
            raise

    async def update(
        self, mortalidad_id: str, data: MortalidadUpdate
    ) -> Optional[DomainMortalidad]:
        if self._db_disabled:
            return await self._mem.update(mortalidad_id, data)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbMortalidad).where(DbMortalidad.id == mortalidad_id)
                )
                row = res.scalar_one_or_none()
                if not row:
                    return None

                lote_res = await session.execute(
                    select(DbLote).where(DbLote.id == row.lote_id)
                )
                lote = lote_res.scalar_one_or_none()
                if not lote:
                    return None

                # Si cambia la cantidad, ajustamos el inventario por el delta.
                if data.cantidad is not None:
                    delta = int(data.cantidad) - int(row.cantidad)
                    lote.cantidad_actual = (lote.cantidad_actual or 0) - delta
                    self._clamp_cantidad_actual(lote)
                    row.cantidad = int(data.cantidad)

                    peso_base = lote.peso_promedio_actual or 3.2
                    row.peso_estimado = row.cantidad * float(peso_base)

                if data.fecha is not None:
                    row.fecha = data.fecha
                if data.causa is not None:
                    row.causa = DbCausaMortalidad(data.causa.value)
                if data.observaciones is not None:
                    row.observaciones = data.observaciones

                await session.commit()
                await session.refresh(row)
                return self._to_domain(row)
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.update(mortalidad_id, data)
            raise

    async def delete(self, mortalidad_id: str) -> bool:
        if self._db_disabled:
            return await self._mem.delete(mortalidad_id)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbMortalidad).where(DbMortalidad.id == mortalidad_id)
                )
                row = res.scalar_one_or_none()
                if not row:
                    return False

                lote_res = await session.execute(
                    select(DbLote).where(DbLote.id == row.lote_id)
                )
                lote = lote_res.scalar_one_or_none()
                if lote:
                    # Revertimos el impacto del registro eliminado.
                    lote.cantidad_actual = (lote.cantidad_actual or 0) + int(
                        row.cantidad
                    )
                    self._clamp_cantidad_actual(lote)

                await session.delete(row)
                await session.commit()
                return True
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.delete(mortalidad_id)
            raise


mortalidad_repository = MortalidadRepository()
