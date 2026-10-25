from rest_framework.routers import DefaultRouter

from documents.views import ResumeDocumentViewSet


router = DefaultRouter()
router.register("documents", ResumeDocumentViewSet, basename="document")
urlpatterns = router.urls
