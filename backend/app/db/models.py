"""
Modelos de Base de Datos - Entidades del Sistema
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    DateTime,
    Date,
    Boolean,
    ForeignKey,
    Text,
    Enum,
    Float,
    JSON,
    CHAR,
    UniqueConstraint,
)
import uuid
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship

from app.core.database import Base


class TipoLote(str, PyEnum):
    PROPIO = "PROPIO"
    TERCERIZADO = "TERCERIZADO"


class EstadoLote(str, PyEnum):
    ACTIVO = "ACTIVO"
    EN_CRIANZA = "EN_CRIANZA"
    EN_PROCESO = "EN_PROCESO"
    CERRADO = "CERRADO"
    LIQUIDADO = "LIQUIDADO"


class CausaMortalidad(str, PyEnum):
    ENFERMEDAD = "ENFERMEDAD"
    PREDADORES = "PREDADORES"
    CALOR = "CALOR"
    FRIO = "FRIO"
    OTRO = "OTRO"


class TipoInsumo(str, PyEnum):
    ALIMENTO = "ALIMENTO"
    MEDICAMENTO = "MEDICAMENTO"
    VACUNA = "VACUNA"


class TipoMovimientoInventario(str, PyEnum):
    ENTRADA = "ENTRADA"
    SALIDA = "SALIDA"
    AJUSTE = "AJUSTE"


class TipoCosto(str, PyEnum):
    MANO_OBRA = "MANO_OBRA"
    ENERGIA = "ENERGIA"
    AGUA = "AGUA"
    TRANSPORTE = "TRANSPORTE"
    MANTENIMIENTO = "MANTENIMIENTO"
    DEPRECIACION = "DEPRECIACION"
    ALIMENTO = "ALIMENTO"
    POLLITO_BABY = "POLLITO_BABY"
    OTRO = "OTRO"


class TipoTercero(str, PyEnum):
    PROVEEDOR = "PROVEEDOR"
    GRANJERO = "GRANJERO"
    PLANTA = "PLANTA"


class TipoContrato(str, PyEnum):
    POR_CABEZA = "POR_CABEZA"
    POR_LIBRA = "POR_LIBRA"


class TipoProducto(str, PyEnum):
    ENTERO = "ENTERO"
    PECHUGA = "PECHUGA"
    ALAS = "ALAS"
    MUSLOS = "MUSLOS"
    HÍGADO = "HÍGADO"
    MOLLEJA = "MOLLEJA"
    PATAS = "PATAS"
    CABEZA = "CABEZA"


class Granja(Base):
    __tablename__ = "granjas"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(100), unique=True, nullable=False)
    ubicacion = Column(String(200))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Galpon(Base):
    __tablename__ = "galpones"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    numero = Column(String(20), nullable=False)
    capacidad = Column(Integer)
    granja_id = Column(CHAR(36), ForeignKey("granjas.id"))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Lote(Base):
    __tablename__ = "lotes"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    numero_lote = Column(String(50), unique=True, nullable=False)
    tipo_lote = Column(Enum(TipoLote), default=TipoLote.PROPIO)
    estado = Column(Enum(EstadoLote), default=EstadoLote.ACTIVO)
    cantidad_inicial = Column(Integer, nullable=False)
    cantidad_actual = Column(Integer, nullable=False)
    peso_promedio_inicial = Column(Float)
    peso_promedio_actual = Column(Float)
    fecha_ingreso = Column(Date, nullable=False)
    fecha_cierre = Column(Date)
    fecha_liquidacion = Column(Date)
    observaciones = Column(Text)

    granja_id = Column(CHAR(36), ForeignKey("granjas.id"))
    galpon_id = Column(CHAR(36), ForeignKey("galpones.id"))
    tercero_id = Column(CHAR(36), ForeignKey("terceros.id"))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))

    # Relationships
    pesajes = relationship(
        "Pesaje", back_populates="lote", cascade="all, delete-orphan"
    )
    mortalidades = relationship(
        "Mortalidad", back_populates="lote", cascade="all, delete-orphan"
    )
    consumos = relationship(
        "ConsumoInsumo", back_populates="lote", cascade="all, delete-orphan"
    )
    costos = relationship(
        "CostoCrianza", back_populates="lote", cascade="all, delete-orphan"
    )
    procesamiento = relationship(
        "Procesamiento",
        back_populates="lote",
        uselist=False,
        cascade="all, delete-orphan",
    )

    ambiente_registros = relationship(
        "AmbienteRegistro", back_populates="lote", cascade="all, delete-orphan"
    )
    ambiente_programacion = relationship(
        "AmbienteProgramacion",
        back_populates="lote",
        uselist=False,
        cascade="all, delete-orphan",
    )

    presupuesto_pesos = relationship(
        "PresupuestoPesoSemanal",
        back_populates="lote",
        cascade="all, delete-orphan",
    )


class Pesaje(Base):
    __tablename__ = "pesajes"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"))
    semana = Column(Integer, nullable=False)
    fecha = Column(Date, nullable=False)
    cantidad_muestreada = Column(Integer, nullable=False)
    peso_total_muestra = Column(Float, nullable=False)
    peso_promedio = Column(Float, nullable=False)
    peso_anterior = Column(Float)
    variacion_semanal = Column(Float)
    observaciones = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))

    lote = relationship("Lote", back_populates="pesajes")


class Mortalidad(Base):
    __tablename__ = "mortalidades"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"))
    fecha = Column(Date, nullable=False)
    cantidad = Column(Integer, nullable=False)
    causa = Column(Enum(CausaMortalidad))
    peso_estimado = Column(Float)
    observaciones = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))

    lote = relationship("Lote", back_populates="mortalidades")


class AmbienteRegistro(Base):
    __tablename__ = "ambiente_registros"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"), nullable=False)
    fecha_hora = Column(DateTime, nullable=False)
    temperatura_c = Column(Float, nullable=False)
    humedad_relativa = Column(Float, nullable=False)
    observaciones = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))

    lote = relationship("Lote", back_populates="ambiente_registros")


class AmbienteProgramacion(Base):
    __tablename__ = "ambiente_programaciones"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"), unique=True, nullable=False)

    # Guardamos la planificacion como JSON para flexibilidad.
    horas_comida = Column(JSON, nullable=False, default=list)
    luz_inicio = Column(String(5))  # HH:MM
    luz_fin = Column(String(5))  # HH:MM

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lote = relationship("Lote", back_populates="ambiente_programacion")


class PresupuestoPesoSemanal(Base):
    __tablename__ = "presupuestos_peso_semanal"

    __table_args__ = (
        UniqueConstraint(
            "lote_id",
            "semana",
            name="uq_presupuesto_peso_lote_semana",
        ),
    )

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"), nullable=False)
    semana = Column(Integer, nullable=False)
    edad = Column(Integer, nullable=False)
    peso_objetivo = Column(Float, nullable=False)
    gd = Column(Float)
    ca = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lote = relationship("Lote", back_populates="presupuesto_pesos")


class Insumo(Base):
    __tablename__ = "insumos"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(200), nullable=False)
    tipo = Column(Enum(TipoInsumo), nullable=False)
    unidad = Column(String(20))
    proveedor_id = Column(CHAR(36), ForeignKey("terceros.id"))
    costo_unitario = Column(Float)
    activo = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ConsumoInsumo(Base):
    __tablename__ = "consumos_insumo"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"))
    insumo_id = Column(CHAR(36), ForeignKey("insumos.id"))
    fecha = Column(Date, nullable=False)
    cantidad = Column(Float, nullable=False)
    costo_unitario = Column(Float, nullable=False)
    costo_total = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))

    lote = relationship("Lote", back_populates="consumos")
    insumo = relationship("Insumo")


class InventarioSaldo(Base):
    __tablename__ = "inventario_saldos"

    # Un saldo por insumo (simplificacion: un solo almacen).
    insumo_id = Column(CHAR(36), ForeignKey("insumos.id"), primary_key=True)
    stock_actual = Column(Float, nullable=False, default=0)
    costo_promedio = Column(Float, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    insumo = relationship("Insumo")


class InventarioMovimiento(Base):
    __tablename__ = "inventario_movimientos"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    insumo_id = Column(CHAR(36), ForeignKey("insumos.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    tipo = Column(Enum(TipoMovimientoInventario), nullable=False)

    cantidad = Column(Float, nullable=False)
    costo_unitario = Column(Float, nullable=False)
    costo_total = Column(Float, nullable=False)

    # Metadatos de referencia (NIIF: trazabilidad de costo)
    referencia_tipo = Column(String(50))
    referencia_id = Column(CHAR(36))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"))

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))

    insumo = relationship("Insumo")
    lote = relationship("Lote")


class CostoCrianza(Base):
    __tablename__ = "costos_crianza"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"))
    tipo_costo = Column(Enum(TipoCosto), nullable=False)
    descripcion = Column(String(500))
    monto = Column(Float, nullable=False)
    fecha = Column(Date, nullable=False)
    comprobante = Column(String(200))

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))

    lote = relationship("Lote", back_populates="costos")


class Procesamiento(Base):
    __tablename__ = "procesamientos"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"), unique=True)
    fecha_recepcion = Column(Date, nullable=False)
    peso_vivo_recibido = Column(Float, nullable=False)
    merma_transporte = Column(Float, default=0)
    peso_neto = Column(Float)
    peso_carne = Column(Float)
    peso_menudos = Column(Float)
    decomiso = Column(Float, default=0)
    rendimiento = Column(Float)
    observaciones = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lote = relationship("Lote", back_populates="procesamiento")
    productos = relationship(
        "ProductoProcesado",
        back_populates="procesamiento",
        cascade="all, delete-orphan",
    )
    costos = relationship(
        "CostoProcesamiento",
        back_populates="procesamiento",
        cascade="all, delete-orphan",
    )


class ProductoProcesado(Base):
    __tablename__ = "productos_procesados"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    procesamiento_id = Column(CHAR(36), ForeignKey("procesamientos.id"))
    tipo_producto = Column(Enum(TipoProducto), nullable=False)
    cantidad_unidades = Column(Integer)
    peso_total = Column(Float, nullable=False)
    rendimiento = Column(Float)

    procesamiento = relationship("Procesamiento", back_populates="productos")


class CostoProcesamiento(Base):
    __tablename__ = "costos_procesamiento"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    procesamiento_id = Column(CHAR(36), ForeignKey("procesamientos.id"))
    tipo_costo = Column(Enum(TipoCosto), nullable=False)
    descripcion = Column(String(500))
    monto = Column(Float, nullable=False)
    fecha = Column(Date, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    procesamiento = relationship("Procesamiento", back_populates="costos")


class Tercero(Base):
    __tablename__ = "terceros"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(200), nullable=False)
    tipo = Column(Enum(TipoTercero))
    nit = Column(String(50))
    telefono = Column(String(50))
    email = Column(String(200))
    direccion = Column(Text)
    activo = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ContratoTercerizado(Base):
    __tablename__ = "contratos_tercerizado"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lote_id = Column(CHAR(36), ForeignKey("lotes.id"))
    tercero_id = Column(CHAR(36), ForeignKey("terceros.id"))
    tipo_contrato = Column(Enum(TipoContrato), nullable=False)
    tarifa = Column(Float, nullable=False)
    estado = Column(Enum(EstadoLote), default=EstadoLote.ACTIVO)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date)
    cantidad_aves = Column(Integer)
    peso_promedio = Column(Float)
    liquidacion = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(200), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    nombre_completo = Column(String(200))
    rol = Column(String(50), default="USUARIO")
    activo = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LogIntegracion(Base):
    __tablename__ = "logs_integracion"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    modulo = Column(String(50), nullable=False)
    operacion = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    mensaje = Column(Text)
    datos_envio = Column(Text)
    datos_respuesta = Column(Text)
    fecha = Column(DateTime, default=datetime.utcnow)
    reintentos = Column(Integer, default=0)


class ParametroSistema(Base):
    __tablename__ = "parametros_sistema"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clave = Column(String(100), unique=True, nullable=False)
    valor = Column(Text)
    descripcion = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
