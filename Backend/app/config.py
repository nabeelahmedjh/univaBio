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

    # ---- LLM (Google AI Studio / Gemini) ----
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    llm_temperature: float = 0.2

    # ---- Speech-to-text (local Whisper) ----
    # Model size: tiny | base | small | medium | large. 'tiny' is fastest on CPU;
    # larger models are more accurate but download more weights and run slower.
    whisper_model: str = "tiny"
    # Where uploaded audio files are stored before transcription.
    audio_upload_dir: str = "uploads"
    # Number of concurrent async pipeline workers draining the job queue.
    pipeline_workers: int = 2

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
