"""Challenge / mission generation. Uses latest ``MindsetKnowledge.payload`` (mindsets, patterns, habits, benefits) from the ingest agent — not the raw uploaded file."""
from __future__ import annotations

import hashlib
import secrets
import re
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from django.utils import timezone

from api.models import MindsetKnowledge, UploadedDocument
from django.db import IntegrityError

from api.services.openai_client import (
    _pad_user_custom_description,
    enrich_user_custom_challenge_payload,
    generate_agent_daily_quote,
    generate_category_pair_batch,
    generate_challenge_for_mood,
    generate_daily_category_energetic_one,
    generate_daily_category_happy_tired_pair,
    generate_daily_category_moods_batch,
    generate_mood_category_challenges_batch,
    normalize_challenge_payload,
    validate_unique_challenge_titles,
)

from .models import AgentDailyQuote, GeneratedChallenge, UserAgentDailyQuote, UserDeviceMindsetContext

# Imported lazily in ensure_daily_challenges_for_device to avoid circular import with device_batch_async.

EMPTY_DEVICE_BATCH = ""

CATEGORIES = ["business", "money", "fitness", "power", "grooming"]

# 5 categories × 3 moods (no sad) × 1 slot — one mission per category per mood
DAILY_SYSTEM_BATCH_SIZE = 15
# First wave: one energetic mission per category (shown on first HTTP response before phase 2).
DAILY_PHASE1_ENERGETIC_COUNT = 5

VALID_MOODS = frozenset({"energetic", "happy", "tired"})
STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "your",
    "have",
    "will",
    "about",
    "into",
    "after",
    "before",
    "their",
    "there",
    "then",
    "than",
    "they",
    "them",
    "what",
    "when",
    "where",
    "which",
    "while",
    "mission",
    "challenge",
}

MOOD_BEHAVIOR: dict[str, str] = {
    "energetic": (
        "User is in an activation state: ready to push forward. Missions should demand momentum, "
        "clear stretch, and 'do it now' execution in the category — forward motion, not winding down."
    ),
    "happy": (
        "User benefits from uplift and positive affect: appreciation, gratitude, savoring wins, "
        "joyful or celebratory framing. Rewarding and emotionally bright without requiring a brutal sprint."
    ),
    "tired": (
        "User is low bandwidth: missions must be tiny, gentle, restorative, and low cognitive load — "
        "permission to go small, recovery-friendly, still on-category but never a high-intensity push."
    ),
}


def _points_from_difficulty(diff: str) -> int:
    """
    Difficulty-aware random points in the range 1..10.
    - easy:   1..4
    - medium: 4..7
    - hard:   7..10
    """
    d = (diff or "medium").strip().lower()
    if d == "easy":
        return 1 + secrets.randbelow(4)  # 1..4
    if d == "hard":
        return 7 + secrets.randbelow(4)  # 7..10
    return 4 + secrets.randbelow(4)  # medium: 4..7


def _points_for_user_custom_mission() -> int:
    """Points for user-created missions only: inclusive 3..5."""
    return 3 + secrets.randbelow(3)


def _quick_merge_user_device_summary(previous: str, title: str, difficulty: str, one_line: str) -> str:
    """Rolling device summary without a second LLM call (keeps daily personalization snappy)."""
    focus = (one_line or "").strip()[:200]
    piece = f"{difficulty}: {title}" + (f" — {focus}" if focus else "")
    prev = (previous or "").strip()
    out = piece if not prev else f"{prev}\n• {piece}"
    if len(out) > 1200:
        out = out[-1200:]
    return out


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


