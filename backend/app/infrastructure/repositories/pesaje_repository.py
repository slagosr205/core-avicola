from __future__ import annotations

from datetime import datetime
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.exc import DBAPIError, OperationalError

from app.core.database import AsyncSessionLocal
from app.db.models import Lote as DbLote, Pesaje as DbPesaje
from app.domain.entities.pesaje import Pesaje as DomainPesaje
from app.application.dto.pesaje import PesajeCreate, PesajeUpdate


class _InMemoryPesajeRepository:
    def __init__(self):
        self._rows: List[DomainPesaje] = []

    async def get_all(self, lote_id: Optional[str] = None) -> List[DomainPesaje]:
        return (
            list(self._rows)
            if not lote_id
            else [p for p in self._rows if p.lote_id == lote_id]
        )

    async def get_by_id(self, pesaje_id: str) -> Optional[DomainPesaje]:
        for p in self._rows:
            if p.id == pesaje_id:
                return p
        return None

    async def create(self, data: PesajeCreate) -> DomainPesaje:
        peso_promedio = data.peso_total_muestra / data.cantidad_muestreada

        # En memoria no calculamos peso_anterior/variacion de forma sofisticada.
        pesaje = DomainPesaje(
            id=str(uuid.uuid4()),
            lote_id=data.lote_id,
            semana=data.semana,
            fecha=data.fecha,
            cantidad_muestreada=data.cantidad_muestreada,
            peso_total_muestra=data.peso_total_muestra,
            peso_promedio=peso_promedio,
            peso_anterior=None,
            variacion_semanal=None,
            observaciones=data.observaciones,
            created_at=datetime.utcnow(),
            created_by=None,
        )
        self._rows.append(pesaje)
        return pesaje

    async def update(
        self, pesaje_id: str, data: PesajeUpdate
    ) -> Optional[DomainPesaje]:
        for i, p in enumerate(self._rows):
            if p.id != pesaje_id:
                continue

            if data.peso_total_muestra is not None:
                p.peso_total_muestra = data.peso_total_muestra
                p.peso_promedio = data.peso_total_muestra / p.cantidad_muestreada
                p.variacion_semanal = (
                    p.peso_promedio - p.peso_anterior
                    if p.peso_anterior is not None
                    else None
                )
            if data.observaciones is not None:
                p.observaciones = data.observaciones

            self._rows[i] = p
            return p
        return None

    async def delete(self, pesaje_id: str) -> bool:
        for i, p in enumerate(self._rows):
            if p.id == pesaje_id:
                self._rows.pop(i)
                return True
        return False


