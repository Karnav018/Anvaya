from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def root(_request):
    return JsonResponse({"service": "Anvaya API", "version": "1.0.0", "status": "running"})


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("", root),
    path("health", health),
    path("admin/", admin.site.urls),
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.orgs.urls")),
    path("", include("apps.projects.urls")),
    path("", include("apps.billing.urls")),
    # dj-stripe exposes /stripe/webhook/ for Stripe -> our app push events.
    path("stripe/", include("djstripe.urls", namespace="djstripe")),
]
