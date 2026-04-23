from datetime import datetime
from typing import Optional, List
import uuid

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.db.models import (
    Lote as DbLote,
    Insumo as DbInsumo,
    InventarioSaldo as DbInvSaldo,
    InventarioMovimiento as DbInvMovimiento,
    TipoMovimientoInventario,
)
from app.domain.entities.pesaje import CostoCrianza as DomainCosto
from app.infrastructure.repositories.costo_repository import costo_repository


class AlimentacionService:
    """Servicio para registrar consumo de alimento con cálculo automático de costos.

    El costo total incluye:
    - Concentrado: cantidad consumida * costo promedio del insumo
    - Pollito baby: una sola vez al inicio del lote (si se especifica)
    """

    async def registrar_consumo(
        self,
        lote_id: str,
        insumo_id: str,
        cantidad: float,
        fecha,
        descripcion: Optional[str] = None,
        costo_pollito_baby: Optional[float] = None,
    ) -> dict:
        """Registra consumo de alimento y calcula costos automáticamente."""
        async with AsyncSessionLocal() as session:
            lote = (
                await session.execute(select(DbLote).where(DbLote.id == lote_id))
            ).scalar_one_or_none()

            if not lote:
                raise ValueError("Lote no encontrado")

            insumo = (
                await session.execute(select(DbInsumo).where(DbInsumo.id == insumo_id))
            ).scalar_one_or_none()

            if not insumo:
                raise ValueError("Insumo no encontrado")

            saldo = (
                await session.execute(
                    select(DbInvSaldo).where(DbInvSaldo.insumo_id == insumo_id)
                )
            ).scalar_one_or_none()

            if saldo and saldo.stock_actual < cantidad:
                raise ValueError(
                    f"Stock insuficiente. Disponible: {saldo.stock_actual}"
                )

            costo_concentrado = 0
            unit_cost = 0
            if saldo and saldo.costo_promedio and saldo.costo_promedio > 0:
                unit_cost = float(saldo.costo_promedio)
                costo_concentrado = cantidad * unit_cost
            elif insumo.costo_unitario and float(insumo.costo_unitario) > 0:
                unit_cost = float(insumo.costo_unitario)
                costo_concentrado = cantidad * unit_cost
            else:
                raise ValueError("No hay costo disponible para el insumo")

            if saldo:
                saldo.stock_actual = float(saldo.stock_actual) - cantidad

            mov = DbInvMovimiento(
                id=str(uuid.uuid4()),
                insumo_id=insumo_id,
                fecha=fecha,
                tipo=TipoMovimientoInventario.SALIDA,
                cantidad=float(cantidad),
                costo_unitario=unit_cost,
                costo_total=costo_concentrado,
                referencia_tipo="ALIMENTACION",
                referencia_id=lote_id,
                lote_id=lote_id,
                created_at=datetime.utcnow(),
                created_by=None,
            )
            session.add(mov)

            total_costo = costo_concentrado
            descripciones = []

            if costo_pollito_baby and costo_pollito_baby > 0:
                total_costo += costo_pollito_baby
                descripciones.append(f"Pollito baby: L {costo_pollito_baby:.2f}")
                from app.application.dto.consumo import CostoCreate

                costo_pollito = CostoCreate(
                    lote_id=lote_id,
                    tipo_costo="POLLITO_BABY",
                    descripcion=f"Pollito baby: {lote.numero_lote}",
                    monto=costo_pollito_baby,
                    fecha=fecha,
                    insumo_id=None,
                    cantidad=1,
                )
                await costo_repository.create(costo_pollito)

            from app.application.dto.consumo import CostoCreate

            costo_concentrado_dto = CostoCreate(
                lote_id=lote_id,
                tipo_costo="ALIMENTO",
                descripcion=descripcion
                or f"Concentrado {insumo.nombre}: {cantidad} lb",
                monto=costo_concentrado,
                fecha=fecha,
                insumo_id=insumo_id,
                cantidad=cantidad,
            )
            await costo_repository.create(costo_concentrado_dto)

            await session.commit()

            return {
                "lote_id": lote_id,
                "insumo_id": insumo_id,
                "insumo_nombre": insumo.nombre,
                "cantidad": cantidad,
                "costo_unitario": unit_cost,
                "costo_concentrado": costo_concentrado,
                "costo_pollito_baby": costo_pollito_baby or 0,
                "costo_total": total_costo,
                "stock_restante": float(saldo.stock_actual) if saldo else 0,
            }

    async def get_resumen_lote(self, lote_id: str) -> dict:
        """Obtiene resumen de alimentación del lote."""
        costos = await costo_repository.get_all(lote_id)
        costos_alimento = [c for c in costos if c.tipo_costo == "ALIMENTO"]
        costos_pollito = [c for c in costos if c.tipo_costo == "POLLITO_BABY"]

        total_concentrado = sum(c.monto for c in costos_alimento)
        total_pollito = sum(c.monto for c in costos_pollito)

        return {
            "lote_id": lote_id,
            "total_concentrado": total_concentrado,
            "total_pollito": total_pollito,
            "costo_alimentacion": total_concentrado + total_pollito,
            "registros": len(costos_alimento) + len(costos_pollito),
        }


alimentacion_service = AlimentacionService()
