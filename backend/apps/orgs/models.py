import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


def _default_reset_at():
    return timezone.now() + timedelta(days=30)


ROLE_CHOICES = (
    ("owner", "Owner"),
    ("editor", "Editor"),
    ("viewer", "Viewer"),
)


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=64, unique=True)
    plan = models.CharField(max_length=32, default="free")
    stripe_customer_id = models.CharField(max_length=64, blank=True, default="")
    generations_used = models.IntegerField(default=0)
    generations_limit = models.IntegerField(default=10)
    generations_reset_at = models.DateTimeField(default=_default_reset_at)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizations"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.name} ({self.slug})"


class Membership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "memberships"
        unique_together = (("organization", "user"),)
        indexes = [
            # Cache-miss path: IsOrgMember filters by (user, organization__slug).
            # Composite index makes the join-and-filter cheap.
            models.Index(fields=["user", "organization"], name="memberships_user_org_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} in {self.organization_id} as {self.role}"


class Invitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    email = models.EmailField()
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    token_hash = models.CharField(max_length=128, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitations_sent",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invitations"
        ordering = ("-created_at",)
        indexes = [
            # Owner-only list-pending-invites endpoint sorts by created_at DESC.
            models.Index(fields=["organization", "-created_at"], name="invites_org_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.email} -> {self.organization_id} ({self.role})"