class PesajeRepository:
    """Repositorio de pesajes.

    Prioriza persistencia en BD. Si la BD no está disponible, cae a memoria.
    """

    def __init__(self):
        self._mem = _InMemoryPesajeRepository()
        self._db_disabled = False

    def _disable_db(self, err: Exception) -> None:
        if not self._db_disabled:
            print(f"[WARN][Pesajes] DB deshabilitada, usando memoria: {err}")
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

    def _to_domain(self, row: DbPesaje) -> DomainPesaje:
        return DomainPesaje(
            id=str(row.id),
            lote_id=str(row.lote_id),
            semana=row.semana,
            fecha=row.fecha,
            cantidad_muestreada=row.cantidad_muestreada,
            peso_total_muestra=row.peso_total_muestra,
            peso_promedio=row.peso_promedio,
            peso_anterior=row.peso_anterior,
            variacion_semanal=row.variacion_semanal,
            observaciones=row.observaciones,
            created_at=row.created_at,
            created_by=row.created_by,
        )

    async def get_all(self, lote_id: Optional[str] = None) -> List[DomainPesaje]:
        if self._db_disabled:
            return await self._mem.get_all(lote_id)

        try:
            async with AsyncSessionLocal() as session:
                stmt = select(DbPesaje).order_by(
                    DbPesaje.fecha.desc(), DbPesaje.created_at.desc()
                )
                if lote_id:
                    stmt = stmt.where(DbPesaje.lote_id == lote_id)
                res = await session.execute(stmt)
                return [self._to_domain(r) for r in res.scalars().all()]
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.get_all(lote_id)
            raise

    async def get_by_id(self, pesaje_id: str) -> Optional[DomainPesaje]:
        if self._db_disabled:
            return await self._mem.get_by_id(pesaje_id)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbPesaje).where(DbPesaje.id == pesaje_id)
                )
                row = res.scalar_one_or_none()
                return self._to_domain(row) if row else None
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.get_by_id(pesaje_id)
            raise

    async def _get_previous_peso_promedio(
        self, lote_id: str, semana: int
    ) -> Optional[float]:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbPesaje)
                .where(DbPesaje.lote_id == lote_id, DbPesaje.semana < semana)
                .order_by(
                    DbPesaje.semana.desc(),
                    DbPesaje.fecha.desc(),
                    DbPesaje.created_at.desc(),
                )
                .limit(1)
            )
            prev = res.scalar_one_or_none()
            return float(prev.peso_promedio) if prev else None

    async def create(self, data: PesajeCreate) -> DomainPesaje:
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

                peso_promedio = data.peso_total_muestra / data.cantidad_muestreada

                prev_res = await session.execute(
                    select(DbPesaje)
                    .where(
                        DbPesaje.lote_id == data.lote_id, DbPesaje.semana < data.semana
                    )
                    .order_by(
                        DbPesaje.semana.desc(),
                        DbPesaje.fecha.desc(),
                        DbPesaje.created_at.desc(),
                    )
                    .limit(1)
                )
                prev = prev_res.scalar_one_or_none()
                peso_anterior = float(prev.peso_promedio) if prev else None
                variacion = (
                    (peso_promedio - peso_anterior)
                    if peso_anterior is not None
                    else None
                )

                row = DbPesaje(
                    id=str(uuid.uuid4()),
                    lote_id=data.lote_id,
                    semana=data.semana,
                    fecha=data.fecha,
                    cantidad_muestreada=data.cantidad_muestreada,
                    peso_total_muestra=data.peso_total_muestra,
                    peso_promedio=peso_promedio,
                    peso_anterior=peso_anterior,
                    variacion_semanal=variacion,
                    observaciones=data.observaciones,
                    created_at=datetime.utcnow(),
                    created_by=None,
                )

                # Peso actual del lote (último pesaje registrado).
                lote.peso_promedio_actual = peso_promedio

                session.add(row)
                await session.commit()
                await session.refresh(row)
                return self._to_domain(row)
        except ValueError:
            raise
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.create(data)
            raise

    async def update(
        self, pesaje_id: str, data: PesajeUpdate
    ) -> Optional[DomainPesaje]:
        if self._db_disabled:
            return await self._mem.update(pesaje_id, data)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbPesaje).where(DbPesaje.id == pesaje_id)
                )
                row = res.scalar_one_or_none()
                if not row:
                    return None

                if data.peso_total_muestra is not None:
                    row.peso_total_muestra = data.peso_total_muestra
                    row.peso_promedio = (
                        data.peso_total_muestra / row.cantidad_muestreada
                    )

                    # Mantiene/actualiza variación con el anterior.
                    if row.peso_anterior is None:
                        prev_res = await session.execute(
                            select(DbPesaje)
                            .where(
                                DbPesaje.lote_id == row.lote_id,
                                DbPesaje.semana < row.semana,
                            )
                            .order_by(
                                DbPesaje.semana.desc(),
                                DbPesaje.fecha.desc(),
                                DbPesaje.created_at.desc(),
                            )
                            .limit(1)
                        )
                        prev = prev_res.scalar_one_or_none()
                        row.peso_anterior = float(prev.peso_promedio) if prev else None

                    row.variacion_semanal = (
                        float(row.peso_promedio) - float(row.peso_anterior)
                        if row.peso_anterior is not None
                        else None
                    )

                    lote_res = await session.execute(
                        select(DbLote).where(DbLote.id == row.lote_id)
                    )
                    lote = lote_res.scalar_one_or_none()
                    if lote:
                        lote.peso_promedio_actual = float(row.peso_promedio)

                if data.observaciones is not None:
                    row.observaciones = data.observaciones

                await session.commit()
                await session.refresh(row)
                return self._to_domain(row)
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.update(pesaje_id, data)
            raise

    async def delete(self, pesaje_id: str) -> bool:
        if self._db_disabled:
            return await self._mem.delete(pesaje_id)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbPesaje).where(DbPesaje.id == pesaje_id)
                )
                row = res.scalar_one_or_none()
                if not row:
                    return False
                await session.delete(row)
                await session.commit()
                return True
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.delete(pesaje_id)
            raise


pesaje_repository = PesajeRepository()
