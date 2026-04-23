from __future__ import annotations

from datetime import datetime, time
from typing import Optional, List
import uuid

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.db.models import (
    AmbienteRegistro as DbAmbienteRegistro,
    AmbienteProgramacion as DbAmbienteProgramacion,
    Lote as DbLote,
)
from app.application.dto.ambiente import (
    AmbienteRegistroCreate,
    AmbienteRegistroResponse,
    AmbienteProgramacionUpsert,
    AmbienteProgramacionResponse,
    AmbienteEstadoResponse,
    ParametroEstado,
)


def _parse_hhmm(value: Optional[str]) -> Optional[time]:
    if not value:
        return None
    try:
        hh, mm = value.split(":", 1)
        return time(hour=int(hh), minute=int(mm))
    except Exception:
        return None


def _hours_between(start: time, end: time) -> float:
    # Si end < start asumimos que cruza medianoche.
    s = start.hour * 60 + start.minute
    e = end.hour * 60 + end.minute
    if e < s:
        e += 24 * 60
    return (e - s) / 60.0


class AmbienteService:
    async def list_registros(
        self, lote_id: Optional[str] = None, limit: int = 200
    ) -> List[AmbienteRegistroResponse]:
        async with AsyncSessionLocal() as session:
            stmt = select(DbAmbienteRegistro).order_by(
                DbAmbienteRegistro.fecha_hora.desc(),
                DbAmbienteRegistro.created_at.desc(),
            )
            if lote_id:
                stmt = stmt.where(DbAmbienteRegistro.lote_id == lote_id)
            stmt = stmt.limit(limit)
            res = await session.execute(stmt)
            rows = res.scalars().all()
            return [AmbienteRegistroResponse.model_validate(r) for r in rows]

    async def create_registro(
        self, data: AmbienteRegistroCreate
    ) -> AmbienteRegistroResponse:
        async with AsyncSessionLocal() as session:
            # valida lote
            lote = (
                await session.execute(select(DbLote).where(DbLote.id == data.lote_id))
            ).scalar_one_or_none()
            if not lote:
                raise ValueError("Lote no encontrado")

            row = DbAmbienteRegistro(
                id=str(uuid.uuid4()),
                lote_id=data.lote_id,
                fecha_hora=data.fecha_hora,
                temperatura_c=float(data.temperatura_c),
                humedad_relativa=float(data.humedad_relativa),
                observaciones=data.observaciones,
                created_at=datetime.utcnow(),
                created_by=None,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return AmbienteRegistroResponse.model_validate(row)

    async def get_programacion(
        self, lote_id: str
    ) -> Optional[AmbienteProgramacionResponse]:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbAmbienteProgramacion).where(
                    DbAmbienteProgramacion.lote_id == lote_id
                )
            )
            row = res.scalar_one_or_none()
            return AmbienteProgramacionResponse.model_validate(row) if row else None

    async def upsert_programacion(
        self, lote_id: str, data: AmbienteProgramacionUpsert
    ) -> AmbienteProgramacionResponse:
        async with AsyncSessionLocal() as session:
            lote = (
                await session.execute(select(DbLote).where(DbLote.id == lote_id))
            ).scalar_one_or_none()
            if not lote:
                raise ValueError("Lote no encontrado")

            res = await session.execute(
                select(DbAmbienteProgramacion).where(
                    DbAmbienteProgramacion.lote_id == lote_id
                )
            )
            row = res.scalar_one_or_none()
            if not row:
                row = DbAmbienteProgramacion(
                    id=str(uuid.uuid4()),
                    lote_id=lote_id,
                    horas_comida=list(data.horas_comida or []),
                    luz_inicio=data.luz_inicio,
                    luz_fin=data.luz_fin,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                session.add(row)
            else:
                row.horas_comida = list(data.horas_comida or [])
                row.luz_inicio = data.luz_inicio
                row.luz_fin = data.luz_fin
                row.updated_at = datetime.utcnow()

            await session.commit()
            await session.refresh(row)
            return AmbienteProgramacionResponse.model_validate(row)

    def _eval_range(
        self,
        value: float,
        ok_min: float,
        ok_max: float,
        warn_min: float,
        warn_max: float,
        *,
        label: str,
    ) -> ParametroEstado:
        if value < warn_min or value > warn_max:
            return ParametroEstado(
                estado="BAD",
                valor=value,
                minimo=ok_min,
                maximo=ok_max,
                mensaje=f"{label} fuera de rango",
            )
        if value < ok_min or value > ok_max:
            return ParametroEstado(
                estado="WARN",
                valor=value,
                minimo=ok_min,
                maximo=ok_max,
                mensaje=f"{label} en zona de alerta",
            )
        return ParametroEstado(
            estado="OK",
            valor=value,
            minimo=ok_min,
            maximo=ok_max,
            mensaje=f"{label} OK",
        )

    async def estado(self, lote_id: str) -> AmbienteEstadoResponse:
        async with AsyncSessionLocal() as session:
            # ultimo registro
            reg_res = await session.execute(
                select(DbAmbienteRegistro)
                .where(DbAmbienteRegistro.lote_id == lote_id)
                .order_by(
                    DbAmbienteRegistro.fecha_hora.desc(),
                    DbAmbienteRegistro.created_at.desc(),
                )
                .limit(1)
            )
            reg = reg_res.scalar_one_or_none()

            prog_res = await session.execute(
                select(DbAmbienteProgramacion).where(
                    DbAmbienteProgramacion.lote_id == lote_id
                )
            )
            prog = prog_res.scalar_one_or_none()

            if not reg:
                return AmbienteEstadoResponse(
                    lote_id=lote_id,
                    fecha_hora=None,
                    temperatura=ParametroEstado(estado="NA", mensaje="Sin registros"),
                    humedad=ParametroEstado(estado="NA", mensaje="Sin registros"),
                    luz_horas=ParametroEstado(estado="NA", mensaje="Sin programación"),
                    comidas=ParametroEstado(estado="NA", mensaje="Sin programación"),
                )

            # Rangos base (pueden volverse configurables por edad/linea).
            temperatura = self._eval_range(
                float(reg.temperatura_c),
                ok_min=21.0,
                ok_max=27.0,
                warn_min=18.0,
                warn_max=30.0,
                label="Temperatura (°C)",
            )
            humedad = self._eval_range(
                float(reg.humedad_relativa),
                ok_min=50.0,
                ok_max=70.0,
                warn_min=40.0,
                warn_max=80.0,
                label="Humedad (%)",
            )

            # Programacion
            if not prog:
                luz_horas = ParametroEstado(estado="NA", mensaje="Sin programación")
                comidas = ParametroEstado(estado="NA", mensaje="Sin programación")
            else:
                comidas_count = len(prog.horas_comida or [])
                if comidas_count >= 3:
                    comidas = ParametroEstado(
                        estado="OK", valor=float(comidas_count), mensaje="Comidas OK"
                    )
                elif comidas_count >= 2:
                    comidas = ParametroEstado(
                        estado="WARN",
                        valor=float(comidas_count),
                        mensaje="Pocas comidas",
                    )
                elif comidas_count >= 1:
                    comidas = ParametroEstado(
                        estado="BAD",
                        valor=float(comidas_count),
                        mensaje="Muy pocas comidas",
                    )
                else:
                    comidas = ParametroEstado(
                        estado="BAD", valor=0, mensaje="Sin comidas programadas"
                    )

                t0 = _parse_hhmm(prog.luz_inicio)
                t1 = _parse_hhmm(prog.luz_fin)
                if not t0 or not t1:
                    luz_horas = ParametroEstado(
                        estado="NA", mensaje="Horario de luz incompleto"
                    )
                else:
                    hrs = _hours_between(t0, t1)
                    # Rangos recomendados (general): 16-23h
                    if hrs < 14 or hrs > 24:
                        luz_horas = ParametroEstado(
                            estado="BAD",
                            valor=hrs,
                            minimo=16,
                            maximo=23,
                            mensaje="Horas de luz fuera de rango",
                        )
                    elif hrs < 16 or hrs > 23:
                        luz_horas = ParametroEstado(
                            estado="WARN",
                            valor=hrs,
                            minimo=16,
                            maximo=23,
                            mensaje="Horas de luz en alerta",
                        )
                    else:
                        luz_horas = ParametroEstado(
                            estado="OK",
                            valor=hrs,
                            minimo=16,
                            maximo=23,
                            mensaje="Horas de luz OK",
                        )

            return AmbienteEstadoResponse(
                lote_id=lote_id,
                fecha_hora=reg.fecha_hora,
                temperatura=temperatura,
                humedad=humedad,
                luz_horas=luz_horas,
                comidas=comidas,
            )


ambiente_service = AmbienteService()
