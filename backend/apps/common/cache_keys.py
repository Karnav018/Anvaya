"""Centralized Redis key formatters.

Keep all key shapes here so invalidation paths can't drift from read paths.
Every key is namespaced via Django's CACHE_KEY_PREFIX (set in settings/base.py).
"""

from __future__ import annotations

from uuid import UUID


def membership(user_id: str | UUID, org_slug: str) -> str:
    return f"membership:{user_id}:{org_slug}"


def user_orgs(user_id: str | UUID) -> str:
    """Cached list-of-orgs for the user (used by /orgs GET)."""
    return f"user_orgs:{user_id}"


def blueprint_latest(project_id: str | UUID) -> str:
    """Cached latest blueprint payload for a project."""
    return f"blueprint:latest:{project_id}"


def org_by_slug(slug: str) -> str:
    """Cached Organization PK lookup by slug — avoids a Postgres roundtrip
    on every org-scoped request."""
    return f"org_id_by_slug:{slug}"
