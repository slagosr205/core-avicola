from fastapi import APIRouter
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.core.database import AsyncSessionLocal
from app.db.models import Lote, Mortalidad, Pesaje, ConsumoInsumo
from app.application.dto.lote import DashboardStats, Alerta, LoteResponse

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    async with AsyncSessionLocal() as session:
        lotes_activos = await session.execute(
            select(func.count()).select_from(Lote).where(Lote.estado == "ACTIVO")
        )
        lotes_activos = lotes_activos.scalar() or 0

        aves_vivas = await session.execute(
            select(func.coalesce(func.sum(Lote.cantidad_actual), 0))
            .select_from(Lote)
            .where(Lote.estado == "ACTIVO")
        )
        aves_vivas = aves_vivas.scalar() or 0

        peso_promedio_result = await session.execute(
            select(func.avg(Pesaje.peso_promedio)).select_from(Pesaje)
        )
        peso_promedio = peso_promedio_result.scalar() or 0.0

        un_mes_atras = datetime.now().date() - timedelta(days=30)
        mortalidad_result = await session.execute(
            select(func.count())
            .select_from(Mortalidad)
            .where(Mortalidad.fecha >= un_mes_atras)
        )
        mortalidad_count = mortalidad_result.scalar() or 0

        total_inicial = await session.execute(
            select(func.coalesce(func.sum(Lote.cantidad_inicial), 0)).select_from(Lote)
        )
        total_inicial = total_inicial.scalar() or 0
        mortalidad_mes = (
            (mortalidad_count / total_inicial * 100) if total_inicial > 0 else 0.0
        )

        lotes_proceso = await session.execute(
            select(func.count()).select_from(Lote).where(Lote.estado == "EN_PROCESO")
        )
        lotes_proceso = lotes_proceso.scalar() or 0

        total_costo = await session.execute(
            select(func.coalesce(func.sum(ConsumoInsumo.costo_total), 0)).select_from(
                ConsumoInsumo
            )
        )
        total_costo = total_costo.scalar() or 0.0

        total_peso = await session.execute(
            select(func.coalesce(func.sum(Pesaje.peso_total_muestra), 0)).select_from(
                Pesaje
            )
        )
        total_peso = total_peso.scalar() or 0.0
        costo_promedio_lb = (total_costo / total_peso) if total_peso > 0 else 0.0

        return DashboardStats(
            lotes_activos=lotes_activos,
            aves_vivas=aves_vivas,
            peso_promedio=round(peso_promedio, 2),
            mortalidad_mes=round(mortalidad_mes, 2),
            costo_promedio_lb=round(costo_promedio_lb, 2),
            lotes_proceso=lotes_proceso,
        )


@router.get("/alertas", response_model=list[Alerta])
async def get_alertas():
    async with AsyncSessionLocal() as session:
        alertas = []

        lotes_activos = await session.execute(
            select(Lote).where(Lote.estado == "ACTIVO")
        )
        lotes = lotes_activos.scalars().all()

        for lote in lotes:
            mortalidades = await session.execute(
                select(func.sum(Mortalidad.cantidad))
                .select_from(Mortalidad)
                .where(Mortalidad.lote_id == lote.id)
            )
            total_mort = mortalidades.scalar() or 0
            if lote.cantidad_inicial > 0:
                porc_mort = (total_mort / lote.cantidad_inicial) * 100
                if porc_mort > 3:
                    alertas.append(
                        Alerta(
                            id=f"mort_{lote.id}",
                            tipo="warning",
                            mensaje=f"Lote {lote.numero_lote} supera {porc_mort:.1f}% de mortalidad",
                            lote_id=lote.id,
                        )
                    )

        recientes = await session.execute(
            select(Lote).order_by(Lote.created_at.desc()).limit(5)
        )
        lotes_recientes = recientes.scalars().all()

        return alertas


@router.get("/lotes-recientes", response_model=list[LoteResponse])
async def get_lotes_recientes():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Lote).order_by(Lote.created_at.desc()).limit(5)
        )
        lotes = result.scalars().all()
        return [
            LoteResponse(
                id=str(lote.id),
                numero_lote=lote.numero_lote,
                tipo_lote=lote.tipo_lote,
                estado=lote.estado,
                cantidad_inicial=lote.cantidad_inicial,
                cantidad_actual=lote.cantidad_actual,
                peso_promedio_inicial=lote.peso_promedio_inicial,
                peso_promedio_actual=lote.peso_promedio_actual,
                fecha_ingreso=lote.fecha_ingreso,
                fecha_cierre=lote.fecha_cierre,
                fecha_liquidacion=lote.fecha_liquidacion,
                observaciones=lote.observaciones,
                created_at=lote.created_at.isoformat() if lote.created_at else "",
            )
            for lote in lotes
        ]
