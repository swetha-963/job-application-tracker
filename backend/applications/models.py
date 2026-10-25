from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Q
from django.utils import timezone


class JobApplication(models.Model):
    class JobType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        INTERNSHIP = "internship", "Internship"
        CONTRACT = "contract", "Contract"
        REMOTE = "remote", "Remote"

    class WorkMode(models.TextChoices):
        ON_SITE = "on_site", "On-site"
        HYBRID = "hybrid", "Hybrid"
        REMOTE = "remote", "Remote"

    class Sector(models.TextChoices):
        IT = "it", "IT"
        NON_IT = "non_it", "Non-IT"

    class LocationCategory(models.TextChoices):
        INDIA = "india", "India"
        GULF = "gulf", "Gulf"

    class Currency(models.TextChoices):
        INR = "INR", "INR"
        BHD = "BHD", "BHD"
        AED = "AED", "AED"
        SAR = "SAR", "SAR"
        QAR = "QAR", "QAR"
        OMR = "OMR", "OMR"
        KWD = "KWD", "KWD"

    class Status(models.TextChoices):
        SAVED = "saved", "Saved"
        APPLIED = "applied", "Applied"
        ASSESSMENT = "assessment", "Assessment"
        INTERVIEW = "interview", "Interview"
        OFFER = "offer", "Offer"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"

    class Source(models.TextChoices):
        LINKEDIN = "linkedin", "LinkedIn"
        COMPANY_WEBSITE = "company_website", "Company website"
        REFERRAL = "referral", "Referral"
        JOB_PORTAL = "job_portal", "Job portal"
        RECRUITER = "recruiter", "Recruiter"
        OTHER = "other", "Other"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )
    title = models.CharField(max_length=180)
    company_name = models.CharField(max_length=180)
    company_website = models.URLField(blank=True)
    job_description = models.TextField(blank=True)
    job_type = models.CharField(max_length=20, choices=JobType.choices, blank=True)
    work_mode = models.CharField(max_length=20, choices=WorkMode.choices, blank=True)
    sector = models.CharField(max_length=10, choices=Sector.choices, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=100, blank=True)
    location_category = models.CharField(
        max_length=10,
        choices=LocationCategory.choices,
        blank=True,
    )
    salary_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
    )
    salary_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
    )
    salary_currency = models.CharField(max_length=3, choices=Currency.choices, blank=True)
    application_date = models.DateField(default=timezone.localdate)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.SAVED,
    )
    job_posting_url = models.URLField(blank=True)
    source = models.CharField(max_length=20, choices=Source.choices, blank=True)
    recruiter_name = models.CharField(max_length=180, blank=True)
    recruiter_contact = models.CharField(max_length=255, blank=True)
    next_follow_up_date = models.DateField(blank=True, null=True)
    personal_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-application_date", "-created_at"]
        indexes = [
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["owner", "application_date"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(salary_min__isnull=True)
                    | Q(salary_max__isnull=True)
                    | Q(salary_min__lte=F("salary_max"))
                ),
                name="application_salary_min_lte_max",
            ),
        ]

    def __str__(self):
        return f"{self.title} at {self.company_name}"
