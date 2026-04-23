from __future__ import annotations

from typing import Optional, List

from sqlalchemy import select, func, delete, extract
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.exc import DBAPIError, OperationalError

from app.core.database import AsyncSessionLocal
from app.db.models import (
    Lote as DbLote,
    TipoLote as DbTipoLote,
    EstadoLote as DbEstadoLote,
)
from app.domain.entities.lote import Lote as DomainLote
from app.domain.value_objects.enums import TipoLote, EstadoLote


class _InMemoryLoteRepository:
    def __init__(self):
        self._lotes: List[DomainLote] = []

    async def get_all(self, estado: Optional[str] = None) -> List[DomainLote]:
        if estado:
            return [l for l in self._lotes if l.estado.value == estado]
        return list(self._lotes)

    async def get_by_id(self, lote_id: str) -> Optional[DomainLote]:
        for lote in self._lotes:
            if lote.id == lote_id:
                return lote
        return None

    async def get_by_numero(self, numero: str) -> Optional[DomainLote]:
        for lote in self._lotes:
            if lote.numero_lote == numero:
                return lote
        return None

    async def create(self, lote: DomainLote) -> DomainLote:
        self._lotes.append(lote)
        return lote

    async def update(self, lote: DomainLote) -> DomainLote:
        for i, existing in enumerate(self._lotes):
            if existing.id == lote.id:
                self._lotes[i] = lote
                return lote
        raise ValueError(f"Lote {lote.id} no encontrado")

    async def delete(self, lote_id: str) -> bool:
        for i, lote in enumerate(self._lotes):
            if lote.id == lote_id:
                self._lotes.pop(i)
                return True
        return False

    async def count_by_year(self, year: int) -> int:
        return sum(1 for l in self._lotes if l.fecha_ingreso.year == year)


