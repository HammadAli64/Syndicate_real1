"""Challenge generation and daily batch business logic."""
from __future__ import annotations

from django.utils import timezone

from api.models import MindsetKnowledge, UploadedDocument
from django.db import IntegrityError

from api.services.openai_client import (
    POINTS_BY_DIFFICULTY,
    generate_agent_daily_quote,
    generate_category_pair_batch,
    generate_challenge_for_mood,
    generate_daily_category_moods_batch,
    generate_mood_category_challenges_batch,
    validate_unique_challenge_titles,
)

from .models import AgentDailyQuote, GeneratedChallenge

CATEGORIES = ["business", "money", "fitness", "power", "grooming"]

VALID_MOODS = frozenset({"energetic", "happy", "sad", "tired"})

MOOD_BEHAVIOR: dict[str, str] = {
    "energetic": "High-energy, activating, momentum-building tasks that push the user forward.",
    "happy": "Very positive, joyful, celebratory framing; lean into optimism and gratitude.",
    "sad": "Comforting, gentle, validating tasks that meet the user with empathy.",
    "tired": "Relaxing, low-effort, restorative micro-steps; conserve energy.",
}


def validate_mood_challenge_item(item: dict, mood: str, category: str) -> tuple[bool, str | None]:
    """Ensure mood/category match and title length > 3."""
    m = str(item.get("mood") or "").strip().lower()
    c = str(item.get("category") or "").strip().lower()
    title = str(item.get("title") or "").strip()
    desc = str(item.get("description") or "").strip()
    if m != mood:
        return False, "challenge.mood must match selected mood"
    if c != category:
        return False, "challenge.category must match selected category"
    if len(title) <= 3:
        return False, "title must be longer than 3 characters"
    if not desc:
        return False, "description is required"
    return True, None


def generate_challenges(mood: str, category: str) -> tuple[bool, list[dict], str | None]:
    """
    Generate 2 validated challenges for the given mood and category via OpenAI.
    Returns list of dicts: title, description, mood, category (does not persist to DB).
    """
    mood = (mood or "").strip().lower()
    category = (category or "").strip().lower()
    if mood not in VALID_MOODS:
        return False, [], "Invalid mood. Use: energetic, happy, sad, tired."
    if category not in CATEGORIES:
        return False, [], "Invalid category."

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, [], "Ingest a document first."

    avoid = recent_titles()
    try:
        raw = generate_mood_category_challenges_batch(
            latest.payload,
            mood,
            category,
            MOOD_BEHAVIOR[mood],
            avoid,
        )
    except Exception as e:
        return False, [], str(e)

    validated: list[dict] = []
    for item in raw:
        ok, verr = validate_mood_challenge_item(item, mood, category)
        if not ok:
            return False, [], verr or "Validation failed"
        validated.append(
            {
                "title": item["title"],
                "description": item["description"],
                "mood": mood,
                "category": category,
            }
        )
    if len(validated) != 2:
        return False, [], "Expected 2 validated challenges"
    return True, validated, None


def category_sort_key(cat: str) -> int:
    try:
        return CATEGORIES.index(cat)
    except ValueError:
        return 99


def _mood_sort_key(mood: str) -> int:
    order = {"energetic": 0, "happy": 1, "sad": 2, "tired": 3}
    return order.get((mood or "").lower(), 99)


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
    """Create or return today's challenges: 5 categories × 4 moods × 2 slots = 40 unique rows."""
    today = timezone.localdate()
    qs = GeneratedChallenge.objects.filter(challenge_date=today)
    if not force_regenerate and qs.count() >= 40:
        ordered = sorted(
            qs,
            key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
        )
        return True, [serialize_challenge_row(c) for c in ordered], None

    # Pair-only mode: exactly 2 daily challenges in one category — keep as-is on reload.
    if not force_regenerate and qs.count() == 2:
        pair = list(qs)
        if (
            all((c.mood or "") == "daily" for c in pair)
            and pair[0].category
            and pair[0].category == pair[1].category
        ):
            ordered = sorted(qs, key=lambda x: (category_sort_key(x.category), x.slot, x.id))
            return True, [serialize_challenge_row(c) for c in ordered], None

    if force_regenerate or qs.count() < 40:
        qs.delete()

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, [], "Ingest a document first."

    avoid = recent_titles()
    accumulated: list[dict] = []
    avoid_run = list(avoid)
    try:
        for cat in CATEGORIES:
            chunk = generate_daily_category_moods_batch(latest.payload, avoid_run, cat)
            for ch in chunk:
                t = str(ch.get("challenge_title") or "").strip()
                if t:
                    avoid_run.append(t)
            accumulated.extend(chunk)
        validate_unique_challenge_titles(accumulated)
    except RuntimeError as e:
        return False, [], str(e)
    except ValueError as e:
        return False, [], str(e)
    except Exception as e:
        return False, [], str(e)

    if len(accumulated) != 40:
        return False, [], f"Expected 40 challenges, got {len(accumulated)}"

    doc = latest.source
    rows: list[dict] = []
    for item in accumulated:
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
        mood = str(item.get("mood") or "").lower().strip()
        if mood not in VALID_MOODS:
            mood = "energetic"

        c = GeneratedChallenge.objects.create(
            mood=mood,
            category=cat,
            difficulty=diff,
            points=pts,
            challenge_date=today,
            slot=slot,
            payload=item,
            source_document=doc,
        )
        rows.append(serialize_challenge_row(c))

    rows.sort(
        key=lambda r: (
            category_sort_key(str(r.get("category") or "")),
            _mood_sort_key(str(r.get("mood") or "")),
            r.get("slot", 1),
            r.get("id", 0),
        )
    )
    return True, rows, None


def ensure_category_pair(category: str) -> tuple[bool, list[dict], str | None]:
    """Replace today's challenges with exactly 2 for the given category (slots 1–2)."""
    cat = (category or "").lower().strip()
    if cat not in CATEGORIES:
        return False, [], "Invalid category"

    today = timezone.localdate()
    GeneratedChallenge.objects.filter(challenge_date=today).delete()

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, [], "Ingest a document first."

    avoid = recent_titles()
    try:
        items = generate_category_pair_batch(latest.payload, avoid, cat)
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

    rows.sort(key=lambda r: (r.get("slot", 1), r.get("id", 0)))
    return True, rows, None


def ensure_agent_quote_for_today() -> tuple[bool, str | None, str | None]:
    """Return persisted agent quote for local calendar today, generating once via OpenAI if missing."""
    today = timezone.localdate()
    existing = AgentDailyQuote.objects.filter(quote_date=today).first()
    if existing:
        return True, existing.text, None

    latest = MindsetKnowledge.objects.order_by("-updated_at").first()
    if not latest:
        return False, None, "Ingest a document first."

    avoid = [
        t.strip()
        for t in AgentDailyQuote.objects.order_by("-quote_date")[:50].values_list("text", flat=True)
        if t and str(t).strip()
    ]
    try:
        text = generate_agent_daily_quote(latest.payload, avoid, today.isoformat())
    except Exception as e:
        return False, None, str(e)

    try:
        AgentDailyQuote.objects.create(quote_date=today, text=text)
    except IntegrityError:
        again = AgentDailyQuote.objects.filter(quote_date=today).first()
        if again:
            return True, again.text, None
        return False, None, "Could not save agent quote."

    return True, text, None
