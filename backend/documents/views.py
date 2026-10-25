import os

from django.http import FileResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from documents.models import ResumeDocument
from documents.serializers import ResumeDocumentSerializer


class ResumeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = {"application": ["exact"], "is_default": ["exact"]}
    search_fields = ["title", "description", "original_filename"]
    ordering_fields = ["created_at", "updated_at", "title", "is_default"]
    ordering = ["-is_default", "-created_at"]

    def get_queryset(self):
        return ResumeDocument.objects.filter(owner=self.request.user).select_related(
            "application"
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        previous_file = instance.file
        updated = serializer.save(owner=self.request.user)
        if "file" in serializer.validated_data and previous_file:
            previous_file.delete(save=False)
        return updated

    def perform_destroy(self, instance):
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        document = self.get_object()
        if not document.file:
            raise NotFound("This document has no stored file.")
        try:
            file_handle = document.file.open("rb")
        except (OSError, ValueError):
            raise NotFound("The document file is unavailable.")
        filename = os.path.basename(document.original_filename or document.file.name)
        response = FileResponse(file_handle, as_attachment=True, filename=filename)
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store"
        return response
