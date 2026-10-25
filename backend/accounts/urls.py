from django.urls import path

from accounts.views import (
    LoginView,
    LogoutView,
    PasswordChangeView,
    RefreshTokenView,
    RegistrationView,
    UserProfileView,
)

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("change-password/", PasswordChangeView.as_view(), name="change-password"),
]
