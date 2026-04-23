from fastapi import APIRouter, status
from typing import Optional

from app.application.dto.consumo import CostoCreate, CostoResponse, ResumenCostos
from app.application.services.consumo_service import costo_service

router = APIRouter()


@router.get("", response_model=list[CostoResponse])
async def list_costos(lote_id: Optional[str] = None):
    return await costo_service.get_all(lote_id)


@router.post("", response_model=CostoResponse, status_code=status.HTTP_201_CREATED)
async def create_costo(data: CostoCreate):
    return await costo_service.create(data)


@router.get("/resumen/{lote_id}", response_model=ResumenCostos)
async def get_resumen_costos(lote_id: str):
    return await costo_service.get_resumen(lote_id)
