from __future__ import annotations

from datetime import datetime
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.exc import DBAPIError, OperationalError

from app.core.database import AsyncSessionLocal
from app.db.models import Insumo as DbInsumo, TipoInsumo as DbTipoInsumo
from app.domain.value_objects.enums import TipoInsumo
from app.application.dto.insumo import InsumoCreate, InsumoUpdate


class InsumoRepository:
    def __init__(self):
        self._db_disabled = False

    def _disable_db(self, err: Exception) -> None:
        if not self._db_disabled:
            print(f"[WARN][Insumos] DB deshabilitada: {err}")
        self._db_disabled = True

    def _should_fallback(self, err: Exception) -> bool:
        if isinstance(err, OperationalError):
            return True
        if isinstance(err, DBAPIError) and bool(
            getattr(err, "connection_invalidated", False)
        ):
            return True
        return False

    async def list(self, tipo: Optional[str] = None) -> List[DbInsumo]:
        try:
            async with AsyncSessionLocal() as session:
                stmt = select(DbInsumo).order_by(DbInsumo.nombre.asc())
                if tipo:
                    stmt = stmt.where(DbInsumo.tipo == DbTipoInsumo(tipo))
                res = await session.execute(stmt)
                return res.scalars().all()
        except Exception as e:
            if self._should_fallback(e):
                self._disable_db(e)
            raise

    async def get(self, insumo_id: str) -> Optional[DbInsumo]:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbInsumo).where(DbInsumo.id == insumo_id)
                )
                return res.scalar_one_or_none()
        except Exception as e:
            if self._should_fallback(e):
                self._disable_db(e)
            raise

    async def create(self, data: InsumoCreate) -> DbInsumo:
        try:
            async with AsyncSessionLocal() as session:
                row = DbInsumo(
                    id=str(uuid.uuid4()),
                    codigo=data.codigo,
                    nombre=data.nombre,
                    tipo=DbTipoInsumo(data.tipo.value),
                    unidad=data.unidad,
                    proveedor_id=data.proveedor_id,
                    costo_unitario=data.costo_unitario,
                    activo=data.activo,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                session.add(row)
                await session.commit()
                await session.refresh(row)
                return row
        except Exception as e:
            if self._should_fallback(e):
                self._disable_db(e)
            raise

    async def update(self, insumo_id: str, data: InsumoUpdate) -> Optional[DbInsumo]:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(DbInsumo).where(DbInsumo.id == insumo_id)
                )
                row = res.scalar_one_or_none()
                if not row:
                    return None

                if data.nombre is not None:
                    row.nombre = data.nombre
                if data.tipo is not None:
                    row.tipo = DbTipoInsumo(data.tipo.value)
                if data.unidad is not None:
                    row.unidad = data.unidad
                if data.proveedor_id is not None:
                    row.proveedor_id = data.proveedor_id
                if data.costo_unitario is not None:
                    row.costo_unitario = data.costo_unitario
                if data.activo is not None:
                    row.activo = data.activo

                row.updated_at = datetime.utcnow()
                await session.commit()
                await session.refresh(row)
                return row
        except Exception as e:
            if self._should_fallback(e):
                self._disable_db(e)
            raise


insumo_repository = InsumoRepository()
