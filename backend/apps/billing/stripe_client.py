"""Shared helpers for talking to Stripe.

The Stripe-customer lazy creation logic is duplicated between the
``Organization`` ``post_save`` signal and the ``CheckoutSessionView``; this
module centralizes it so both call sites stay in sync.
"""
from __future__ import annotations

import structlog
from django.conf import settings

from apps.orgs.models import Organization

log = structlog.get_logger("billing")


def get_stripe_api_key() -> str:
    """Return whichever Stripe secret key is configured (test takes priority)."""
    return settings.STRIPE_TEST_SECRET_KEY or settings.STRIPE_LIVE_SECRET_KEY


def ensure_stripe_customer(org: Organization) -> str | None:
    """Create a Stripe Customer for ``org`` if it doesn't already have one.

    Returns the Stripe customer ID on success (existing or newly created), or
    ``None`` if Stripe isn't configured. Stripe errors are propagated to the
    caller — unlike the signal path, the view does want to surface them.
    """
    if org.stripe_customer_id:
        return org.stripe_customer_id
    if not settings.STRIPE_ENABLED:
        return None

    import stripe

    stripe.api_key = get_stripe_api_key()
    customer = stripe.Customer.create(
        name=org.name,
        metadata={"anvaya_org_id": str(org.id), "anvaya_org_slug": org.slug},
    )
    # Bypass save() to avoid re-triggering the post_save signal.
    Organization.objects.filter(pk=org.pk).update(stripe_customer_id=customer.id)
    org.stripe_customer_id = customer.id
    log.info("stripe_customer_created_lazy", org_id=str(org.id), customer_id=customer.id)
    return customer.id
