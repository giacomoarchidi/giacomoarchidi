from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Environment
    ENV: str = "dev"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGO: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database - Supporta sia URL diretto che componenti separati
    DATABASE_URL: str | None = None
    DB_HOST: str | None = None
    DB_PORT: int | None = None
    DB_USER: str | None = None
    DB_PASSWORD: str | None = None
    DB_NAME: str | None = None

    def get_database_url(self) -> str:
        """Get database URL from env or build from components"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Redis (opzionale per deployment iniziale)
    REDIS_URL: str = "redis://localhost:6379"

    # Stripe (opzionale per deployment iniziale)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    # S3/MinIO (opzionale per deployment iniziale)
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET: str = "ai-tutor"
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = False

    # Email (opzionale per deployment iniziale)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@aitutor.com"

    # AI Services
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str | None = None

    # Agora Video SDK
    AGORA_APP_ID: str = "4d3c5454d08847ed9536332dad1b6759"
    AGORA_APP_CERTIFICATE: str = "5c6993d86ecc434682beb8873b3ae5c8"

    # CORS - Può essere stringa separata da virgole o lista
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

    class Config:
        env_file = ".env.dev"
        case_sensitive = True
        extra = "allow"  # Permette variabili extra senza errori


settings = Settings()
