from datetime import date, timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from applications.models import JobApplication
from applications.serializers import JobApplicationSerializer
from productivity.models import Interview, Reminder
from productivity.serializers import InterviewSerializer, ReminderSerializer


def _month_start(months_ago):
    today = timezone.localdate()
    month_index = (today.year * 12) + (today.month - 1) - months_ago
    return date(month_index // 12, (month_index % 12) + 1, 1)


def _range_start(value):
    today = timezone.localdate()
    if value == "7d":
        return today - timedelta(days=6)
    if value == "30d":
        return today - timedelta(days=29)
    if value == "6m":
        return _month_start(5)
    if value == "all":
        return None
    raise ValidationError({"range": "Choose 7d, 30d, 6m, or all."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    selected_range = request.query_params.get("range", "30d")
    start = _range_start(selected_range)

    all_applications = JobApplication.objects.filter(owner=user)
    applications = all_applications
    if start:
        applications = applications.filter(application_date__gte=start)

    today = timezone.localdate()
    now = timezone.now()
    upcoming_interviews = (
        Interview.objects.filter(
            owner=user,
            status=Interview.Status.UPCOMING,
            scheduled_at__gte=now,
        )
        .select_related("application")
        .order_by("scheduled_at")
    )
    upcoming_reminders = (
        Reminder.objects.filter(
            owner=user,
            is_completed=False,
            due_at__date__gte=today,
        )
        .select_related("application")
        .order_by("due_at")
    )

    status_counts = dict(
        applications.values("status").annotate(total=Count("id")).values_list(
            "status", "total"
        )
    )
    status_chart = [
        {"name": label, "key": key, "count": status_counts.get(key, 0)}
        for key, label in JobApplication.Status.choices
    ]

    month_labels = []
    monthly_chart = []
    for months_ago in range(5, -1, -1):
        month_start = _month_start(months_ago)
        if month_start.month == 12:
            next_month = date(month_start.year + 1, 1, 1)
        else:
            next_month = date(month_start.year, month_start.month + 1, 1)
        count = all_applications.filter(
            application_date__gte=month_start,
            application_date__lt=next_month,
        ).count()
        month_labels.append(month_start.strftime("%b %Y"))
        monthly_chart.append({"month": month_start.strftime("%b"), "label": month_start.strftime("%b %Y"), "count": count})

    location_counts = dict(
        applications.values("location_category").annotate(total=Count("id")).values_list(
            "location_category", "total"
        )
    )
    location_chart = [
        {"name": "India", "count": location_counts.get("india", 0)},
        {"name": "Gulf", "count": location_counts.get("gulf", 0)},
        {"name": "Unspecified", "count": location_counts.get("", 0)},
    ]

    role_chart = [
        {"name": row["title"], "count": row["total"]}
        for row in applications.values("title")
        .annotate(total=Count("id"))
        .order_by("-total", "title")[:5]
    ]

    submitted_month = all_applications.filter(
        application_date__year=today.year,
        application_date__month=today.month,
    ).count()
    total = applications.count()
    conversion_base = applications.exclude(status=JobApplication.Status.SAVED).count()
    interview_count = applications.filter(
        status__in=[JobApplication.Status.INTERVIEW, JobApplication.Status.OFFER]
    ).count()
    offer_count = applications.filter(status=JobApplication.Status.OFFER).count()

    def percent(numerator):
        return round((numerator / conversion_base) * 100, 1) if conversion_base else 0

    recent_applications = applications.order_by("-updated_at", "-created_at")[:6]
    summary = {
        "total_applications": total,
        "submitted_this_month": submitted_month,
        "interviews_scheduled": upcoming_interviews.count(),
        "offers_received": applications.filter(status=JobApplication.Status.OFFER).count(),
        "rejected_applications": applications.filter(status=JobApplication.Status.REJECTED).count(),
        "upcoming_interviews": upcoming_interviews.count(),
    }

    return Response({
        "range": selected_range,
        "summary": summary,
        "charts": {
            "status": status_chart,
            "monthly": monthly_chart,
            "locations": location_chart,
            "roles": role_chart,
        },
        "conversion": {
            "interview_rate": percent(interview_count),
            "offer_rate": percent(offer_count),
            "interview_applications": interview_count,
            "offers": offer_count,
            "denominator": conversion_base,
            "basis": "Current application status; saved applications are excluded.",
        },
        "recent_applications": JobApplicationSerializer(
            recent_applications, many=True, context={"request": request}
        ).data,
        "upcoming_interviews": InterviewSerializer(
            upcoming_interviews[:5], many=True, context={"request": request}
        ).data,
        "upcoming_reminders": ReminderSerializer(
            upcoming_reminders[:5], many=True, context={"request": request}
        ).data,
    })
