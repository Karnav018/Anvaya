"""Read-through cache for ``Membership`` lookups.

Every authenticated request to an ``/o/<slug>/...`` endpoint hits
``IsOrgMember.has_permission``, which used to issue a SELECT against the
``memberships`` table on every request. With this cache, repeat reads land in
Redis and only invalidate when membership rows change (signals in
``apps.orgs.signals``).

The cached value is the membership *role* plus the organization PK, which is
all downstream permission checks need. We do **not** cache the full
``Membership`` ORM instance — that keeps cache invariants simpler and avoids
serialization of related objects.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from django.conf import settings
from django.core.cache import cache

from apps.common import cache_keys


@dataclass(frozen=True)
class CachedMembership:
    role: str
    organization_id: str  # UUID as string for cache-safe round-tripping


def get(user_id: str | UUID, org_slug: str) -> Optional[CachedMembership]:
    raw = cache.get(cache_keys.membership(user_id, org_slug))
    if raw is None:
        return None
    return CachedMembership(role=raw["role"], organization_id=raw["organization_id"])


def set(user_id: str | UUID, org_slug: str, role: str, organization_id: str | UUID) -> None:
    cache.set(
        cache_keys.membership(user_id, org_slug),
        {"role": role, "organization_id": str(organization_id)},
        timeout=settings.CACHE_MEMBERSHIP_TTL,
    )


def invalidate(user_id: str | UUID, org_slug: str) -> None:
    cache.delete(cache_keys.membership(user_id, org_slug))


def invalidate_user(user_id: str | UUID) -> None:
    """Best-effort: clear the user-orgs list cache. Per-org memberships expire
    naturally within ``CACHE_MEMBERSHIP_TTL`` (60s); explicit per-(user,org)
    invalidation is wired via signals."""
    cache.delete(cache_keys.user_orgs(user_id))
