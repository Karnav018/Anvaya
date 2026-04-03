from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.models.blueprint import GenerateRequest
from app.core.deps import get_current_user
from app.database import get_pool
from app.services.generator.parser import parse_blueprint, topological_sort
from app.services.generator.ast_builder import build_ast
from app.services.generator.bundler import bundle_project
from app.models.blueprint import AnvayaBlueprint
import uuid
import io
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/generate", tags=["Generate"])


@router.post("/{project_id}")
async def generate_code(
    project_id: uuid.UUID,
    body: GenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()

    async with pool.acquire() as conn:
        # 1. Verify project ownership
        project = await conn.fetchrow(
            "SELECT id, name FROM projects WHERE id = $1 AND user_id = $2",
            project_id, current_user["id"],
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # 2. Check generation quota
        user = await conn.fetchrow(
            "SELECT generations_used, generations_limit, generations_reset_at "
            "FROM users WHERE id = $1",
            current_user["id"],
        )

        now = datetime.now(timezone.utc)
        reset_at = user["generations_reset_at"]

        # Auto-reset if month has passed
        if reset_at.tzinfo is None:
            reset_at = reset_at.replace(tzinfo=timezone.utc)

        if now > reset_at:
            next_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if next_month.month == 12:
                next_month = next_month.replace(year=next_month.year + 1, month=1)
            else:
                next_month = next_month.replace(month=next_month.month + 1)

            await conn.execute(
                "UPDATE users SET generations_used = 0, generations_reset_at = $1 WHERE id = $2",
                next_month, current_user["id"],
            )
            user = dict(user)
            user["generations_used"] = 0

        generations_used = user["generations_used"]
        generations_limit = user["generations_limit"]

        if generations_used >= generations_limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "quota_exceeded",
                    "message": f"You've used all {generations_limit} free generations this month.",
                    "used": generations_used,
                    "limit": generations_limit,
                    "resets_at": reset_at.isoformat(),
                },
            )

        # 3. Load latest blueprint
        blueprint_row = await conn.fetchrow(
            """
            SELECT canvas_json FROM blueprints
            WHERE project_id = $1
            ORDER BY version DESC LIMIT 1
            """,
            project_id,
        )

    if not blueprint_row:
        raise HTTPException(status_code=400, detail="No blueprint saved for this project yet")

    raw = blueprint_row["canvas_json"]
    canvas_data = json.loads(raw) if isinstance(raw, str) else raw
    blueprint = AnvayaBlueprint(**canvas_data)

    # 4. Parse + validate
    graph = parse_blueprint(blueprint)
    if not graph.is_valid:
        raise HTTPException(
            status_code=400,
            detail={"errors": graph.errors},
        )

    # 5. Sort → AST → Bundle
    sorted_nodes = topological_sort(graph)
    ast = build_ast(sorted_nodes, body.project_name or project["name"])
    zip_bytes = bundle_project(ast)

    # 6. Consume one generation credit
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET generations_used = generations_used + 1 WHERE id = $1",
            current_user["id"],
        )
        # Log export
        await conn.execute(
            "INSERT INTO exports (project_id, user_id, language) VALUES ($1, $2, 'express')",
            project_id, current_user["id"],
        )

    # 7. Stream the zip back
    slug = ast.project_slug
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{slug}-server.zip"',
            "X-Quota-Used": str(generations_used + 1),
            "X-Quota-Limit": str(generations_limit),
            "X-Quota-Remaining": str(generations_limit - generations_used - 1),
        },
    )


@router.get("/quota", tags=["Quota"])
async def get_quota(current_user: dict = Depends(get_current_user)):
    """Check remaining generation quota for the current user."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT generations_used, generations_limit, generations_reset_at "
            "FROM users WHERE id = $1",
            current_user["id"],
        )

    remaining = max(0, user["generations_limit"] - user["generations_used"])
    return {
        "used": user["generations_used"],
        "limit": user["generations_limit"],
        "remaining": remaining,
        "resets_at": user["generations_reset_at"].isoformat(),
        "can_generate": remaining > 0,
    }
