import io
from datetime import datetime, timezone

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone as djtz
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common import cache_keys
from apps.common.permissions import HasOrgRole, IsOrgMember, OrgScopedViewSetMixin
from apps.generator.ast_builder import build_ast
from apps.generator.blueprint import AnvayaBlueprint
from apps.generator.bundler import bundle_project, render_files_dict
from apps.generator.parser import parse_blueprint, topological_sort
from apps.orgs.models import Organization
from apps.projects.models import Blueprint, Export, Project
from apps.projects.starter_blueprints import get as get_starter_blueprint
from apps.projects.serializers import (
    BlueprintSaveSerializer,
    BlueprintSerializer,
    GenerateRequestSerializer,
    ProjectCreateSerializer,
    ProjectSerializer,
    ProjectUpdateSerializer,
)


EMPTY_CANVAS = {"version": "1.0.0", "nodes": [], "edges": []}


class ProjectViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    lookup_field = "id"
    queryset = Project.objects.all()

    def get_permissions(self):
        base = [IsAuthenticated(), IsOrgMember()]
        if self.action in {"create", "update", "partial_update", "destroy"}:
            base.append(HasOrgRole("owner", "editor")())
        return base

    def get_queryset(self):
        # OrgScopedViewSetMixin filters by org slug; apply ordering on top.
        return super().get_queryset().order_by("-updated_at")

    def get_serializer_class(self):
        if self.action == "create":
            return ProjectCreateSerializer
        if self.action in {"update", "partial_update"}:
            return ProjectUpdateSerializer
        return ProjectSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = dict(serializer.validated_data)
        template_key = validated.pop("template", None)
        canvas = get_starter_blueprint(template_key) if template_key else EMPTY_CANVAS
        with transaction.atomic():
            project = Project.objects.create(
                user=request.user,
                organization=self.organization,
                **validated,
            )
            Blueprint.objects.create(project=project, version=1, canvas_json=canvas)
        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProjectSerializer(instance).data)


class BlueprintByProjectView(APIView):
    def get_permissions(self):
        base = [IsAuthenticated(), IsOrgMember()]
        if self.request.method == "POST":
            base.append(HasOrgRole("owner", "editor")())
        return base

    def _get_project(self, project_id):
        return get_object_or_404(
            Project,
            id=project_id,
            organization__slug=self.kwargs["org_slug"],
        )

    def get(self, request, org_slug, project_id):
        cache_key = cache_keys.blueprint_latest(project_id)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        project = self._get_project(project_id)
        bp = project.blueprints.order_by("-version").first()
        if bp is None:
            raise NotFound("Blueprint not found")
        payload = BlueprintSerializer(bp).data
        cache.set(cache_key, payload, timeout=settings.CACHE_BLUEPRINT_TTL)
        return Response(payload)

    def post(self, request, org_slug, project_id):
        project = self._get_project(project_id)
        serializer = BlueprintSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        canvas_json = serializer.validated_data["canvas_json"]
        with transaction.atomic():
            latest = (
                project.blueprints.select_for_update().order_by("-version").first()
            )
            next_version = (latest.version + 1) if latest else 1
            bp = Blueprint.objects.create(
                project=project, version=next_version, canvas_json=canvas_json
            )
            Project.objects.filter(id=project.id).update(updated_at=djtz.now())
        payload = BlueprintSerializer(bp).data
        # Refresh cache with the newly saved version (don't leave a stale entry).
        cache.set(cache_keys.blueprint_latest(project_id), payload, timeout=settings.CACHE_BLUEPRINT_TTL)
        return Response(payload, status=status.HTTP_201_CREATED)


def _next_month_first(now: datetime) -> datetime:
    if now.month == 12:
        return now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)


class GenerateView(APIView):
    permission_classes = [IsAuthenticated, IsOrgMember, HasOrgRole("owner", "editor")]

    def post(self, request, org_slug, project_id):
        project = get_object_or_404(
            Project, id=project_id, organization__slug=org_slug
        )
        body = GenerateRequestSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        project_name_override = body.validated_data.get("project_name")

        # ?format=zip (default, back-compat) | ?format=json (code preview API)
        output_format = request.query_params.get("format", "zip").lower()
        if output_format not in {"zip", "json"}:
            raise ValidationError({"format": "must be 'zip' or 'json'"})

        now = datetime.now(timezone.utc)

        # Lock the org row for the quota check + decrement.
        with transaction.atomic():
            org = Organization.objects.select_for_update().get(pk=project.organization_id)

            if org.generations_reset_at and now > org.generations_reset_at:
                org.generations_used = 0
                org.generations_reset_at = _next_month_first(now)
                org.save(update_fields=["generations_used", "generations_reset_at"])

            if org.generations_used >= org.generations_limit:
                return Response(
                    {
                        "detail": {
                            "error": "quota_exceeded",
                            "message": f"Your organization has used all {org.generations_limit} generations this month.",
                            "used": org.generations_used,
                            "limit": org.generations_limit,
                            "resets_at": org.generations_reset_at.isoformat() if org.generations_reset_at else None,
                        }
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            bp = project.blueprints.order_by("-version").first()
            if bp is None:
                raise ValidationError("No blueprint saved for this project yet")

            blueprint = AnvayaBlueprint(**bp.canvas_json)
            graph = parse_blueprint(blueprint)
            if not graph.is_valid:
                raise ValidationError({"errors": graph.errors})

            sorted_nodes = topological_sort(graph)
            ast = build_ast(sorted_nodes, project_name_override or project.name)
            if output_format == "json":
                files = render_files_dict(ast)
            else:
                zip_bytes = bundle_project(ast)

            org.generations_used += 1
            org.save(update_fields=["generations_used"])
            Export.objects.create(
                project=project,
                user=request.user,
                organization=org,
                blueprint=bp,
                language="express",
            )

        if output_format == "json":
            response = Response(
                {
                    "language": "express",
                    "project_slug": ast.project_slug,
                    "files": files,
                }
            )
        else:
            response = StreamingHttpResponse(
                io.BytesIO(zip_bytes),
                content_type="application/zip",
            )
            response["Content-Disposition"] = f'attachment; filename="{ast.project_slug}-server.zip"'
        response["X-Quota-Used"] = str(org.generations_used)
        response["X-Quota-Limit"] = str(org.generations_limit)
        response["X-Quota-Remaining"] = str(org.generations_limit - org.generations_used)
        return response


class GenerateQuotaView(APIView):
    permission_classes = [IsAuthenticated, IsOrgMember]

    def get(self, request, org_slug):
        org = get_object_or_404(Organization, slug=org_slug)
        remaining = max(0, org.generations_limit - org.generations_used)
        return Response(
            {
                "used": org.generations_used,
                "limit": org.generations_limit,
                "remaining": remaining,
                "resets_at": org.generations_reset_at.isoformat() if org.generations_reset_at else None,
                "can_generate": remaining > 0,
            }
        )
