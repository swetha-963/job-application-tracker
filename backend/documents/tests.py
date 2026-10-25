import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from applications.models import JobApplication
from documents.models import ResumeDocument


class ResumeDocumentModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username="document-user",
            password="safe-test-password",
        )

    def make_document(self, filename="resume.pdf", content=b"%PDF-1.7\nresume"):
        return ResumeDocument(
            owner=self.user,
            title="My Resume",
            file=SimpleUploadedFile(filename, content, content_type="application/pdf"),
        )

    def test_valid_pdf_passes_file_validation(self):
        document = self.make_document()

        document.full_clean()

    def test_non_pdf_extension_is_rejected(self):
        document = self.make_document(filename="resume.txt", content=b"%PDF-1.7\nresume")

        with self.assertRaises(ValidationError):
            document.full_clean()

    def test_invalid_pdf_header_is_rejected(self):
        document = self.make_document(content=b"not a pdf")

        with self.assertRaises(ValidationError):
            document.full_clean()

    def test_file_larger_than_five_megabytes_is_rejected(self):
        document = self.make_document(content=b"%PDF-" + b"x" * (5 * 1024 * 1024))

        with self.assertRaises(ValidationError):
            document.full_clean()

    def test_default_resume_has_a_database_uniqueness_constraint(self):
        constraint_names = {
            constraint.name for constraint in ResumeDocument._meta.constraints
        }

        self.assertIn("one_default_resume_per_user", constraint_names)


class ResumeDocumentAPITests(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.media_directory = tempfile.TemporaryDirectory()
        cls.media_override = override_settings(MEDIA_ROOT=cls.media_directory.name)
        cls.media_override.enable()

    @classmethod
    def tearDownClass(cls):
        cls.media_override.disable()
        cls.media_directory.cleanup()
        super().tearDownClass()

    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.user = user_model.objects.create_user(
            username="document-api-user",
            password="safe-test-password",
        )
        cls.other_user = user_model.objects.create_user(
            username="other-document-user",
            password="safe-test-password",
        )
        cls.application = JobApplication.objects.create(
            owner=cls.user,
            title="Python Developer",
            company_name="Example Company",
        )
        cls.other_application = JobApplication.objects.create(
            owner=cls.other_user,
            title="Java Developer",
            company_name="Other Company",
        )

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def make_pdf(self, name="resume.pdf", content=b"%PDF-1.7\nresume"):
        return SimpleUploadedFile(name, content, content_type="application/pdf")

    def create_document(self, **extra_fields):
        return self.client.post(
            "/api/documents/",
            {
                "title": "My Resume",
                "file": self.make_pdf(),
                **extra_fields,
            },
            format="multipart",
        )

    def test_upload_creates_private_document_without_exposing_file_url(self):
        response = self.create_document(application=self.application.id)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("file", response.data)
        self.assertIn("/api/documents/", response.data["download_url"])
        document = ResumeDocument.objects.get(id=response.data["id"])
        self.assertEqual(document.owner, self.user)
        self.assertEqual(document.application, self.application)
        self.assertEqual(Path(document.file.name).name, "resume.pdf")
        self.assertIn("file_name", response.data)

    def test_invalid_pdf_is_rejected(self):
        response = self.client.post(
            "/api/documents/",
            {"title": "Invalid file", "file": self.make_pdf(content=b"not a pdf")},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)

    def test_document_cannot_reference_another_users_application(self):
        response = self.create_document(application=self.other_application.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("application", response.data)

    def test_default_resume_replaces_previous_default(self):
        first_response = self.create_document(is_default=True)
        second_response = self.create_document(is_default=True)

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(
            ResumeDocument.objects.get(id=first_response.data["id"]).is_default
        )
        self.assertTrue(
            ResumeDocument.objects.get(id=second_response.data["id"]).is_default
        )

    def test_download_is_authenticated_and_owner_scoped(self):
        own_response = self.create_document()
        own_download = self.client.get(
            f"/api/documents/{own_response.data['id']}/download/"
        )

        self.assertEqual(own_download.status_code, status.HTTP_200_OK)
        self.assertEqual(
            b"".join(own_download.streaming_content),
            b"%PDF-1.7\nresume",
        )

        other_document = ResumeDocument.objects.create(
            owner=self.other_user,
            application=self.other_application,
            title="Private resume",
            file=self.make_pdf(),
        )
        other_download = self.client.get(
            f"/api/documents/{other_document.id}/download/"
        )

        self.assertEqual(other_download.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_removes_document_and_stored_file(self):
        response = self.create_document()
        document = ResumeDocument.objects.get(id=response.data["id"])
        file_path = Path(document.file.path)

        delete_response = self.client.delete(f"/api/documents/{document.id}/")

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ResumeDocument.objects.filter(id=document.id).exists())
        self.assertFalse(file_path.exists())

    def test_document_endpoints_require_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/documents/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
