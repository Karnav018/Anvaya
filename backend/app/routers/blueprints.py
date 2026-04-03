from fastapi import APIRouter, HTTPException, Depends
from app.models.blueprint import BlueprintSave, BlueprintResponse
from app.core.deps import get_current_user
from app.database import get_pool
import uuid
import json

router = APIRouter(prefix="/blueprints", tags=["Blueprints"])


@router.get("/{project_id}", response_model=BlueprintResponse)
async def get_blueprint(
    project_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verify project ownership
        project = await conn.fetchrow(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            project_id, current_user["id"],
        )
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get the latest blueprint
        row = await conn.fetchrow(
            """
            SELECT id, project_id, version, canvas_json, created_at
            FROM blueprints
            WHERE project_id = $1
            ORDER BY version DESC
            LIMIT 1
            """,
            project_id,
        )

    if row is None:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    return BlueprintResponse(
        id=row["id"],
        project_id=row["project_id"],
        version=row["version"],
        canvas_json=json.loads(row["canvas_json"]) if isinstance(row["canvas_json"], str) else row["canvas_json"],
        created_at=row["created_at"],
    )


@router.post("/{project_id}", response_model=BlueprintResponse, status_code=201)
async def save_blueprint(
    project_id: uuid.UUID,
    body: BlueprintSave,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verify project ownership
        project = await conn.fetchrow(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            project_id, current_user["id"],
        )
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get current version
        current = await conn.fetchrow(
            "SELECT COALESCE(MAX(version), 0) AS v FROM blueprints WHERE project_id = $1",
            project_id,
        )
        next_version = current["v"] + 1

        canvas_dict = body.canvas_json.model_dump()

        row = await conn.fetchrow(
            """
            INSERT INTO blueprints (project_id, version, canvas_json)
            VALUES ($1, $2, $3::jsonb)
            RETURNING id, project_id, version, canvas_json, created_at
            """,
            project_id,
            next_version,
            json.dumps(canvas_dict),
        )

        # Update project updated_at
        await conn.execute(
            "UPDATE projects SET updated_at = NOW() WHERE id = $1", project_id
        )

    return BlueprintResponse(
        id=row["id"],
        project_id=row["project_id"],
        version=row["version"],
        canvas_json=json.loads(row["canvas_json"]) if isinstance(row["canvas_json"], str) else row["canvas_json"],
        created_at=row["created_at"],
    )
