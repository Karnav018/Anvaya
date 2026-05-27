from rest_framework import serializers

from apps.projects.models import Blueprint, Export, Project


class ProjectSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source="user.id", read_only=True)

    class Meta:
        model = Project
        fields = ("id", "user_id", "name", "description", "created_at", "updated_at")
        read_only_fields = ("id", "user_id", "created_at", "updated_at")


class ProjectCreateSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, default="")
    template = serializers.ChoiceField(
        choices=("todo", "cart", "blog"),
        required=False,
        allow_blank=True,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Project
        fields = ("name", "description", "template")


class ProjectUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("name", "description")
        extra_kwargs = {"name": {"required": False}, "description": {"required": False}}


class BlueprintSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(source="project.id", read_only=True)

    class Meta:
        model = Blueprint
        fields = ("id", "project_id", "version", "canvas_json", "created_at")
        read_only_fields = fields


class BlueprintSaveSerializer(serializers.Serializer):
    canvas_json = serializers.JSONField()


class GenerateRequestSerializer(serializers.Serializer):
    project_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class ExportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Export
        fields = ("id", "project", "user", "blueprint", "language", "created_at")
        read_only_fields = fields
