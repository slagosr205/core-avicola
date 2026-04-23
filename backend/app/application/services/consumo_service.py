from datetime import date, datetime
from typing import Optional, List
import uuid

from app.domain.entities.pesaje import ConsumoInsumo, CostoCrianza
from app.application.dto.consumo import (
    ConsumoCreate,
    ConsumoResponse,
    CostoCreate,
    CostoResponse,
    ResumenCostos,
)

from app.application.services.inventario_service import inventario_service
from app.infrastructure.repositories.consumo_repository import consumo_repository
from app.infrastructure.repositories.costo_repository import costo_repository

TIPO_COSTO_REQUIERE_INVENTARIO = ["ALIMENTO", "MEDICAMENTO", "OTRO"]


class ConsumoService:
    def __init__(self):
        self.repository = consumo_repository

    async def get_all(self, lote_id: Optional[str] = None) -> List[ConsumoResponse]:
        consumos = await self.repository.get_all(lote_id)
        return [self._to_response(c) for c in consumos]

    async def create(self, data: ConsumoCreate) -> ConsumoResponse:
        # Primero creamos el registro de consumo (id) y luego generamos la salida de inventario.
        consumo_id = str(uuid.uuid4())

        try:
            unit_cost, total = await inventario_service.salida_por_consumo(
                insumo_id=data.insumo_id,
                lote_id=data.lote_id,
                consumo_id=consumo_id,
                fecha=data.fecha,
                cantidad=float(data.cantidad),
            )
        except Exception:
            # Fallback: si no se esta llevando inventario, usamos el costo_unitario enviado.
            if data.costo_unitario is None:
                raise
            unit_cost = float(data.costo_unitario)
            total = float(data.cantidad) * unit_cost

        consumo = await self.repository.create(
            consumo_id,
            data,
            costo_unitario=unit_cost,
            costo_total=total,
        )
        return self._to_response(consumo)

    def _to_response(self, consumo: ConsumoInsumo) -> ConsumoResponse:
        return ConsumoResponse(
            id=consumo.id,
            lote_id=consumo.lote_id,
            insumo_id=consumo.insumo_id,
            fecha=consumo.fecha,
            cantidad=consumo.cantidad,
            costo_unitario=consumo.costo_unitario,
            costo_total=consumo.costo_total,
            created_at=consumo.created_at.isoformat(),
        )


class CostoService:
    def __init__(self):
        self.repository = costo_repository

    async def get_all(self, lote_id: Optional[str] = None) -> List[CostoResponse]:
        costos = await self.repository.get_all(lote_id)
        return [self._to_costo_response(c) for c in costos]

    async def create(self, data: CostoCreate) -> CostoResponse:
        monto_total = data.monto or 0

        if (
            data.tipo_costo in TIPO_COSTO_REQUIERE_INVENTARIO
            and data.insumo_id
            and data.cantidad
        ):
            unit_cost, costo_inventario = await inventario_service.salida_por_consumo(
                insumo_id=data.insumo_id,
                lote_id=data.lote_id,
                consumo_id=str(uuid.uuid4()),
                fecha=data.fecha,
                cantidad=float(data.cantidad),
            )
            monto_total = costo_inventario

        data.monto = monto_total
        costo = await self.repository.create(data)
        return self._to_costo_response(costo)

    async def get_resumen(self, lote_id: str) -> ResumenCostos:
        costos = await self.repository.get_all(lote_id)
        total = sum(c.monto for c in costos)
        return ResumenCostos(
            lote_id=lote_id,
            total=total,
            cantidad_registros=len(costos),
        )

    def _to_costo_response(self, costo: CostoCrianza) -> CostoResponse:
        return CostoResponse(
            id=costo.id,
            lote_id=costo.lote_id,
            tipo_costo=costo.tipo_costo,
            descripcion=costo.descripcion,
            monto=costo.monto,
            fecha=costo.fecha,
            created_at=costo.created_at.isoformat(),
        )


consumo_service = ConsumoService()
costo_service = CostoService()
