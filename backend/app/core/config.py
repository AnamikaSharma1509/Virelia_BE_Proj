from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "Virelia"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:password@localhost:5433/virelia_db",
        description="SQLAlchemy database connection URL"
    )

    # JWT Security
    JWT_SECRET: str = "virelia_jwt_secret_dev_key_super_secure_random_change_in_prod_2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # Initial Admin Seed
    ADMIN_EMAIL: str = "anamika.admin@gmail.com"
    ADMIN_INITIAL_PASSWORD: str = "Admin@Virelia2026!"

    # Email / SMTP
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "support@virelia.com"

    # AI Configuration
    AI_PROVIDER: str = "local"  # "local", "openai"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gpt-4o-mini"
    AI_BASE_URL: Optional[str] = None

    # Media Storage
    MEDIA_ROOT: str = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "media"))
    MAX_VIDEO_UPLOAD_MB: int = 500

settings = Settings()
