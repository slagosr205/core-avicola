from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.application.dto.pesaje import (
    MortalidadCreate,
    MortalidadUpdate,
    MortalidadResponse,
)
from app.application.services.pesaje_service import mortalidad_service

router = APIRouter()


@router.get("", response_model=list[MortalidadResponse])
async def list_mortalidad(lote_id: Optional[str] = None):
    return await mortalidad_service.get_all(lote_id)


@router.get("/{mortalidad_id}", response_model=MortalidadResponse)
async def get_mortalidad(mortalidad_id: str):
    m = await mortalidad_service.get_by_id(mortalidad_id)
    if not m:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return m


@router.post("", response_model=MortalidadResponse, status_code=status.HTTP_201_CREATED)
async def create_mortalidad(data: MortalidadCreate):
    try:
        return await mortalidad_service.create(data)
    except ValueError as e:
        # Errores funcionales (ej: lote no existe)
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{mortalidad_id}", response_model=MortalidadResponse)
async def update_mortalidad(mortalidad_id: str, data: MortalidadUpdate):
    m = await mortalidad_service.update(mortalidad_id, data)
    if not m:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return m


@router.delete("/{mortalidad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mortalidad(mortalidad_id: str):
    deleted = await mortalidad_service.delete(mortalidad_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
