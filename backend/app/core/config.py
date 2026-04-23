"""Configuracion principal del sistema."""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Core Avicola"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "mysql+aiomysql://root:@localhost:3306/core_avicola"
    SYNC_DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/core_avicola"

    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "core-avicola-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    ODOO_URL: str = "http://localhost:8069"
    ODOO_DB: str = "odoo"
    ODOO_USER: str = "admin"
    ODOO_PASSWORD: str = "admin"
    ODOO_UID: int = 1

    # Pydantic v2: asegura que se lea .env al iniciar (si existe)
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
