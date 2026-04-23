from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.exc import DBAPIError, OperationalError

from app.core.database import AsyncSessionLocal
from app.db.models import CostoCrianza as DbCosto
from app.domain.entities.pesaje import CostoCrianza as DomainCosto
from app.application.dto.consumo import CostoCreate


class _InMemoryCostoRepository:
    def __init__(self):
        self._rows: List[DomainCosto] = []

    async def get_all(self, lote_id: Optional[str] = None) -> List[DomainCosto]:
        return (
            list(self._rows)
            if not lote_id
            else [c for c in self._rows if c.lote_id == lote_id]
        )

    async def create(self, data: CostoCreate) -> DomainCosto:
        import uuid

        row = DomainCosto(
            id=str(uuid.uuid4()),
            lote_id=data.lote_id,
            tipo_costo=data.tipo_costo,
            descripcion=data.descripcion,
            monto=float(data.monto),
            fecha=data.fecha,
            comprobante=None,
            created_at=datetime.utcnow(),
            created_by=None,
        )
        self._rows.append(row)
        return row


class CostoRepository:
    """Repositorio de costos de cria (costos_crianza) persistido en BD."""

    def __init__(self):
        self._mem = _InMemoryCostoRepository()
        self._db_disabled = False

    def _disable_db(self, err: Exception) -> None:
        if not self._db_disabled:
            print(f"[WARN][Costos] DB deshabilitada, usando memoria: {err}")
        self._db_disabled = True

    def _should_fallback_to_memory(self, err: Exception) -> bool:
        if isinstance(err, OperationalError):
            return True
        if isinstance(err, DBAPIError) and bool(
            getattr(err, "connection_invalidated", False)
        ):
            return True
        return False

    def _to_domain(self, row: DbCosto) -> DomainCosto:
        return DomainCosto(
            id=str(row.id),
            lote_id=str(row.lote_id) if row.lote_id else None,
            tipo_costo=str(row.tipo_costo.value) if row.tipo_costo else "",
            descripcion=row.descripcion,
            monto=float(row.monto) if row.monto else 0.0,
            fecha=row.fecha,
            comprobante=row.comprobante,
            created_at=row.created_at,
            created_by=row.created_by,
        )

    async def get_all(self, lote_id: Optional[str] = None) -> List[DomainCosto]:
        if self._db_disabled:
            return await self._mem.get_all(lote_id)

        try:
            async with AsyncSessionLocal() as session:
                stmt = select(DbCosto).order_by(
                    DbCosto.fecha.desc(), DbCosto.created_at.desc()
                )
                if lote_id:
                    stmt = stmt.where(DbCosto.lote_id == lote_id)
                res = await session.execute(stmt)
                return [self._to_domain(r) for r in res.scalars().all()]
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.get_all(lote_id)
            raise

    async def create(self, data: CostoCreate) -> DomainCosto:
        if self._db_disabled:
            return await self._mem.create(data)

        try:
            async with AsyncSessionLocal() as session:
                import uuid

                row = DbCosto(
                    id=str(uuid.uuid4()),
                    lote_id=data.lote_id,
                    tipo_costo=data.tipo_costo,
                    descripcion=data.descripcion,
                    monto=float(data.monto),
                    fecha=data.fecha,
                    created_at=datetime.utcnow(),
                    created_by=None,
                )
                session.add(row)
                await session.commit()
                await session.refresh(row)
                return self._to_domain(row)
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                return await self._mem.create(data)
            raise


costo_repository = CostoRepository()
