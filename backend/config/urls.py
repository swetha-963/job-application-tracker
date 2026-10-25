from django.contrib import admin
from django.urls import include, path

from config.views import health_check


urlpatterns = [
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("applications.urls")),
    path("api/", include("productivity.urls")),
    path("api/", include("documents.urls")),
    path("admin/", admin.site.urls),
]
