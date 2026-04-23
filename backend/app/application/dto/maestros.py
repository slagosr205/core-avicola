from pydantic import BaseModel
from typing import Optional


class GranjaResponse(BaseModel):
    id: str
    nombre: str
    ubicacion: Optional[str] = None
    activo: bool = True


class GranjaCreate(BaseModel):
    nombre: str
    ubicacion: Optional[str] = None


class GranjaUpdate(BaseModel):
    nombre: Optional[str] = None
    ubicacion: Optional[str] = None
    activo: Optional[bool] = None


class GalponResponse(BaseModel):
    id: str
    numero: str
    capacidad: Optional[int] = None
    granja_id: Optional[str] = None
    activo: bool = True


class GalponCreate(BaseModel):
    numero: str
    capacidad: Optional[int] = None
    granja_id: str


class GalponUpdate(BaseModel):
    numero: Optional[str] = None
    capacidad: Optional[int] = None
    granja_id: Optional[str] = None
    activo: Optional[bool] = None
