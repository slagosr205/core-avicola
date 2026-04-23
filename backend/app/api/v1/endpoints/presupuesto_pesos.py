from fastapi import APIRouter, HTTPException
from typing import Optional

from app.application.dto.presupuesto_peso import (
    PresupuestoPesoUpsert,
    PresupuestoPesoResponse,
    PresupuestoPesoEstadoResponse,
)
from app.application.services.presupuesto_peso_service import presupuesto_peso_service


router = APIRouter()


@router.get("", response_model=list[PresupuestoPesoResponse])
async def list_presupuestos(lote_id: Optional[str] = None):
    return await presupuesto_peso_service.list(lote_id)


@router.put("/{lote_id}", response_model=list[PresupuestoPesoResponse])
async def replace_presupuesto(lote_id: str, data: PresupuestoPesoUpsert):
    try:
        return await presupuesto_peso_service.replace(lote_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/estado", response_model=PresupuestoPesoEstadoResponse)
async def get_estado(lote_id: str):
    return await presupuesto_peso_service.estado(lote_id)
