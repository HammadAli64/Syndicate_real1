import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SyndicateUserProgress(models.Model):
    """Server-authoritative Syndicate dashboard state (points, streak, completions, etc.) per user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="syndicate_progress",
    )
    state = models.JSONField(default=dict, blank=True)
    points_total = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=0)
    streak_count = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "challenges"
        db_table = "api_syndicateuserprogress"

    def __str__(self) -> str:
        return f"SyndicateProgress({self.user_id})"


class UserAgentDailyQuote(models.Model):
    """One AI agent brief per user per calendar day (distinct from legacy global AgentDailyQuote)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_agent_quotes",
    )
    quote_date = models.DateField(db_index=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "challenges"
        db_table = "api_useragentdailyquote"
        constraints = [
            models.UniqueConstraint(fields=["user", "quote_date"], name="uniq_user_agent_quote_per_day"),
        ]
        ordering = ["-quote_date"]

    def __str__(self) -> str:
        return f"{self.user_id} @ {self.quote_date}"


class GeneratedChallenge(models.Model):
    """History of generated challenges. Rows with ``creator_device`` set are user-created (max 2/day per device)."""

    mood = models.CharField(max_length=128, db_index=True, blank=True)
    creator_device = models.CharField(max_length=128, db_index=True, blank=True, default="")
    # When set with creator_device="", rows are the per-device daily batch (40) for that device_id.
    # Empty = legacy shared batch or non–device-scoped rows.
    device_batch_device_id = models.CharField(max_length=128, db_index=True, blank=True, default="")
    category = models.CharField(max_length=32, db_index=True, blank=True)
    difficulty = models.CharField(max_length=16, blank=True)
    points = models.PositiveSmallIntegerField(default=0)
    challenge_date = models.DateField(null=True, blank=True, db_index=True)
    slot = models.PositiveSmallIntegerField(default=1)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    source_document = models.ForeignKey(
        "api.UploadedDocument",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="challenges",
    )

    class Meta:
        app_label = "challenges"
        db_table = "api_generatedchallenge"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        title = (self.payload or {}).get("challenge_title", "?")
        return f"{title} ({self.mood})"


class ReferralRestore(models.Model):
    """Friend-invite codes to restore streak after a break (7-day window)."""

    code = models.CharField(max_length=32, unique=True, db_index=True)
    creator_device = models.CharField(max_length=128, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    redeemed = models.BooleanField(default=False)
    redeemer_device = models.CharField(max_length=128, blank=True)
    restore_claimed = models.BooleanField(default=False)

    class Meta:
        app_label = "challenges"
        db_table = "api_referralrestore"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.code


class LeaderboardEntry(models.Model):
    """Anonymous device-scoped scores for Syndicate leaderboard (top points)."""

    device_id = models.CharField(max_length=128, unique=True, db_index=True)
    display_name = models.CharField(max_length=64, default="Anonymous")
    points_total = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "challenges"
        db_table = "api_leaderboardentry"
        ordering = ["-points_total", "updated_at"]

    def __str__(self) -> str:
        return f"{self.display_name} ({self.points_total})"


class UserDeviceMindsetContext(models.Model):
    """Rolling summary of a device's self-created tasks; used to personalize future AI expansions."""

    device_id = models.CharField(max_length=128, unique=True, db_index=True)
    summary = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "challenges"
        db_table = "api_userdevicemindsetcontext"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.device_id[:20]}…"


class AgentDailyQuote(models.Model):
    """One AI-generated Syndicate dashboard quote per calendar day (no repeats vs past rows)."""

    quote_date = models.DateField(unique=True, db_index=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "challenges"
        db_table = "api_agentdailyquote"
        ordering = ["-quote_date"]

    def __str__(self) -> str:
        return f"{self.quote_date}: {self.text[:48]}…"


class AdminAssignedTask(models.Model):
    """Tasks created from admin panel that users can submit for manual review."""

    title = models.CharField(max_length=220)
    description = models.TextField(blank=True, default="")
    points_target = models.PositiveIntegerField(default=50)
    visibility_hours = models.PositiveSmallIntegerField(
        default=24,
        validators=[MinValueValidator(1), MaxValueValidator(168)],
        help_text="How many hours this task stays visible after creation (1-168).",
    )
    admin_note = models.CharField(max_length=280, blank=True, default="")
    image_url = models.CharField(max_length=500, blank=True, default="")
    active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "challenges"
        db_table = "api_adminassignedtask"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


def admin_task_submission_upload_to(instance: "AdminTaskSubmission", filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    safe = f"{uuid.uuid4().hex}.{ext[:32]}"
    return f"admin_task_submissions/{instance.task_id}/{safe}"


class AdminTaskSubmission(models.Model):
    """User submission for one admin-assigned task, reviewed manually by admin."""

    STATUS_PENDING = "pending"
    STATUS_REVIEWED = "reviewed"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_REVIEWED, "Reviewed"),
        (STATUS_REJECTED, "Rejected"),
    )

    task = models.ForeignKey(AdminAssignedTask, on_delete=models.CASCADE, related_name="submissions")
    device_id = models.CharField(max_length=128, db_index=True)
    response_text = models.TextField()
    attachment = models.FileField(upload_to=admin_task_submission_upload_to, blank=True, null=True, max_length=500)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    elapsed_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    awarded_points = models.PositiveIntegerField(default=0)
    review_notes = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_admin_task_submissions",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    points_claimed = models.BooleanField(default=False, db_index=True)

    class Meta:
        app_label = "challenges"
        db_table = "api_admintasksubmission"
        ordering = ["-submitted_at"]
        constraints = [
            models.UniqueConstraint(fields=["task", "device_id"], name="uniq_admin_task_submission_per_device"),
        ]

    def __str__(self) -> str:
        return f"{self.device_id[:16]}… -> {self.task_id} ({self.status})"
