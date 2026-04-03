from fastapi import APIRouter, HTTPException, status, Depends
from app.models.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.core.deps import get_current_user
from app.database import get_pool
from typing import List
import uuid

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
async def list_projects(current_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, user_id, name, description, created_at, updated_at
            FROM projects
            WHERE user_id = $1
            ORDER BY updated_at DESC
            """,
            current_user["id"],
        )
    return [ProjectResponse(**dict(r)) for r in rows]


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO projects (user_id, name, description)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, name, description, created_at, updated_at
            """,
            current_user["id"],
            body.name,
            body.description,
        )
        # Create an empty blueprint for this project automatically
        await conn.execute(
            """
            INSERT INTO blueprints (project_id, canvas_json)
            VALUES ($1, '{"version":"1.0.0","nodes":[],"edges":[]}'::jsonb)
            """,
            row["id"],
        )
    return ProjectResponse(**dict(row))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, user_id, name, description, created_at, updated_at
            FROM projects WHERE id = $1 AND user_id = $2
            """,
            project_id,
            current_user["id"],
        )
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(**dict(row))


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            project_id, current_user["id"],
        )
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")

        updated = await conn.fetchrow(
            """
            UPDATE projects
            SET name        = COALESCE($1, name),
                description = COALESCE($2, description),
                updated_at  = NOW()
            WHERE id = $3
            RETURNING id, user_id, name, description, created_at, updated_at
            """,
            body.name,
            body.description,
            project_id,
        )
    return ProjectResponse(**dict(updated))


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM projects WHERE id = $1 AND user_id = $2",
            project_id, current_user["id"],
        )
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Project not found")
