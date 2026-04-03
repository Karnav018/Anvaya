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


# ── NEW: Schema and Validation Data Models ──────────────────────────────────

class SchemaField(BaseModel):
    name: str
    type: Literal["string", "number", "boolean", "date", "uuid", "json", "text", "email"]
    required: bool = True
    unique: bool = False
    indexed: bool = False
    default: Optional[str] = None
    constraints: dict[str, Any] = {}  # min, max, pattern, etc.


class SchemaRelationship(BaseModel):
    type: Literal["hasMany", "belongsTo", "hasOne", "manyToMany"]
    target_model: str
    foreign_key: Optional[str] = None
    through_model: Optional[str] = None  # for many-to-many
    cascade_delete: bool = False


class SchemaData(BaseModel):
    model: str
    provider: Literal["postgres", "mongodb", "sqlite"] = "postgres"
    fields: list[SchemaField] = []
    relationships: list[SchemaRelationship] = []
    timestamps: bool = True
    soft_deletes: bool = False


class ValidationRule(BaseModel):
    type: Literal["required", "email", "min", "max", "pattern", "unique", "custom"]
    value: Optional[str] = None  # For min/max/pattern
    message: Optional[str] = None


class ValidationField(BaseModel):
    name: str
    type: Literal["string", "number", "boolean", "array", "object"]
    rules: list[ValidationRule] = []
    optional: bool = False


class ValidationData(BaseModel):
    location: Literal["body", "query", "params"] = "body"
    fields: list[ValidationField] = []
    schema_reference: Optional[str] = None  # Link to SchemaNode ID


class ErrorType(BaseModel):
    name: str
    status_code: int
    message_template: str
    log_level: Literal["info", "warn", "error", "critical"] = "error"


class ErrorHandlerData(BaseModel):
    strategy: Literal["global", "route_specific", "middleware"] = "global"
    custom_errors: list[ErrorType] = []
    fallback_message: str = "An error occurred"
    include_stack_trace: bool = False
    log_errors: bool = True
    error_response_format: Literal["standard", "json_api", "custom"] = "standard"


class ResponseField(BaseModel):
    name: str
    type: Literal["string", "number", "boolean", "array", "object", "null"]
    description: Optional[str] = None
    example: Optional[str] = None
    required: bool = True


class ResponseSchemaData(BaseModel):
    name: str = "SuccessResponse"
    status_codes: list[int] = [200]
    content_type: Literal["application/json", "text/plain", "text/html"] = "application/json"
    fields: list[ResponseField] = []
    format: Literal["standard", "envelope", "raw", "paginated"] = "standard"
    include_metadata: bool = True
    cache_control: Optional[str] = None


# ── Canvas node and edge ──────────────────────────────────────────────────────

class CanvasNode(BaseModel):
    id: str
    type: Literal["route", "auth", "database", "middleware", "response", "schema", "validation", "error_handler", "response_schema"]
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