def generate_challenges(mood: str, category: str, device_id: str = "") -> tuple[bool, list[dict], str | None]:
    """
    Generate 2 validated challenges for the given mood and category via OpenAI.
    Returns list of dicts: title, description, mood, category (does not persist to DB).
    """
    mood = (mood or "").strip().lower()
    category = (category or "").strip().lower()
    if mood not in VALID_MOODS:
        return False, [], "Invalid mood. Use: energetic, happy, tired."
    if category not in CATEGORIES:
        return False, [], "Invalid category."

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, [], "Ingest a document first."

    mindset_hints = ""
    dev = (device_id or "").strip()
    if dev:
        rec = UserDeviceMindsetContext.objects.filter(device_id=dev).first()
        if rec and rec.summary:
            mindset_hints = rec.summary

    avoid = recent_titles()
    try:
        raw = generate_mood_category_challenges_batch(
            latest.payload,
            mood,
            category,
            MOOD_BEHAVIOR[mood],
            avoid,
            mindset_hints,
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
    order = {"energetic": 0, "happy": 1, "tired": 2}
    return order.get((mood or "").lower(), 99)


def recent_titles() -> list[str]:
    return [
        c.payload.get("challenge_title", "")
        for c in GeneratedChallenge.objects.order_by("-created_at")[:30]
        if c.payload
    ]


def prune_stale_syndicate_daily_rows() -> None:
    """
    Drop calendar-dated syndicate content before **today** (local date).

    Kept in DB:
    - ``GeneratedChallenge`` where ``creator_device`` is non-empty (user-created custom missions),
      any ``challenge_date`` (only those rows are long-lived task records here).

    Removed:
    - AI/system daily challenges: ``GeneratedChallenge`` with ``creator_device == ""`` and
      ``challenge_date`` strictly before today.
    - Per-user agent lines: ``UserAgentDailyQuote`` with ``quote_date`` before today.
    - Legacy global quotes: ``AgentDailyQuote`` with ``quote_date`` before today.

    Other apps (mindsets, uploads, progress JSON, leaderboard, admin tasks) are not touched here.
    """
    today = timezone.localdate()
    GeneratedChallenge.objects.filter(creator_device="", challenge_date__lt=today).delete()
    UserAgentDailyQuote.objects.filter(quote_date__lt=today).delete()
    AgentDailyQuote.objects.filter(quote_date__lt=today).delete()


def device_batch_is_phase1_energetic_only(*, device_id: str, today) -> bool:
    """True when today's device batch has exactly 5 energetic rows, one per category."""
    device_id = (device_id or "").strip()
    qs = GeneratedChallenge.objects.filter(
        challenge_date=today,
        creator_device="",
        device_batch_device_id=device_id,
    )
    rows = list(qs)
    if len(rows) != DAILY_PHASE1_ENERGETIC_COUNT:
        return False
    if any((r.mood or "").lower() != "energetic" for r in rows):
        return False
    cats = {r.category for r in rows}
    return cats == set(CATEGORIES)


def get_today_device_system_rows(device_id: str) -> list[dict]:
    """Serialized system missions for this device key for local calendar today."""
    device_id = (device_id or "").strip()
    today = timezone.localdate()
    qs = GeneratedChallenge.objects.filter(
        challenge_date=today,
        creator_device="",
        device_batch_device_id=device_id,
    )
    ordered = sorted(
        qs,
        key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
    )
    return [serialize_challenge_row(c) for c in ordered]


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
        "user_created": bool((c.creator_device or "").strip()),
    }


def resolve_mission_response_text(data: dict) -> tuple[str, str | None]:
    """
    Build the single string used for validation and scoring.

    Preferred: ``completion_how`` and ``completion_learned`` (both non-empty).
    Legacy: ``response_text`` alone.
    Returns ``(combined_text, error_message_or_none)``.
    """
    how = (data.get("completion_how") or "").strip()
    learned = (data.get("completion_learned") or "").strip()
    legacy = (data.get("response_text") or "").strip()
    if how or learned:
        if not how:
            return "", "completion_how is required together with completion_learned."
        if not learned:
            return "", "completion_learned is required together with completion_how."
        return (
            "How I completed this mission:\n"
            f"{how}\n\n"
            "What I learned from it:\n"
            f"{learned}",
            None,
        )
    if legacy:
        return legacy, None
    return (
        "",
        "Provide completion_how and completion_learned (both non-empty), or response_text for legacy clients.",
    )


