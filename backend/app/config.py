from pydantic_settings import BaseSettings
from pydantic import field_validator
import sys


class Settings(BaseSettings):
    # Required settings
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    APP_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Optional settings
    ENCRYPTION_KEY: str = "0" * 64  # 32-byte hex — override in .env
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    # DB SSL: True=require, False=off, None=auto (infer from URL / host)
    DATABASE_SSL: bool | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        """Ensure JWT secret is not the default insecure value."""
        if v == "change-this-to-a-random-256-bit-secret":
            print("⚠️  WARNING: Using default JWT_SECRET is insecure!")
            print("   Generate a secure secret with: openssl rand -hex 32")
            if cls.model_config.get("env_file") != ".env":  # Only error in production
                sys.exit(1)
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters long")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL format."""
        if not v.startswith(("postgresql://", "postgres://")):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        return v

    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"

    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT.lower() == "development"


# Initialize settings and validate on import
try:
    settings = Settings()
    print(f"✅ Configuration loaded successfully (ENV: {settings.ENVIRONMENT})")
except Exception as e:
    print(f"❌ Configuration error: {e}")
    print("   Make sure .env file exists and contains all required variables")
    print("   Copy .env.example to .env and update the values")
    sys.exit(1)
