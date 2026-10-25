from django.contrib import admin

from productivity.models import ApplicationActivity, Interview, Note, Reminder


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ("application", "owner", "scheduled_at", "interview_type", "status")
    list_filter = ("status", "interview_type", "round")
    search_fields = ("application__title", "application__company_name", "owner__username")


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "due_at", "reminder_type", "is_completed")
    list_filter = ("is_completed", "reminder_type")
    search_fields = ("title", "owner__username")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "application", "updated_at")
    search_fields = ("title", "content", "owner__username")


@admin.register(ApplicationActivity)
class ApplicationActivityAdmin(admin.ModelAdmin):
    list_display = ("description", "owner", "application", "created_at")
    readonly_fields = ("created_at",)
