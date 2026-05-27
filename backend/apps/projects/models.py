import uuid

from django.conf import settings
from django.db import models


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    organization = models.ForeignKey(
        "orgs.Organization",
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects"
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["organization"]),
            # Project list endpoint scopes by org and sorts by updated_at DESC.
            models.Index(fields=["organization", "-updated_at"], name="projects_org_updated_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.user_id})"


class Blueprint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="blueprints")
    version = models.IntegerField(default=1)
    canvas_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "blueprints"
        ordering = ("-version",)
        indexes = [
            models.Index(fields=["project"]),
            # "latest blueprint for project" hot path: scopes by project,
            # sorts by version DESC. Covers the GET /blueprints/{project_id}
            # cache-miss path.
            models.Index(fields=["project", "-version"], name="blueprints_project_version_idx"),
        ]
        unique_together = (("project", "version"),)

    def __str__(self) -> str:
        return f"{self.project_id} v{self.version}"


class Export(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="exports")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="exports")
    organization = models.ForeignKey(
        "orgs.Organization",
        on_delete=models.CASCADE,
        related_name="exports",
    )
    blueprint = models.ForeignKey(Blueprint, on_delete=models.SET_NULL, null=True, blank=True, related_name="exports")
    language = models.CharField(max_length=32, default="express")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "exports"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["organization"]),
        ]
