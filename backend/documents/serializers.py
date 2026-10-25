from pathlib import PurePosixPath

from rest_framework import serializers

from applications.models import JobApplication
from documents.models import ResumeDocument
from documents.validators import validate_pdf_file


class ResumeDocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=False)
    file_name = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    application_title = serializers.CharField(
        source="application.title", read_only=True, default=""
    )

    class Meta:
        model = ResumeDocument
        fields = (
            "id", "application", "application_title", "title", "description", "file",
            "original_filename", "file_name", "download_url", "is_default",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "original_filename", "created_at", "updated_at",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["application"].queryset = JobApplication.objects.filter(
                owner=request.user
            )

    def get_file_name(self, obj):
        return obj.original_filename or PurePosixPath(obj.file.name).name

    def get_download_url(self, obj):
        request = self.context.get("request")
        path = f"/api/documents/{obj.pk}/download/"
        return request.build_absolute_uri(path) if request else path

    def validate_file(self, uploaded_file):
        validate_pdf_file(uploaded_file)
        return uploaded_file

    def create(self, validated_data):
        uploaded_file = validated_data["file"]
        validated_data["original_filename"] = uploaded_file.name[:255]
        return super().create(validated_data)

    def update(self, instance, validated_data):
        uploaded_file = validated_data.get("file")
        if uploaded_file:
            validated_data["original_filename"] = uploaded_file.name[:255]
        return super().update(instance, validated_data)

    def validate(self, attrs):
        if not self.instance and not attrs.get("file"):
            raise serializers.ValidationError({"file": "Choose a PDF file to upload."})
        return attrs
