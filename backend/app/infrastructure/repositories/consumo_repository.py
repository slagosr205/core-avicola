from __future__ import annotations

from datetime import datetime
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.exc import DBAPIError, OperationalError

from app.core.database import AsyncSessionLocal
from app.db.models import ConsumoInsumo as DbConsumo
from app.domain.entities.pesaje import ConsumoInsumo as DomainConsumo
from app.application.dto.consumo import ConsumoCreate


class _InMemoryConsumoRepository:
    def __init__(self):
        self._rows: List[DomainConsumo] = []

    async def get_all(self, lote_id: Optional[str] = None) -> List[DomainConsumo]:
        return (
            list(self._rows)
            if not lote_id
            else [c for c in self._rows if c.lote_id == lote_id]
        )

    async def create(
        self,
        consumo_id: str,
        tipo: str,
        lote_id: str,
        insumo_id: str,
        fecha,
        cantidad: float,
        costo_unitario: float,
        costo_total: float,
    ) -> DomainConsumo:
        if self._db_disabled:
            from datetime import datetime

            row = DomainConsumo(
                id=consumo_id,
                lote_id=lote_id,
                insumo_id=insumo_id,
                fecha=fecha,
                cantidad=cantidad,
                costo_unitario=costo_unitario,
                costo_total=costo_total,
                tipo=tipo,
                created_at=datetime.utcnow(),
                created_by=None,
            )
            self._rows.append(row)
            return row

        try:
            async with AsyncSessionLocal() as session:
                row = DbConsumo(
                    id=consumo_id,
                    lote_id=lote_id,
                    insumo_id=insumo_id,
                    fecha=fecha,
                    cantidad=float(cantidad),
                    costo_unitario=float(costo_unitario),
                    costo_total=float(costo_total),
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
                from datetime import datetime

                row = DomainConsumo(
                    id=consumo_id,
                    lote_id=lote_id,
                    insumo_id=insumo_id,
                    fecha=fecha,
                    cantidad=cantidad,
                    costo_unitario=costo_unitario,
                    costo_total=costo_total,
                    tipo=tipo,
                    created_at=datetime.utcnow(),
                    created_by=None,
                )
                self._rows.append(row)
                return row
            raise


class ConsumoRepository:
    """Repositorio de consumos (consumos_insumo) persistido en BD."""

    def __init__(self):
        self._mem = _InMemoryConsumoRepository()
        self._db_disabled = False

    def _disable_db(self, err: Exception) -> None:
        if not self._db_disabled:
            print(f"[WARN][Consumos] DB deshabilitada, usando memoria: {err}")
        self._db_disabled = True

    def _should_fallback_to_memory(self, err: Exception) -> bool:
        if isinstance(err, OperationalError):
            return True
        if isinstance(err, DBAPIError) and bool(
            getattr(err, "connection_invalidated", False)
        ):
            return True
        return False

    def _to_domain(self, row: DbConsumo) -> DomainConsumo:
        return DomainConsumo(
            id=str(row.id),
            lote_id=str(row.lote_id),
            insumo_id=str(row.insumo_id),
            fecha=row.fecha,
            cantidad=row.cantidad,
            costo_unitario=row.costo_unitario,
            costo_total=row.costo_total,
            created_at=row.created_at,
            created_by=row.created_by,
        )

    async def get_all(
        self, lote_id: Optional[str] = None, tipo: Optional[str] = None
    ) -> List[DomainConsumo]:
        if self._db_disabled:
            rows = await self._mem.get_all(lote_id)
            if tipo:
                rows = [c for c in rows if getattr(c, "tipo", None) == tipo]
            return rows

        try:
            async with AsyncSessionLocal() as session:
                stmt = select(DbConsumo).order_by(
                    DbConsumo.fecha.desc(), DbConsumo.created_at.desc()
                )
                if lote_id:
                    stmt = stmt.where(DbConsumo.lote_id == lote_id)
                res = await session.execute(stmt)
                rows = [self._to_domain(r) for r in res.scalars().all()]
                if tipo:
                    rows = [c for c in rows if getattr(c, "tipo", None) == tipo]
                return rows
        except Exception as e:
            if self._should_fallback_to_memory(e):
                self._disable_db(e)
                rows = await self._mem.get_all(lote_id)
                if tipo:
                    rows = [c for c in rows if getattr(c, "tipo", None) == tipo]
                return rows
            raise

    async def create(
        self,
        consumo_id: str,
        data: ConsumoCreate,
        *,
        costo_unitario: float,
        costo_total: float,
    ) -> DomainConsumo:
        if self._db_disabled:
            return await self._mem.create(
                consumo_id, data, costo_unitario=costo_unitario, costo_total=costo_total
            )

        try:
            async with AsyncSessionLocal() as session:
                row = DbConsumo(
                    id=consumo_id,
                    lote_id=data.lote_id,
                    insumo_id=data.insumo_id,
                    fecha=data.fecha,
                    cantidad=float(data.cantidad),
                    costo_unitario=float(costo_unitario),
                    costo_total=float(costo_total),
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
                return await self._mem.create(
                    consumo_id,
                    data,
                    costo_unitario=costo_unitario,
                    costo_total=costo_total,
                )
            raise


consumo_repository = ConsumoRepository()
