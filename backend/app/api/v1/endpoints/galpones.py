from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.application.dto.maestros import (
    GalponCreate,
    GalponUpdate,
    GalponResponse,
)
from app.application.services.maestro_service import galpon_service


router = APIRouter()


@router.get("", response_model=list[GalponResponse])
async def list_galpones(
    granja_id: Optional[str] = None,
    include_inactive: Optional[bool] = False,
):
    return await galpon_service.get_all(
        granja_id=granja_id, include_inactive=include_inactive
    )


@router.get("/{galpon_id}", response_model=GalponResponse)
async def get_galpon(galpon_id: str):
    galpon = await galpon_service.get_by_id(galpon_id)
    if not galpon:
        raise HTTPException(status_code=404, detail="Galpón no encontrado")
    return galpon


@router.post(
    "",
    response_model=GalponResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_galpon(data: GalponCreate):
    return await galpon_service.create(data)


@router.put("/{galpon_id}", response_model=GalponResponse)
async def update_galpon(galpon_id: str, data: GalponUpdate):
    galpon = await galpon_service.update(galpon_id, data)
    if not galpon:
        raise HTTPException(status_code=404, detail="Galpón no encontrado")
    return galpon


@router.delete("/{galpon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_galpon(galpon_id: str):
    success = await galpon_service.delete(galpon_id)
    if not success:
        raise HTTPException(status_code=404, detail="Galpón no encontrado")
