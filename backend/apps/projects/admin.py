from django.contrib import admin

from apps.projects.models import Blueprint, Export, Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at", "updated_at")
    search_fields = ("name", "user__email")
    list_filter = ("created_at",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Blueprint)
class BlueprintAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "version", "created_at")
    list_filter = ("created_at",)
    readonly_fields = ("id", "created_at")


@admin.register(Export)
class ExportAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "user", "language", "created_at")
    list_filter = ("language", "created_at")
    readonly_fields = ("id", "created_at")
