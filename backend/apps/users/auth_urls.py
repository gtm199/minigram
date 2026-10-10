from django.urls import path

from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    RegisterView,
    TokenRefreshEnvelopeView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", TokenRefreshEnvelopeView.as_view(), name="auth-token-refresh"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
]
