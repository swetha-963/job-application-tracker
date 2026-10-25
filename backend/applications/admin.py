from django.contrib import admin

from applications.models import JobApplication


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("title", "company_name", "owner", "status", "application_date")
    list_filter = ("status", "country", "job_type", "location_category")
    search_fields = ("title", "company_name", "owner__username", "owner__email")
    readonly_fields = ("created_at", "updated_at")
