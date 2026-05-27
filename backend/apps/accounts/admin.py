from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.accounts.models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = ("email", "name", "plan", "generations_used", "generations_limit", "is_active", "created_at")
    list_filter = ("plan", "is_active", "is_staff")
    search_fields = ("email", "name")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("name",)}),
        ("Quota", {"fields": ("plan", "generations_used", "generations_limit", "generations_reset_at")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "password1", "password2"),
        }),
    )
    readonly_fields = ("created_at", "updated_at", "last_login")
