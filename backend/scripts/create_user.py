r"""Crea (o actualiza) un usuario en la BD local.

Uso (PowerShell desde backend):
  & .\venv\Scripts\python.exe .\scripts\create_user.py --email admin@local --username admin --password "TuPass" --rol ADMIN

Si el email ya existe, actualiza username/nombre/rol/password.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys

from sqlalchemy import select

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import AsyncSessionLocal, engine  # noqa: E402
from app.db.models import Usuario as DbUsuario  # noqa: E402
from app.application.services.auth_service import auth_service  # noqa: E402


async def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--email", required=True)
    p.add_argument("--username", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--nombre", default=None)
    p.add_argument("--rol", default="USUARIO")
    args = p.parse_args()

    async with AsyncSessionLocal() as session:
        existing = (
            await session.execute(
                select(DbUsuario).where(DbUsuario.email == args.email)
            )
        ).scalar_one_or_none()

        hashed = auth_service.hash_password(args.password)
        if existing:
            existing.username = args.username
            existing.hashed_password = hashed
            existing.nombre_completo = args.nombre
            existing.rol = args.rol
            existing.activo = True
            await session.commit()
            await session.refresh(existing)
            print(
                f"Usuario actualizado: {existing.email} ({existing.username}) rol={existing.rol}"
            )
        else:
            user = DbUsuario(
                email=args.email,
                username=args.username,
                hashed_password=hashed,
                nombre_completo=args.nombre,
                rol=args.rol,
                activo=True,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Usuario creado: {user.email} ({user.username}) rol={user.rol}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
