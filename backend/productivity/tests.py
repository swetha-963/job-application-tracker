from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from applications.models import JobApplication
from productivity.models import Interview, Note, Reminder


class ProductivityModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username="productivity-user",
            password="safe-test-password",
        )
        cls.application = JobApplication.objects.create(
            owner=cls.user,
            title="Python Developer",
            company_name="Example Company",
        )

    def test_interview_is_linked_to_owner_and_application(self):
        interview = Interview.objects.create(
            owner=self.user,
            application=self.application,
            scheduled_at=timezone.now(),
            interview_type=Interview.InterviewType.ONLINE,
        )

        self.assertEqual(interview.owner, self.user)
        self.assertEqual(interview.application, self.application)
        self.assertEqual(interview.status, Interview.Status.UPCOMING)

    def test_reminder_can_be_general_and_defaults_to_incomplete(self):
        reminder = Reminder.objects.create(
            owner=self.user,
            title="Prepare for interviews",
            due_at=timezone.now(),
            reminder_type=Reminder.ReminderType.CUSTOM,
        )

        self.assertIsNone(reminder.application)
        self.assertFalse(reminder.is_completed)

    def test_note_can_be_general_or_application_specific(self):
        general_note = Note.objects.create(
            owner=self.user,
            title="Career goals",
            content="Focus on backend development roles.",
        )
        application_note = Note.objects.create(
            owner=self.user,
            application=self.application,
            title="Recruiter conversation",
            content="Follow up next week.",
        )

        self.assertIsNone(general_note.application)
        self.assertEqual(application_note.application, self.application)

    def test_deleting_application_cascades_interviews_and_detaches_other_records(self):
        Interview.objects.create(
            owner=self.user,
            application=self.application,
            scheduled_at=timezone.now(),
            interview_type=Interview.InterviewType.PHONE,
        )
        reminder = Reminder.objects.create(
            owner=self.user,
            application=self.application,
            title="Follow up",
            due_at=timezone.now(),
            reminder_type=Reminder.ReminderType.RECRUITER_FOLLOW_UP,
        )
        note = Note.objects.create(
            owner=self.user,
            application=self.application,
            title="Notes",
            content="Keep this note.",
        )

        self.application.delete()

        self.assertFalse(Interview.objects.exists())
        reminder.refresh_from_db()
        note.refresh_from_db()
        self.assertIsNone(reminder.application)
        self.assertIsNone(note.application)


class ProductivityAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.user = user_model.objects.create_user(
            username="productivity-api-user",
            password="safe-test-password",
        )
        cls.other_user = user_model.objects.create_user(
            username="other-productivity-user",
            password="safe-test-password",
        )
        cls.application = JobApplication.objects.create(
            owner=cls.user,
            title="Backend Engineer",
            company_name="Northwind",
        )
        cls.other_application = JobApplication.objects.create(
            owner=cls.other_user,
            title="Frontend Engineer",
            company_name="Contoso",
        )
        cls.other_interview = Interview.objects.create(
            owner=cls.other_user,
            application=cls.other_application,
            scheduled_at=timezone.now(),
            interview_type=Interview.InterviewType.ONLINE,
        )

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_interview_creation_uses_authenticated_owner(self):
        response = self.client.post(
            "/api/interviews/",
            {
                "owner": self.other_user.id,
                "application": self.application.id,
                "scheduled_at": "2030-01-01T10:00:00Z",
                "interview_type": Interview.InterviewType.ONLINE,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        interview = Interview.objects.get(id=response.data["id"])
        self.assertEqual(interview.owner, self.user)
        self.assertEqual(interview.application, self.application)

    def test_interview_cannot_be_linked_to_another_users_application(self):
        response = self.client.post(
            "/api/interviews/",
            {
                "application": self.other_application.id,
                "scheduled_at": "2030-01-01T10:00:00Z",
                "interview_type": Interview.InterviewType.ONLINE,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("application", response.data)

    def test_other_users_interview_is_not_accessible(self):
        response = self.client.get(f"/api/interviews/{self.other_interview.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reminder_completion_timestamp_is_managed_by_api(self):
        create_response = self.client.post(
            "/api/reminders/",
            {
                "application": self.application.id,
                "title": "Follow up with recruiter",
                "due_at": "2030-01-01T10:00:00Z",
                "reminder_type": Reminder.ReminderType.RECRUITER_FOLLOW_UP,
            },
            format="json",
        )
        reminder_id = create_response.data["id"]
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        complete_response = self.client.patch(
            f"/api/reminders/{reminder_id}/",
            {"is_completed": True, "completed_at": None},
            format="json",
        )

        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        reminder = Reminder.objects.get(id=reminder_id)
        self.assertTrue(reminder.is_completed)
        self.assertIsNotNone(reminder.completed_at)

        self.client.patch(
            f"/api/reminders/{reminder_id}/",
            {"is_completed": False},
            format="json",
        )
        reminder.refresh_from_db()
        self.assertIsNone(reminder.completed_at)

    def test_note_search_and_list_are_scoped_to_authenticated_owner(self):
        Note.objects.create(
            owner=self.user,
            application=self.application,
            title="Backend notes",
            content="Review the API design.",
        )
        other_note = Note.objects.create(
            owner=self.other_user,
            application=self.other_application,
            title="Backend private note",
            content="Do not expose this.",
        )

        response = self.client.get("/api/notes/?search=backend")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertNotEqual(response.data["results"][0]["id"], other_note.id)

    def test_application_records_require_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/reminders/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
