import uuid
from typing import Optional, List

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.db.models import Granja as DbGranja, Galpon as DbGalpon
from app.application.dto.maestros import (
    GranjaCreate,
    GranjaUpdate,
    GranjaResponse,
    GalponCreate,
    GalponUpdate,
    GalponResponse,
)


class GranjaService:
    async def get_all(self, include_inactive: bool = False) -> List[GranjaResponse]:
        async with AsyncSessionLocal() as session:
            stmt = select(DbGranja)
            if not include_inactive:
                stmt = stmt.where(DbGranja.activo == True)
            res = await session.execute(stmt)
            rows = res.scalars().all()
            return [self._to_response(r) for r in rows]

    async def get_by_id(self, granja_id: str) -> Optional[GranjaResponse]:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbGranja).where(DbGranja.id == granja_id)
            )
            row = res.scalar_one_or_none()
            return self._to_response(row) if row else None

    async def create(self, data: GranjaCreate) -> GranjaResponse:
        async with AsyncSessionLocal() as session:
            granja = DbGranja(
                id=str(uuid.uuid4()),
                nombre=data.nombre,
                ubicacion=data.ubicacion,
                activo=True,
            )
            session.add(granja)
            await session.commit()
            await session.refresh(granja)
            return self._to_response(granja)

    async def update(
        self, granja_id: str, data: GranjaUpdate
    ) -> Optional[GranjaResponse]:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbGranja).where(DbGranja.id == granja_id)
            )
            granja = res.scalar_one_or_none()
            if not granja:
                return None

            if data.nombre is not None:
                granja.nombre = data.nombre
            if data.ubicacion is not None:
                granja.ubicacion = data.ubicacion
            if data.activo is not None:
                granja.activo = data.activo

            await session.commit()
            await session.refresh(granja)
            return self._to_response(granja)

    async def delete(self, granja_id: str) -> bool:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbGranja).where(DbGranja.id == granja_id)
            )
            granja = res.scalar_one_or_none()
            if not granja:
                return False
            granja.activo = False
            await session.commit()
            return True

    def _to_response(self, granja: DbGranja) -> GranjaResponse:
        return GranjaResponse(
            id=str(granja.id),
            nombre=granja.nombre,
            ubicacion=granja.ubicacion,
            activo=granja.activo,
        )


class GalponService:
    async def get_all(
        self, granja_id: Optional[str] = None, include_inactive: bool = False
    ) -> List[GalponResponse]:
        async with AsyncSessionLocal() as session:
            stmt = select(DbGalpon)
            if not include_inactive:
                stmt = stmt.where(DbGalpon.activo == True)
            if granja_id:
                stmt = stmt.where(DbGalpon.granja_id == granja_id)
            res = await session.execute(stmt)
            rows = res.scalars().all()
            return [self._to_response(r) for r in rows]

    async def get_by_id(self, galpon_id: str) -> Optional[GalponResponse]:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbGalpon).where(DbGalpon.id == galpon_id)
            )
            row = res.scalar_one_or_none()
            return self._to_response(row) if row else None

    async def create(self, data: GalponCreate) -> GalponResponse:
        async with AsyncSessionLocal() as session:
            galpon = DbGalpon(
                id=str(uuid.uuid4()),
                numero=data.numero,
                capacidad=data.capacidad,
                granja_id=data.granja_id,
                activo=True,
            )
            session.add(galpon)
            await session.commit()
            await session.refresh(galpon)
            return self._to_response(galpon)

    async def update(
        self, galpon_id: str, data: GalponUpdate
    ) -> Optional[GalponResponse]:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbGalpon).where(DbGalpon.id == galpon_id)
            )
            galpon = res.scalar_one_or_none()
            if not galpon:
                return None

            if data.numero is not None:
                galpon.numero = data.numero
            if data.capacidad is not None:
                galpon.capacidad = data.capacidad
            if data.granja_id is not None:
                galpon.granja_id = data.granja_id
            if data.activo is not None:
                galpon.activo = data.activo

            await session.commit()
            await session.refresh(galpon)
            return self._to_response(galpon)

    async def delete(self, galpon_id: str) -> bool:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbGalpon).where(DbGalpon.id == galpon_id)
            )
            galpon = res.scalar_one_or_none()
            if not galpon:
                return False
            galpon.activo = False
            await session.commit()
            return True

    def _to_response(self, galpon: DbGalpon) -> GalponResponse:
        return GalponResponse(
            id=str(galpon.id),
            numero=galpon.numero,
            capacidad=galpon.capacidad,
            granja_id=str(galpon.granja_id) if galpon.granja_id else None,
            activo=galpon.activo,
        )


granja_service = GranjaService()
galpon_service = GalponService()
