"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---- App ----
    app_name: str = "univaBio Backend"
    environment: str = "development"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # ---- Database ----
    database_url: str = "sqlite:///./univabio.db"

    # ---- Security ----
    jwt_secret_key: str = "change-me-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # ---- Super admin (creates doctor profiles; not stored in DB) ----
    super_admin_username: str = "admin"
    super_admin_pass: str = "admin"

    # ---- LLM ----
    llm_provider: str = "groq"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    llm_temperature: float = 0.2

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
