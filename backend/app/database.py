import asyncpg
from app.config import settings

pool: asyncpg.Pool | None = None


async def init_db() -> None:
    global pool
    try:
        # Use SSL for neon.tech databases
        pool = await asyncpg.create_pool(
            dsn=settings.DATABASE_URL,
            min_size=1,
            max_size=5,
            command_timeout=30,
            ssl="require" if "neon.tech" in settings.DATABASE_URL else None
        )
        await run_migrations()
        print("Database connected successfully")
    except Exception as e:
        print(f"Database connection failed: {e}")
        # We don't re-raise here so the API can still start and serve health checks
        pool = None


async def close_db() -> None:
    if pool:
        await pool.close()


async def get_pool() -> asyncpg.Pool:
    if pool is None:
        raise RuntimeError("Database pool not initialized")
    return pool


async def run_migrations() -> None:
    """Create all tables if they don't exist."""
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            CREATE TABLE IF NOT EXISTS users (
                id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email                 TEXT UNIQUE NOT NULL,
                password              TEXT NOT NULL,
                name                  TEXT NOT NULL,
                plan                  TEXT DEFAULT 'free',
                generations_used      INTEGER DEFAULT 0,
                generations_limit     INTEGER DEFAULT 10,
                generations_reset_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
                created_at            TIMESTAMPTZ DEFAULT NOW(),
                updated_at            TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS projects (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
                name        TEXT NOT NULL,
                description TEXT,
                created_at  TIMESTAMPTZ DEFAULT NOW(),
                updated_at  TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS blueprints (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
                version     INTEGER DEFAULT 1,
                canvas_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at  TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS exports (
                id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
                user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
                blueprint_id UUID REFERENCES blueprints(id),
                language     TEXT DEFAULT 'express',
                created_at   TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_projects_user_id   ON projects(user_id);
            CREATE INDEX IF NOT EXISTS idx_blueprints_project  ON blueprints(project_id);
            CREATE INDEX IF NOT EXISTS idx_exports_user_id     ON exports(user_id);
        """)