def _tokenize_words(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9']+", (text or "").lower())


def evaluate_mission_validity_with_agent(
    *,
    title: str,
    response_text: str,
    difficulty: str = "medium",
    challenge_description: str = "",
    example_tasks: list[str] | None = None,
) -> dict:
    """
    Mandatory pre-scoring step: OpenAI evaluation agent returns ``is_valid`` and ``reason``.
    Without ``OPENAI_API_KEY``, validation cannot run — response is treated as invalid (zero points).
    """
    from django.conf import settings

    api_key = (getattr(settings, "OPENAI_API_KEY", None) or "").strip().strip("\ufeff")
    if not api_key:
        return {
            "is_valid": False,
            "reason": "Mission validation requires OPENAI_API_KEY to be configured on the server.",
            "source": "unavailable",
        }
    try:
        from api.services.openai_client import validate_user_mission_response_for_scoring

        out = validate_user_mission_response_for_scoring(
            challenge_title=title,
            challenge_description=challenge_description or "",
            example_tasks=list(example_tasks or []),
            difficulty=difficulty or "medium",
            user_response=response_text,
        )
        return {**out, "source": "openai"}
    except Exception:
        return {
            "is_valid": False,
            "reason": "Validation agent could not complete; response was not scored.",
            "source": "error",
        }


# Max extra multiplier from speed when accuracy is already positive (secondary bonus only).
_TIME_SECONDARY_COEFF = 0.15


def score_mission_response_after_validation(
    *,
    title: str,
    response_text: str,
    elapsed_seconds: int,
    max_points: int,
    difficulty: str = "medium",
) -> dict:
    """
    Numeric scoring **only** after the evaluation agent marked the response valid.
    Accuracy (relevance, keywords, length, uniqueness, syndicate bonus, repetition penalty) forms
    ``accuracy_ratio``. Time is **not** mixed into that blend; it applies only as a bounded
    multiplicative bonus so it cannot compensate for low accuracy and is inert when accuracy is 0.
    """
    text = (response_text or "").strip()
    words = _tokenize_words(text)
    wc = len(words)
    safe_max = max(0, int(max_points))
    safe_elapsed = max(0, int(elapsed_seconds))
    diff = (difficulty or "medium").strip().lower()
    target_seconds = {"easy": 8 * 60, "medium": 15 * 60, "hard": 22 * 60}.get(diff, 15 * 60)

    word_score = min(1.0, wc / 60.0)
    time_score = max(0.0, 1.0 - (safe_elapsed / float(target_seconds)))

    unique_count = len(set(words))
    unique_ratio = (unique_count / wc) if wc else 0.0
    repetition_penalty = max(0.0, (1.0 - unique_ratio) * 0.35)

    title_tokens = [
        t
        for t in _tokenize_words(title)
        if len(t) >= 4 and t not in STOPWORDS
    ]
    title_key_set = set(title_tokens)
    overlap = 0
    if title_key_set:
        response_key_set = set(words)
        overlap = len(title_key_set & response_key_set)
        relevance_score = overlap / float(len(title_key_set))
        keyword_score = overlap / float(max(1, min(len(title_key_set), 3)))
        keyword_score = max(0.0, min(1.0, keyword_score))
    else:
        relevance_score = 0.0
        keyword_score = 0.0

    syndicate_bonus = 0.08 if "syndicate" in set(words) else 0.0

    # Primary accuracy only — no time term.
    accuracy_weighted = (
        0.45 * relevance_score
        + 0.28 * keyword_score
        + 0.20 * word_score
        + 0.07 * unique_ratio
    )
    accuracy_ratio = max(0.0, min(1.0, accuracy_weighted - repetition_penalty + syndicate_bonus))

    # Secondary: speed multiplies the accuracy base; when accuracy_ratio is 0, time has no effect.
    time_multiplier = 1.0 + _TIME_SECONDARY_COEFF * time_score
    score_ratio = min(1.0, accuracy_ratio * time_multiplier)
    awarded = int(round(safe_max * score_ratio))
    awarded = max(0, min(safe_max, awarded))

    return {
        "awarded_points": awarded,
        "max_points": safe_max,
        "accuracy_ratio": round(accuracy_ratio, 4),
        "score_ratio": round(score_ratio, 4),
        "breakdown": {
            "word_count": wc,
            "word_score": round(word_score, 4),
            "elapsed_seconds": safe_elapsed,
            "target_seconds": target_seconds,
            "time_score": round(time_score, 4),
            "time_multiplier": round(time_multiplier, 4),
            "accuracy_ratio": round(accuracy_ratio, 4),
            "relevance_score": round(relevance_score, 4),
            "keyword_score": round(keyword_score, 4),
            "unique_ratio": round(unique_ratio, 4),
            "repetition_penalty": round(repetition_penalty, 4),
            "syndicate_bonus": round(syndicate_bonus, 4),
        },
    }


def enrich_mission_score_with_agent_attestation(
    scored: dict,
    *,
    title: str,
    response_text: str,
    difficulty: str,
    challenge_description: str = "",
    example_tasks: list[str] | None = None,
) -> dict:
    """
    After numeric scoring, call the OpenAI mission agent to attest whether the user's
    response meets the mission's rules and intent. Adds key ``agent_attestation`` (dict or null).
    """
    from django.conf import settings

    api_key = (getattr(settings, "OPENAI_API_KEY", None) or "").strip().strip("\ufeff")
    if not api_key:
        return {**scored, "agent_attestation": None}
    try:
        from api.services.openai_client import attest_user_mission_response

        att = attest_user_mission_response(
            challenge_title=title,
            challenge_description=challenge_description or "",
            example_tasks=list(example_tasks or []),
            difficulty=difficulty or "medium",
            user_response=response_text,
        )
        return {**scored, "agent_attestation": att}
    except Exception:
        return {**scored, "agent_attestation": None}


def _fallback_user_custom_payload(title: str, difficulty: str) -> dict:
    """Deterministic expansion when OpenAI is unavailable or returns unusable output."""
    t = (title or "").strip()
    diff = (difficulty or "medium").lower().strip()
    if diff not in ("easy", "medium", "hard"):
        diff = "medium"
    desc = _pad_user_custom_description(t, "")
    merged = normalize_challenge_payload(
        {
            "challenge_title": t,
            "challenge_description": desc,
            "example_tasks": [
                f"Write one concrete micro-step for «{t[:100]}» and give it a ten-minute timer.",
                "Do that step once, then one sentence on what worked or what to adjust.",
                "File the takeaway where your future self will see it tomorrow morning.",
            ],
            "benefits_list": [
                f"You prove you can move «{t[:100]}» forward without needing a perfect plan before you start.",
                f"Each rep on «{t[:100]}» builds evidence that your own titles can become real work, not just ideas.",
                f"Staying honest about «{t[:100]}» keeps the mission aligned with what you actually chose to pursue.",
            ],
            "based_on_mindset": "User-authored custom mission (saved without live AI expansion).",
            "suitable_moods": ["custom", "energetic"],
            "difficulty": diff,
            "category": "personal",
        }
    )
    merged["challenge_title"] = t
    merged["difficulty"] = diff
    merged["category"] = "personal"
    return merged


def create_user_custom_challenge(device_id: str, title: str, difficulty: str) -> tuple[bool, dict | None, str | None]:
    """Up to 2 user tasks per device per calendar day; AI expands title; points 3–5."""
    device_id = (device_id or "").strip()
    if not device_id or len(device_id) > 128:
        return False, None, "device_id required"
    title = (title or "").strip()
    if len(title) < 3 or len(title) > 220:
        return False, None, "Title must be 3–220 characters."
    diff = (difficulty or "").lower().strip()
    if diff not in ("easy", "medium", "hard"):
        return False, None, "difficulty must be easy, medium, or hard."

    today = timezone.localdate()
    existing_n = GeneratedChallenge.objects.filter(challenge_date=today, creator_device=device_id).count()
    if existing_n >= 2:
        return False, None, "Maximum 2 custom missions per calendar day."

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, None, "Ingest a document first."

    ctx, _ = UserDeviceMindsetContext.objects.get_or_create(device_id=device_id, defaults={"summary": ""})

    try:
        payload = enrich_user_custom_challenge_payload(latest.payload, title, diff, ctx.summary or "")
    except ValueError as e:
        return False, None, str(e)
    except Exception:
        payload = _fallback_user_custom_payload(title, diff)

    points = _points_for_user_custom_mission()
    one_line = (payload.get("based_on_mindset") or "").strip()[:240] or (payload.get("challenge_description") or "")[:200]

    try:
        ctx.summary = _quick_merge_user_device_summary(ctx.summary, title, diff, one_line)
        ctx.save(update_fields=["summary", "updated_at"])
    except Exception:
        pass

    slot = existing_n + 1
    payload_out = {**payload, "user_created": True, "points": points}
    c = GeneratedChallenge.objects.create(
        mood="custom",
        creator_device=device_id,
        category="personal",
        difficulty=diff,
        points=points,
        challenge_date=today,
        slot=slot,
        payload=payload_out,
        source_document=latest.source,
    )
    return True, serialize_challenge_row(c), None


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


def _daily_personalization_for_device(device_id: str) -> str:
    """Extra prompt text so each device's daily batch differs from others."""
    dev = (device_id or "").strip()
    if not dev:
        return ""
    parts = [f"Unique session id (keep challenges distinct from other users): {dev[:96]}"]
    rec = UserDeviceMindsetContext.objects.filter(device_id=dev).first()
    if rec and (rec.summary or "").strip():
        parts.append(f"Returning user context (non-verbatim): {rec.summary.strip()[:1800]}")
    return "\n\n".join(parts)


def _persist_challenge_payloads_for_device(
    device_id: str,
    today,
    doc,
    items: list[dict],
) -> list[dict]:
    """Create GeneratedChallenge rows from AI payload dicts; return serialized rows."""
    rows: list[dict] = []
    for item in items:
        diff = str(item.get("difficulty") or "medium").lower().strip()
        if diff not in ("easy", "medium", "hard"):
            diff = "medium"
        pts = _points_from_difficulty(diff)
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
            device_batch_device_id=device_id,
        )
        rows.append(serialize_challenge_row(c))
    return rows


