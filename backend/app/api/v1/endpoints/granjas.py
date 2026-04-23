from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.application.dto.maestros import (
    GranjaCreate,
    GranjaUpdate,
    GranjaResponse,
)
from app.application.services.maestro_service import granja_service


router = APIRouter()


@router.get("", response_model=list[GranjaResponse])
async def list_granjas(include_inactive: Optional[bool] = False):
    return await granja_service.get_all(include_inactive=include_inactive)


@router.get("/{granja_id}", response_model=GranjaResponse)
async def get_granja(granja_id: str):
    granja = await granja_service.get_by_id(granja_id)
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    return granja


@router.post(
    "",
    response_model=GranjaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_granja(data: GranjaCreate):
    return await granja_service.create(data)


@router.put("/{granja_id}", response_model=GranjaResponse)
async def update_granja(granja_id: str, data: GranjaUpdate):
    granja = await granja_service.update(granja_id, data)
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    return granja


@router.delete("/{granja_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_granja(granja_id: str):
    success = await granja_service.delete(granja_id)
    if not success:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
