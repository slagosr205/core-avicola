from fastapi import APIRouter, HTTPException, status
from typing import Optional
from pydantic import BaseModel

from app.core.database import AsyncSessionLocal
from app.application.services.alimentacion_service import alimentacion_service
from app.infrastructure.repositories.costo_repository import costo_repository
from sqlalchemy import select

router = APIRouter()


class AlimentacionCreate(BaseModel):
    lote_id: str
    insumo_id: str
    cantidad: float
    fecha: str
    descripcion: Optional[str] = None
    costo_pollito_baby: Optional[float] = None


@router.get("", response_model=list)
async def list_consumos(lote_id: Optional[str] = None):
    costos = await costo_repository.get_all(lote_id)
    consumos = [
        c
        for c in costos
        if c.tipo_costo in ("ALIMENTO", "POLLITO_BABY") or not c.tipo_costo
    ]

    from app.db.models import Lote

    lote_map = {}
    async with AsyncSessionLocal() as session:
        for c in consumos:
            if c.lote_id and c.lote_id not in lote_map:
                res = await session.execute(
                    select(Lote.numero_lote).where(Lote.id == c.lote_id)
                )
                lote_name = res.scalar()
                lote_map[c.lote_id] = lote_name or c.lote_id[:8]

    return [
        {
            "id": c.id,
            "lote_id": c.lote_id,
            "lote_nombre": lote_map.get(
                c.lote_id, c.lote_id[:8] if c.lote_id else "N/A"
            ),
            "tipo": c.tipo_costo or "ALIMENTO",
            "descripcion": c.descripcion,
            "fecha": c.fecha,
            "cantidad": getattr(c, "cantidad", None),
            "costo_total": c.monto,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in consumos
    ]

    from app.db.models import Lote

    async with AsyncSessionLocal() as session:
        lote_map = {}
        for c in consumos:
            if c.lote_id and c.lote_id not in lote_map:
                res = await session.execute(
                    select(Lote.numero_lote).where(Lote.id == c.lote_id)
                )
                lote_name = res.scalar()
                lote_map[c.lote_id] = lote_name or c.lote_id[:8]

    return [
        {
            "id": c.id,
            "lote_id": c.lote_id,
            "lote_nombre": lote_map.get(c.lote_id, c.lote_id[:8]),
            "tipo": c.tipo_costo or "ALIMENTO",
            "descripcion": c.descripcion,
            "fecha": c.fecha,
            "cantidad": getattr(c, "cantidad", None),
            "costo_total": c.monto,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in consumos
    ]
    return [
        {
            "id": c.id,
            "lote_id": c.lote_id,
            "tipo": c.tipo_costo or "ALIMENTO",
            "descripcion": c.descripcion,
            "fecha": c.fecha,
            "cantidad": getattr(c, "cantidad", None),
            "costo_total": c.monto,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in consumos
    ]


@router.get("/resumen/{lote_id}")
async def get_resumen(lote_id: str):
    return await alimentacion_service.get_resumen_lote(lote_id)


@router.post("", status_code=status.HTTP_201_CREATED)
async def registrar_consumo(data: AlimentacionCreate):
    try:
        return await alimentacion_service.registrar_consumo(
            lote_id=data.lote_id,
            insumo_id=data.insumo_id,
            cantidad=data.cantidad,
            fecha=data.fecha,
            descripcion=data.descripcion,
            costo_pollito_baby=data.costo_pollito_baby,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
