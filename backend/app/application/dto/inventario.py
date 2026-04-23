from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field


class InsumoBase(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    tipo: str
    unidad: Optional[str] = None
    proveedor_id: Optional[str] = None
    costo_unitario: Optional[float] = None


class InsumoCreate(BaseModel):
    nombre: str
    tipo: str
    unidad: Optional[str] = None
    proveedor_id: Optional[str] = None
    costo_unitario: Optional[float] = None


class InsumoUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    unidad: Optional[str] = None
    proveedor_id: Optional[str] = None
    costo_unitario: Optional[float] = None
    activo: Optional[bool] = None


class InsumoResponse(BaseModel):
    id: str
    codigo: Optional[str] = None
    nombre: str
    tipo: str
    unidad: Optional[str] = None
    proveedor_id: Optional[str] = None
    costo_unitario: Optional[float] = None
    activo: bool
    created_at: str

    class Config:
        from_attributes = True


class InventarioEntradaCreate(BaseModel):
    insumo_id: str
    fecha: date
    cantidad: float = Field(gt=0)
    costo_unitario: float = Field(gt=0)
    numero_factura: Optional[str] = None
    observaciones: Optional[str] = None


class InventarioSalidaCreate(BaseModel):
    insumo_id: str
    lote_id: str
    fecha: date
    cantidad: float = Field(gt=0)
    descripcion: Optional[str] = None


class InventarioTransferenciaCreate(BaseModel):
    insumo_id: str
    fecha: date
    cantidad_inicio: float = Field(gt=0)
    cantidad_final: float = Field(gt=0)
    descripcion: Optional[str] = None


class InventarioMovimientoResponse(BaseModel):
    id: str
    insumo_id: str
    insumo_nombre: Optional[str] = None
    fecha: date
    tipo: str
    cantidad: float
    costo_unitario: float
    costo_total: float
    referencia_tipo: Optional[str]
    referencia_id: Optional[str]
    lote_id: Optional[str]
    observaciones: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class InventarioSaldoResponse(BaseModel):
    insumo_id: str
    insumo_nombre: str
    tipo_insumo: str
    unidad: Optional[str]
    stock_actual: float
    stock_minimo: Optional[float] = None
    costo_promedio: float
    valor_total: float
    activo: bool
    actualizado: str

    class Config:
        from_attributes = True


class InventarioResumenResponse(BaseModel):
    total_insumos: int
    total_stock: float
    valor_total_inventario: float
    alertas_stock_bajo: List[InventarioSaldoResponse]


class KardexResponse(BaseModel):
    insumo_id: str
    insumo_nombre: str
    saldo_anterior: float
    entradas: float
    salidas: float
    saldo_final: float
    movimientos: List[InventarioMovimientoResponse]
