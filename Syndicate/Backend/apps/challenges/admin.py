from django.contrib import admin

from .models import GeneratedChallenge, ReferralRestore


@admin.register(GeneratedChallenge)
class GeneratedChallengeAdmin(admin.ModelAdmin):
    list_display = ["id", "mood", "category", "challenge_date", "created_at"]


@admin.register(ReferralRestore)
class ReferralRestoreAdmin(admin.ModelAdmin):
    list_display = ["code", "creator_device", "redeemed", "restore_claimed", "expires_at"]
