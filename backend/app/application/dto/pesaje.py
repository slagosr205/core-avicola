from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

from app.domain.value_objects.enums import CausaMortalidad


class PesajeBase(BaseModel):
    lote_id: str
    semana: int = Field(gt=0)
    fecha: date
    cantidad_muestreada: int = Field(gt=0)
    peso_total_muestra: float = Field(gt=0)
    observaciones: Optional[str] = None


class PesajeCreate(PesajeBase):
    pass


class PesajeUpdate(BaseModel):
    peso_total_muestra: Optional[float] = None
    observaciones: Optional[str] = None


class PesajeResponse(BaseModel):
    id: str
    lote_id: str
    semana: int
    fecha: date
    cantidad_muestreada: int
    peso_total_muestra: float
    peso_promedio: float
    peso_anterior: Optional[float]
    variacion_semanal: Optional[float]
    observaciones: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class MortalidadBase(BaseModel):
    lote_id: str
    fecha: date
    cantidad: int = Field(gt=0)
    causa: CausaMortalidad
    peso_estimado: Optional[float] = None
    observaciones: Optional[str] = None


class MortalidadCreate(MortalidadBase):
    pass


class MortalidadUpdate(BaseModel):
    fecha: Optional[date] = None
    cantidad: Optional[int] = Field(default=None, gt=0)
    causa: Optional[CausaMortalidad] = None
    observaciones: Optional[str] = None


class MortalidadResponse(BaseModel):
    id: str
    lote_id: str
    fecha: date
    cantidad: int
    causa: CausaMortalidad
    peso_estimado: Optional[float]
    observaciones: Optional[str]
    created_at: str

    class Config:
        from_attributes = True
