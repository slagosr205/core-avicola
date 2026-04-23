from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.application.dto.insumo import (
    InsumoCreate,
    InsumoUpdate,
    InsumoResponse,
)
from app.infrastructure.repositories.insumo_repository import insumo_repository


router = APIRouter()


@router.get("", response_model=list[InsumoResponse])
async def list_insumos(tipo: Optional[str] = None):
    return await insumo_repository.list(tipo)


@router.get("/{insumo_id}", response_model=InsumoResponse)
async def get_insumo(insumo_id: str):
    insumo = await insumo_repository.get(insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return insumo


@router.post("", response_model=InsumoResponse, status_code=status.HTTP_201_CREATED)
async def create_insumo(data: InsumoCreate):
    try:
        return await insumo_repository.create(data)
    except Exception:
        raise HTTPException(status_code=400, detail="No se pudo crear el insumo")


@router.put("/{insumo_id}", response_model=InsumoResponse)
async def update_insumo(insumo_id: str, data: InsumoUpdate):
    insumo = await insumo_repository.update(insumo_id, data)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return insumo
