from fastapi import APIRouter, HTTPException, status

from app.application.dto.auth import (
    LoginRequest,
    TokenResponse,
    LoginResponse,
    RegisterRequest,
)
from app.application.services.auth_service import auth_service

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    result = await auth_service.login(request)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas"
        )
    return result


@router.post(
    "/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED
)
async def register(request: RegisterRequest):
    try:
        return await auth_service.register(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=LoginResponse)
async def get_current_user():
    return await auth_service.get_current_user()
