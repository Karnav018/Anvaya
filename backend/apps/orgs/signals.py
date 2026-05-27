"""Cache-invalidation signals for org/membership writes.

We invalidate eagerly on the boundaries that matter:
- Membership created / updated / deleted  → drop the (user, org_slug) cache
- Organization slug change                → drop org-by-slug cache and any
  per-membership entries that referenced the old slug
"""

from __future__ import annotations

from django.core.cache import cache
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from apps.common import cache_keys, membership_cache
from apps.orgs.models import Membership, Organization


@receiver(post_save, sender=Membership)
def _on_membership_save(sender, instance: Membership, **kwargs):
    membership_cache.invalidate(instance.user_id, instance.organization.slug)
    membership_cache.invalidate_user(instance.user_id)


@receiver(post_delete, sender=Membership)
def _on_membership_delete(sender, instance: Membership, **kwargs):
    # On delete, ``instance.organization`` may still be loaded; guard for the
    # cascade case where it was already gone.
    slug = getattr(getattr(instance, "organization", None), "slug", None)
    if slug:
        membership_cache.invalidate(instance.user_id, slug)
    membership_cache.invalidate_user(instance.user_id)


@receiver(pre_save, sender=Organization)
def _on_organization_pre_save(sender, instance: Organization, **kwargs):
    """If slug changed, drop every cache entry that referenced the old slug."""
    if not instance.pk:
        return
    try:
        old = Organization.objects.only("slug").get(pk=instance.pk)
    except Organization.DoesNotExist:
        return
    if old.slug == instance.slug:
        return
    # Drop the org-by-slug index and all membership caches for the old slug.
    cache.delete(cache_keys.org_by_slug(old.slug))
    # Per-user membership keys also key off the old slug — invalidate each.
    for user_id in instance.memberships.values_list("user_id", flat=True):
        membership_cache.invalidate(user_id, old.slug)


@receiver(post_save, sender=Organization)
def _on_organization_save(sender, instance: Organization, **kwargs):
    cache.delete(cache_keys.org_by_slug(instance.slug))


@receiver(post_delete, sender=Organization)
def _on_organization_delete(sender, instance: Organization, **kwargs):
    cache.delete(cache_keys.org_by_slug(instance.slug))


@receiver(post_save, sender=Organization)
def _ensure_stripe_customer(sender, instance: Organization, created: bool, **kwargs):
    """Best-effort: create a Stripe Customer the first time an org is saved.

    Wrapped in try/except so Stripe outages or missing keys never block org
    creation. The customer ID is written back without re-triggering signals
    via QuerySet.update(...) (NOT instance.save()).
    """
    if not created:
        return
    if instance.stripe_customer_id:
        return
    from django.conf import settings
    if not settings.STRIPE_ENABLED:
        return
    try:
        import stripe
        stripe.api_key = settings.STRIPE_TEST_SECRET_KEY or settings.STRIPE_LIVE_SECRET_KEY
        customer = stripe.Customer.create(
            name=instance.name,
            metadata={"anvaya_org_id": str(instance.id), "anvaya_org_slug": instance.slug},
        )
        Organization.objects.filter(pk=instance.pk).update(stripe_customer_id=customer.id)
    except Exception as exc:  # noqa: BLE001
        import structlog
        structlog.get_logger("billing").warning(
            "stripe_customer_create_failed", org_id=str(instance.id), error=str(exc)
        )
