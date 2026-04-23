from enum import Enum


class TipoLote(str, Enum):
    PROPIO = "PROPIO"
    TERCERIZADO = "TERCERIZADO"


class EstadoLote(str, Enum):
    ACTIVO = "ACTIVO"
    EN_CRIANZA = "EN_CRIANZA"
    EN_PROCESO = "EN_PROCESO"
    CERRADO = "CERRADO"
    LIQUIDADO = "LIQUIDADO"


class CausaMortalidad(str, Enum):
    ENFERMEDAD = "ENFERMEDAD"
    PREDADORES = "PREDADORES"
    CALOR = "CALOR"
    FRIO = "FRIO"
    OTRO = "OTRO"


class TipoInsumo(str, Enum):
    ALIMENTO = "ALIMENTO"
    MEDICAMENTO = "MEDICAMENTO"
    VACUNA = "VACUNA"
    POLLITO = "POLLITO"
    MATERIAL = "MATERIAL"
    EQUIPO = "EQUIPO"
    OTRO = "OTRO"


class TipoCosto(str, Enum):
    MANO_OBRA = "MANO_OBRA"
    ENERGIA = "ENERGIA"
    AGUA = "AGUA"
    TRANSPORTE = "TRANSPORTE"
    MANTENIMIENTO = "MANTENIMIENTO"
    DEPRECIACION = "DEPRECIACION"
    ALIMENTO = "ALIMENTO"
    POLLITO_BABY = "POLLITO_BABY"
    OTRO = "OTRO"


class TipoTercero(str, Enum):
    PROVEEDOR = "PROVEEDOR"
    GRANJERO = "GRANJERO"
    PLANTA = "PLANTA"


class TipoContrato(str, Enum):
    POR_CABEZA = "POR_CABEZA"
    POR_LIBRA = "POR_LIBRA"


class TipoProducto(str, Enum):
    ENTERO = "ENTERO"
    PECHUGA = "PECHUGA"
    ALAS = "ALAS"
    MUSLOS = "MUSLOS"
    HIGADO = "HIGADO"
    MOLLEJA = "MOLLEJA"
    PATAS = "PATAS"
    CABEZA = "CABEZA"
