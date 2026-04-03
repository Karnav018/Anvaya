from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "karnav@anvaya.dev",
                "password": "securepass123",
                "name": "Karnav",
            }
        }
    }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "karnav@anvaya.dev",
                "password": "securepass123",
            }
        }
    }


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    plan: str
    generations_used: int
    generations_limit: int
    generations_reset_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserResponse
