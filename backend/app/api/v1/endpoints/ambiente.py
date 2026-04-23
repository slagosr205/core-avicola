from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.application.dto.ambiente import (
    AmbienteRegistroCreate,
    AmbienteRegistroResponse,
    AmbienteProgramacionUpsert,
    AmbienteProgramacionResponse,
    AmbienteEstadoResponse,
)
from app.application.services.ambiente_service import ambiente_service


router = APIRouter()


@router.get("/registros", response_model=list[AmbienteRegistroResponse])
async def list_registros(lote_id: Optional[str] = None):
    return await ambiente_service.list_registros(lote_id)


@router.post(
    "/registros",
    response_model=AmbienteRegistroResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_registro(data: AmbienteRegistroCreate):
    try:
        return await ambiente_service.create_registro(data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/programacion/{lote_id}", response_model=AmbienteProgramacionResponse)
async def get_programacion(lote_id: str):
    prog = await ambiente_service.get_programacion(lote_id)
    if not prog:
        raise HTTPException(status_code=404, detail="Sin programación")
    return prog


@router.put("/programacion/{lote_id}", response_model=AmbienteProgramacionResponse)
async def upsert_programacion(lote_id: str, data: AmbienteProgramacionUpsert):
    try:
        return await ambiente_service.upsert_programacion(lote_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/estado", response_model=AmbienteEstadoResponse)
async def get_estado(lote_id: str):
    return await ambiente_service.estado(lote_id)
