from typing import Optional
from pydantic import BaseModel, EmailStr


class TerceroBase(BaseModel):
    nombre: str
    tipo: str
    nit: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None


class TerceroCreate(TerceroBase):
    pass


class TerceroUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None


class TerceroResponse(BaseModel):
    id: str
    nombre: str
    tipo: str
    nit: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    direccion: Optional[str]
    activo: bool
    created_at: str

    class Config:
        from_attributes = True


class ProcesamientoBase(BaseModel):
    lote_id: str
    fecha_recepcion: str
    peso_vivo_recibido: float
    merma_transporte: float = 0
    observaciones: Optional[str] = None


class ProcesamientoCreate(ProcesamientoBase):
    pass


class ProcesamientoUpdate(BaseModel):
    peso_carne: Optional[float] = None
    peso_menudos: Optional[float] = None
    decomiso: Optional[float] = None
    observaciones: Optional[str] = None


class ProcesamientoResponse(BaseModel):
    id: str
    lote_id: str
    fecha_recepcion: str
    peso_vivo_recibido: float
    merma_transporte: float
    peso_neto: Optional[float]
    peso_carne: Optional[float]
    peso_menudos: Optional[float]
    decomiso: float
    rendimiento: Optional[float]
    observaciones: Optional[str]
    created_at: str

    class Config:
        from_attributes = True
