import bcrypt
from datetime import datetime
from typing import Optional

from sqlalchemy import select

from app.application.dto.auth import (
    LoginRequest,
    TokenResponse,
    LoginResponse,
    RegisterRequest,
)
from app.core.database import AsyncSessionLocal
from app.db.models import Usuario as DbUsuario


class AuthService:
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

    def hash_password(self, plain_password: str) -> str:
        return bcrypt.hashpw(plain_password.encode(), bcrypt.gensalt()).decode()

    def create_access_token(self, user_id: str) -> str:
        return f"token_{user_id}_{datetime.utcnow().timestamp()}"

    async def login(self, request: LoginRequest) -> Optional[TokenResponse]:
        async with AsyncSessionLocal() as session:
            row = (
                await session.execute(
                    select(DbUsuario).where(DbUsuario.email == str(request.email))
                )
            ).scalar_one_or_none()

            if not row or not row.activo:
                return None

            if not self.verify_password(request.password, row.hashed_password):
                return None

            user = LoginResponse(
                id=row.id,
                email=row.email,
                username=row.username,
                nombre_completo=row.nombre_completo,
                rol=row.rol or "USUARIO",
            )
            token = self.create_access_token(row.id)
            return TokenResponse(user=user, token=token)

    async def register(self, request: RegisterRequest) -> LoginResponse:
        async with AsyncSessionLocal() as session:
            existing = (
                await session.execute(
                    select(DbUsuario).where(
                        (DbUsuario.email == str(request.email))
                        | (DbUsuario.username == request.username)
                    )
                )
            ).scalar_one_or_none()
            if existing:
                raise ValueError("Email o username ya existe")

            user = DbUsuario(
                email=str(request.email),
                username=request.username,
                hashed_password=self.hash_password(request.password),
                nombre_completo=request.nombre_completo,
                rol=(request.rol or "USUARIO"),
                activo=True,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

            return LoginResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                nombre_completo=user.nombre_completo,
                rol=user.rol or "USUARIO",
            )

    async def get_current_user(self) -> LoginResponse:
        # Placeholder: el frontend no usa /me hoy.
        return LoginResponse(
            id="",
            email="",
            username="",
            nombre_completo=None,
            rol="",
        )


auth_service = AuthService()
