from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


class RegistrationAPITests(APITestCase):
    def test_registration_creates_user_without_returning_password(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "new-careerflow-user",
                "email": "new-user@example.com",
                "password": "Strong-CareerFlow-Password-2026!",
                "first_name": "Taylor",
                "last_name": "User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)
        user = get_user_model().objects.get(username="new-careerflow-user")
        self.assertTrue(user.check_password("Strong-CareerFlow-Password-2026!"))

    def test_registration_rejects_duplicate_email_case_insensitively(self):
        user_model = get_user_model()
        user_model.objects.create_user(
            username="existing-user",
            email="existing@example.com",
            password="safe-test-password",
        )

        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "another-user",
                "email": "EXISTING@example.com",
                "password": "Strong-CareerFlow-Password-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)


class ProfileAndPasswordAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username="profile-user",
            email="profile@example.com",
            password="safe-test-password",
        )

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_profile_returns_only_authenticated_user(self):
        response = self.client.get("/api/auth/profile/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertEqual(response.data["email"], self.user.email)

    def test_profile_can_be_updated(self):
        response = self.client.patch(
            "/api/auth/profile/",
            {"first_name": "Taylor", "email": "updated@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Taylor")
        self.assertEqual(self.user.email, "updated@example.com")

    def test_profile_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/auth/profile/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_password_change_rejects_incorrect_current_password(self):
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "current_password": "incorrect-password",
                "new_password": "Another-Strong-Password-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", response.data)

    def test_password_change_updates_password_and_revokes_refresh_tokens(self):
        refresh_token = str(RefreshToken.for_user(self.user))
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "current_password": "safe-test-password",
                "new_password": "Another-Strong-Password-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Another-Strong-Password-2026!"))

        refresh_response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )

        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_refresh_token(self):
        refresh_token = str(RefreshToken.for_user(self.user))

        logout_response = self.client.post(
            "/api/auth/logout/",
            {"refresh": refresh_token},
            format="json",
        )
        refresh_response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )

        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
