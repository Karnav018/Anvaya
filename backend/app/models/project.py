from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {"name": "My REST API", "description": "User management API"}
        }
    }


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
