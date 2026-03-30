"""Challenge generation and daily batch business logic."""
from __future__ import annotations

from django.utils import timezone

from api.models import MindsetKnowledge, UploadedDocument
from api.services.openai_client import (
    POINTS_BY_DIFFICULTY,
    generate_challenge_for_mood,
    generate_daily_challenges_batch,
)

from .models import GeneratedChallenge

CATEGORIES = ["business", "money", "fitness", "power", "grooming"]


def category_sort_key(cat: str) -> int:
    try:
        return CATEGORIES.index(cat)
    except ValueError:
        return 99


def recent_titles() -> list[str]:
    return [
        c.payload.get("challenge_title", "")
        for c in GeneratedChallenge.objects.order_by("-created_at")[:30]
        if c.payload
    ]


def serialize_challenge_row(c: GeneratedChallenge) -> dict:
    p = c.payload or {}
    return {
        "id": c.id,
        "mood": c.mood,
        "category": c.category or p.get("category", ""),
        "difficulty": c.difficulty or p.get("difficulty", ""),
        "points": int(c.points or p.get("points") or 0),
        "slot": c.slot,
        "challenge_date": c.challenge_date.isoformat() if c.challenge_date else None,
        "payload": p,
        "created_at": c.created_at.isoformat(),
    }


def run_generate(mood: str) -> tuple[bool, dict | None, str | None]:
    mood = (mood or "").strip()
    if not mood:
        return False, None, "mood is required"

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, None, "Ingest a document first."

    avoid = recent_titles()
    try:
        payload = generate_challenge_for_mood(latest.payload, mood, avoid)
    except RuntimeError as e:
        return False, None, str(e)
    except Exception as e:
        return False, None, str(e)

    today = timezone.localdate()
    GeneratedChallenge.objects.create(
        mood=mood,
        payload=payload,
        source_document=latest.source,
        challenge_date=today,
        slot=1,
    )

    return True, {
        "challenge": payload,
        "date": today.isoformat(),
        "source_document_id": latest.source.id,
    }, None


def ensure_daily_challenges(force_regenerate: bool = False) -> tuple[bool, list[dict], str | None]:
    """Create or return 10 challenges for today (2 per category)."""
    today = timezone.localdate()
    qs = GeneratedChallenge.objects.filter(challenge_date=today)
    if not force_regenerate and qs.count() >= 10:
        ordered = sorted(qs, key=lambda x: (category_sort_key(x.category), x.slot, x.id))
        return True, [serialize_challenge_row(c) for c in ordered], None

    if force_regenerate or qs.count() < 10:
        qs.delete()

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, [], "Ingest a document first."

    avoid = recent_titles()
    try:
        items = generate_daily_challenges_batch(latest.payload, avoid)
    except RuntimeError as e:
        return False, [], str(e)
    except Exception as e:
        return False, [], str(e)

    doc = latest.source
    rows: list[dict] = []
    for item in items:
        diff = str(item.get("difficulty") or "medium").lower().strip()
        if diff not in POINTS_BY_DIFFICULTY:
            diff = "medium"
        pts = POINTS_BY_DIFFICULTY[diff]
        cat = str(item.get("category") or "").lower().strip()
        if cat not in CATEGORIES:
            cat = "business"
        slot = int(item.get("slot") or 1)
        if slot not in (1, 2):
            slot = 1

        c = GeneratedChallenge.objects.create(
            mood="daily",
            category=cat,
            difficulty=diff,
            points=pts,
            challenge_date=today,
            slot=slot,
            payload=item,
            source_document=doc,
        )
        rows.append(serialize_challenge_row(c))

    rows.sort(key=lambda r: (category_sort_key(str(r.get("category") or "")), r.get("slot", 1), r.get("id", 0)))
    return True, rows, None
