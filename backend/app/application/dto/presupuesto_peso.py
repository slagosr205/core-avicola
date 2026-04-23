from datetime import datetime
from typing import Optional, List, Literal

from pydantic import BaseModel, Field


Semaforo = Literal["OK", "WARN", "BAD", "NA"]


class PresupuestoPesoItem(BaseModel):
    semana: int = Field(ge=1)
    edad: int = Field(ge=0)
    peso_objetivo: float = Field(gt=0)
    gd: Optional[float] = Field(default=None, ge=0)
    ca: Optional[float] = Field(default=None, ge=0)


class PresupuestoPesoUpsert(BaseModel):
    items: List[PresupuestoPesoItem] = Field(default_factory=list)


class PresupuestoPesoResponse(BaseModel):
    id: str
    lote_id: str
    semana: int
    edad: int
    peso_objetivo: float
    gd: Optional[float] = None
    ca: Optional[float] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class PresupuestoPesoSemanaEstado(BaseModel):
    semana: int
    edad: int
    peso_objetivo: float
    gd: Optional[float] = None
    ca: Optional[float] = None
    peso_real: Optional[float] = None
    delta: Optional[float] = None
    ganancia_objetivo: Optional[float] = None
    estado: Semaforo
    mensaje: Optional[str] = None


class PresupuestoPesoEstadoResponse(BaseModel):
    lote_id: str
    estado_global: Semaforo
    semanas: List[PresupuestoPesoSemanaEstado]
