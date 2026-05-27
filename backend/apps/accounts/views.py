import structlog
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.accounts.serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SignupSerializer,
    UserSerializer,
)
from apps.accounts.tokens import password_reset_token
from apps.common.throttles import AuthAnonRateThrottle

logger = structlog.get_logger("auth")


def _tokens_for(user: User) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class SignupView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        if User.objects.filter(email__iexact=request.data.get("email", "")).exists():
            return Response(
                {"detail": "An account with this email already exists"},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Local import to avoid circular imports during settings/app loading.
        from django.db import transaction
        from django.utils.text import slugify

        from apps.orgs.models import Membership, Organization

        with transaction.atomic():
            user = serializer.save()
            # Auto-create a personal org for this user.
            base = slugify(user.name or "")
            if not base:
                local = (user.email or "").split("@", 1)[0]
                base = slugify(local) or "workspace"
            slug = base[:51] if len(base) > 51 else base
            if Organization.objects.filter(slug=slug).exists():
                import uuid as _uuid

                while True:
                    candidate = f"{slug}-{_uuid.uuid4().hex[:12]}"
                    if not Organization.objects.filter(slug=candidate).exists():
                        slug = candidate
                        break
            org = Organization.objects.create(
                name=f"{user.name or user.email}'s workspace",
                slug=slug,
                generations_used=user.generations_used,
                generations_limit=user.generations_limit,
                generations_reset_at=user.generations_reset_at,
            )
            Membership.objects.create(organization=org, user=user, role="owner")

        return Response(
            {"user": UserSerializer(user).data, **_tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("Invalid email or password")
        if not user.check_password(password) or not user.is_active:
            raise AuthenticationFailed("Invalid email or password")
        return Response({"user": UserSerializer(user).data, **_tokens_for(user)})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        from apps.accounts.serializers import ProfileUpdateSerializer

        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        from django.utils import timezone

        user = request.user
        user.is_active = False
        user.deleted_at = timezone.now()
        user.save(update_fields=["is_active", "deleted_at"])
        logger.info("account_deleted", user_id=str(user.id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        from apps.accounts.serializers import PasswordChangeSerializer

        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        current = serializer.validated_data["current_password"]
        new = serializer.validated_data["new_password"]
        user = request.user
        if not user.check_password(current):
            return Response(
                {"detail": "current_password_incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new)
        user.save(update_fields=["password"])
        logger.info("password_changed", user_id=str(user.id))
        return Response({"detail": "Password changed."})


_GENERIC_RESET_DETAIL = "If an account exists for that email, we've sent a reset link."


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            user = None

        if user is not None:
            try:
                # Local import: keeps optional httpx-backed send_email out of
                # the module-load path so URL resolution works even if the
                # email transport dep is missing in the env.
                from apps.common.email import send_email

                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = password_reset_token.make_token(user)
                reset_url = (
                    f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
                )
                context = {"name": user.name, "reset_url": reset_url}
                html = render_to_string("email/password_reset.html", context)
                text = render_to_string("email/password_reset.txt", context)
                send_email(
                    to=user.email,
                    subject="Reset your Anvaya password",
                    html=html,
                    text=text,
                )
                logger.info("password_reset_email_sent", user_id=str(user.pk))
            except Exception as exc:  # noqa: BLE001 — never leak existence via errors
                logger.error(
                    "password_reset_email_failed",
                    user_id=str(user.pk),
                    error=str(exc),
                )

        return Response({"detail": _GENERIC_RESET_DETAIL}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            # If the password itself fails validation, surface those messages.
            if "new_password" in exc.detail:
                return Response(
                    {"detail": exc.detail["new_password"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": "invalid_or_expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            pk = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=pk)
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError, User.DoesNotExist):
            return Response(
                {"detail": "invalid_or_expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:  # noqa: BLE001 — UUID validation can raise other types
            return Response(
                {"detail": "invalid_or_expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password_reset_token.check_token(user, token):
            return Response(
                {"detail": "invalid_or_expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        logger.info("password_reset_completed", user_id=str(user.pk))
        return Response(
            {"detail": "Password reset successful."},
            status=status.HTTP_200_OK,
        )