class LoteRepository:
    """Repositorio de lotes.

    Prioriza persistencia en BD. Si la BD no está disponible (por ejemplo, en dev),
    cae a un repositorio en memoria para no bloquear la app.
    """

    def __init__(self):
        self._mem = _InMemoryLoteRepository()
        self._db_disabled = False

    def _disable_db(self, err: Exception) -> None:
        if not self._db_disabled:
            print(f"[WARN][Lotes] DB deshabilitada, usando memoria: {err}")
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

    def _to_domain(self, row: DbLote) -> DomainLote:
        return DomainLote(
            id=str(row.id),
            numero_lote=row.numero_lote,
            tipo_lote=TipoLote(
                row.tipo_lote.value
                if hasattr(row.tipo_lote, "value")
                else str(row.tipo_lote)
            ),
            estado=EstadoLote(
                row.estado.value if hasattr(row.estado, "value") else str(row.estado)
            ),
            cantidad_inicial=row.cantidad_inicial,
            cantidad_actual=row.cantidad_actual,
            peso_promedio_inicial=row.peso_promedio_inicial,
            peso_promedio_actual=row.peso_promedio_actual,
            fecha_ingreso=row.fecha_ingreso,
            fecha_cierre=row.fecha_cierre,
            fecha_liquidacion=row.fecha_liquidacion,
            observaciones=row.observaciones,
            granja_id=row.granja_id,
            galpon_id=row.galpon_id,
            tercero_id=row.tercero_id,
            created_at=row.created_at,
            updated_at=row.updated_at,
            created_by=row.created_by,
        )

    async def get_all(self, estado: Optional[str] = None) -> List[DomainLote]:
        if self._db_disabled:
            return await self._mem.get_all(estado)

        try:
            async with AsyncSessionLocal() as session:
                stmt = select(DbLote)
                if estado:
                    stmt = stmt.where(DbLote.estado == DbEstadoLote(estado))
                stmt = stmt.order_by(DbLote.created_at.desc())
                res = await session.execute(stmt)
                return [self._to_domain(r) for r in res.scalars().all()]
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.get_all(estado)
            raise

    async def get_by_id(self, lote_id: str) -> Optional[DomainLote]:
        if self._db_disabled:
            return await self._mem.get_by_id(lote_id)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(DbLote).where(DbLote.id == lote_id))
                row = res.scalar_one_or_none()
                return self._to_domain(row) if row else None
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.get_by_id(lote_id)
            raise

    async def get_by_numero(self, numero: str) -> Optional[DomainLote]:
        if self._db_disabled:
            return await self._mem.get_by_numero(numero)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbLote).where(DbLote.numero_lote == numero)
                )
                row = res.scalar_one_or_none()
                return self._to_domain(row) if row else None
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.get_by_numero(numero)
            raise

    async def create(self, lote: DomainLote) -> DomainLote:
        if self._db_disabled:
            return await self._mem.create(lote)

        try:
            async with AsyncSessionLocal() as session:
                row = DbLote(
                    id=lote.id,
                    numero_lote=lote.numero_lote,
                    tipo_lote=DbTipoLote(lote.tipo_lote.value),
                    estado=DbEstadoLote(lote.estado.value),
                    cantidad_inicial=lote.cantidad_inicial,
                    cantidad_actual=lote.cantidad_actual,
                    peso_promedio_inicial=lote.peso_promedio_inicial,
                    peso_promedio_actual=lote.peso_promedio_actual,
                    fecha_ingreso=lote.fecha_ingreso,
                    fecha_cierre=lote.fecha_cierre,
                    fecha_liquidacion=lote.fecha_liquidacion,
                    observaciones=lote.observaciones,
                    granja_id=lote.granja_id,
                    galpon_id=lote.galpon_id,
                    tercero_id=lote.tercero_id,
                    created_at=lote.created_at,
                    updated_at=lote.updated_at,
                    created_by=lote.created_by,
                )
                session.add(row)
                await session.commit()
                await session.refresh(row)
                return self._to_domain(row)
        except SQLAlchemyError as e:
            # Si cae por constraint (ej: numero_lote unique), mostramos el error real.
            raise
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.create(lote)
            raise

    async def update(self, lote: DomainLote) -> DomainLote:
        if self._db_disabled:
            return await self._mem.update(lote)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(DbLote).where(DbLote.id == lote.id))
                row = res.scalar_one_or_none()
                if not row:
                    raise ValueError(f"Lote {lote.id} no encontrado")

                row.tipo_lote = DbTipoLote(lote.tipo_lote.value)
                row.estado = DbEstadoLote(lote.estado.value)
                row.cantidad_inicial = lote.cantidad_inicial
                row.cantidad_actual = lote.cantidad_actual
                row.peso_promedio_inicial = lote.peso_promedio_inicial
                row.peso_promedio_actual = lote.peso_promedio_actual
                row.fecha_ingreso = lote.fecha_ingreso
                row.fecha_cierre = lote.fecha_cierre
                row.fecha_liquidacion = lote.fecha_liquidacion
                row.observaciones = lote.observaciones
                row.granja_id = lote.granja_id
                row.galpon_id = lote.galpon_id
                row.tercero_id = lote.tercero_id
                row.updated_at = lote.updated_at

                await session.commit()
                await session.refresh(row)
                return self._to_domain(row)
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.update(lote)
            raise

    async def delete(self, lote_id: str) -> bool:
        if self._db_disabled:
            return await self._mem.delete(lote_id)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(delete(DbLote).where(DbLote.id == lote_id))
                await session.commit()
                return (res.rowcount or 0) > 0
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.delete(lote_id)
            raise

    async def count_by_year(self, year: int) -> int:
        if self._db_disabled:
            return await self._mem.count_by_year(year)

        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(func.count())
                    .select_from(DbLote)
                    .where(extract("year", DbLote.fecha_ingreso) == year)
                )
                return int(res.scalar_one())
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.count_by_year(year)
            raise


lote_repository = LoteRepository()