def generate_device_ai_batch_phase_energetic_parallel(device_id: str, _user_id: int) -> tuple[bool, str | None]:
    """
    Parallel OpenAI: one energetic mission per category (5 total). Caller should hold
    ``device_generation_lock`` when replacing a corrupt partial batch; do not call when 15 rows exist.
    """
    device_id = (device_id or "").strip()
    today = timezone.localdate()
    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, "Ingest a document first."
    personalization = _daily_personalization_for_device(device_id)
    doc = latest.source
    avoid = recent_titles()
    accumulated: list[dict] = []
    try:
        with ThreadPoolExecutor(max_workers=len(CATEGORIES)) as pool:
            futures = [
                pool.submit(
                    partial(
                        generate_daily_category_energetic_one,
                        latest.payload,
                        avoid,
                        cat,
                        personalization=personalization,
                    )
                )
                for cat in CATEGORIES
            ]
            for fut in futures:
                accumulated.extend(fut.result())
        if len(accumulated) != DAILY_PHASE1_ENERGETIC_COUNT:
            return False, f"Expected {DAILY_PHASE1_ENERGETIC_COUNT} energetic challenges, got {len(accumulated)}"
        validate_unique_challenge_titles(accumulated)
        _persist_challenge_payloads_for_device(device_id, today, doc, accumulated)
    except RuntimeError as e:
        return False, str(e)
    except ValueError as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)
    return True, None


