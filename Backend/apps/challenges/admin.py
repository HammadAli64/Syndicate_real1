from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.utils.text import Truncator

from .models import AdminAssignedTask, AdminTaskSubmission, GeneratedChallenge, ReferralRestore


def _format_elapsed(seconds: int) -> str:
    if seconds <= 0:
        return ""
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    parts: list[str] = []
    if h:
        parts.append(f"{h}h")
    if m or h:
        parts.append(f"{m}m")
    parts.append(f"{s}s")
    return " ".join(parts)


def _dt_display(dt) -> str:
    if dt is None:
        return "—"
    if timezone.is_aware(dt):
        dt = timezone.localtime(dt)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


@admin.register(GeneratedChallenge)
class GeneratedChallengeAdmin(admin.ModelAdmin):
    list_display = ["id", "mood", "category", "challenge_date", "created_at"]


@admin.register(ReferralRestore)
class ReferralRestoreAdmin(admin.ModelAdmin):
    list_display = ["code", "creator_device", "redeemed", "restore_claimed", "expires_at"]


@admin.register(AdminAssignedTask)
class AdminAssignedTaskAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "points_target", "visibility_hours", "active", "created_at"]
    list_filter = ["active", "created_at"]
    search_fields = ["title", "description"]
    fields = ["title", "description", "admin_note", "points_target", "visibility_hours", "active"]


@admin.register(AdminTaskSubmission)
class AdminTaskSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "task",
        "device_id",
        "status",
        "result_summary",
        "awarded_points",
        "reviewed_at",
        "time_after_bonus_display",
        "points_claimed",
        "submitted_at",
        "attachment",
    ]
    list_select_related = ("task",)
    list_filter = ["status", "points_claimed", "submitted_at"]
    search_fields = ["device_id", "task__title", "response_text"]
    autocomplete_fields = ["task", "reviewed_by"]
    readonly_fields = [
        "completion_time_display",
        "started_at",
        "elapsed_seconds",
        "submitted_at",
        "result_preview",
    ]
    fieldsets = (
        (
            "Submission",
            {
                "fields": (
                    "task",
                    "device_id",
                    "completion_time_display",
                    "response_text",
                    "attachment",
                    "status",
                    "result_preview",
                )
            },
        ),
        (
            "Review",
            {
                "fields": (
                    "awarded_points",
                    "review_notes",
                    "reviewed_by",
                    "reviewed_at",
                    "points_claimed",
                )
            },
        ),
        (
            "Timing (raw)",
            {
                "description": (
                    "Bonus posted = task created time. Elapsed = seconds from bonus posted to submit (stored on save). "
                    "Device started = optional client timestamp when the user opened the task in the app."
                ),
                "fields": ("started_at", "elapsed_seconds", "submitted_at"),
            },
        ),
    )

    @admin.display(description="After bonus posted")
    def time_after_bonus_display(self, obj: AdminTaskSubmission) -> str:
        posted = obj.task.created_at if obj.task_id else None
        submitted = obj.submitted_at
        if posted is not None and submitted is not None:
            sec = max(0, int((submitted - posted).total_seconds()))
        else:
            sec = int(obj.elapsed_seconds or 0)
        human = _format_elapsed(sec)
        if human:
            return f"{human} ({sec}s)"
        return f"{sec}s"

    @admin.display(description="Time to complete")
    def completion_time_display(self, obj: AdminTaskSubmission) -> str:
        if obj is None or obj.pk is None:
            return "—"
        posted = obj.task.created_at if obj.task_id else None
        submitted = obj.submitted_at
        if posted is not None and submitted is not None:
            delta_sec = max(0, int((submitted - posted).total_seconds()))
        else:
            delta_sec = int(obj.elapsed_seconds or 0)
        human = _format_elapsed(delta_sec)
        if delta_sec > 0 and human:
            head = format_html(
                '<p style="margin:0 0 6px 0;font-size:15px;"><strong>{}</strong> <span style="opacity:.85">({} seconds from bonus post → submit)</span></p>',
                human,
                delta_sec,
            )
        else:
            head = format_html(
                '<p style="margin:0 0 6px 0;opacity:.9"><strong>0s</strong> <span style="opacity:.85">(submitted in the same second the bonus was posted, or missing timestamps)</span></p>'
            )
        client_note = ""
        if obj.started_at is not None:
            client_note = format_html(
                '<p style="margin:6px 0 0 0;font-size:12px;line-height:1.45;opacity:.75">Device reported open: {} <span style="opacity:.7">(optional client clock)</span></p>',
                _dt_display(obj.started_at),
            )
        lines = format_html(
            '<p style="margin:0;font-size:13px;line-height:1.5;opacity:.88">Bonus posted (admin): {}<br/>User submitted: {}</p>',
            _dt_display(posted),
            _dt_display(submitted),
        )
        return format_html("{}{}{}", head, lines, client_note)

    @admin.display(description="User result")
    def result_summary(self, obj: AdminTaskSubmission) -> str:
        return Truncator(obj.response_text or "").chars(48)

    @admin.display(description="Submission result")
    def result_preview(self, obj: AdminTaskSubmission) -> str:
        text = (obj.response_text or "").strip()
        if not text:
            return "-"
        # Keep full response readable in detail view without editing it here.
        return text
