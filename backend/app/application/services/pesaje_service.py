from datetime import date, datetime
from typing import Optional, List
import uuid

from app.domain.entities.pesaje import Pesaje, Mortalidad
from app.application.dto.pesaje import (
    PesajeCreate,
    PesajeUpdate,
    PesajeResponse,
    MortalidadCreate,
    MortalidadUpdate,
    MortalidadResponse,
)

from app.infrastructure.repositories.mortalidad_repository import mortalidad_repository
from app.infrastructure.repositories.pesaje_repository import pesaje_repository


class PesajeService:
    def __init__(self):
        self.repository = pesaje_repository

    async def get_all(self, lote_id: Optional[str] = None) -> List[PesajeResponse]:
        pesajes = await self.repository.get_all(lote_id)
        return [self._to_response(p) for p in pesajes]

    async def get_by_id(self, pesaje_id: str) -> Optional[PesajeResponse]:
        p = await self.repository.get_by_id(pesaje_id)
        return self._to_response(p) if p else None

    async def create(self, data: PesajeCreate) -> PesajeResponse:
        pesaje = await self.repository.create(data)
        return self._to_response(pesaje)

    async def update(
        self, pesaje_id: str, data: PesajeUpdate
    ) -> Optional[PesajeResponse]:
        pesaje = await self.repository.update(pesaje_id, data)
        return self._to_response(pesaje) if pesaje else None

    async def delete(self, pesaje_id: str) -> bool:
        return await self.repository.delete(pesaje_id)

    def _to_response(self, pesaje: Pesaje) -> PesajeResponse:
        return PesajeResponse(
            id=pesaje.id,
            lote_id=pesaje.lote_id,
            semana=pesaje.semana,
            fecha=pesaje.fecha,
            cantidad_muestreada=pesaje.cantidad_muestreada,
            peso_total_muestra=pesaje.peso_total_muestra,
            peso_promedio=pesaje.peso_promedio,
            peso_anterior=pesaje.peso_anterior,
            variacion_semanal=pesaje.variacion_semanal,
            observaciones=pesaje.observaciones,
            created_at=pesaje.created_at.isoformat(),
        )


class MortalidadService:
    def __init__(self):
        self.repository = mortalidad_repository

    async def get_all(self, lote_id: Optional[str] = None) -> List[MortalidadResponse]:
        mortalidades = await self.repository.get_all(lote_id)
        return [self._to_response(m) for m in mortalidades]

    async def get_by_id(self, mortalidad_id: str) -> Optional[MortalidadResponse]:
        m = await self.repository.get_by_id(mortalidad_id)
        return self._to_response(m) if m else None

    async def create(self, data: MortalidadCreate) -> MortalidadResponse:
        mortalidad = await self.repository.create(data)
        return self._to_response(mortalidad)

    async def update(
        self, mortalidad_id: str, data: MortalidadUpdate
    ) -> Optional[MortalidadResponse]:
        mortalidad = await self.repository.update(mortalidad_id, data)
        return self._to_response(mortalidad) if mortalidad else None

    async def delete(self, mortalidad_id: str) -> bool:
        return await self.repository.delete(mortalidad_id)

    def _to_response(self, mortalidad: Mortalidad) -> MortalidadResponse:
        return MortalidadResponse(
            id=mortalidad.id,
            lote_id=mortalidad.lote_id,
            fecha=mortalidad.fecha,
            cantidad=mortalidad.cantidad,
            causa=mortalidad.causa,
            peso_estimado=mortalidad.peso_estimado,
            observaciones=mortalidad.observaciones,
            created_at=mortalidad.created_at.isoformat(),
        )


pesaje_service = PesajeService()
mortalidad_service = MortalidadService()
