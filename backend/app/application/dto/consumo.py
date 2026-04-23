from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class ConsumoBase(BaseModel):
    lote_id: str
    insumo_id: str
    fecha: date
    cantidad: float = Field(gt=0)
    costo_unitario: Optional[float] = Field(default=None, gt=0)
    tipo: Optional[str] = "CONSUMO"


class ConsumoCreate(ConsumoBase):
    pass


class ConsumoResponse(BaseModel):
    id: str
    lote_id: str
    insumo_id: str
    fecha: date
    cantidad: float
    costo_unitario: float
    costo_total: float
    created_at: str

    class Config:
        from_attributes = True


class CostoBase(BaseModel):
    lote_id: str
    tipo_costo: str
    descripcion: Optional[str] = None
    monto: Optional[float] = None
    fecha: date
    insumo_id: Optional[str] = None
    cantidad: Optional[float] = None


class CostoCreate(CostoBase):
    pass


class CostoResponse(BaseModel):
    id: str
    lote_id: str
    tipo_costo: str
    descripcion: Optional[str]
    monto: float
    fecha: date
    insumo_id: Optional[str] = None
    cantidad: Optional[float] = None
    created_at: str

    class Config:
        from_attributes = True


class ResumenCostos(BaseModel):
    lote_id: str
    total: float
    cantidad_registros: int
