from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # App
    APP_NAME: str = "MediKiosk"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    POSTGRES_USER: str = "medikiosk"
    POSTGRES_PASSWORD: str = "medikiosk_dev"
    POSTGRES_DB: str = "medikiosk"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis / Celery
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    @property
    def CELERY_BROKER_URL(self) -> str:
        return self.REDIS_URL

    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        return self.REDIS_URL

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ABDM / ABHA Integration
    ABDM_GATEWAY_URL: str = "https://dev.abdm.gov.in/gateway"
    ABDM_CLIENT_ID: str = ""
    ABDM_CLIENT_SECRET: str = ""
    ABDM_CALLBACK_URL: str = ""

    # AI / LLM
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 4000

    # OCR
    TESSERACT_CMD: str = "/usr/bin/tesseract"
    OCR_LANGUAGES: str = "eng+hin"

    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_MIME_TYPES: list[str] = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    UPLOAD_DIR: str = "/tmp/medikiosk_uploads"

    # FHIR
    FHIR_SERVER_URL: str = "https://hapi.fhir.org/baseR4"

    # Logging
    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()