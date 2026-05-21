"""
Configuracion cargada desde variables de entorno.

Lee `.env` automaticamente si existe en el directorio actual al arrancar
uvicorn. En produccion el `.env` lo gestiona pm2 (cwd del proceso).
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PORT: int = 8001
    ENV: Literal["development", "production"] = "production"
    LOG_LEVEL: Literal["debug", "info", "warning", "error"] = "info"

    # Compartida con el Node (KD_API_KEY de server/.env)
    API_KEY: str = Field(min_length=16)

    COOKIES_PATH: Path = Path("./cookies.json")

    # --- session_keeper (fuente preferida de cookies DWR) -----------------
    # Si SESSION_KEEPER_URL esta definido, al arrancar y al expirar la
    # sesion intentamos obtener cookies frescas desde el keeper. El
    # cookies.json sigue siendo fallback / break-glass.
    SESSION_KEEPER_URL: str = ""
    ADMIN_API_KEY: str = ""
    SESSION_KEEPER_TIMEOUT_S: float = 10.0
    # Edad maxima de las cookies en memoria antes de re-pedirlas al keeper
    # de forma proactiva (segundos). 0 = nunca (solo bajo demanda).
    SESSION_KEEPER_MAX_AGE_S: int = 600

    # Solo relevante si se quiere debugar pegandole desde el navegador.
    # En produccion vacio: el unico cliente legitimo es el Node por loopback.
    CORS_ORIGINS: str = ""

    @field_validator("API_KEY")
    @classmethod
    def _api_key_no_default(cls, v: str) -> str:
        if not v or v.strip().lower() in {"changeme", "todo", "xxx"}:
            raise ValueError("API_KEY no puede estar vacia ni ser un placeholder")
        return v.strip()

    @field_validator("SESSION_KEEPER_URL", "ADMIN_API_KEY")
    @classmethod
    def _strip_keeper(cls, v: str) -> str:
        # Saneamos espacios accidentales en .env (ej: "ADMIN_API_KEY= foo").
        return v.strip() if isinstance(v, str) else v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def keeper_enabled(self) -> bool:
        return bool(self.SESSION_KEEPER_URL and self.ADMIN_API_KEY)


def get_settings() -> Settings:
    """Factory cacheable para inyeccion por dependencias FastAPI."""
    return Settings()  # type: ignore[call-arg]
