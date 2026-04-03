from dataclasses import dataclass, field
from app.models.blueprint import CanvasNode


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


@dataclass
class ProjectAST:
    project_name: str
    project_slug: str
    routes: list[RouteAST] = field(default_factory=list)
    models: list[str] = field(default_factory=list)
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
    models_seen: set[str] = set()
    env_vars_seen: set[str] = set()

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
                safe_name=safe_name
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
