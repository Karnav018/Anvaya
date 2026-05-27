from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from apps.accounts.views import (
    LoginView,
    MeView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    SignupView,
)

urlpatterns = [
    path("signup", SignupView.as_view()),
    path("login", LoginView.as_view()),
    path("refresh", TokenRefreshView.as_view()),
    path("logout", TokenBlacklistView.as_view()),
    path("me", MeView.as_view()),
    path("me/password", PasswordChangeView.as_view()),
    path("password-reset/request", PasswordResetRequestView.as_view()),
    path("password-reset/confirm", PasswordResetConfirmView.as_view()),
]
