from django.apps import AppConfig


class BillingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.billing"

    def ready(self) -> None:
        # Register dj-stripe webhook handlers.
        from apps.billing import webhooks  # noqa: F401
