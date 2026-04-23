from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List
import uuid

from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.db.models import (
    InventarioMovimiento as DbInvMovimiento,
    InventarioSaldo as DbInvSaldo,
    TipoMovimientoInventario,
    Insumo as DbInsumo,
)
from app.domain.value_objects.enums import TipoInsumo
from app.application.dto.inventario import (
    InventarioEntradaCreate,
    InventarioSalidaCreate,
    InventarioTransferenciaCreate,
    InventarioMovimientoResponse,
    InventarioSaldoResponse,
    InventarioResumenResponse,
    KardexResponse,
    InsumoCreate,
    InsumoUpdate,
)


class InsumoService:
    """Servicio para gestionar insumos del sistema."""

    async def get_all(
        self, tipo: Optional[str] = None, include_inactive: bool = False
    ) -> List[DbInsumo]:
        async with AsyncSessionLocal() as session:
            stmt = select(DbInsumo)
            if not include_inactive:
                stmt = stmt.where(DbInsumo.activo == True)
            if tipo:
                stmt = stmt.where(DbInsumo.tipo == tipo)
            res = await session.execute(stmt.order_by(DbInsumo.nombre))
            return res.scalars().all()

    async def get_by_id(self, insumo_id: str) -> Optional[DbInsumo]:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbInsumo).where(DbInsumo.id == insumo_id)
            )
            return res.scalar_one_or_none()

    async def create(self, data: InsumoCreate) -> DbInsumo:
        async with AsyncSessionLocal() as session:
            tipo_value = data.tipo.upper()
            try:
                tipo_enum = TipoInsumo[tipo_value]
            except KeyError:
                tipo_enum = TipoInsumo.ALIMENTO

            tipo_prefix = {
                TipoInsumo.ALIMENTO: "ALIM",
                TipoInsumo.MEDICAMENTO: "MED",
                TipoInsumo.VACUNA: "VAC",
                TipoInsumo.POLLITO: "POLL",
                TipoInsumo.MATERIAL: "MAT",
                TipoInsumo.EQUIPO: "EQ",
                TipoInsumo.OTRO: "OTR",
            }.get(tipo_enum, "INS")

            max_seq = 1
            prefix_pattern = f"{tipo_prefix}-%"
            res = await session.execute(
                select(DbInsumo.codigo).where(DbInsumo.codigo.like(prefix_pattern))
            )
            existing_codes = [r for r in res.scalars().all() if r]
            if existing_codes:
                nums = []
                for code in existing_codes:
                    try:
                        num = int(code.split("-")[1])
                        nums.append(num)
                    except (ValueError, IndexError):
                        pass
                if nums:
                    max_seq = max(nums) + 1

            codigo = f"{tipo_prefix}-{max_seq:04d}"

            insumo = DbInsumo(
                id=str(uuid.uuid4()),
                codigo=codigo,
                nombre=data.nombre,
                tipo=tipo_enum,
                unidad=data.unidad,
                proveedor_id=data.proveedor_id,
                costo_unitario=data.costo_unitario,
                activo=True,
                created_at=datetime.utcnow(),
            )
            session.add(insumo)
            await session.commit()
            await session.refresh(insumo)
            return insumo

    async def update(self, insumo_id: str, data: InsumoUpdate) -> Optional[DbInsumo]:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(DbInsumo).where(DbInsumo.id == insumo_id)
            )
            insumo = res.scalar_one_or_none()
            if not insumo:
                return None

            if data.nombre is not None:
                insumo.nombre = data.nombre
            if data.tipo is not None:
                tipo_value = data.tipo.upper()
                try:
                    insumo.tipo = TipoInsumo[tipo_value]
                except KeyError:
                    insumo.tipo = TipoInsumo.OTRO
            if data.unidad is not None:
                insumo.unidad = data.unidad
            if data.proveedor_id is not None:
                insumo.proveedor_id = data.proveedor_id
            if data.costo_unitario is not None:
                insumo.costo_unitario = data.costo_unitario
            if data.activo is not None:
                insumo.activo = data.activo

            insumo.updated_at = datetime.utcnow()
            await session.commit()

            if data.costo_unitario is not None or data.activo is not None:
                saldo_res = await session.execute(
                    select(DbInvSaldo).where(DbInvSaldo.insumo_id == insumo_id)
                )
                saldo = saldo_res.scalar_one_or_none()
                if saldo:
                    if data.costo_unitario is not None:
                        saldo.costo_promedio = float(data.costo_unitario)
                    saldo.updated_at = datetime.utcnow()
                    await session.commit()

            await session.refresh(insumo)
            return insumo


