from fastapi import APIRouter, HTTPException, status

from app.application.dto.tercero import (
    ProcesamientoCreate,
    ProcesamientoUpdate,
    ProcesamientoResponse,
)
from app.application.services.tercero_service import procesamiento_service

router = APIRouter()


@router.get("", response_model=list[ProcesamientoResponse])
async def list_procesamientos():
    return await procesamiento_service.get_all()


@router.get("/{proc_id}", response_model=ProcesamientoResponse)
async def get_procesamiento(proc_id: str):
    proc = await procesamiento_service.get_by_id(proc_id)
    if not proc:
        raise HTTPException(status_code=404, detail="Procesamiento no encontrado")
    return proc


@router.post(
    "", response_model=ProcesamientoResponse, status_code=status.HTTP_201_CREATED
)
async def create_procesamiento(data: ProcesamientoCreate):
    return await procesamiento_service.create(data)


@router.put("/{proc_id}", response_model=ProcesamientoResponse)
async def update_procesamiento(proc_id: str, data: ProcesamientoUpdate):
    proc = await procesamiento_service.update(proc_id, data)
    if not proc:
        raise HTTPException(status_code=404, detail="Procesamiento no encontrado")
    return proc