def generate_device_ai_batch_phase_happy_tired_parallel(device_id: str, _user_id: int) -> tuple[bool, str | None]:
    """
    Parallel OpenAI: happy + tired per category (10 total). Expects exactly 5 energetic rows already stored.
    Caller must hold ``device_generation_lock``.
    """
    device_id = (device_id or "").strip()
    today = timezone.localdate()
    if not device_batch_is_phase1_energetic_only(device_id=device_id, today=today):
        return False, "Phase 2 requires five energetic missions (one per category)."
    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, "Ingest a document first."
    personalization = _daily_personalization_for_device(device_id)
    doc = latest.source
    qs_existing = GeneratedChallenge.objects.filter(
        challenge_date=today,
        creator_device="",
        device_batch_device_id=device_id,
    )
    existing_items = [dict(c.payload or {}) for c in qs_existing.order_by("id")]
    avoid = recent_titles()
    accumulated: list[dict] = []
    try:
        with ThreadPoolExecutor(max_workers=len(CATEGORIES)) as pool:
            futures = [
                pool.submit(
                    partial(
                        generate_daily_category_happy_tired_pair,
                        latest.payload,
                        avoid,
                        cat,
                        personalization=personalization,
                    )
                )
                for cat in CATEGORIES
            ]
            for fut in futures:
                accumulated.extend(fut.result())
        if len(accumulated) != DAILY_SYSTEM_BATCH_SIZE - DAILY_PHASE1_ENERGETIC_COUNT:
            return (
                False,
                f"Expected {DAILY_SYSTEM_BATCH_SIZE - DAILY_PHASE1_ENERGETIC_COUNT} happy/tired challenges, got {len(accumulated)}",
            )
        validate_unique_challenge_titles(existing_items + accumulated)
        _persist_challenge_payloads_for_device(device_id, today, doc, accumulated)
    except RuntimeError as e:
        return False, str(e)
    except ValueError as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)
    return True, None


