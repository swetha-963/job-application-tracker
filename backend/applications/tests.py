from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from applications.models import JobApplication


class JobApplicationModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username="careerflow-user",
            password="safe-test-password",
        )

    def test_application_is_owned_by_user_and_defaults_to_saved(self):
        application = JobApplication.objects.create(
            owner=self.user,
            title="Python Developer",
            company_name="Example Company",
        )

        self.assertEqual(application.owner, self.user)
        self.assertEqual(application.status, JobApplication.Status.SAVED)

    def test_salary_minimum_cannot_exceed_maximum(self):
        application = JobApplication(
            owner=self.user,
            title="Python Developer",
            company_name="Example Company",
            salary_min=Decimal("80000"),
            salary_max=Decimal("60000"),
        )

        with self.assertRaises(ValidationError):
            application.full_clean()

    def test_salary_range_accepts_equal_bounds(self):
        application = JobApplication(
            owner=self.user,
            title="Python Developer",
            company_name="Example Company",
            salary_min=Decimal("60000"),
            salary_max=Decimal("60000"),
        )

        application.full_clean()


class JobApplicationAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.user = user_model.objects.create_user(
            username="api-owner",
            password="safe-test-password",
        )
        cls.other_user = user_model.objects.create_user(
            username="other-owner",
            password="safe-test-password",
        )
        cls.own_application = JobApplication.objects.create(
            owner=cls.user,
            title="Backend Engineer",
            company_name="Northwind",
            status=JobApplication.Status.APPLIED,
        )
        cls.other_application = JobApplication.objects.create(
            owner=cls.other_user,
            title="Frontend Engineer",
            company_name="Contoso",
        )

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_list_only_includes_current_users_applications(self):
        response = self.client.get("/api/applications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["id"] for item in response.data["results"]],
            [self.own_application.id],
        )

    def test_other_users_application_is_not_accessible(self):
        response = self.client.get(f"/api/applications/{self.other_application.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_assigns_owner_from_authenticated_request(self):
        response = self.client.post(
            "/api/applications/",
            {
                "owner": self.other_user.id,
                "title": "Data Analyst",
                "company_name": "Fabrikam",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_application = JobApplication.objects.get(id=response.data["id"])
        self.assertEqual(created_application.owner, self.user)

    def test_create_rejects_invalid_salary_range(self):
        response = self.client.post(
            "/api/applications/",
            {
                "title": "Data Analyst",
                "company_name": "Fabrikam",
                "salary_min": "80000.00",
                "salary_max": "60000.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("salary_max", response.data)

    def test_partial_update_rejects_invalid_salary_range(self):
        self.own_application.salary_min = Decimal("50000")
        self.own_application.salary_max = Decimal("80000")
        self.own_application.save()

        response = self.client.patch(
            f"/api/applications/{self.own_application.id}/",
            {"salary_min": "90000.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("salary_max", response.data)

    def test_status_filter_returns_matching_owned_records(self):
        response = self.client.get("/api/applications/?status=applied")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["id"] for item in response.data["results"]],
            [self.own_application.id],
        )

    def test_authenticated_user_can_update_application(self):
        response = self.client.patch(
            f"/api/applications/{self.own_application.id}/",
            {"status": JobApplication.Status.INTERVIEW},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.own_application.refresh_from_db()
        self.assertEqual(self.own_application.status, JobApplication.Status.INTERVIEW)

    def test_authenticated_user_can_delete_application(self):
        response = self.client.delete(f"/api/applications/{self.own_application.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(JobApplication.objects.filter(id=self.own_application.id).exists())

    def test_application_api_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/applications/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_token_authenticates_application_requests(self):
        self.client.force_authenticate(user=None)
        token_response = self.client.post(
            "/api/auth/login/",
            {"username": "api-owner", "password": "safe-test-password"},
            format="json",
        )

        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}"
        )
        applications_response = self.client.get("/api/applications/")

        self.assertEqual(applications_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(applications_response.data["results"]), 1)
