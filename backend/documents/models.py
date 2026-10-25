from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Q
from django.utils.text import get_valid_filename

from documents.validators import validate_pdf_file


def resume_upload_path(instance, filename):
    safe_name = get_valid_filename(Path(filename).name)
    return f"resumes/{instance.owner_id}/{uuid4().hex}/{safe_name}"


class ResumeDocument(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resume_documents",
    )
    application = models.ForeignKey(
        "applications.JobApplication",
        on_delete=models.SET_NULL,
        related_name="resume_documents",
        blank=True,
        null=True,
    )
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    file = models.FileField(
        upload_to=resume_upload_path,
        validators=[validate_pdf_file],
    )
    original_filename = models.CharField(max_length=255, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "created_at"], name="documents_r_owner_i_554fd6_idx")
        ]
        constraints = [
            models.UniqueConstraint(
                condition=Q(is_default=True),
                fields=("owner",),
                name="one_default_resume_per_user",
            )
        ]

    def save(self, *args, **kwargs):
        if self.is_default and self.owner_id:
            type(self).objects.filter(owner_id=self.owner_id).exclude(pk=self.pk).update(
                is_default=False
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
