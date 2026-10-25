import csv

from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from applications.models import JobApplication
from applications.serializers import JobApplicationSerializer
from productivity.models import ApplicationActivity
from productivity.serializers import ApplicationActivitySerializer


class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = {
        "status": ["exact"],
        "country": ["exact", "iexact"],
        "job_type": ["exact"],
        "work_mode": ["exact"],
        "sector": ["exact"],
        "location_category": ["exact"],
        "salary_min": ["gte", "lte"],
        "salary_max": ["gte", "lte"],
        "salary_currency": ["exact"],
        "source": ["exact"],
    }
    search_fields = ["title", "company_name", "country", "city"]
    ordering_fields = ["application_date", "company_name", "salary_min", "status", "updated_at"]
    ordering = ["-application_date", "-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return JobApplication.objects.none()
        return JobApplication.objects.filter(owner=user)

    def perform_create(self, serializer):
        application = serializer.save(owner=self.request.user)
        ApplicationActivity.objects.create(
            owner=self.request.user,
            application=application,
            action="created",
            description=f"Added application for {application.title} at {application.company_name}.",
        )

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        application = serializer.save(owner=self.request.user)
        if application.status != previous_status:
            action_name = "status_changed"
            description = (
                f"Status changed from {previous_status} to {application.status}."
            )
        else:
            action_name = "updated"
            description = "Application details updated."
        ApplicationActivity.objects.create(
            owner=self.request.user,
            application=application,
            action=action_name,
            description=description,
        )

    @action(detail=True, methods=["get"], url_path="timeline")
    def timeline(self, request, pk=None):
        application = self.get_object()
        entries = ApplicationActivity.objects.filter(
            owner=request.user,
            application=application,
        )
        serializer = ApplicationActivitySerializer(entries, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        applications = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="careerflow-applications.csv"'
        writer = csv.writer(response)
        writer.writerow([
            "Job title", "Company", "Country", "City", "Status", "Job type",
            "Work mode", "Sector", "Salary minimum", "Salary maximum",
            "Currency", "Application date", "Job posting URL", "Source",
            "Recruiter", "Follow-up date", "Notes",
        ])
        for application in applications.iterator():
            writer.writerow([
                application.title,
                application.company_name,
                application.country,
                application.city,
                application.get_status_display(),
                application.get_job_type_display(),
                application.get_work_mode_display(),
                application.get_sector_display(),
                application.salary_min or "",
                application.salary_max or "",
                application.salary_currency,
                application.application_date.isoformat(),
                application.job_posting_url,
                application.get_source_display(),
                application.recruiter_name,
                application.next_follow_up_date.isoformat()
                if application.next_follow_up_date else "",
                application.personal_notes,
            ])
        return response
