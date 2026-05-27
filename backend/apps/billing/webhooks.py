"""dj-stripe webhook handlers for Anvaya billing events.

The public functions ``_subscription_active``, ``_subscription_deleted`` and
``_invoice_payment_failed`` are importable as
``apps.billing.webhooks._subscription_active`` etc. and accept a Stripe-like
event object as their only positional argument so they can also be invoked
directly from tests / scripts without going through a webhook payload.

dj-stripe wraps them via ``djstripe_receiver`` so they're also fired by the
real /stripe/webhook/ endpoint. The receiver signature dj-stripe expects is
``(sender, event, **kwargs)``; we route both shapes through a single
implementation by accepting *args/**kwargs and picking the event object out.
"""
from __future__ import annotations

import structlog

# Resolve the webhook decorator across dj-stripe versions. Prefer the modern
# ``djstripe_receiver``; fall back to legacy ``webhooks.handler`` shapes.
try:
    from djstripe.event_handlers import djstripe_receiver as _register
except ImportError:  # pragma: no cover - legacy fallback
    try:
        from djstripe import webhooks as _legacy_webhooks  # type: ignore[attr-defined]
        _register = _legacy_webhooks.handler  # type: ignore[attr-defined]
    except ImportError:
        from djstripe.event_handlers import webhooks as _legacy_webhooks  # type: ignore[no-redef]
        _register = _legacy_webhooks.handler  # type: ignore[attr-defined]

from apps.orgs.models import Organization

log = structlog.get_logger("billing")


def _pick_event(args, kwargs):
    """Pick the event object out of either receiver-style or direct calls.

    Receiver style: ``handler(sender, event, **kwargs)`` -> args[1] or kwargs.
    Direct style (smoke test): ``handler(event)`` -> args[0].
    """
    if "event" in kwargs:
        return kwargs["event"]
    if len(args) >= 2:
        return args[1]
    if len(args) == 1:
        return args[0]
    return None


def _org_for_customer(customer_id):
    if not customer_id:
        return None
    return Organization.objects.filter(stripe_customer_id=customer_id).first()


@_register(["customer.subscription.created", "customer.subscription.updated"])
def _subscription_active(*args, **kwargs):
    """Promote/demote org plan based on subscription status."""
    event = _pick_event(args, kwargs)
    if event is None:
        return
    sub = event.data["object"]
    org = _org_for_customer(sub.get("customer"))
    if not org:
        return
    from django.conf import settings

    status_ = sub.get("status")
    if status_ in {"active", "trialing"}:
        Organization.objects.filter(pk=org.pk).update(
            plan="pro",
            generations_limit=settings.PRO_PLAN_GENERATIONS_LIMIT,
        )
        log.info("subscription_active", org_id=str(org.pk), status=status_)
    elif status_ in {"canceled", "incomplete_expired", "unpaid"}:
        Organization.objects.filter(pk=org.pk).update(
            plan="free",
            generations_limit=settings.FREE_PLAN_GENERATIONS_LIMIT,
        )
        log.info("subscription_inactive", org_id=str(org.pk), status=status_)


@_register("customer.subscription.deleted")
def _subscription_deleted(*args, **kwargs):
    """Cancellation/expiry: always drop the org back to the free plan."""
    event = _pick_event(args, kwargs)
    if event is None:
        return
    sub = event.data["object"]
    org = _org_for_customer(sub.get("customer"))
    if not org:
        return
    from django.conf import settings

    Organization.objects.filter(pk=org.pk).update(
        plan="free",
        generations_limit=settings.FREE_PLAN_GENERATIONS_LIMIT,
    )
    log.info("subscription_deleted", org_id=str(org.pk))


@_register("invoice.payment_failed")
def _invoice_payment_failed(*args, **kwargs):
    event = _pick_event(args, kwargs)
    if event is None:
        return
    inv = event.data["object"]
    org = _org_for_customer(inv.get("customer"))
    log.warning(
        "invoice_payment_failed",
        org_id=str(org.pk) if org else None,
        amount_due=inv.get("amount_due"),
    )
    # TODO(week 4): send a dunning email via apps.common.email.send_email