def ensure_daily_challenges(force_regenerate: bool = False) -> tuple[bool, list[dict], str | None]:
    """Create or return today's shared challenges: 5 categories × 3 moods × 1 slot each = 15 (no device scope)."""
    prune_stale_syndicate_daily_rows()
    today = timezone.localdate()
    qs_all = GeneratedChallenge.objects.filter(challenge_date=today)
    qs_system = qs_all.filter(creator_device="", device_batch_device_id=EMPTY_DEVICE_BATCH)

    if not force_regenerate and qs_system.count() >= DAILY_SYSTEM_BATCH_SIZE:
        ordered = sorted(
            qs_system,
            key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
        )
        return True, [serialize_challenge_row(c) for c in ordered], None
    # Fast path: if we already have some system rows for today, return them immediately.
    # This avoids re-running expensive generation on every reload.
    if not force_regenerate and qs_system.count() > 0:
        ordered = sorted(
            qs_system,
            key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
        )
        return True, [serialize_challenge_row(c) for c in ordered], None

    # Pair-only mode: exactly 2 daily challenges in one category — keep as-is on reload.
    if not force_regenerate and qs_all.filter(device_batch_device_id=EMPTY_DEVICE_BATCH).count() == 2:
        pair = list(qs_all.filter(device_batch_device_id=EMPTY_DEVICE_BATCH))
        if (
            len(pair) == 2
            and all((not (c.creator_device or "").strip()) for c in pair)
            and all((c.mood or "") == "daily" for c in pair)
            and pair[0].category
            and pair[0].category == pair[1].category
        ):
            ordered = sorted(qs_all.filter(device_batch_device_id=EMPTY_DEVICE_BATCH), key=lambda x: (category_sort_key(x.category), x.slot, x.id))
            return True, [serialize_challenge_row(c) for c in ordered], None

    if force_regenerate or qs_system.count() < DAILY_SYSTEM_BATCH_SIZE:
        qs_system.delete()

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, [], "Ingest a document first."

    avoid = recent_titles()
    accumulated: list[dict] = []
    try:
        # Generate each category in parallel to reduce first-load latency.
        # We do not cross-feed avoid lists between categories in this fast path.
        # Global de-duplication is still validated after merge.
        with ThreadPoolExecutor(max_workers=len(CATEGORIES)) as pool:
            futures = [
                pool.submit(generate_daily_category_moods_batch, latest.payload, avoid, cat)
                for cat in CATEGORIES
            ]
            for fut in futures:
                chunk = fut.result()
                accumulated.extend(chunk)
        validate_unique_challenge_titles(accumulated)
    except RuntimeError as e:
        return False, [], str(e)
    except ValueError as e:
        return False, [], str(e)
    except Exception as e:
        return False, [], str(e)

    if len(accumulated) != DAILY_SYSTEM_BATCH_SIZE:
        return False, [], f"Expected {DAILY_SYSTEM_BATCH_SIZE} challenges, got {len(accumulated)}"

    doc = latest.source
    rows: list[dict] = []
    for item in accumulated:
        diff = str(item.get("difficulty") or "medium").lower().strip()
        if diff not in ("easy", "medium", "hard"):
            diff = "medium"
        pts = _points_from_difficulty(diff)
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
            device_batch_device_id=EMPTY_DEVICE_BATCH,
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


