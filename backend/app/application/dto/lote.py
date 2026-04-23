from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

from app.domain.value_objects.enums import TipoLote, EstadoLote


class LoteBase(BaseModel):
    numero_lote: str
    tipo_lote: TipoLote = TipoLote.PROPIO
    cantidad_inicial: int = Field(gt=0)
    peso_promedio_inicial: Optional[float] = None
    fecha_ingreso: date
    observaciones: Optional[str] = None
    granja_id: Optional[str] = None
    galpon_id: Optional[str] = None
    tercero_id: Optional[str] = None


class LoteCreate(LoteBase):
    pass


class LoteUpdate(BaseModel):
    tipo_lote: Optional[TipoLote] = None
    estado: Optional[EstadoLote] = None
    cantidad_actual: Optional[int] = None
    peso_promedio_actual: Optional[float] = None
    observaciones: Optional[str] = None
    granja_id: Optional[str] = None
    galpon_id: Optional[str] = None


class LoteResponse(BaseModel):
    id: str
    numero_lote: str
    tipo_lote: TipoLote
    estado: EstadoLote
    cantidad_inicial: int
    cantidad_actual: int
    peso_promedio_inicial: Optional[float]
    peso_promedio_actual: Optional[float]
    fecha_ingreso: date
    fecha_cierre: Optional[date]
    fecha_liquidacion: Optional[date]
    observaciones: Optional[str]
    granja_id: Optional[str] = None
    galpon_id: Optional[str] = None
    tercero_id: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    lotes_activos: int
    aves_vivas: int
    peso_promedio: float
    mortalidad_mes: float
    costo_promedio_lb: float
    lotes_proceso: int


class Alerta(BaseModel):
    id: str
    tipo: str
    mensaje: str
    lote_id: Optional[str] = None
