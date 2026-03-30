"""REST API for challenges and referral streak restore."""
from __future__ import annotations

import secrets
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.models import MindsetKnowledge

from .models import GeneratedChallenge, ReferralRestore
from .services import ensure_daily_challenges, run_generate, serialize_challenge_row


@api_view(["GET", "POST"])
def challenge_list_create(request):
    """
    GET: today's daily batch (same as /today/).
    POST: body with `mood` for one challenge, or `regenerate_daily` / `force` for daily batch.
    """
    if request.method == "GET":
        return challenges_today(request)
    mood = (request.data.get("mood") or "").strip()
    if mood:
        return generate_challenge(request)
    if request.data.get("regenerate_daily") or request.data.get("force"):
        return challenges_generate_daily(request)
    return Response(
        {"detail": "Provide `mood` (string) or `regenerate_daily` / `force` for daily batch."},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
def generate_challenge(request):
    """Body: { mood: string }. Uses latest ingested mindsets."""
    mood = (request.data.get("mood") or "").strip()
    ok, data, err = run_generate(mood)
    if not ok:
        code = status.HTTP_400_BAD_REQUEST if err in ("mood is required", "Ingest a document first.") else status.HTTP_503_SERVICE_UNAVAILABLE
        if err and "OPENAI_API_KEY" in err:
            code = status.HTTP_503_SERVICE_UNAVAILABLE
        elif err and err not in ("mood is required", "Ingest a document first."):
            code = status.HTTP_502_BAD_GATEWAY
        return Response({"detail": err}, status=code)

    return Response(data)


@api_view(["GET"])
def challenge_history(request):
    qs = GeneratedChallenge.objects.order_by("-created_at")[:50]
    return Response(
        [
            {
                "id": c.id,
                "mood": c.mood,
                "title": (c.payload or {}).get("challenge_title"),
                "created_at": c.created_at.isoformat(),
            }
            for c in qs
        ]
    )


@api_view(["GET"])
def challenges_recent(request):
    """Full challenge payloads for UI (newest first)."""
    try:
        limit = min(int(request.query_params.get("limit", 10)), 50)
    except ValueError:
        limit = 10
    qs = GeneratedChallenge.objects.order_by("-created_at")[:limit]
    return Response({"results": [serialize_challenge_row(c) for c in qs]})


@api_view(["GET"])
def challenges_today(_request):
    """Today's daily batch (10 challenges) or create if missing."""
    if not MindsetKnowledge.objects.exists():
        return Response({"results": [], "detail": "No mindsets loaded yet."})
    ok, rows, err = ensure_daily_challenges(force_regenerate=False)
    if not ok:
        return Response({"results": [], "detail": err or "Failed"}, status=status.HTTP_502_BAD_GATEWAY)
    return Response({"results": rows})


@api_view(["POST"])
def challenges_generate_daily(request):
    """Regenerate today's 10 challenges. Body: { force: true } to replace existing."""
    if not MindsetKnowledge.objects.exists():
        return Response({"detail": "Ingest a document first."}, status=status.HTTP_400_BAD_REQUEST)
    force = bool(request.data.get("force", False))
    ok, rows, err = ensure_daily_challenges(force_regenerate=force)
    if not ok:
        code = status.HTTP_503_SERVICE_UNAVAILABLE if err and "OPENAI_API_KEY" in (err or "") else status.HTTP_502_BAD_GATEWAY
        return Response({"detail": err}, status=code)
    return Response({"results": rows})


@api_view(["POST"])
def referral_create(request):
    """Create a unique invite code (valid 7 days) for streak restore."""
    device = (request.data.get("device_id") or "").strip()
    if not device:
        return Response({"detail": "device_id required"}, status=status.HTTP_400_BAD_REQUEST)
    now = timezone.now()
    ReferralRestore.objects.filter(creator_device=device, redeemed=False, expires_at__gte=now).delete()
    code = f"SYN-{secrets.token_hex(5).upper()}"
    expires = now + timedelta(days=7)
    r = ReferralRestore.objects.create(code=code, creator_device=device, expires_at=expires)
    return Response({"code": r.code, "expires_at": r.expires_at.isoformat()})


@api_view(["POST"])
def referral_redeem(request):
    """Friend redeems a code (cannot be your own)."""
    code = (request.data.get("code") or "").strip().upper()
    device = (request.data.get("device_id") or "").strip()
    if not code or not device:
        return Response({"detail": "code and device_id required"}, status=status.HTTP_400_BAD_REQUEST)
    now = timezone.now()
    try:
        r = ReferralRestore.objects.get(code=code)
    except ReferralRestore.DoesNotExist:
        return Response({"detail": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)
    if r.expires_at < now:
        return Response({"detail": "Code expired"}, status=status.HTTP_400_BAD_REQUEST)
    if r.redeemed:
        return Response({"detail": "Code already used"}, status=status.HTTP_400_BAD_REQUEST)
    if r.creator_device == device:
        return Response({"detail": "You cannot use your own code"}, status=status.HTTP_400_BAD_REQUEST)
    r.redeemed = True
    r.redeemer_device = device
    r.save()
    return Response({"ok": True})


@api_view(["GET"])
def referral_status(request):
    """Inviter: check if a friend redeemed so you can claim streak restore."""
    device = (request.GET.get("device_id") or "").strip()
    if not device:
        return Response({"detail": "device_id required"}, status=status.HTTP_400_BAD_REQUEST)
    now = timezone.now()
    r = (
        ReferralRestore.objects.filter(
            creator_device=device,
            redeemed=True,
            restore_claimed=False,
            expires_at__gte=now,
        )
        .order_by("-created_at")
        .first()
    )
    return Response({"can_claim": bool(r), "code_suffix": r.code[-4:] if r else None})


@api_view(["POST"])
def referral_claim(request):
    """Inviter: consume one pending restore after friend redeemed."""
    device = (request.data.get("device_id") or "").strip()
    if not device:
        return Response({"detail": "device_id required"}, status=status.HTTP_400_BAD_REQUEST)
    now = timezone.now()
    r = (
        ReferralRestore.objects.filter(
            creator_device=device,
            redeemed=True,
            restore_claimed=False,
            expires_at__gte=now,
        )
        .order_by("-created_at")
        .first()
    )
    if not r:
        return Response({"detail": "Nothing to claim"}, status=status.HTTP_400_BAD_REQUEST)
    r.restore_claimed = True
    r.save()
    return Response({"ok": True})
