from rest_framework.routers import DefaultRouter

from productivity.views import (
    ApplicationActivityViewSet,
    InterviewViewSet,
    NoteViewSet,
    ReminderViewSet,
)


router = DefaultRouter()
router.register("interviews", InterviewViewSet, basename="interview")
router.register("reminders", ReminderViewSet, basename="reminder")
router.register("notes", NoteViewSet, basename="note")
router.register("activity", ApplicationActivityViewSet, basename="activity")
urlpatterns = router.urls
