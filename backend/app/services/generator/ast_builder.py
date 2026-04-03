from dataclasses import dataclass, field
from app.models.blueprint import CanvasNode
from typing import Optional


@dataclass 
class SchemaFieldAST:
    name: str
    type: str
    required: bool
    unique: bool
    constraints: dict
    default: Optional[str] = None


@dataclass
class SchemaRelationshipAST:
    type: str
    target_model: str
    foreign_key: Optional[str] = None
    through_model: Optional[str] = None
    cascade_delete: bool = False


@dataclass
class SchemaAST:
    model: str
    provider: str
    fields: list[SchemaFieldAST] = field(default_factory=list)
    relationships: list[SchemaRelationshipAST] = field(default_factory=list)
    timestamps: bool = True


@dataclass
class ValidationRuleAST:
    type: str
    value: Optional[str] = None
    message: Optional[str] = None


@dataclass
class ValidationFieldAST:
    name: str
    type: str
    rules: list[ValidationRuleAST] = field(default_factory=list)
    optional: bool = False


@dataclass
class ValidationAST:
    location: str
    fields: list[ValidationFieldAST] = field(default_factory=list)
    schema_reference: Optional[str] = None


@dataclass
class ErrorTypeAST:
    name: str
    status_code: int
    message_template: str
    log_level: str = "error"


@dataclass
class ErrorHandlerAST:
    strategy: str
    custom_errors: list[ErrorTypeAST] = field(default_factory=list)
    fallback_message: str = "An error occurred"
    include_stack_trace: bool = False
    log_errors: bool = True
    error_response_format: str = "standard"


@dataclass
class ResponseFieldAST:
    name: str
    type: str
    description: Optional[str] = None
    example: Optional[str] = None
    required: bool = True


@dataclass
class ResponseSchemaAST:
    name: str
    status_codes: list[int] = field(default_factory=lambda: [200])
    content_type: str = "application/json"
    fields: list[ResponseFieldAST] = field(default_factory=list)
    format: str = "standard"
    include_metadata: bool = True
    cache_control: Optional[str] = None


@dataclass
class RouteAST:
    method: str
    path: str
    file_name: str = ""
    safe_name: str = ""
    auth_strategy: str = "none"        # jwt | api_key | none
    auth_env_var: str = "JWT_SECRET"
    db_model: str = ""
    db_action: str = ""
    db_provider: str = ""
    has_fetch: bool = False
    fetch_method: str = ""
    fetch_url: str = ""
    has_cache: bool = False
    cache_ttl: int = 3600
    cache_key: str = "req.url"
    response_status: int = 200
    response_body: str = "data"
    middlewares: list[str] = field(default_factory=list)
    has_database: bool = False
    has_auth: bool = False
    has_email: bool = False
    email_to: str = ""
    email_subject: str = ""
    has_upload: bool = False
    upload_bucket: str = ""
    has_ai: bool = False
    ai_prompt: str = ""
    has_payment: bool = False
    payment_mode: str = "payment"
    payment_product_id: str = ""
    # NEW: Schema, validation, error handler, and response schema references
    schema: Optional[SchemaAST] = None
    validation: Optional[ValidationAST] = None
    error_handler: Optional[ErrorHandlerAST] = None
    response_schema: Optional[ResponseSchemaAST] = None


@dataclass
class ProjectAST:
    project_name: str
    project_slug: str
    routes: list[RouteAST] = field(default_factory=list)
    models: list[str] = field(default_factory=list)
    schemas: list[SchemaAST] = field(default_factory=list)
    error_handlers: list[ErrorHandlerAST] = field(default_factory=list)
    response_schemas: list[ResponseSchemaAST] = field(default_factory=list)  # NEW
    env_vars: list[str] = field(default_factory=list)
    has_jwt: bool = False
    has_database: bool = False
    has_axios: bool = False
    has_redis: bool = False
    has_nodemailer: bool = False
    has_multer: bool = False
    has_openai: bool = False
    has_stripe: bool = False


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("_", "-")


