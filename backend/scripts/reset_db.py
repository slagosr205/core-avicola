"""Resetea la base de datos local (DROP + CREATE de todas las tablas).

Uso (PowerShell):
  & .\\venv\\Scripts\\python.exe .\\scripts\\reset_db.py

ADVERTENCIA: esto elimina TODOS los datos del esquema configurado en DATABASE_URL.
"""

import os
import sys

# Asegura que `app` sea importable al ejecutar como script.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import asyncio

from sqlalchemy import text

from app.core.database import engine, Base


async def main() -> None:
    # Importa modelos para registrar metadata en Base
    from app.db import models as _models  # noqa: F401

    async with engine.begin() as conn:
        db_name = (await conn.execute(text("SELECT DATABASE()"))).scalar_one_or_none()
        print(f"[RESET][DB] Database: {db_name}")
        print("[RESET][DB] Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("[RESET][DB] Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("[RESET][DB] OK")

    # Cierra conexiones de forma limpia (evita warnings al cerrar el loop).
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