class InventarioService:
    """Inventario perpetuo con costo promedio ponderado (NIIF IAS 2)."""

    def __init__(self):
        self._insumo_service = InsumoService()

    async def _to_saldo_response(
        self, saldo: DbInvSaldo, insumo: DbInsumo
    ) -> InventarioSaldoResponse:
        valor_total = float(saldo.stock_actual or 0) * float(saldo.costo_promedio or 0)
        return InventarioSaldoResponse(
            insumo_id=str(saldo.insumo_id),
            insumo_nombre=insumo.nombre,
            tipo_insumo=str(insumo.tipo.value)
            if hasattr(insumo.tipo, "value")
            else str(insumo.tipo),
            unidad=insumo.unidad,
            stock_actual=float(saldo.stock_actual or 0),
            costo_promedio=float(saldo.costo_promedio or 0),
            valor_total=round(valor_total, 2),
            activo=insumo.activo,
            actualizado=saldo.updated_at.isoformat()
            if saldo.updated_at
            else datetime.utcnow().isoformat(),
        )

    async def get_resumen(self) -> InventarioResumenResponse:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(DbInvSaldo))
            saldos = result.scalars().all()

            total_stock = sum(float(s.stock_actual or 0) for s in saldos)
            valor_total = sum(
                float(s.stock_actual or 0) * float(s.costo_promedio or 0)
                for s in saldos
            )

            insumos_result = await session.execute(
                select(DbInsumo).where(DbInsumo.activo == True)
            )
            total_insumos = len(insumos_result.scalars().all())

            alertas = []
            for saldo in saldos:
                if float(saldo.stock_actual or 0) < 100:
                    insumo = await session.execute(
                        select(DbInsumo).where(DbInsumo.id == saldo.insumo_id)
                    )
                    insumo = insumo.scalar_one_or_none()
                    if insumo:
                        alertas.append(await self._to_saldo_response(saldo, insumo))

            return InventarioResumenResponse(
                total_insumos=total_insumos,
                total_stock=round(total_stock, 2),
                valor_total_inventario=round(valor_total, 2),
                alertas_stock_bajo=alertas,
            )

    async def get_all_saldos(self) -> List[InventarioSaldoResponse]:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(DbInvSaldo))
            saldos = result.scalars().all()

            responses = []
            for saldo in saldos:
                insumo = await session.execute(
                    select(DbInsumo).where(DbInsumo.id == saldo.insumo_id)
                )
                insumo = insumo.scalar_one_or_none()
                if insumo and insumo.activo:
                    responses.append(await self._to_saldo_response(saldo, insumo))

            return responses

    async def get_kardex(
        self, insumo_id: str, fechaDesde: Optional[date] = None
    ) -> KardexResponse:
        async with AsyncSessionLocal() as session:
            insumo = await session.execute(
                select(DbInsumo).where(DbInsumo.id == insumo_id)
            )
            insumo = insumo.scalar_one_or_none()
            if not insumo:
                raise ValueError("Insumo no encontrado")

            saldo = await session.execute(
                select(DbInvSaldo).where(DbInvSaldo.insumo_id == insumo_id)
            )
            saldo = saldo.scalar_one_or_none()

            saldo_anterior = float(saldo.stock_actual or 0) if saldo else 0
            costo_promedio = float(saldo.costo_promedio or 0) if saldo else 0

            stmt = (
                select(DbInvMovimiento)
                .where(DbInvMovimiento.insumo_id == insumo_id)
                .order_by(DbInvMovimiento.fecha.asc(), DbInvMovimiento.created_at.asc())
            )

            if fechaDesde:
                stmt = stmt.where(DbInvMovimiento.fecha >= fechaDesde)

            result = await session.execute(stmt)
            movimientos = result.scalars().all()

            entradas = sum(
                m.cantidad
                for m in movimientos
                if m.tipo == TipoMovimientoInventario.ENTRADA
            )
            salidas = sum(
                m.cantidad
                for m in movimientos
                if m.tipo == TipoMovimientoInventario.SALIDA
            )

            movimiento_responses = [
                InventarioMovimientoResponse(
                    id=str(m.id),
                    insumo_id=str(m.insumo_id),
                    fecha=m.fecha,
                    tipo=str(m.tipo.value) if hasattr(m.tipo, "value") else str(m.tipo),
                    cantidad=float(m.cantidad),
                    costo_unitario=float(m.costo_unitario),
                    costo_total=float(m.costo_total),
                    referencia_tipo=m.referencia_tipo,
                    referencia_id=m.referencia_id,
                    lote_id=m.lote_id,
                    observaciones=None,
                    created_at=m.created_at.isoformat() if m.created_at else "",
                )
                for m in movimientos
            ]

            return KardexResponse(
                insumo_id=insumo_id,
                insumo_nombre=insumo.nombre,
                saldo_anterior=saldo_anterior - entradas + salidas,
                entradas=entradas,
                salidas=salidas,
                saldo_final=saldo_anterior,
                movimientos=movimiento_responses,
            )

    async def get_saldo(self, insumo_id: str) -> Optional[InventarioSaldoResponse]:
        async with AsyncSessionLocal() as session:
            saldo = await session.execute(
                select(DbInvSaldo).where(DbInvSaldo.insumo_id == insumo_id)
            )
            saldo = saldo.scalar_one_or_none()
            if not saldo:
                return None

            insumo = await session.execute(
                select(DbInsumo).where(DbInsumo.id == insumo_id)
            )
            insumo = insumo.scalar_one_or_none()
            if not insumo:
                return None

            return await self._to_saldo_response(saldo, insumo)

    async def list_movimientos(
        self, insumo_id: Optional[str] = None, limite: int = 50
    ) -> List[InventarioMovimientoResponse]:
        async with AsyncSessionLocal() as session:
            stmt = (
                select(DbInvMovimiento)
                .order_by(
                    DbInvMovimiento.fecha.desc(), DbInvMovimiento.created_at.desc()
                )
                .limit(limite)
            )

            if insumo_id:
                stmt = stmt.where(DbInvMovimiento.insumo_id == insumo_id)

            res = await session.execute(stmt)
            movimientos = res.scalars().all()

            responses = []
            for m in movimientos:
                insumo = await session.execute(
                    select(DbInsumo).where(DbInsumo.id == m.insumo_id)
                )
                insumo = insumo.scalar_one_or_none()

                responses.append(
                    InventarioMovimientoResponse(
                        id=str(m.id),
                        insumo_id=str(m.insumo_id),
                        insumo_nombre=insumo.nombre if insumo else None,
                        fecha=m.fecha,
                        tipo=str(m.tipo.value)
                        if hasattr(m.tipo, "value")
                        else str(m.tipo),
                        cantidad=float(m.cantidad),
                        costo_unitario=float(m.costo_unitario),
                        costo_total=float(m.costo_total),
                        referencia_tipo=m.referencia_tipo,
                        referencia_id=m.referencia_id,
                        lote_id=m.lote_id,
                        observaciones=None,
                        created_at=m.created_at.isoformat() if m.created_at else "",
                    )
                )

            return responses

    async def _get_or_create_saldo(self, session, insumo_id: str) -> DbInvSaldo:
        res = await session.execute(
            select(DbInvSaldo).where(DbInvSaldo.insumo_id == insumo_id)
        )
        saldo = res.scalar_one_or_none()
        if saldo:
            return saldo

        saldo = DbInvSaldo(
            insumo_id=insumo_id,
            stock_actual=0,
            costo_promedio=0,
            created_at=datetime.utcnow(),
        )
        session.add(saldo)
        await session.flush()
        return saldo

    async def entrada(
        self, data: InventarioEntradaCreate
    ) -> InventarioMovimientoResponse:
        async with AsyncSessionLocal() as session:
            insumo = await session.execute(
                select(DbInsumo).where(DbInsumo.id == data.insumo_id)
            )
            insumo = insumo.scalar_one_or_none()
            if not insumo:
                raise ValueError("Insumo no encontrado")

            saldo = await self._get_or_create_saldo(session, data.insumo_id)

            old_stock = float(saldo.stock_actual or 0)
            old_avg = float(saldo.costo_promedio or 0)
            qty = float(data.cantidad)
            unit_cost = float(data.costo_unitario)

            new_stock = old_stock + qty
            new_avg = (
                ((old_stock * old_avg) + (qty * unit_cost)) / new_stock
                if new_stock > 0
                else 0
            )

            saldo.stock_actual = new_stock
            saldo.costo_promedio = new_avg
            saldo.updated_at = datetime.utcnow()

            mov = DbInvMovimiento(
                id=str(uuid.uuid4()),
                insumo_id=data.insumo_id,
                fecha=data.fecha,
                tipo=TipoMovimientoInventario.ENTRADA,
                cantidad=qty,
                costo_unitario=unit_cost,
                costo_total=qty * unit_cost,
                referencia_tipo="COMPRA",
                referencia_id=data.numero_factura,
                created_at=datetime.utcnow(),
                created_by=None,
            )
            session.add(mov)
            await session.commit()
            await session.refresh(mov)

            return InventarioMovimientoResponse(
                id=str(mov.id),
                insumo_id=str(mov.insumo_id),
                insumo_nombre=insumo.nombre,
                fecha=mov.fecha,
                tipo=str(mov.tipo.value),
                cantidad=float(mov.cantidad),
                costo_unitario=float(mov.costo_unitario),
                costo_total=float(mov.costo_total),
                referencia_tipo=mov.referencia_tipo,
                referencia_id=mov.referencia_id,
                lote_id=mov.lote_id,
                observaciones=data.observaciones,
                created_at=mov.created_at.isoformat(),
            )

    async def salida_por_consumo(
        self,
        *,
        insumo_id: str,
        lote_id: str,
        consumo_id: str,
        fecha,
        cantidad: float,
    ) -> tuple[float, float]:
        """Genera salida a costo promedio y retorna (costo_unitario, costo_total)."""

        async with AsyncSessionLocal() as session:
            insumo = await session.execute(
                select(DbInsumo).where(DbInsumo.id == insumo_id)
            )
            insumo = insumo.scalar_one_or_none()
            if not insumo:
                raise ValueError("Insumo no encontrado")

            saldo = await self._get_or_create_saldo(session, insumo_id)
            stock = float(saldo.stock_actual or 0)
            avg = float(saldo.costo_promedio or 0)
            qty = float(cantidad)

            if qty <= 0:
                raise ValueError("Cantidad invalida")
            if stock < qty:
                raise ValueError(f"Stock insuficiente. Disponible: {stock}")

            unit_cost = avg if avg > 0 else float(insumo.costo_unitario or 0)
            if unit_cost <= 0:
                raise ValueError("Costo de inventario no disponible")

            total = qty * unit_cost
            saldo.stock_actual = stock - qty
            saldo.updated_at = datetime.utcnow()

            mov = DbInvMovimiento(
                id=str(uuid.uuid4()),
                insumo_id=insumo_id,
                fecha=fecha,
                tipo=TipoMovimientoInventario.SALIDA,
                cantidad=qty,
                costo_unitario=unit_cost,
                costo_total=total,
                referencia_tipo="CONSUMO",
                referencia_id=consumo_id,
                lote_id=lote_id,
                created_at=datetime.utcnow(),
                created_by=None,
            )
            session.add(mov)
            await session.commit()
            return unit_cost, total

    async def salida(
        self, data: InventarioSalidaCreate
    ) -> InventarioMovimientoResponse:
        """Registra una salida de inventario."""
        unit_cost, total = await self.salida_por_consumo(
            insumo_id=data.insumo_id,
            lote_id=data.lote_id,
            consumo_id=str(uuid.uuid4()),
            fecha=data.fecha,
            cantidad=data.cantidad,
        )

        async with AsyncSessionLocal() as session:
            insumo = await session.execute(
                select(DbInsumo).where(DbInsumo.id == data.insumo_id)
            )
            insumo = insumo.scalar_one_or_none()

            return InventarioMovimientoResponse(
                id=str(uuid.uuid4()),
                insumo_id=data.insumo_id,
                insumo_nombre=insumo.nombre if insumo else None,
                fecha=data.fecha,
                tipo="SALIDA",
                cantidad=data.cantidad,
                costo_unitario=unit_cost,
                costo_total=total,
                referencia_tipo="SALIDA_MANUAL",
                referencia_id=None,
                lote_id=data.lote_id,
                observaciones=data.descripcion,
                created_at=datetime.utcnow().isoformat(),
            )

    async def transferencia(self, data: InventarioTransferenciaCreate) -> dict:
        """Registra una transferencia de concentrado (inicio/final)."""
        async with AsyncSessionLocal() as session:
            insumo = await session.execute(
                select(DbInsumo).where(DbInsumo.id == data.insumo_id)
            )
            insumo = insumo.scalar_one_or_none()
            if not insumo:
                raise ValueError("Insumo no encontrado")

            saldo = await self._get_or_create_saldo(session, data.insumo_id)
            old_stock = float(saldo.stock_actual or 0)

            entrada_mov = DbInvMovimiento(
                id=str(uuid.uuid4()),
                insumo_id=data.insumo_id,
                fecha=data.fecha,
                tipo=TipoMovimientoInventario.ENTRADA,
                cantidad=float(data.cantidad_inicio),
                costo_unitario=float(saldo.costo_promedio or 0),
                costo_total=float(data.cantidad_inicio)
                * float(saldo.costo_promedio or 0),
                referencia_tipo="TRANSFERENCIA_INICIO",
                created_at=datetime.utcnow(),
            )
            session.add(entrada_mov)

            saldo.stock_actual = old_stock + float(data.cantidad_inicio)
            saldo.updated_at = datetime.utcnow()

            await session.commit()

            return {
                "insumo_id": data.insumo_id,
                "insumo_nombre": insumo.nombre,
                "fecha": data.fecha,
                "tipo": "TRANSFERENCIA",
                "cantidad_inicio": data.cantidad_inicio,
                "cantidad_final": data.cantidad_final,
                "consumo": data.cantidad_inicio - data.cantidad_final,
                "descripcion": data.descripcion,
                "stock_anterior": old_stock,
                "stock_actual": saldo.stock_actual,
            }


insumo_service = InsumoService()
inventario_service = InventarioService()
