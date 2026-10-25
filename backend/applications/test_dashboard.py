from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from applications.models import JobApplication
from productivity.models import Interview


class DashboardStatsAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.user = user_model.objects.create_user(
            username="dashboard-owner",
            password="safe-test-password",
        )
        cls.other_user = user_model.objects.create_user(
            username="dashboard-other",
            password="safe-test-password",
        )
        cls.applied = JobApplication.objects.create(
            owner=cls.user,
            title="Backend Developer",
            company_name="Northwind",
            status=JobApplication.Status.APPLIED,
        )
        cls.interview = JobApplication.objects.create(
            owner=cls.user,
            title="Python Engineer",
            company_name="Contoso",
            status=JobApplication.Status.INTERVIEW,
            location_category=JobApplication.LocationCategory.INDIA,
        )
        cls.offer = JobApplication.objects.create(
            owner=cls.user,
            title="Platform Engineer",
            company_name="Fabrikam",
            status=JobApplication.Status.OFFER,
            location_category=JobApplication.LocationCategory.GULF,
        )
        JobApplication.objects.create(
            owner=cls.user,
            title="Saved role",
            company_name="Adventure Works",
            status=JobApplication.Status.SAVED,
        )
        JobApplication.objects.create(
            owner=cls.other_user,
            title="Private role",
            company_name="Private Company",
        )
        Interview.objects.create(
            owner=cls.user,
            application=cls.interview,
            scheduled_at=timezone.now() + timedelta(days=2),
            interview_type=Interview.InterviewType.ONLINE,
        )

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_dashboard_returns_user_scoped_live_counts_and_conversion_rates(self):
        response = self.client.get("/api/dashboard/stats/?range=all")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["total_applications"], 4)
        self.assertEqual(response.data["summary"]["submitted_this_month"], 4)
        self.assertEqual(response.data["summary"]["interviews_scheduled"], 1)
        self.assertEqual(response.data["summary"]["offers_received"], 1)
        self.assertEqual(response.data["conversion"]["denominator"], 3)
        self.assertEqual(response.data["conversion"]["interview_rate"], 66.7)
        self.assertEqual(response.data["conversion"]["offer_rate"], 33.3)
        self.assertTrue(
            all(
                item["company_name"] != "Private Company"
                for item in response.data["recent_applications"]
            )
        )

    def test_dashboard_rejects_unknown_date_range(self):
        response = self.client.get("/api/dashboard/stats/?range=tomorrow")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("range", response.data)

    def test_dashboard_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/dashboard/stats/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ApplicationExportAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.user = user_model.objects.create_user(
            username="export-owner",
            password="safe-test-password",
        )
        cls.other_user = user_model.objects.create_user(
            username="export-other",
            password="safe-test-password",
        )
        JobApplication.objects.create(
            owner=cls.user,
            title="My Export Role",
            company_name="My Company",
        )
        JobApplication.objects.create(
            owner=cls.other_user,
            title="Private Export Role",
            company_name="Other Company",
        )

    def test_csv_export_contains_only_the_authenticated_users_records(self):
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get("/api/applications/export/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("text/csv", response["Content-Type"])
        self.assertContains(response, "My Export Role")
        self.assertNotContains(response, "Private Export Role")
