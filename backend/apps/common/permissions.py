from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level permission: only the owning user can act on the resource."""

    def has_object_permission(self, request, _view, obj):
        return getattr(obj, "user_id", None) == request.user.id


class IsOrgMember(BasePermission):
    """Allow access only if the requester is a Membership of the org_slug in URL.

    Hot path: every authed /o/<slug>/... request lands here. Read-through cache
    on (user_id, org_slug) so the typical request hits Redis, not Postgres.
    """

    def has_permission(self, request, view):
        # Lazy imports to avoid AppRegistryNotReady at module import time.
        from apps.common import membership_cache
        from apps.orgs.models import Membership

        if not request.user or not request.user.is_authenticated:
            return False
        org_slug = view.kwargs.get("org_slug")
        if not org_slug:
            return False

        cached = membership_cache.get(request.user.id, org_slug)
        if cached is not None:
            # Reconstruct a lightweight stand-in: downstream code only reads
            # .role and .organization_id, both of which are cached.
            request.membership = _CachedMembershipProxy(
                role=cached.role,
                organization_id=cached.organization_id,
                user_id=request.user.id,
            )
            return True

        membership = (
            Membership.objects.select_related("organization")
            .filter(organization__slug=org_slug, user=request.user)
            .first()
        )
        if membership is None:
            return False
        membership_cache.set(
            user_id=request.user.id,
            org_slug=org_slug,
            role=membership.role,
            organization_id=membership.organization_id,
        )
        request.membership = membership
        return True


class _CachedMembershipProxy:
    """Stand-in for a Membership row when the value came from Redis.

    Exposes the small surface the permission/view layer reads: ``role``,
    ``organization_id``, ``user_id``. Adding fields here is intentional and
    rare — keep it tight.
    """

    __slots__ = ("role", "organization_id", "user_id")

    def __init__(self, role: str, organization_id: str, user_id) -> None:
        self.role = role
        self.organization_id = organization_id
        self.user_id = user_id


def HasOrgRole(*roles):  # noqa: N802 — factory naming for permission classes.
    """Permission factory: requires the membership role to be in ``roles``.

    Intended to follow ``IsOrgMember`` in ``permission_classes``, which sets
    ``request.membership``.
    """

    allowed = set(roles)

    class _HasOrgRole(BasePermission):
        def has_permission(self, request, _view):
            membership = getattr(request, "membership", None)
            if membership is None:
                return False
            return membership.role in allowed

    _HasOrgRole.__name__ = f"HasOrgRole_{'_'.join(sorted(allowed))}"
    return _HasOrgRole


class OrgScopedViewSetMixin:
    """ViewSet mixin that scopes queries/creates to the URL's ``org_slug``."""

    @property
    def organization(self):
        # Lazy import to avoid model-resolution at import time.
        from apps.orgs.models import Organization

        cached = getattr(self, "_organization", None)
        if cached is not None:
            return cached
        org = Organization.objects.get(slug=self.kwargs["org_slug"])
        self._organization = org
        return org

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(organization__slug=self.kwargs["org_slug"])

    def perform_create(self, serializer):
        serializer.save(organization=self.organization)
