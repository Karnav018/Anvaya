"""Billing endpoints: Stripe Checkout, Customer Portal, status read-out."""
from __future__ import annotations

import structlog
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.stripe_client import ensure_stripe_customer, get_stripe_api_key
from apps.common.permissions import HasOrgRole, IsOrgMember
from apps.orgs.models import Organization

log = structlog.get_logger("billing")


def _owner_perms():
    return [IsAuthenticated(), IsOrgMember(), HasOrgRole("owner")()]


class CheckoutSessionView(APIView):
    """POST /o/<org_slug>/billing/checkout — start a Pro-plan checkout flow."""

    def get_permissions(self):
        return _owner_perms()

    def post(self, request, org_slug):
        if not settings.STRIPE_ENABLED:
            return Response(
                {"detail": "Billing is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not settings.STRIPE_PRO_PRICE_ID:
            return Response(
                {"detail": "Pro plan price is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        org = get_object_or_404(Organization, slug=org_slug)
        try:
            customer_id = ensure_stripe_customer(org)
        except Exception as exc:  # noqa: BLE001 — opaque vendor errors
            log.warning("stripe_customer_lazy_failed", org_id=str(org.id), error=str(exc))
            return Response(
                {"detail": "Failed to initialize billing customer."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        if not customer_id:
            return Response(
                {"detail": "Billing is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        import stripe

        stripe.api_key = get_stripe_api_key()
        try:
            session = stripe.checkout.Session.create(
                mode="subscription",
                customer=customer_id,
                line_items=[{"price": settings.STRIPE_PRO_PRICE_ID, "quantity": 1}],
                success_url=f"{settings.FRONTEND_URL}/o/{org_slug}/settings/billing?status=success",
                cancel_url=f"{settings.FRONTEND_URL}/o/{org_slug}/settings/billing?status=cancelled",
                metadata={"anvaya_org_id": str(org.id), "anvaya_org_slug": org.slug},
                allow_promotion_codes=True,
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("stripe_checkout_create_failed", org_id=str(org.id), error=str(exc))
            return Response(
                {"detail": "Failed to create checkout session."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"url": session.url}, status=status.HTTP_200_OK)


class BillingPortalView(APIView):
    """POST /o/<org_slug>/billing/portal — open the Stripe customer portal."""

    def get_permissions(self):
        return _owner_perms()

    def post(self, request, org_slug):
        if not settings.STRIPE_ENABLED:
            return Response(
                {"detail": "Billing is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        org = get_object_or_404(Organization, slug=org_slug)
        if not org.stripe_customer_id:
            return Response(
                {"detail": "No Stripe customer for this organization yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import stripe

        stripe.api_key = get_stripe_api_key()
        try:
            session = stripe.billing_portal.Session.create(
                customer=org.stripe_customer_id,
                return_url=f"{settings.FRONTEND_URL}/o/{org_slug}/settings/billing",
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("stripe_portal_create_failed", org_id=str(org.id), error=str(exc))
            return Response(
                {"detail": "Failed to create billing portal session."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"url": session.url}, status=status.HTTP_200_OK)


class BillingStatusView(APIView):
    """GET /o/<org_slug>/billing/status — quota + subscription snapshot."""

    permission_classes = [IsAuthenticated, IsOrgMember]

    def get(self, request, org_slug):
        org = get_object_or_404(Organization, slug=org_slug)

        has_active = False
        current_period_end = None
        try:
            from datetime import datetime, timezone as _tz

            from djstripe.models import Subscription

            # dj-stripe 2.10 stores the raw Stripe payload in JSONB ``stripe_data``
            # rather than per-field columns; query through that.
            subs = Subscription.objects.filter(
                customer__id=org.stripe_customer_id,
                stripe_data__status__in=["active", "trialing"],
            )
            # Order by current_period_end DESC in Python — the JSONB value is
            # serialized as an int (unix ts) or ISO string depending on stripe-py.
            def _period_end_key(s):
                v = (s.stripe_data or {}).get("current_period_end")
                if isinstance(v, (int, float)):
                    return v
                if isinstance(v, str):
                    try:
                        return datetime.fromisoformat(v.replace("Z", "+00:00")).timestamp()
                    except ValueError:
                        return 0
                return 0

            subs_sorted = sorted(subs, key=_period_end_key, reverse=True)
            sub = subs_sorted[0] if subs_sorted else None
            if sub is not None:
                has_active = True
                v = (sub.stripe_data or {}).get("current_period_end")
                if isinstance(v, (int, float)):
                    current_period_end = datetime.fromtimestamp(v, tz=_tz.utc).isoformat()
                elif isinstance(v, str):
                    current_period_end = v
        except Exception as exc:  # noqa: BLE001 — defensive, e.g. no migrations
            log.warning("billing_status_subscription_lookup_failed", error=str(exc))

        return Response(
            {
                "plan": org.plan,
                "generations_used": org.generations_used,
                "generations_limit": org.generations_limit,
                "generations_reset_at": (
                    org.generations_reset_at.isoformat() if org.generations_reset_at else None
                ),
                "stripe_customer_id": org.stripe_customer_id or None,
                "has_active_subscription": has_active,
                "current_period_end": current_period_end,
            }
        )
