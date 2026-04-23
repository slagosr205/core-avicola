from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.application.dto.tercero import (
    TerceroCreate,
    TerceroUpdate,
    TerceroResponse,
)
from app.application.services.tercero_service import tercero_service

router = APIRouter()


@router.get("", response_model=list[TerceroResponse])
async def list_terceros(tipo: Optional[str] = None):
    return await tercero_service.get_all(tipo)


@router.get("/{tercero_id}", response_model=TerceroResponse)
async def get_tercero(tercero_id: str):
    tercero = await tercero_service.get_by_id(tercero_id)
    if not tercero:
        raise HTTPException(status_code=404, detail="Tercero no encontrado")
    return tercero


@router.post("", response_model=TerceroResponse, status_code=status.HTTP_201_CREATED)
async def create_tercero(data: TerceroCreate):
    return await tercero_service.create(data)


@router.put("/{tercero_id}", response_model=TerceroResponse)
async def update_tercero(tercero_id: str, data: TerceroUpdate):
    tercero = await tercero_service.update(tercero_id, data)
    if not tercero:
        raise HTTPException(status_code=404, detail="Tercero no encontrado")
    return tercero
