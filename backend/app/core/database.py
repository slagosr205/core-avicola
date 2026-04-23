"""
Configuración de Base de Datos
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> bool:
    """Inicializa la BD (crea tablas) y valida conectividad.

    Devuelve True si pudo conectarse y ejecutar operaciones básicas.
    """
    try:
        # Importa modelos para registrar metadata en Base
        from app.db import models as _models  # noqa: F401

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_name = (
                await session.execute(text("SELECT DATABASE()"))
            ).scalar_one_or_none()
            print(f"[INIT][DB] Database: {db_name}")

        return True
    except Exception as e:
        print(f"[INIT][DB] No disponible: {e}")
        return False
