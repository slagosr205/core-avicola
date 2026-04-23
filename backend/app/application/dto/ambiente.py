from datetime import datetime
from typing import Optional, List, Literal

from pydantic import BaseModel, Field


Semaforo = Literal["OK", "WARN", "BAD", "NA"]


class AmbienteRegistroCreate(BaseModel):
    lote_id: str
    fecha_hora: datetime
    temperatura_c: float
    humedad_relativa: float = Field(ge=0, le=100)
    observaciones: Optional[str] = None


class AmbienteRegistroResponse(BaseModel):
    id: str
    lote_id: str
    fecha_hora: datetime
    temperatura_c: float
    humedad_relativa: float
    observaciones: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AmbienteProgramacionUpsert(BaseModel):
    horas_comida: List[str] = Field(default_factory=list, description="Lista de HH:MM")
    luz_inicio: Optional[str] = Field(default=None, description="HH:MM")
    luz_fin: Optional[str] = Field(default=None, description="HH:MM")


class AmbienteProgramacionResponse(BaseModel):
    id: str
    lote_id: str
    horas_comida: List[str]
    luz_inicio: Optional[str]
    luz_fin: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


class ParametroEstado(BaseModel):
    estado: Semaforo
    valor: Optional[float] = None
    minimo: Optional[float] = None
    maximo: Optional[float] = None
    mensaje: Optional[str] = None


class AmbienteEstadoResponse(BaseModel):
    lote_id: str
    fecha_hora: Optional[datetime] = None
    temperatura: ParametroEstado
    humedad: ParametroEstado
    luz_horas: ParametroEstado
    comidas: ParametroEstado
