from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: str
    email: str
    username: str
    nombre_completo: str | None
    rol: str


class TokenResponse(BaseModel):
    user: LoginResponse
    token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    nombre_completo: str | None = None
    rol: str | None = None
