from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel


class ReporteResponse(BaseModel):
    reporte: str
    data: list


router = APIRouter()


@router.get("/lote", response_model=ReporteResponse)
async def reporte_lote(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
):
    return ReporteResponse(reporte="lote", data=[])


@router.get("/costos", response_model=ReporteResponse)
async def reporte_costos(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
):
    return ReporteResponse(reporte="costos", data=[])


@router.get("/mortalidad", response_model=ReporteResponse)
async def reporte_mortalidad(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
):
    return ReporteResponse(reporte="mortalidad", data=[])


@router.get("/pesajes", response_model=ReporteResponse)
async def reporte_pesajes(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
):
    return ReporteResponse(reporte="pesajes", data=[])


@router.get("/procesamiento", response_model=ReporteResponse)
async def reporte_procesamiento(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
):
    return ReporteResponse(reporte="procesamiento", data=[])


@router.get("/comparativo", response_model=ReporteResponse)
async def reporte_comparativo():
    return ReporteResponse(reporte="comparativo", data=[])
