from django.conf import settings
from django.db import models
from django.utils import timezone


class Interview(models.Model):
    class InterviewType(models.TextChoices):
        ONLINE = "online", "Online"
        PHONE = "phone", "Phone"
        IN_PERSON = "in_person", "In-person"

    class Round(models.TextChoices):
        HR = "hr", "HR"
        TECHNICAL = "technical", "Technical"
        CODING = "coding", "Coding"
        MANAGERIAL = "managerial", "Managerial"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interviews",
    )
    application = models.ForeignKey(
        "applications.JobApplication",
        on_delete=models.CASCADE,
        related_name="interviews",
    )
    scheduled_at = models.DateTimeField()
    interview_type = models.CharField(max_length=10, choices=InterviewType.choices)
    round = models.CharField(max_length=12, choices=Round.choices, default=Round.OTHER)
    meeting_link = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    interviewer_name = models.CharField(max_length=180, blank=True)
    preparation_notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.UPCOMING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scheduled_at"]
        indexes = [
            models.Index(fields=["owner", "scheduled_at"], name="productivit_owner_i_9cb791_idx"),
            models.Index(fields=["application", "scheduled_at"], name="productivit_applica_5de748_idx"),
        ]

    def __str__(self):
        return f"{self.get_round_display()} interview for {self.application}"


class Reminder(models.Model):
    class ReminderType(models.TextChoices):
        INTERVIEW = "interview", "Interview"
        RECRUITER_FOLLOW_UP = "recruiter_follow_up", "Recruiter follow-up"
        APPLICATION_DEADLINE = "application_deadline", "Application deadline"
        ASSESSMENT = "assessment", "Assessment"
        CUSTOM = "custom", "Custom"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    application = models.ForeignKey(
        "applications.JobApplication",
        on_delete=models.SET_NULL,
        related_name="reminders",
        blank=True,
        null=True,
    )
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    due_at = models.DateTimeField()
    reminder_type = models.CharField(
        max_length=24,
        choices=ReminderType.choices,
        default=ReminderType.CUSTOM,
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_at"]
        indexes = [
            models.Index(fields=["owner", "due_at"], name="productivit_owner_i_efd5b7_idx"),
            models.Index(fields=["owner", "is_completed"], name="productivit_owner_i_405b74_idx"),
        ]

    def __str__(self):
        return self.title


class Note(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="career_notes",
    )
    application = models.ForeignKey(
        "applications.JobApplication",
        on_delete=models.SET_NULL,
        related_name="notes",
        blank=True,
        null=True,
    )
    title = models.CharField(max_length=180)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["owner", "updated_at"], name="productivit_owner_i_8a29f0_idx"),
            models.Index(fields=["application"], name="productivit_applica_72218a_idx"),
        ]

    def __str__(self):
        return self.title


class ApplicationActivity(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="application_activity",
    )
    application = models.ForeignKey(
        "applications.JobApplication",
        on_delete=models.CASCADE,
        related_name="activity",
    )
    action = models.CharField(max_length=32)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "application activities"
        indexes = [models.Index(fields=["owner", "application", "created_at"])]

    def __str__(self):
        return self.description
