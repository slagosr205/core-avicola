"""
Core Avicola - Sistema de Gestión Avícola y Agroindustrial
Backend Principal - FastAPI
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.database import init_db

    db_ok = await init_db()
    print(f"[INIT] DB {'OK' if db_ok else 'NO DISPONIBLE'}")

    # Seed removido: no se precargan datos automaticamente.
    yield
    print("[SHUTDOWN] Apagando...")


app = FastAPI(
    title="Core Avicola API",
    description="Sistema de Gestión Avícola y Agroindustrial",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
