from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    APP_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    ENCRYPTION_KEY: str = "0" * 64  # 32-byte hex — override in .env

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
