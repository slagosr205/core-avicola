from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from app.application.dto.lote import (
    LoteCreate,
    LoteUpdate,
    LoteResponse,
    DashboardStats,
    Alerta,
)
from app.application.services.lote_service import lote_service

router = APIRouter()


@router.get("/proximo")
async def get_proximo_numero_lote():
    return await lote_service.get_proximo_numero()


@router.get("", response_model=list[LoteResponse])
async def list_lotes(estado: Optional[str] = None):
    return await lote_service.get_all(estado)


@router.get("/{lote_id}", response_model=LoteResponse)
async def get_lote(lote_id: str):
    lote = await lote_service.get_by_id(lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote


@router.post("", response_model=LoteResponse, status_code=status.HTTP_201_CREATED)
async def create_lote(data: LoteCreate):
    return await lote_service.create(data)


@router.put("/{lote_id}", response_model=LoteResponse)
async def update_lote(lote_id: str, data: LoteUpdate):
    lote = await lote_service.update(lote_id, data)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote


@router.delete("/{lote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lote(lote_id: str):
    deleted = await lote_service.delete(lote_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lote no encontrado")


@router.post("/{lote_id}/cerrar", response_model=LoteResponse)
async def cerrar_lote(lote_id: str):
    lote = await lote_service.cerrar(lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote


@router.post("/{lote_id}/liquidar", response_model=LoteResponse)
async def liquidar_lote(lote_id: str):
    lote = await lote_service.liquidar(lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote
