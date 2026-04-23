from fastapi import APIRouter
from app.api.v1.endpoints import (
    lotes,
    pesajes,
    mortalidad,
    ambiente,
    presupuesto_pesos,
    alimentacion,
    costos,
    inventario,
    insumos,
    procesamiento,
    terceros,
    dashboard,
    reportes,
    odoo,
    auth,
    granjas,
    galpones,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(lotes.router, prefix="/lotes", tags=["Lotes"])
api_router.include_router(pesajes.router, prefix="/pesajes", tags=["Pesajes"])
api_router.include_router(mortalidad.router, prefix="/mortalidad", tags=["Mortalidad"])
api_router.include_router(ambiente.router, prefix="/ambiente", tags=["Ambiente"])
api_router.include_router(
    presupuesto_pesos.router, prefix="/presupuesto-pesos", tags=["Presupuesto Pesos"]
)
api_router.include_router(
    alimentacion.router, prefix="/consumos", tags=["Alimentación"]
)
api_router.include_router(costos.router, prefix="/costos", tags=["Costos"])
api_router.include_router(insumos.router, prefix="/insumos", tags=["Insumos"])
api_router.include_router(inventario.router, prefix="/inventario", tags=["Inventario"])
api_router.include_router(
    procesamiento.router, prefix="/procesamientos", tags=["Procesamiento"]
)
api_router.include_router(terceros.router, prefix="/terceros", tags=["Terceros"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(reportes.router, prefix="/reportes", tags=["Reportes"])
api_router.include_router(odoo.router, prefix="/odoo", tags=["Odoo"])
api_router.include_router(granjas.router, prefix="/granjas", tags=["Granjas"])
api_router.include_router(galpones.router, prefix="/galpones", tags=["Galpones"])