def build_ast(sorted_nodes: list[CanvasNode], project_name: str) -> ProjectAST:
    ast = ProjectAST(
        project_name=project_name,
        project_slug=slugify(project_name),
    )

    current_route: RouteAST | None = None
    current_schema: SchemaAST | None = None
    current_validation: ValidationAST | None = None
    models_seen: set[str] = set()
    schemas_map: dict[str, SchemaAST] = {}  # node_id -> schema
    validations_map: dict[str, ValidationAST] = {}  # node_id -> validation
    error_handlers_map: dict[str, ErrorHandlerAST] = {}  # node_id -> error_handler
    response_schemas_map: dict[str, ResponseSchemaAST] = {}  # node_id -> response_schema
    env_vars_seen: set[str] = set()

    # First pass: Build schemas and validations
    for node in sorted_nodes:
        t = node.type
        d = node.data

        if t == "schema":
            schema = SchemaAST(
                model=d.get("model", "Model"),
                provider=d.get("provider", "postgres"),
                timestamps=d.get("timestamps", True),
            )
            
            # Parse fields
            for field_data in d.get("fields", []):
                field = SchemaFieldAST(
                    name=field_data.get("name", ""),
                    type=field_data.get("type", "string"),
                    required=field_data.get("required", True),
                    unique=field_data.get("unique", False),
                    constraints=field_data.get("constraints", {}),
                    default=field_data.get("default"),
                )
                schema.fields.append(field)
            
            # Parse relationships
            for rel_data in d.get("relationships", []):
                relationship = SchemaRelationshipAST(
                    type=rel_data.get("type", "hasMany"),
                    target_model=rel_data.get("target_model", ""),
                    foreign_key=rel_data.get("foreign_key"),
                    through_model=rel_data.get("through_model"),
                    cascade_delete=rel_data.get("cascade_delete", False),
                )
                schema.relationships.append(relationship)
            
            schemas_map[node.id] = schema
            ast.schemas.append(schema)
            models_seen.add(schema.model)

        elif t == "validation":
            validation = ValidationAST(
                location=d.get("location", "body"),
                schema_reference=d.get("schema_reference"),
            )
            
            # Parse validation fields
            for field_data in d.get("fields", []):
                field = ValidationFieldAST(
                    name=field_data.get("name", ""),
                    type=field_data.get("type", "string"),
                    optional=field_data.get("optional", False),
                )
                
                # Parse validation rules
                for rule_data in field_data.get("rules", []):
                    rule = ValidationRuleAST(
                        type=rule_data.get("type", "required"),
                        value=rule_data.get("value"),
                        message=rule_data.get("message"),
                    )
                    field.rules.append(rule)
                
                validation.fields.append(field)
            
            validations_map[node.id] = validation

        elif t == "error_handler":
            error_handler = ErrorHandlerAST(
                strategy=d.get("strategy", "global"),
                fallback_message=d.get("fallback_message", "An error occurred"),
                include_stack_trace=d.get("include_stack_trace", False),
                log_errors=d.get("log_errors", True),
                error_response_format=d.get("error_response_format", "standard"),
            )
            
            # Parse custom error types
            for error_data in d.get("custom_errors", []):
                error_type = ErrorTypeAST(
                    name=error_data.get("name", ""),
                    status_code=error_data.get("status_code", 500),
                    message_template=error_data.get("message_template", ""),
                    log_level=error_data.get("log_level", "error"),
                )
                error_handler.custom_errors.append(error_type)
            
            ast.error_handlers.append(error_handler)
            error_handlers_map[node.id] = error_handler

        elif t == "response_schema":
            response_schema = ResponseSchemaAST(
                name=d.get("name", "SuccessResponse"),
                status_codes=d.get("status_codes", [200]),
                content_type=d.get("content_type", "application/json"),
                format=d.get("format", "standard"),
                include_metadata=d.get("include_metadata", True),
                cache_control=d.get("cache_control"),
            )
            
            # Parse response fields
            for field_data in d.get("fields", []):
                field = ResponseFieldAST(
                    name=field_data.get("name", ""),
                    type=field_data.get("type", "string"),
                    description=field_data.get("description"),
                    example=field_data.get("example"),
                    required=field_data.get("required", True),
                )
                response_schema.fields.append(field)
            
            ast.response_schemas.append(response_schema)
            response_schemas_map[node.id] = response_schema

    # Second pass: Build routes with references to schemas and validations  
    for node in sorted_nodes:
        t = node.type
        d = node.data

        if t == "route":
            path_val = d.get("path", "/")
            file_name = path_val.strip("/").replace("/", "-") or "index"
            safe_name = file_name.replace("-", "_")

            current_route = RouteAST(
                method=d.get("method", "GET"),
                path=path_val,
                file_name=file_name,
                safe_name=safe_name,
                # Check for linked schema/validation/error_handler/response_schema (if edges point to them)
                schema=schemas_map.get(d.get("schema_id")) if "schema_id" in d else None,
                validation=validations_map.get(d.get("validation_id")) if "validation_id" in d else None,
                error_handler=error_handlers_map.get(d.get("error_handler_id")) if "error_handler_id" in d else None,
                response_schema=response_schemas_map.get(d.get("response_schema_id")) if "response_schema_id" in d else None,
            )

        elif t == "auth" and current_route:
            strategy = d.get("strategy", "none")
            env_var = d.get("secret_env_var") or d.get("secretEnvVar", "JWT_SECRET")
            current_route.auth_strategy = strategy
            current_route.auth_env_var = env_var
            current_route.has_auth = strategy != "none"
            if strategy != "none":
                env_vars_seen.add(env_var)
                ast.has_jwt = strategy == "jwt"

        elif t == "database" and current_route:
            model = d.get("model", "Record")
            action = d.get("action", "findAll")
            provider = d.get("provider", "postgres")
            current_route.db_model = model
            current_route.db_action = action
            current_route.db_provider = provider
            current_route.has_database = True
            models_seen.add(model)
            ast.has_database = True
            env_vars_seen.add("DATABASE_URL")

        elif t == "middleware" and current_route:
            mw_type = d.get("type", "logger")
            current_route.middlewares.append(mw_type)

        elif t == "fetch" and current_route:
            current_route.has_fetch = True
            current_route.fetch_method = d.get("method", "GET")
            current_route.fetch_url = d.get("url", "")
            ast.has_axios = True

        elif t == "cache" and current_route:
            current_route.has_cache = True
            current_route.cache_ttl = d.get("ttl", 3600)
            current_route.cache_key = d.get("cache_key", "req.url")
            ast.has_redis = True
            env_vars_seen.add("REDIS_URL")

        elif t == "email" and current_route:
            current_route.has_email = True
            current_route.email_to = d.get("to", "")
            current_route.email_subject = d.get("subject", "")
            ast.has_nodemailer = True
            env_vars_seen.add("SMTP_HOST")
            env_vars_seen.add("SMTP_USER")
            env_vars_seen.add("SMTP_PASS")

        elif t == "upload" and current_route:
            current_route.has_upload = True
            current_route.upload_bucket = d.get("bucket", "")
            ast.has_multer = True
            env_vars_seen.add("AWS_ACCESS_KEY_ID")
            env_vars_seen.add("AWS_SECRET_ACCESS_KEY")
            env_vars_seen.add("AWS_REGION")

        elif t == "ai" and current_route:
            current_route.has_ai = True
            current_route.ai_prompt = d.get("prompt", "")
            ast.has_openai = True
            env_vars_seen.add("OPENAI_API_KEY")

        elif t == "payment" and current_route:
            current_route.has_payment = True
            current_route.payment_mode = d.get("mode", "payment")
            current_route.payment_product_id = d.get("product_id", "")
            ast.has_stripe = True
            env_vars_seen.add("STRIPE_SECRET_KEY")

        elif t == "response" and current_route:
            current_route.response_status = d.get("status_code", 200)
            current_route.response_body = d.get("body", "data")
            ast.routes.append(current_route)
            current_route = None

    ast.models = list(models_seen)
    ast.env_vars = ["PORT", *list(env_vars_seen)]
    return ast
