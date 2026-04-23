from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.domain.value_objects.enums import TipoInsumo


class InsumoBase(BaseModel):
    codigo: str = Field(min_length=1, max_length=50)
    nombre: str = Field(min_length=1, max_length=200)
    tipo: TipoInsumo
    unidad: Optional[str] = Field(default=None, max_length=20)
    proveedor_id: Optional[str] = None
    costo_unitario: Optional[float] = Field(default=None, gt=0)
    activo: bool = True


class InsumoCreate(InsumoBase):
    pass


class InsumoUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=200)
    tipo: Optional[TipoInsumo] = None
    unidad: Optional[str] = Field(default=None, max_length=20)
    proveedor_id: Optional[str] = None
    costo_unitario: Optional[float] = Field(default=None, gt=0)
    activo: Optional[bool] = None


class InsumoResponse(BaseModel):
    id: str
    codigo: str
    nombre: str
    tipo: TipoInsumo
    unidad: Optional[str]
    proveedor_id: Optional[str]
    costo_unitario: Optional[float]
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
