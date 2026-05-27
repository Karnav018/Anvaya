from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["*"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173"]),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-only-insecure-change-me-in-prod-32-chars-min")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["*"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    # local
    "apps.accounts",
    "apps.projects",
    "apps.orgs",
    # dj-stripe must come after apps.orgs since the Stripe customer signal
    # is wired in apps.orgs.signals and relies on the Organization model.
    "djstripe",
    "apps.billing",
    "apps.common",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.common.middleware.RequestIDMiddleware",
]

ROOT_URLCONF = "anvaya.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "anvaya.wsgi.application"
ASGI_APPLICATION = "anvaya.asgi.application"

DATABASES = {"default": env.db("DATABASE_URL", default="postgres://postgres:postgres@localhost:5432/anvaya")}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_PARSER_CLASSES": ("rest_framework.parsers.JSONParser",),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "apps.common.throttles.AuthAnonRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "1000/minute",
        "user": "1000/minute",
        "auth_anon": "100/minute",
    },
    "EXCEPTION_HANDLER": "apps.common.exceptions.drf_exception_handler",
    "UNAUTHENTICATED_USER": None,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": env("JWT_SIGNING_KEY", default=SECRET_KEY),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:5173"])
CORS_ALLOW_CREDENTIALS = True

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")
APP_URL = env("APP_URL", default="http://localhost:8000")

# Redis-backed cache. Also used as the storage layer for DRF throttle counters,
# the membership-lookup hot-path cache, and (week 3) Stripe webhook idempotency.
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "KEY_PREFIX": env("CACHE_KEY_PREFIX", default="anvaya"),
        "TIMEOUT": 300,  # 5-minute default; per-key overrides where they matter
    }
}
CACHE_MEMBERSHIP_TTL = 60  # seconds
CACHE_BLUEPRINT_TTL = 30
CACHE_ORG_QUOTA_TTL = 10

# Stripe / dj-stripe
STRIPE_TEST_SECRET_KEY = env("STRIPE_TEST_SECRET_KEY", default="")
STRIPE_LIVE_SECRET_KEY = env("STRIPE_LIVE_SECRET_KEY", default="")
STRIPE_LIVE_MODE = env.bool("STRIPE_LIVE_MODE", default=False)
DJSTRIPE_WEBHOOK_SECRET = env("DJSTRIPE_WEBHOOK_SECRET", default="")
DJSTRIPE_USE_NATIVE_JSONFIELD = True
DJSTRIPE_FOREIGN_KEY_TO_FIELD = "id"
STRIPE_PRO_PRICE_ID = env("STRIPE_PRO_PRICE_ID", default="")
STRIPE_ENABLED = bool(STRIPE_TEST_SECRET_KEY or STRIPE_LIVE_SECRET_KEY)
# Quota lifted to 500/mo on Pro plan.
PRO_PLAN_GENERATIONS_LIMIT = 500
FREE_PLAN_GENERATIONS_LIMIT = 10

# Email (Resend)
RESEND_API_KEY = env("RESEND_API_KEY", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="Anvaya <noreply@anvaya.dev>")
EMAIL_DEBUG_TO_CONSOLE = env.bool("EMAIL_DEBUG_TO_CONSOLE", default=not bool(RESEND_API_KEY))

# Password reset
PASSWORD_RESET_TIMEOUT = 60 * 60  # 1 hour

# Structlog / logging
from apps.common.logging import configure_structlog  # noqa: E402

configure_structlog(debug=DEBUG)
