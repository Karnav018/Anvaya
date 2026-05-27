import uuid

from django.db import migrations
from django.utils.text import slugify


def _unique_slug(Organization, base):
    """Return a unique slug starting from base, adding a hex suffix on collision."""
    candidate = base or "workspace"
    # Limit to slug field max_length 64; reserve 13 chars for "-<12-hex>".
    candidate = candidate[:51] if len(candidate) > 51 else candidate
    if not Organization.objects.filter(slug=candidate).exists():
        return candidate
    while True:
        suffix = uuid.uuid4().hex[:12]
        attempt = f"{candidate}-{suffix}"
        if not Organization.objects.filter(slug=attempt).exists():
            return attempt


def backfill_orgs(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Organization = apps.get_model("orgs", "Organization")
    Membership = apps.get_model("orgs", "Membership")
    Project = apps.get_model("projects", "Project")
    Export = apps.get_model("projects", "Export")

    for user in User.objects.all():
        # Idempotency guard: skip if user already has a personal org as owner.
        if Membership.objects.filter(user=user, role="owner").exists():
            continue

        # Build slug from name first, then email local-part, then a fallback.
        base = slugify(user.name or "")
        if not base:
            local = (user.email or "").split("@", 1)[0]
            base = slugify(local) or "workspace"
        slug = _unique_slug(Organization, base)

        org_name = f"{user.name or user.email}'s workspace"
        org = Organization.objects.create(
            name=org_name,
            slug=slug,
            generations_used=user.generations_used,
            generations_limit=user.generations_limit,
            generations_reset_at=user.generations_reset_at,
        )
        Membership.objects.create(organization=org, user=user, role="owner")

        for project in Project.objects.filter(user=user):
            project.organization = org
            project.save(update_fields=["organization"])

        for export in Export.objects.filter(user=user):
            export.organization = org
            export.save(update_fields=["organization"])


def noop_reverse(apps, schema_editor):
    # Reverse is a no-op: we don't want to destroy organizations on rollback.
    return


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("orgs", "0001_initial"),
        ("projects", "0002_export_organization_project_organization_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_orgs, noop_reverse),
    ]
