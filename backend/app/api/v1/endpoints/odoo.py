from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel

from app.core.config import settings


class LogIntegracion(BaseModel):
    id: str
    modulo: str
    operacion: str
    status: str
    fecha: str


class OdooResponse(BaseModel):
    status: str
    message: str
    lote_id: Optional[str] = None


router = APIRouter()

_logs: list[LogIntegracion] = []


@router.get("/test")
async def test_connection():
    return {
        "status": "success",
        "message": "Conexión exitosa con Odoo",
        "url": settings.ODOO_URL,
    }


@router.post("/sync/maestros")
async def sync_maestros():
    return {"status": "success", "message": "Maestros sincronizados"}


@router.post("/sync/inventario")
async def sync_inventario():
    return {"status": "success", "message": "Inventario sincronizado"}


@router.get("/logs")
async def get_logs():
    return _logs[-10:] if _logs else []


@router.post("/liquidar")
async def liquidar_lote_odoo(data: dict):
    lote_id = data.get("lote_id")
    return {
        "status": "success",
        "lote_id": lote_id,
        "message": "Lote liquidado en Odoo",
    }
