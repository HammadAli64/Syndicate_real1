"""Challenge generation and daily batch business logic."""
from __future__ import annotations

import secrets
import re
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from django.utils import timezone

from api.models import MindsetKnowledge, UploadedDocument
from django.db import IntegrityError

from api.services.openai_client import (
    enrich_user_custom_challenge_payload,
    generate_agent_daily_quote,
    generate_category_pair_batch,
    generate_challenge_for_mood,
    generate_daily_category_moods_batch,
    generate_mood_category_challenges_batch,
    merge_user_device_mindset_summary,
    validate_unique_challenge_titles,
)

from .models import GeneratedChallenge, UserAgentDailyQuote, UserDeviceMindsetContext

EMPTY_DEVICE_BATCH = ""

CATEGORIES = ["business", "money", "fitness", "power", "grooming"]

# 5 categories × 3 moods (no sad) × 2 slots
DAILY_SYSTEM_BATCH_SIZE = 30

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
    "energetic": "High-energy, activating, momentum-building tasks that push the user forward.",
    "happy": "Very positive, joyful, celebratory framing; lean into optimism and gratitude.",
    "tired": "Relaxing, low-effort, restorative micro-steps; conserve energy.",
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


def _tokenize_words(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9']+", (text or "").lower())


def score_mission_response(
    *,
    title: str,
    response_text: str,
    elapsed_seconds: int,
    max_points: int,
    difficulty: str = "medium",
) -> dict:
    """
    Rule-based mission scoring for completion responses.
    Factors: time spent, word count, repetition penalty, "syndicate" bonus, title-keyword relevance.
    """
    text = (response_text or "").strip()
    words = _tokenize_words(text)
    wc = len(words)
    safe_max = max(0, int(max_points))
    safe_elapsed = max(0, int(elapsed_seconds))
    diff = (difficulty or "medium").strip().lower()
    target_seconds = {"easy": 8 * 60, "medium": 15 * 60, "hard": 22 * 60}.get(diff, 15 * 60)

    # Word-count contribution: reward richer answers, cap after ~60 words.
    word_score = min(1.0, wc / 60.0)

    # Time contribution: earlier completion gets higher credit.
    # Full score at start; fades toward 0 by target_seconds.
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
    else:
        relevance_score = 0.0

    # Hard gate requested: irrelevant response gets zero.
    if relevance_score <= 0.0:
        return {
            "awarded_points": 0,
            "max_points": safe_max,
            "score_ratio": 0.0,
            "breakdown": {
                "word_count": wc,
                "word_score": round(word_score, 4),
                "elapsed_seconds": safe_elapsed,
                "target_seconds": target_seconds,
                "time_score": round(time_score, 4),
                "relevance_score": 0.0,
                "keyword_score": 0.0,
                "unique_ratio": round(unique_ratio, 4),
                "repetition_penalty": round(repetition_penalty, 4),
                "syndicate_bonus": 0.0,
            },
        }

    keyword_score = overlap / float(max(1, min(len(title_key_set), 3)))
    keyword_score = max(0.0, min(1.0, keyword_score))
    syndicate_bonus = 0.08 if "syndicate" in set(words) else 0.0

    # Priority requested:
    # 1) relevance, 2) keyword, 3) words, 4) time, 5) syndicate bonus.
    weighted = (
        0.40 * relevance_score
        + 0.24 * keyword_score
        + 0.18 * word_score
        + 0.12 * time_score
        + 0.06 * unique_ratio
    )
    score_ratio = max(0.0, min(1.0, weighted - repetition_penalty + syndicate_bonus))
    awarded = int(round(safe_max * score_ratio))
    awarded = max(0, min(safe_max, awarded))

    return {
        "awarded_points": awarded,
        "max_points": safe_max,
        "score_ratio": round(score_ratio, 4),
        "breakdown": {
            "word_count": wc,
            "word_score": round(word_score, 4),
            "elapsed_seconds": safe_elapsed,
            "target_seconds": target_seconds,
            "time_score": round(time_score, 4),
            "relevance_score": round(relevance_score, 4),
            "keyword_score": round(keyword_score, 4),
            "unique_ratio": round(unique_ratio, 4),
            "repetition_penalty": round(repetition_penalty, 4),
            "syndicate_bonus": round(syndicate_bonus, 4),
        },
    }


def create_user_custom_challenge(device_id: str, title: str, difficulty: str) -> tuple[bool, dict | None, str | None]:
    """Up to 2 user tasks per device per calendar day; AI expands title; random points 0–9."""
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
    except RuntimeError as e:
        return False, None, str(e)
    except Exception as e:
        return False, None, str(e)

    points = _points_from_difficulty(diff)
    one_line = (payload.get("based_on_mindset") or "").strip()[:240] or (payload.get("challenge_description") or "")[:200]

    try:
        ctx.summary = merge_user_device_mindset_summary(ctx.summary, title, diff, one_line)
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


def ensure_daily_challenges(force_regenerate: bool = False) -> tuple[bool, list[dict], str | None]:
    """Create or return today's shared challenges: 5 categories × 3 moods × 2 slots (no device scope)."""
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


def ensure_daily_challenges_for_device(device_id: str, force_regenerate: bool = False) -> tuple[bool, list[dict], str | None]:
    """
    Today's system challenges scoped to one user key — generated via OpenAI (no DB clone of other users' batches).
    Custom missions (creator_device set) are merged separately in the view.
    """
    device_id = (device_id or "").strip()
    if not device_id:
        return ensure_daily_challenges(force_regenerate=force_regenerate)

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
        qs_dev.delete()

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return False, [], "Ingest a document first."

    avoid = recent_titles()
    personalization = _daily_personalization_for_device(device_id)
    accumulated: list[dict] = []
    try:
        with ThreadPoolExecutor(max_workers=len(CATEGORIES)) as pool:
            futures = [
                pool.submit(
                    partial(
                        generate_daily_category_moods_batch,
                        latest.payload,
                        avoid,
                        cat,
                        personalization=personalization,
                    )
                )
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
            device_batch_device_id=device_id,
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
    today = timezone.localdate()
    existing = UserAgentDailyQuote.objects.filter(user=user, quote_date=today).first()
    if existing:
        return True, existing.text, None

    latest = MindsetKnowledge.objects.order_by("-updated_at").first()
    if not latest:
        return False, None, "Ingest a document first."

    avoid = [
        t.strip()
        for t in UserAgentDailyQuote.objects.filter(user=user).order_by("-quote_date")[:50].values_list("text", flat=True)
        if t and str(t).strip()
    ]
    # Also avoid today's lines already assigned to other users to keep quotes unique per day.
    today_taken = {
        t.strip()
        for t in UserAgentDailyQuote.objects.filter(quote_date=today).values_list("text", flat=True)
        if t and str(t).strip()
    }
    avoid.extend(list(today_taken))
    # Stable user key nudges model toward per-user variation even on same day/data.
    user_key = f"user:{getattr(user, 'id', '')}:{getattr(user, 'email', '') or getattr(user, 'username', '')}"
    try:
        text = generate_agent_daily_quote(latest.payload, avoid, today.isoformat(), user_key=user_key)
    except Exception as e:
        return False, None, str(e)

    # Hard guard: if model still returns a duplicate taken today, retry with expanded avoid-list.
    if text in today_taken:
        for _ in range(3):
            avoid.append(text)
            try:
                text = generate_agent_daily_quote(latest.payload, avoid, today.isoformat(), user_key=user_key)
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
