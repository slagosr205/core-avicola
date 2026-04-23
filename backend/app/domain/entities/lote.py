from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

from app.domain.value_objects.enums import TipoLote, EstadoLote


@dataclass
class Lote:
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
    granja_id: Optional[str]
    galpon_id: Optional[str]
    tercero_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]

    def cerrar(self, fecha: date) -> None:
        self.estado = EstadoLote.CERRADO
        self.fecha_cierre = fecha

    def liquidar(self, fecha: date) -> None:
        self.estado = EstadoLote.LIQUIDADO
        self.fecha_liquidacion = fecha

    def apply_mortalidad(self, cantidad: int) -> None:
        self.cantidad_actual = max(0, self.cantidad_actual - cantidad)

    def actualizar_peso(self, nuevo_peso: float) -> None:
        self.peso_promedio_actual = nuevo_peso
