from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.application.dto.pesaje import PesajeCreate, PesajeUpdate, PesajeResponse
from app.application.services.pesaje_service import pesaje_service

router = APIRouter()


@router.get("", response_model=list[PesajeResponse])
async def list_pesajes(lote_id: Optional[str] = None):
    return await pesaje_service.get_all(lote_id)


@router.get("/{pesaje_id}", response_model=PesajeResponse)
async def get_pesaje(pesaje_id: str):
    pesaje = await pesaje_service.get_by_id(pesaje_id)
    if not pesaje:
        raise HTTPException(status_code=404, detail="Pesaje no encontrado")
    return pesaje


@router.post("", response_model=PesajeResponse, status_code=status.HTTP_201_CREATED)
async def create_pesaje(data: PesajeCreate):
    try:
        return await pesaje_service.create(data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{pesaje_id}", response_model=PesajeResponse)
async def update_pesaje(pesaje_id: str, data: PesajeUpdate):
    pesaje = await pesaje_service.update(pesaje_id, data)
    if not pesaje:
        raise HTTPException(status_code=404, detail="Pesaje no encontrado")
    return pesaje


@router.delete("/{pesaje_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pesaje(pesaje_id: str):
    deleted = await pesaje_service.delete(pesaje_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pesaje no encontrado")
