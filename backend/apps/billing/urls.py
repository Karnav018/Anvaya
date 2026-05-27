from django.urls import path

from apps.billing.views import (
    BillingPortalView,
    BillingStatusView,
    CheckoutSessionView,
)

urlpatterns = [
    path("o/<slug:org_slug>/billing/checkout", CheckoutSessionView.as_view()),
    path("o/<slug:org_slug>/billing/portal", BillingPortalView.as_view()),
    path("o/<slug:org_slug>/billing/status", BillingStatusView.as_view()),
]
