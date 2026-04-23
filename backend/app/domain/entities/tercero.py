from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class Tercero:
    id: str
    nombre: str
    tipo: str
    nit: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    direccion: Optional[str]
    activo: bool
    created_at: datetime
    updated_at: datetime


@dataclass
class Procesamiento:
    id: str
    lote_id: str
    fecha_recepcion: date
    peso_vivo_recibido: float
    merma_transporte: float
    peso_neto: Optional[float]
    peso_carne: Optional[float]
    peso_menudos: Optional[float]
    decomiso: float
    rendimiento: Optional[float]
    observaciones: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class ProductoProcesado:
    id: str
    procesamiento_id: str
    tipo_producto: str
    cantidad_unidades: Optional[int]
    peso_total: float
    rendimiento: Optional[float]
