from django.contrib import admin

from apps.orgs.models import Invitation, Membership, Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "plan", "generations_used", "generations_limit", "created_at")
    search_fields = ("name", "slug")
    list_filter = ("plan", "created_at")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("organization", "user", "role", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("organization__slug", "user__email")
    readonly_fields = ("id", "created_at")


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "organization", "role", "expires_at", "accepted_at", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("email", "organization__slug")
    readonly_fields = ("id", "token_hash", "created_at")
