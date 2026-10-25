from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from productivity.models import ApplicationActivity, Interview, Note, Reminder
from productivity.serializers import (
    ApplicationActivitySerializer,
    InterviewSerializer,
    NoteSerializer,
    ReminderSerializer,
)


class UserOwnedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class InterviewViewSet(UserOwnedViewSet):
    serializer_class = InterviewSerializer
    filterset_fields = {
        "status": ["exact"],
        "interview_type": ["exact"],
        "round": ["exact"],
        "application": ["exact"],
    }
    search_fields = ["application__title", "application__company_name", "interviewer_name"]
    ordering_fields = ["scheduled_at", "status", "created_at"]
    ordering = ["scheduled_at"]

    def get_queryset(self):
        return (
            Interview.objects.filter(owner=self.request.user)
            .select_related("application")
        )


class ReminderViewSet(UserOwnedViewSet):
    serializer_class = ReminderSerializer
    filterset_fields = {
        "is_completed": ["exact"],
        "reminder_type": ["exact"],
        "application": ["exact"],
    }
    search_fields = ["title", "description", "application__title"]
    ordering_fields = ["due_at", "created_at", "title"]
    ordering = ["is_completed", "due_at"]

    def get_queryset(self):
        return (
            Reminder.objects.filter(owner=self.request.user)
            .select_related("application")
        )

    def perform_update(self, serializer):
        was_completed = serializer.instance.is_completed
        reminder = serializer.save(owner=self.request.user)
        if reminder.is_completed and not was_completed:
            reminder.completed_at = timezone.now()
            reminder.save(update_fields=["completed_at", "updated_at"])
        elif not reminder.is_completed and reminder.completed_at:
            reminder.completed_at = None
            reminder.save(update_fields=["completed_at", "updated_at"])


class NoteViewSet(UserOwnedViewSet):
    serializer_class = NoteSerializer
    filterset_fields = {"application": ["exact"]}
    search_fields = ["title", "content", "application__title", "application__company_name"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        return (
            Note.objects.filter(owner=self.request.user)
            .select_related("application")
        )


class ApplicationActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ApplicationActivitySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = {"application": ["exact"]}
    ordering = ["-created_at"]

    def get_queryset(self):
        return ApplicationActivity.objects.filter(
            owner=self.request.user
        ).select_related("application")
