from django.urls import include, path
from rest_framework.routers import DefaultRouter

from applications.dashboard import dashboard_stats
from applications.views import JobApplicationViewSet


router = DefaultRouter()
router.register("applications", JobApplicationViewSet, basename="application")

urlpatterns = [
    path("dashboard/stats/", dashboard_stats, name="dashboard-stats"),
    path("", include(router.urls)),
]
