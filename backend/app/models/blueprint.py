from pydantic import BaseModel
from typing import Any, Optional, Literal
from uuid import UUID
from datetime import datetime


# ── Individual node data models ──────────────────────────────────────────────

class RouteData(BaseModel):
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"]
    path: str
    description: Optional[str] = None


class AuthData(BaseModel):
    strategy: Literal["jwt", "api_key", "none"]
    secret_env_var: Optional[str] = None


class DatabaseData(BaseModel):
    provider: Literal["postgres", "mongodb", "sqlite"]
    model: str
    action: Literal["findAll", "findOne", "create", "update", "delete"]


class MiddlewareData(BaseModel):
    type: Literal["cors", "logger", "rate_limit", "body_parser"]


class ResponseData(BaseModel):
    status_code: int = 200
    body: Literal["data", "message", "error", "custom"] = "data"
    custom_body: Optional[str] = None


# ── Canvas node and edge ──────────────────────────────────────────────────────

class CanvasNode(BaseModel):
    id: str
    type: Literal["route", "auth", "database", "middleware", "response"]
    position: dict[str, float]
    data: dict[str, Any]          # raw dict — validated per-type in generator


class CanvasEdge(BaseModel):
    id: str
    source: str
    target: str
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None


# ── The Anvaya Blueprint (the core IR) ───────────────────────────────────────

class AnvayaBlueprint(BaseModel):
    version: str = "1.0.0"
    nodes: list[CanvasNode] = []
    edges: list[CanvasEdge] = []
    viewport: Optional[dict[str, Any]] = None


# ── API models ────────────────────────────────────────────────────────────────

class BlueprintSave(BaseModel):
    canvas_json: AnvayaBlueprint

    model_config = {
        "json_schema_extra": {
            "example": {
                "canvas_json": {
                    "version": "1.0.0",
                    "nodes": [],
                    "edges": [],
                }
            }
        }
    }


class BlueprintResponse(BaseModel):
    id: UUID
    project_id: UUID
    version: int
    canvas_json: dict[str, Any]
    created_at: datetime


class GenerateRequest(BaseModel):
    project_name: Optional[str] = None

    model_config = {
        "json_schema_extra": {"example": {"project_name": "my-user-api"}}
    }
