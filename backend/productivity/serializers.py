from rest_framework import serializers

from applications.models import JobApplication
from productivity.models import ApplicationActivity, Interview, Note, Reminder


class ApplicationScopedSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated and "application" in self.fields:
            self.fields["application"].queryset = JobApplication.objects.filter(
                owner=request.user
            )


class InterviewSerializer(ApplicationScopedSerializer):
    application_title = serializers.CharField(source="application.title", read_only=True)
    company_name = serializers.CharField(source="application.company_name", read_only=True)

    class Meta:
        model = Interview
        fields = (
            "id", "application", "application_title", "company_name", "scheduled_at",
            "interview_type", "round", "meeting_link", "location", "interviewer_name",
            "preparation_notes", "status", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ReminderSerializer(ApplicationScopedSerializer):
    application_title = serializers.CharField(
        source="application.title", read_only=True, default=""
    )
    company_name = serializers.CharField(
        source="application.company_name", read_only=True, default=""
    )
    completed_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Reminder
        fields = (
            "id", "application", "application_title", "company_name", "title",
            "description", "due_at", "reminder_type", "is_completed", "completed_at",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "completed_at", "created_at", "updated_at")


class NoteSerializer(ApplicationScopedSerializer):
    application_title = serializers.CharField(
        source="application.title", read_only=True, default=""
    )
    company_name = serializers.CharField(
        source="application.company_name", read_only=True, default=""
    )

    class Meta:
        model = Note
        fields = (
            "id", "application", "application_title", "company_name", "title",
            "content", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ApplicationActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationActivity
        fields = ("id", "application", "action", "description", "created_at")
        read_only_fields = fields
