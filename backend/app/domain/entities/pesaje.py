from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class Pesaje:
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
    created_at: datetime
    created_by: Optional[str]


@dataclass
class Mortalidad:
    id: str
    lote_id: str
    fecha: date
    cantidad: int
    causa: str
    peso_estimado: Optional[float]
    observaciones: Optional[str]
    created_at: datetime
    created_by: Optional[str]


@dataclass
class ConsumoInsumo:
    id: str
    lote_id: str
    insumo_id: str
    fecha: date
    cantidad: float
    costo_unitario: float
    costo_total: float
    created_at: datetime
    tipo: Optional[str] = None
    created_by: Optional[str] = None


@dataclass
class CostoCrianza:
    id: str
    lote_id: str
    tipo_costo: str
    descripcion: Optional[str]
    monto: float
    fecha: date
    comprobante: Optional[str]
    created_at: datetime
    created_by: Optional[str]
