from django.contrib import admin

from documents.models import ResumeDocument


@admin.register(ResumeDocument)
class ResumeDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "is_default", "created_at")
    list_filter = ("is_default", "created_at")
    search_fields = ("title", "original_filename", "owner__username", "owner__email")
    readonly_fields = ("created_at", "updated_at")
