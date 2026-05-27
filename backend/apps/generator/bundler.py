import io
import zipfile
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from apps.generator.ast_builder import ProjectAST, RouteAST

TEMPLATES_DIR = Path(__file__).parent / "templates" / "express"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    trim_blocks=True,
    lstrip_blocks=True,
)


def _render(template_name: str, **context: object) -> str:
    tmpl = env.get_template(template_name)
    return tmpl.render(**context)


def render_files_dict(ast: ProjectAST) -> dict[str, str]:
    """Render all project templates and return a {relative_path: content} mapping.

    This is the canonical source of generated-project file contents.
    ``bundle_project`` is a thin zip wrapper around this function so that the
    JSON code-preview API and the ZIP download share the exact same output
    layout.
    """
    files: dict[str, str] = {}
    root = ast.project_slug

    # package.json
    files[f"{root}/package.json"] = _render(
        "package.json.j2",
        project_slug=ast.project_slug,
        has_jwt=ast.has_jwt,
        has_database=ast.has_database,
        has_axios=ast.has_axios,
        has_redis=ast.has_redis,
        has_nodemailer=ast.has_nodemailer,
        has_multer=ast.has_multer,
        has_openai=ast.has_openai,
        has_stripe=ast.has_stripe,
    )

    # server.js
    files[f"{root}/server.js"] = _render("server.js.j2", routes=ast.routes)

    # .env.example and .env defaults
    def _get_env_fallback(v):
        if v == "PORT": return "3000"
        if v == "DATABASE_URL": return "postgres://user:pass@localhost:5432/anvayadb"
        if v == "REDIS_URL": return "redis://localhost:6379"
        if v == "SMTP_HOST": return "smtp.mailtrap.io"
        if v == "SMTP_USER": return "your-user"
        if v == "SMTP_PASS": return "your-pass"
        if v == "OPENAI_API_KEY": return "sk-xxx"
        if v == "STRIPE_SECRET_KEY": return "sk_test_xxx"
        if v == "AWS_ACCESS_KEY_ID": return "AKIAxxx"
        if v == "AWS_SECRET_ACCESS_KEY": return "xxx"
        if v == "AWS_REGION": return "us-east-1"
        return ""

    env_lines = "\n".join(f"{var}={_get_env_fallback(var)}" for var in ast.env_vars)
    files[f"{root}/.env.example"] = env_lines
    files[f"{root}/.env"] = env_lines

    # README.md
    files[f"{root}/README.md"] = _build_readme(ast)

    # routes/
    for route in ast.routes:
        files[f"{root}/routes/{route.file_name}.js"] = _render(
            "route-enhanced.js.j2", route=route
        )

    # validators/ (route-specific validation schemas)
    for route in ast.routes:
        files[f"{root}/validators/{route.file_name}.js"] = _render(
            "validators/route-schema.js.j2", route=route
        )

    # middleware/ (error handling and validation)
    files[f"{root}/middleware/errors.js"] = _render(
        "middleware/errors.js.j2", error_handlers=ast.error_handlers
    )
    files[f"{root}/middleware/validation.js"] = _render("middleware/validation.js.j2")

    # middleware/auth.js (if any auth used)
    if ast.has_jwt:
        auth_env = next(
            (r.auth_env_var for r in ast.routes if r.has_auth),
            "JWT_SECRET",
        )
        files[f"{root}/middleware/auth.js"] = _render("auth.js.j2", env_var=auth_env)

    # models/ (enhanced models from schema data or basic models)
    for model in ast.models:
        # Find corresponding schema for this model
        schema = next((s for s in ast.schemas if s.model == model), None)
        files[f"{root}/models/{model}.js"] = _render(
            "model.js.j2", model=model, schema=schema
        )

    # tests/ (test files for each route)
    files[f"{root}/tests/setup.js"] = _render("tests/setup.js.j2")
    for route in ast.routes:
        files[f"{root}/tests/{route.file_name}.test.js"] = _render(
            "tests/route.test.js.j2", route=route
        )

    # db.js (database connection) — only if DB nodes used
    if ast.has_database:
        files[f"{root}/db.js"] = _build_db_js()

    return files


def bundle_project(ast: ProjectAST) -> bytes:
    """Render all templates and return a zip file as bytes."""
    files = render_files_dict(ast)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path, content in files.items():
            zf.writestr(path, content)
    buf.seek(0)
    return buf.read()


def _build_readme(ast: ProjectAST) -> str:
    # Build route docs separately to avoid nested f-string issues (Python 3.11)
    route_docs = ""
    for r in ast.routes:
        route_docs += f"\n### {r.method} {r.path}\n"
        route_docs += f"- Auth: `{r.auth_strategy}`\n"
        if r.has_database:
            route_docs += f"- DB: `{r.db_action} {r.db_model}` ({r.db_provider})\n"
        if r.has_fetch:
            route_docs += f"- Fetch: Calls external API on execution\n"
        if r.has_cache:
            route_docs += f"- Cache: TTL {r.cache_ttl}s via Redis\n"
        if r.has_ai:
            route_docs += f"- AI: OpenAI logic enabled (GPT-4o)\n"
        if r.has_email:
            route_docs += f"- Email: Transactional email (Nodemailer)\n"
        if r.has_payment:
            route_docs += f"- Payment: Stripe Checkout integrations\n"
        if r.has_upload:
            route_docs += f"- Upload: Multimodal file handling (S3)\n"
        route_docs += f"- Response: `{r.response_status}`\n"

    env_docs = "\n".join(f"- `{v}`" for v in ast.env_vars)

    return f"""# {ast.project_name}

> Generated by [Anvaya](https://anvaya.dev) — Visual API Builder

## Getting Started

```bash
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

## Endpoints
{route_docs}

## Environment Variables
{env_docs}
"""


def _build_db_js() -> str:
    return """const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/anvayadb';
const sequelize = new Sequelize(String(dbUrl), {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    // Uncomment when deploying to production with SSL
    // ssl: { require: true, rejectUnauthorized: false },
  },
});

sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => {
    console.error('⚠️ Database connection warning:', err.message);
    console.error('👉 Please update DATABASE_URL in your .env file with a valid PostgreSQL URI.');
  });

module.exports = { sequelize };
"""
