from django.db import models


class GeneratedChallenge(models.Model):
    """History of generated challenges (for de-duplication)."""

    mood = models.CharField(max_length=128, db_index=True, blank=True)
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