def ensure_daily_challenges_for_device(device_id: str, force_regenerate: bool = False, user=None) -> tuple[bool, list[dict], str | None]:
    """
    Today's system challenges scoped to one user key.
    Custom missions (creator_device set) are merged separately in the view.
    When creating or regenerating an empty batch: five energetic missions are generated under the
    device lock, then happy/tired rows are kicked off in a background thread (same as challenges_today).
    """
    device_id = (device_id or "").strip()
    if not device_id:
        return ensure_daily_challenges(force_regenerate=force_regenerate)

    prune_stale_syndicate_daily_rows()

    today = timezone.localdate()
    qs_dev = GeneratedChallenge.objects.filter(
        challenge_date=today,
        creator_device="",
        device_batch_device_id=device_id,
    )

    if not force_regenerate and qs_dev.count() >= DAILY_SYSTEM_BATCH_SIZE:
        ordered = sorted(
            qs_dev,
            key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
        )
        return True, [serialize_challenge_row(c) for c in ordered], None

    if not force_regenerate and qs_dev.count() > 0:
        ordered = sorted(
            qs_dev,
            key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
        )
        return True, [serialize_challenge_row(c) for c in ordered], None

    if force_regenerate or qs_dev.count() == 0:
        from .device_batch_async import device_generation_lock, start_device_ai_batch_phase2

        uid = getattr(user, "id", None) if user is not None else None
        uid_arg = uid if uid is not None else 0

        with device_generation_lock(device_id, today):
            qs_dev = GeneratedChallenge.objects.filter(
                challenge_date=today,
                creator_device="",
                device_batch_device_id=device_id,
            )
            if not force_regenerate and qs_dev.count() >= DAILY_SYSTEM_BATCH_SIZE:
                ordered = sorted(
                    qs_dev,
                    key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
                )
                return True, [serialize_challenge_row(c) for c in ordered], None
            if not force_regenerate and qs_dev.count() > 0:
                ordered = sorted(
                    qs_dev,
                    key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
                )
                return True, [serialize_challenge_row(c) for c in ordered], None
            qs_dev.delete()
            ok_p1, err_p1 = generate_device_ai_batch_phase_energetic_parallel(device_id, uid_arg)
            if not ok_p1:
                return False, [], err_p1

        start_device_ai_batch_phase2(device_id, uid_arg)

        qs_out = GeneratedChallenge.objects.filter(
            challenge_date=today,
            creator_device="",
            device_batch_device_id=device_id,
        )
        ordered = sorted(
            qs_out,
            key=lambda x: (category_sort_key(x.category), _mood_sort_key(x.mood), x.slot, x.id),
        )
        return True, [serialize_challenge_row(c) for c in ordered], None

    raise RuntimeError("ensure_daily_challenges_for_device: unexpected fallthrough")


