from datetime import datetime
from typing import Optional, List
import uuid

from app.domain.entities.tercero import Tercero, Procesamiento
from app.application.dto.tercero import (
    TerceroCreate,
    TerceroUpdate,
    TerceroResponse,
    ProcesamientoCreate,
    ProcesamientoUpdate,
    ProcesamientoResponse,
)


class TerceroService:
    def __init__(self):
        self._terceros: List[Tercero] = []

    async def get_all(self, tipo: Optional[str] = None) -> List[TerceroResponse]:
        terceros = (
            self._terceros
            if not tipo
            else [t for t in self._terceros if t.tipo == tipo]
        )
        return [self._to_response(t) for t in terceros]

    async def get_by_id(self, tercero_id: str) -> Optional[TerceroResponse]:
        for t in self._terceros:
            if t.id == tercero_id:
                return self._to_response(t)
        return None

    async def create(self, data: TerceroCreate) -> TerceroResponse:
        tercero = Tercero(
            id=str(uuid.uuid4()),
            nombre=data.nombre,
            tipo=data.tipo,
            nit=data.nit,
            telefono=data.telefono,
            email=data.email,
            direccion=data.direccion,
            activo=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self._terceros.append(tercero)
        return self._to_response(tercero)

    async def update(
        self, tercero_id: str, data: TerceroUpdate
    ) -> Optional[TerceroResponse]:
        for t in self._terceros:
            if t.id == tercero_id:
                if data.nombre is not None:
                    t.nombre = data.nombre
                if data.telefono is not None:
                    t.telefono = data.telefono
                if data.email is not None:
                    t.email = data.email
                if data.direccion is not None:
                    t.direccion = data.direccion
                if data.activo is not None:
                    t.activo = data.activo
                t.updated_at = datetime.utcnow()
                return self._to_response(t)
        return None

    def _to_response(self, tercero: Tercero) -> TerceroResponse:
        return TerceroResponse(
            id=tercero.id,
            nombre=tercero.nombre,
            tipo=tercero.tipo,
            nit=tercero.nit,
            telefono=tercero.telefono,
            email=tercero.email,
            direccion=tercero.direccion,
            activo=tercero.activo,
            created_at=tercero.created_at.isoformat(),
        )


class ProcesamientoService:
    def __init__(self):
        self._procesamientos: List[Procesamiento] = []

    async def get_all(self) -> List[ProcesamientoResponse]:
        return [self._to_response(p) for p in self._procesamientos]

    async def get_by_id(self, proc_id: str) -> Optional[ProcesamientoResponse]:
        for p in self._procesamientos:
            if p.id == proc_id:
                return self._to_response(p)
        return None

    async def create(self, data: ProcesamientoCreate) -> ProcesamientoResponse:
        peso_neto = data.peso_vivo_recibido - data.merma_transporte

        procesamiento = Procesamiento(
            id=str(uuid.uuid4()),
            lote_id=data.lote_id,
            fecha_recepcion=datetime.strptime(data.fecha_recepcion, "%Y-%m-%d").date(),
            peso_vivo_recibido=data.peso_vivo_recibido,
            merma_transporte=data.merma_transporte,
            peso_neto=peso_neto,
            peso_carne=None,
            peso_menudos=None,
            decomiso=0,
            rendimiento=None,
            observaciones=data.observaciones,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self._procesamientos.append(procesamiento)
        return self._to_response(procesamiento)

    async def update(
        self, proc_id: str, data: ProcesamientoUpdate
    ) -> Optional[ProcesamientoResponse]:
        for p in self._procesamientos:
            if p.id == proc_id:
                if data.peso_carne is not None:
                    p.peso_carne = data.peso_carne
                    if p.peso_neto:
                        p.rendimiento = (data.peso_carne / p.peso_neto) * 100
                if data.peso_menudos is not None:
                    p.peso_menudos = data.peso_menudos
                if data.decomiso is not None:
                    p.decomiso = data.decomiso
                if data.observaciones is not None:
                    p.observaciones = data.observaciones
                p.updated_at = datetime.utcnow()
                return self._to_response(p)
        return None

    def _to_response(self, proc: Procesamiento) -> ProcesamientoResponse:
        return ProcesamientoResponse(
            id=proc.id,
            lote_id=proc.lote_id,
            fecha_recepcion=proc.fecha_recepcion.isoformat(),
            peso_vivo_recibido=proc.peso_vivo_recibido,
            merma_transporte=proc.merma_transporte,
            peso_neto=proc.peso_neto,
            peso_carne=proc.peso_carne,
            peso_menudos=proc.peso_menudos,
            decomiso=proc.decomiso,
            rendimiento=proc.rendimiento,
            observaciones=proc.observaciones,
            created_at=proc.created_at.isoformat(),
        )


tercero_service = TerceroService()
procesamiento_service = ProcesamientoService()
