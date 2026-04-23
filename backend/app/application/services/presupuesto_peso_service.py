from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict
import uuid

from sqlalchemy import select, delete

from app.core.database import AsyncSessionLocal
from app.db.models import (
    PresupuestoPesoSemanal as DbPresupuestoPesoSemanal,
    Lote as DbLote,
    Pesaje as DbPesaje,
)
from app.application.dto.presupuesto_peso import (
    PresupuestoPesoUpsert,
    PresupuestoPesoResponse,
    PresupuestoPesoEstadoResponse,
    PresupuestoPesoSemanaEstado,
    Semaforo,
)


def _worst(a: Semaforo, b: Semaforo) -> Semaforo:
    order: Dict[Semaforo, int] = {"BAD": 3, "WARN": 2, "OK": 1, "NA": 0}
    return a if order[a] >= order[b] else b


class PresupuestoPesoService:
    # Tolerancias por defecto (configurable mas adelante)
    WARN_PCT = 0.05
    BAD_PCT = 0.10

    async def list(
        self, lote_id: Optional[str] = None
    ) -> List[PresupuestoPesoResponse]:
        async with AsyncSessionLocal() as session:
            stmt = select(DbPresupuestoPesoSemanal).order_by(
                DbPresupuestoPesoSemanal.lote_id.asc(),
                DbPresupuestoPesoSemanal.semana.asc(),
                DbPresupuestoPesoSemanal.updated_at.desc(),
            )
            if lote_id:
                stmt = stmt.where(DbPresupuestoPesoSemanal.lote_id == lote_id)
            res = await session.execute(stmt)
            rows = res.scalars().all()
            return [PresupuestoPesoResponse.model_validate(r) for r in rows]

    async def replace(
        self, lote_id: str, data: PresupuestoPesoUpsert
    ) -> List[PresupuestoPesoResponse]:
        items = list(data.items or [])
        # valida duplicados de semana
        seen = set()
        for it in items:
            if it.semana in seen:
                raise ValueError("Semana duplicada en presupuesto")
            seen.add(it.semana)

        async with AsyncSessionLocal() as session:
            lote = (
                await session.execute(select(DbLote).where(DbLote.id == lote_id))
            ).scalar_one_or_none()
            if not lote:
                raise ValueError("Lote no encontrado")

            # Reemplazo total del presupuesto para evitar inconsistencias.
            await session.execute(
                delete(DbPresupuestoPesoSemanal).where(
                    DbPresupuestoPesoSemanal.lote_id == lote_id
                )
            )

            now = datetime.utcnow()
            rows: List[DbPresupuestoPesoSemanal] = []
            for it in sorted(items, key=lambda x: x.semana):
                row = DbPresupuestoPesoSemanal(
                    id=str(uuid.uuid4()),
                    lote_id=lote_id,
                    semana=int(it.semana),
                    edad=int(it.edad),
                    peso_objetivo=float(it.peso_objetivo),
                    gd=float(it.gd) if it.gd is not None else None,
                    ca=float(it.ca) if it.ca is not None else None,
                    created_at=now,
                    updated_at=now,
                )
                session.add(row)
                rows.append(row)

            await session.commit()
            for r in rows:
                await session.refresh(r)
            return [PresupuestoPesoResponse.model_validate(r) for r in rows]

    async def estado(self, lote_id: str) -> PresupuestoPesoEstadoResponse:
        async with AsyncSessionLocal() as session:
            # presupuesto
            pres_res = await session.execute(
                select(DbPresupuestoPesoSemanal)
                .where(DbPresupuestoPesoSemanal.lote_id == lote_id)
                .order_by(DbPresupuestoPesoSemanal.semana.asc())
            )
            pres = pres_res.scalars().all()
            if not pres:
                return PresupuestoPesoEstadoResponse(
                    lote_id=lote_id,
                    estado_global="NA",
                    semanas=[],
                )

            # pesajes del lote (si hay multiples por semana, nos quedamos con el mas reciente por fecha)
            pes_res = await session.execute(
                select(DbPesaje)
                .where(DbPesaje.lote_id == lote_id)
                .order_by(DbPesaje.semana.asc(), DbPesaje.fecha.asc())
            )
            pesajes = pes_res.scalars().all()
            pesaje_by_week: Dict[int, DbPesaje] = {}
            for p in pesajes:
                pesaje_by_week[int(p.semana)] = p

            semanas: List[PresupuestoPesoSemanaEstado] = []
            estado_global: Semaforo = "NA"
            prev_obj: Optional[float] = None
            for p in pres:
                obj = float(p.peso_objetivo)
                real_row = pesaje_by_week.get(int(p.semana))
                real = float(real_row.peso_promedio) if real_row else None
                delta = (real - obj) if real is not None else None

                if real is None:
                    estado: Semaforo = "NA"
                    msg = "Sin pesaje"
                elif real >= obj:
                    estado = "OK"
                    msg = "En objetivo"
                elif real >= obj * (1 - self.WARN_PCT):
                    estado = "WARN"
                    msg = "Levemente por debajo"
                elif real >= obj * (1 - self.BAD_PCT):
                    estado = "BAD"
                    msg = "Por debajo del objetivo"
                else:
                    estado = "BAD"
                    msg = "Muy por debajo del objetivo"

                ganancia = (obj - prev_obj) if prev_obj is not None else None
                prev_obj = obj

                estado_global = _worst(estado_global, estado)
                semanas.append(
                    PresupuestoPesoSemanaEstado(
                        semana=int(p.semana),
                        edad=int(p.edad),
                        peso_objetivo=obj,
                        gd=float(p.gd) if p.gd is not None else None,
                        ca=float(p.ca) if p.ca is not None else None,
                        peso_real=real,
                        delta=delta,
                        ganancia_objetivo=ganancia,
                        estado=estado,
                        mensaje=msg,
                    )
                )

            return PresupuestoPesoEstadoResponse(
                lote_id=lote_id,
                estado_global=estado_global,
                semanas=semanas,
            )


presupuesto_peso_service = PresupuestoPesoService()