def ensure_category_pair(category: str, device_batch_device_id: str | None = None) -> tuple[bool, list[dict], str | None]:
    """Replace today's system batch for this device with exactly 2 challenges for the given category (slots 1–2)."""
    cat = (category or "").lower().strip()
    if cat not in CATEGORIES:
        return False, [], "Invalid category"

    batch_key = (device_batch_device_id or "").strip() or EMPTY_DEVICE_BATCH

    today = timezone.localdate()
    GeneratedChallenge.objects.filter(
        challenge_date=today,
        creator_device="",
        device_batch_device_id=batch_key,
    ).delete()

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
        if diff not in ("easy", "medium", "hard"):
            diff = "medium"
        pts = _points_from_difficulty(diff)
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
            device_batch_device_id=batch_key,
        )
        rows.append(serialize_challenge_row(c))

    rows.sort(key=lambda r: (r.get("slot", 1), r.get("id", 0)))
    return True, rows, None


def ensure_agent_quote_for_user(user) -> tuple[bool, str | None, str | None]:
    """Return persisted agent brief for this user for local calendar today, generating once via OpenAI if missing."""
    prune_stale_syndicate_daily_rows()
    today = timezone.localdate()
    existing = UserAgentDailyQuote.objects.filter(user=user, quote_date=today).first()
    if existing:
        return True, existing.text, None

    latest = MindsetKnowledge.objects.order_by("-updated_at").first()
    if not latest:
        return False, None, "Ingest a document first."

    today_taken = {
        t.strip()
        for t in UserAgentDailyQuote.objects.filter(quote_date=today).values_list("text", flat=True)
        if t and str(t).strip()
    }
    # Prioritize every quote already used today (any user) so [:N] in the API client never drops them
    # behind one operator's long history — that caused identical lines across users.
    today_first = [
        t.strip()
        for t in UserAgentDailyQuote.objects.filter(quote_date=today).values_list("text", flat=True)
        if t and str(t).strip()
    ]
    user_past = [
        t.strip()
        for t in UserAgentDailyQuote.objects.filter(user=user)
        .exclude(quote_date=today)
        .order_by("-quote_date")[:50]
        .values_list("text", flat=True)
        if t and str(t).strip()
    ]
    seen_avoid: set[str] = set()
    avoid: list[str] = []
    for chunk in (today_first, user_past):
        for line in chunk:
            if line not in seen_avoid:
                seen_avoid.add(line)
                avoid.append(line)

    uid = int(getattr(user, "pk", None) or getattr(user, "id", None) or 0)
    device_key = f"user:{uid}" if uid else ""
    personalization = _daily_personalization_for_device(device_key)
    creative_seed = hashlib.sha256(f"{uid}:{today.isoformat()}".encode()).hexdigest()[:28]

    try:
        text = generate_agent_daily_quote(
            latest.payload,
            avoid,
            today.isoformat(),
            operator_id=uid or None,
            personalization=personalization,
            creative_seed=creative_seed,
        )
    except Exception as e:
        return False, None, str(e)

    # Hard guard: if model still returns a duplicate taken today, retry with expanded avoid-list.
    if text in today_taken:
        for _ in range(3):
            avoid.append(text)
            try:
                text = generate_agent_daily_quote(
                    latest.payload,
                    avoid,
                    today.isoformat(),
                    operator_id=uid or None,
                    personalization=personalization,
                    creative_seed=creative_seed,
                )
            except Exception as e:
                return False, None, str(e)
            if text not in today_taken:
                break
        if text in today_taken:
            return False, None, "Could not generate a unique quote for today. Retry shortly."

    try:
        UserAgentDailyQuote.objects.create(user=user, quote_date=today, text=text)
    except IntegrityError:
        again = UserAgentDailyQuote.objects.filter(user=user, quote_date=today).first()
        if again:
            return True, again.text, None
        return False, None, "Could not save agent quote."

    return True, text, None
