from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    APP_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    # Provide defaults to prevent 500 crash if env vars are missing at boot
    DATABASE_URL: str = "postgresql://user:pass@localhost/anvaya"
    JWT_SECRET: str = "super-secret-development-key"
    STRIPE_SECRET_KEY: str = "sk_test_..."
    OPENAI_API_KEY: str = "sk-..."
    ENCRYPTION_KEY: str = "0" * 64

    class Config:
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
