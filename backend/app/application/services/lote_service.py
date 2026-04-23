from datetime import date, datetime
from typing import Optional, List
import uuid

from app.domain.entities.lote import Lote
from app.domain.value_objects import TipoLote, EstadoLote
from app.application.dto.lote import LoteCreate, LoteUpdate, LoteResponse
from app.application.services.inventario_service import (
    inventario_service,
)
from app.application.dto.inventario import InventarioEntradaCreate
from app.infrastructure.repositories.lote_repository import lote_repository


class LoteService:
    def __init__(self):
        self.repository = lote_repository

    async def generate_numero_lote(self, year: int) -> str:
        count = await self.repository.count_by_year(year)
        return f"LT-{year}-{count + 1:03d}"

    async def get_proximo_numero(self) -> dict[str, str]:
        year = date.today().year
        return {"numero_lote": await self.generate_numero_lote(year)}

    async def get_all(self, estado: Optional[str] = None) -> List[LoteResponse]:
        lotes = await self.repository.get_all(estado)
        return [self._to_response(l) for l in lotes]

    async def get_by_id(self, lote_id: str) -> Optional[LoteResponse]:
        lote = await self.repository.get_by_id(lote_id)
        return self._to_response(lote) if lote else None

    async def create(self, data: LoteCreate) -> LoteResponse:
        numero = await self.generate_numero_lote(data.fecha_ingreso.year)
        nuevo = Lote(
            id=str(uuid.uuid4()),
            numero_lote=numero,
            tipo_lote=data.tipo_lote,
            estado=EstadoLote.ACTIVO,
            cantidad_inicial=data.cantidad_inicial,
            cantidad_actual=data.cantidad_inicial,
            peso_promedio_inicial=data.peso_promedio_inicial,
            peso_promedio_actual=data.peso_promedio_inicial,
            fecha_ingreso=data.fecha_ingreso,
            fecha_cierre=None,
            fecha_liquidacion=None,
            observaciones=data.observaciones,
            granja_id=data.granja_id,
            galpon_id=data.galpon_id,
            tercero_id=data.tercero_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by=None,
        )
        created = await self.repository.create(nuevo)

        if (
            data.pollito_insumo_id
            and data.costo_unitario_pollito
            and data.costo_unitario_pollito > 0
        ):
            try:
                await inventario_service.entrada(
                    InventarioEntradaCreate(
                        insumo_id=data.pollito_insumo_id,
                        fecha=data.fecha_ingreso,
                        cantidad=float(data.cantidad_inicial),
                        costo_unitario=data.costo_unitario_pollito,
                        numero_factura=f"LOTE-{numero}",
                        observaciones=f"Entrada de pollitos para {numero}",
                    )
                )
            except Exception:
                pass

        return self._to_response(created)

    async def update(self, lote_id: str, data: LoteUpdate) -> Optional[LoteResponse]:
        lote = await self.repository.get_by_id(lote_id)
        if not lote:
            return None

        if data.tipo_lote:
            lote.tipo_lote = data.tipo_lote
        if data.estado:
            lote.estado = data.estado
        if data.cantidad_actual is not None:
            lote.cantidad_actual = data.cantidad_actual
        if data.peso_promedio_actual is not None:
            lote.peso_promedio_actual = data.peso_promedio_actual
        if data.observaciones is not None:
            lote.observaciones = data.observaciones
        if data.granja_id is not None:
            lote.granja_id = data.granja_id
        if data.galpon_id is not None:
            lote.galpon_id = data.galpon_id

        lote.updated_at = datetime.utcnow()
        updated = await self.repository.update(lote)
        return self._to_response(updated)

    async def delete(self, lote_id: str) -> bool:
        return await self.repository.delete(lote_id)

    async def cerrar(self, lote_id: str) -> Optional[LoteResponse]:
        lote = await self.repository.get_by_id(lote_id)
        if not lote:
            return None
        lote.cerrar(date.today())
        updated = await self.repository.update(lote)
        return self._to_response(updated)

    async def liquidar(self, lote_id: str) -> Optional[LoteResponse]:
        lote = await self.repository.get_by_id(lote_id)
        if not lote:
            return None
        lote.liquidar(date.today())
        updated = await self.repository.update(lote)
        return self._to_response(updated)

    def _to_response(self, lote: Lote) -> LoteResponse:
        return LoteResponse(
            id=lote.id,
            numero_lote=lote.numero_lote,
            tipo_lote=lote.tipo_lote,
            estado=lote.estado,
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
            created_at=lote.created_at.isoformat(),
        )


lote_service = LoteService()
