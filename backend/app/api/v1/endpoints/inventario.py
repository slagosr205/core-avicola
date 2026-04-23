from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.application.dto.inventario import (
    InventarioEntradaCreate,
    InventarioSalidaCreate,
    InventarioTransferenciaCreate,
    InventarioMovimientoResponse,
    InventarioSaldoResponse,
    InventarioResumenResponse,
    KardexResponse,
    InsumoCreate,
    InsumoUpdate,
    InsumoResponse,
)
from app.application.services.inventario_service import (
    inventario_service,
    insumo_service,
)

router = APIRouter()


@router.get("/resumen", response_model=InventarioResumenResponse)
async def get_resumen():
    return await inventario_service.get_resumen()


@router.get("/saldos", response_model=list[InventarioSaldoResponse])
async def list_saldos():
    return await inventario_service.get_all_saldos()


@router.get("/saldos/{insumo_id}", response_model=InventarioSaldoResponse)
async def get_saldo(insumo_id: str):
    saldo = await inventario_service.get_saldo(insumo_id)
    if not saldo:
        raise HTTPException(status_code=404, detail="Saldo no encontrado")
    return saldo


@router.get("/kardex/{insumo_id}", response_model=KardexResponse)
async def get_kardex(insumo_id: str, fechaDesde: Optional[str] = None):
    try:
        fecha = None
        if fechaDesde:
            from datetime import datetime

            fecha = datetime.strptime(fechaDesde, "%Y-%m-%d").date()
        return await inventario_service.get_kardex(insumo_id, fecha)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/movimientos", response_model=list[InventarioMovimientoResponse])
async def list_movimientos(insumo_id: Optional[str] = None, limite: int = 50):
    return await inventario_service.list_movimientos(insumo_id, limite)


@router.post(
    "/entradas",
    response_model=InventarioMovimientoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_entrada(data: InventarioEntradaCreate):
    try:
        return await inventario_service.entrada(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/salidas",
    response_model=InventarioMovimientoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_salida(data: InventarioSalidaCreate):
    try:
        return await inventario_service.salida(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transferencias", status_code=status.HTTP_201_CREATED)
async def create_transferencia(data: InventarioTransferenciaCreate):
    try:
        return await inventario_service.transferencia(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Insumos CRUD


@router.get("/insumos", response_model=list[InsumoResponse])
async def list_insumos(tipo: Optional[str] = None, include_inactive: bool = False):
    insumos = await insumo_service.get_all(tipo, include_inactive)
    return [
        InsumoResponse(
            id=str(i.id),
            codigo=i.codigo,
            nombre=i.nombre,
            tipo=str(i.tipo.value) if hasattr(i.tipo, "value") else str(i.tipo),
            unidad=i.unidad,
            proveedor_id=i.proveedor_id,
            costo_unitario=i.costo_unitario,
            activo=i.activo,
            created_at=i.created_at.isoformat() if i.created_at else "",
        )
        for i in insumos
    ]


@router.get("/insumos/{insumo_id}", response_model=InsumoResponse)
async def get_insumo(insumo_id: str):
    insumo = await insumo_service.get_by_id(insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return InsumoResponse(
        id=str(insumo.id),
        codigo=insumo.codigo,
        nombre=insumo.nombre,
        tipo=str(insumo.tipo.value)
        if hasattr(insumo.tipo, "value")
        else str(insumo.tipo),
        unidad=insumo.unidad,
        proveedor_id=insumo.proveedor_id,
        costo_unitario=insumo.costo_unitario,
        activo=insumo.activo,
        created_at=insumo.created_at.isoformat() if insumo.created_at else "",
    )


@router.post(
    "/insumos", response_model=InsumoResponse, status_code=status.HTTP_201_CREATED
)
async def create_insumo(data: InsumoCreate):
    try:
        insumo = await insumo_service.create(data)
        return InsumoResponse(
            id=str(insumo.id),
            codigo=insumo.codigo,
            nombre=insumo.nombre,
            tipo=str(insumo.tipo.value)
            if hasattr(insumo.tipo, "value")
            else str(insumo.tipo),
            unidad=insumo.unidad,
            proveedor_id=insumo.proveedor_id,
            costo_unitario=insumo.costo_unitario,
            activo=insumo.activo,
            created_at=insumo.created_at.isoformat() if insumo.created_at else "",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/insumos/{insumo_id}", response_model=InsumoResponse)
async def update_insumo(insumo_id: str, data: InsumoUpdate):
    insumo = await insumo_service.update(insumo_id, data)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return InsumoResponse(
        id=str(insumo.id),
        codigo=insumo.codigo,
        nombre=insumo.nombre,
        tipo=str(insumo.tipo.value)
        if hasattr(insumo.tipo, "value")
        else str(insumo.tipo),
        unidad=insumo.unidad,
        proveedor_id=insumo.proveedor_id,
        costo_unitario=insumo.costo_unitario,
        activo=insumo.activo,
        created_at=insumo.created_at.isoformat() if insumo.created_at else "",
    )


@router.delete("/insumos/{insumo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insumo(insumo_id: str):
    insumo = await insumo_service.update(insumo_id, InsumoUpdate(activo=False))
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
