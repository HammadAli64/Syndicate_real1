"""OpenAI API helpers for ingest and challenge generation."""
from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from django.conf import settings
from openai import OpenAI


def _client() -> OpenAI:
    key = (getattr(settings, "OPENAI_API_KEY", None) or "").strip().strip("\ufeff")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set in environment or .env")
    return OpenAI(api_key=key)


def _model() -> str:
    return getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")


def chat_json(
    system: str,
    user: str,
    *,
    max_tokens: int | None = None,
    temperature: float = 0.7,
) -> dict[str, Any]:
    """Return parsed JSON object from OpenAI chat completion."""
    client = _client()
    kwargs: dict[str, Any] = {
        "model": _model(),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "response_format": {"type": "json_object"},
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    resp = client.chat.completions.create(**kwargs)
    text = (resp.choices[0].message.content or "").strip()
    return json.loads(text)


def extract_mindsets_from_document(document_text: str) -> dict[str, Any]:
    from .prompts import INGEST_SYSTEM

    user = (
        "Below is the document text (video transcripts). Extract mindsets as instructed.\n\n"
        "--- DOCUMENT START ---\n"
        f"{document_text}\n"
        "--- DOCUMENT END ---"
    )
    return chat_json(INGEST_SYSTEM, user)


def _split_into_three(text: str) -> list[str]:
    """Best-effort split of legacy single-string examples/benefits into three items."""
    t = (text or "").strip()
    if not t:
        return ["", "", ""]
    for sep in ("\n", ";"):
        if sep in t:
            parts = [p.strip() for p in t.split(sep) if p.strip()]
            if len(parts) >= 2:
                while len(parts) < 3:
                    parts.append("")
                return parts[:3]
    parts = re.split(r"(?<=[.!?])\s+", t)
    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) >= 3:
        return parts[:3]
    if len(parts) == 2:
        return [parts[0], parts[1], ""]
    if len(parts) == 1:
        return [parts[0], "", ""]
    return ["", "", ""]


def normalize_challenge_payload(ch: dict[str, Any]) -> dict[str, Any]:
    """Ensure example_tasks and benefits_list (3 each); keep legacy example_task / benefits for older clients."""
    out = dict(ch)
    legacy_ex = str(out.get("example_task") or "").strip()
    legacy_ben = str(out.get("benefits") or "").strip()

    raw_tasks = out.get("example_tasks")
    if isinstance(raw_tasks, list):
        tasks = [str(x).strip() for x in raw_tasks if str(x).strip()]
    else:
        tasks = []
    if len(tasks) < 3:
        if legacy_ex:
            tasks = _split_into_three(legacy_ex)
        else:
            tasks = tasks + [""] * (3 - len(tasks))
    while len(tasks) < 3:
        tasks.append("")
    out["example_tasks"] = tasks[:3]

    raw_ben = out.get("benefits_list")
    if isinstance(raw_ben, list):
        bens = [str(x).strip() for x in raw_ben if str(x).strip()]
    else:
        bens = []
    if len(bens) < 3:
        if legacy_ben:
            bens = _split_into_three(legacy_ben)
        else:
            bens = bens + [""] * (3 - len(bens))
    while len(bens) < 3:
        bens.append("")
    out["benefits_list"] = bens[:3]

    if not legacy_ex and out["example_tasks"][0]:
        out["example_task"] = out["example_tasks"][0]
    elif legacy_ex:
        out["example_task"] = legacy_ex
    if not legacy_ben and any(out["benefits_list"]):
        out["benefits"] = " ".join(x for x in out["benefits_list"] if x)
    elif legacy_ben:
        out["benefits"] = legacy_ben
    return out


def generate_challenge_for_mood(
    mindsets_payload: dict[str, Any],
    mood: str,
    avoid_titles: list[str],
) -> dict[str, Any]:
    from .prompts import CHALLENGE_SYSTEM

    avoid = "\n".join(f"- {t}" for t in avoid_titles[:40]) if avoid_titles else "(none)"
    user = json.dumps(
        {
            "user_mood": mood.strip(),
            "stored_mindsets": mindsets_payload,
            "recent_challenge_titles_to_avoid": avoid,
            "instruction": "Generate one new challenge. Must differ from the avoided titles.",
        },
        ensure_ascii=False,
    )
    return normalize_challenge_payload(chat_json(CHALLENGE_SYSTEM, user))


POINTS_BY_DIFFICULTY = {"easy": 5, "medium": 10, "hard": 15}


# Per 5-challenge chunk: caps worst-case latency; ~half the output of a 10-challenge call.
_DAILY_BATCH_CHUNK_MAX_TOKENS = 5500


def generate_daily_challenges_batch(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
) -> list[dict[str, Any]]:
    """Returns 10 challenge dicts with category, difficulty, points, and content fields.

    Uses two parallel API calls (5 challenges each) so wall-clock time is roughly max(t1, t2)
    instead of one very large completion.
    Retries once if merged titles are not unique across both parts.
    """
    from .prompts import DAILY_BATCH_SYSTEM_PART1, DAILY_BATCH_SYSTEM_PART2

    last_err: Exception | None = None
    for attempt in range(2):
        user = json.dumps(
            {
                "stored_mindsets": mindsets_payload,
                "titles_to_avoid": avoid_titles[:120],
            },
            ensure_ascii=False,
        )
        temp = 0.65 if attempt == 0 else 0.78

        def _fetch_part(system: str) -> dict[str, Any]:
            return chat_json(
                system,
                user,
                max_tokens=_DAILY_BATCH_CHUNK_MAX_TOKENS,
                temperature=temp,
            )

        try:
            with ThreadPoolExecutor(max_workers=2) as pool:
                fut1 = pool.submit(_fetch_part, DAILY_BATCH_SYSTEM_PART1)
                fut2 = pool.submit(_fetch_part, DAILY_BATCH_SYSTEM_PART2)
                data1 = fut1.result()
                data2 = fut2.result()

            part1 = data1.get("challenges") or []
            part2 = data2.get("challenges") or []
            if len(part1) != 5 or len(part2) != 5:
                raise ValueError(
                    f"Expected 5 challenges per parallel batch, got {len(part1)} and {len(part2)}"
                )
            challenges = list(part1) + list(part2)

            normalized: list[dict[str, Any]] = []
            for ch in challenges:
                diff = str(ch.get("difficulty") or "medium").lower().strip()
                if diff not in POINTS_BY_DIFFICULTY:
                    diff = "medium"
                ch = normalize_challenge_payload(dict(ch))
                ch["difficulty"] = diff
                ch["points"] = POINTS_BY_DIFFICULTY[diff]
                normalized.append(ch)
            _assert_unique_challenge_titles(normalized)
            return normalized
        except ValueError as e:
            last_err = e
            if "Duplicate" in str(e) and attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Daily batch generation failed")


_DAILY_CATEGORY_MOODS_MAX_TOKENS = 12000

# Fixed order for 8 challenges per category: 4 moods × 2 slots.
_MOOD_SLOT_ORDER: list[tuple[str, int]] = [
    ("energetic", 1),
    ("energetic", 2),
    ("happy", 1),
    ("happy", 2),
    ("sad", 1),
    ("sad", 2),
    ("tired", 1),
    ("tired", 2),
]


def generate_daily_category_moods_batch(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
    category: str,
) -> list[dict[str, Any]]:
    """Returns 8 challenge dicts for one category: each of energetic/happy/sad/tired with slots 1–2."""
    from .prompts import daily_category_moods_system_prompt

    cat = (category or "").lower().strip()
    if cat not in _VALID_PAIR_CATEGORIES:
        raise ValueError("Invalid category")

    system = daily_category_moods_system_prompt(cat)
    user = json.dumps(
        {
            "stored_mindsets": mindsets_payload,
            "titles_to_avoid": avoid_titles[:200],
        },
        ensure_ascii=False,
    )

    last_err: Exception | None = None
    for attempt in range(2):
        temp = 0.65 if attempt == 0 else 0.78
        try:
            data = chat_json(system, user, max_tokens=_DAILY_CATEGORY_MOODS_MAX_TOKENS, temperature=temp)
            challenges = data.get("challenges") or []
            if len(challenges) != 8:
                raise ValueError(f"Expected 8 challenges for category {cat}, got {len(challenges)}")

            normalized: list[dict[str, Any]] = []
            for i, ch in enumerate(challenges):
                if not isinstance(ch, dict):
                    raise ValueError("Invalid challenge item")
                exp_mood, exp_slot = _MOOD_SLOT_ORDER[i]
                diff = str(ch.get("difficulty") or "medium").lower().strip()
                if diff not in POINTS_BY_DIFFICULTY:
                    diff = "medium"
                ch = normalize_challenge_payload(dict(ch))
                ch["difficulty"] = diff
                ch["points"] = POINTS_BY_DIFFICULTY[diff]
                ch["category"] = cat
                ch["mood"] = exp_mood
                ch["slot"] = exp_slot
                sm = ch.get("suitable_moods")
                if not isinstance(sm, list) or not sm:
                    ch["suitable_moods"] = [exp_mood]
                else:
                    sm2 = [str(x).strip() for x in sm if str(x).strip()]
                    if not any(str(x).lower() == exp_mood for x in sm2):
                        ch["suitable_moods"] = [exp_mood] + sm2[:2]
                    else:
                        ch["suitable_moods"] = sm2[:4]
                normalized.append(ch)

            _assert_unique_challenge_titles(normalized)
            return normalized
        except ValueError as e:
            last_err = e
            if "Duplicate" in str(e) and attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Daily category moods batch failed")


def validate_unique_challenge_titles(items: list[dict[str, Any]]) -> None:
    """Validate non-empty unique challenge_title values (e.g. after merging category batches)."""
    _assert_unique_challenge_titles(items)


def _assert_unique_challenge_titles(items: list[dict[str, Any]]) -> None:
    raw = [str(x.get("challenge_title") or "").strip().lower() for x in items]
    nonempty = [t for t in raw if t]
    if len(nonempty) != len(items):
        raise ValueError("Missing challenge title(s) in batch")
    if len(set(nonempty)) != len(nonempty):
        raise ValueError("Duplicate challenge titles in batch")


_VALID_PAIR_CATEGORIES = frozenset({"business", "money", "fitness", "power", "grooming"})


def generate_category_pair_batch(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
    category: str,
) -> list[dict[str, Any]]:
    """Returns exactly 2 challenge dicts for a single category (slots 1 and 2)."""
    from .prompts import CATEGORY_PAIR_SYSTEM

    cat = (category or "").lower().strip()
    if cat not in _VALID_PAIR_CATEGORIES:
        raise ValueError("Invalid category")
    system = CATEGORY_PAIR_SYSTEM.format(category=cat)
    last_err: Exception | None = None
    for attempt in range(2):
        user = json.dumps(
            {
                "stored_mindsets": mindsets_payload,
                "titles_to_avoid": avoid_titles[:120],
            },
            ensure_ascii=False,
        )
        temp = 0.65 if attempt == 0 else 0.78
        try:
            data = chat_json(system, user, max_tokens=3200, temperature=temp)
            challenges = data.get("challenges") or []
            if len(challenges) != 2:
                raise ValueError(f"Expected 2 challenges for category pair, got {len(challenges)}")

            normalized: list[dict[str, Any]] = []
            for i, ch in enumerate(challenges):
                diff = str(ch.get("difficulty") or "medium").lower().strip()
                if diff not in POINTS_BY_DIFFICULTY:
                    diff = "medium"
                ch = normalize_challenge_payload(dict(ch))
                ch["difficulty"] = diff
                ch["points"] = POINTS_BY_DIFFICULTY[diff]
                ch["category"] = cat
                ch["slot"] = i + 1
                normalized.append(ch)
            _assert_unique_challenge_titles(normalized)
            return normalized
        except ValueError as e:
            last_err = e
            if "Duplicate" in str(e) and attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Category pair generation failed")


def generate_mood_category_challenges_batch(
    mindsets_payload: dict[str, Any],
    mood: str,
    category: str,
    mood_behavior_instruction: str,
    avoid_titles: list[str],
) -> list[dict[str, Any]]:
    """Returns exactly 2 dicts with keys title, description, mood, category."""
    from .prompts import MOOD_CATEGORY_SYSTEM

    mood = (mood or "").strip().lower()
    category = (category or "").strip().lower()
    system = MOOD_CATEGORY_SYSTEM.format(
        mood=mood,
        category=category,
        mood_behavior=mood_behavior_instruction,
    )
    avoid = "\n".join(f"- {t}" for t in avoid_titles[:40]) if avoid_titles else "(none)"
    user = json.dumps(
        {
            "stored_mindsets": mindsets_payload,
            "recent_challenge_titles_to_avoid": avoid,
        },
        ensure_ascii=False,
    )
    data = chat_json(system, user, max_tokens=2200, temperature=0.72)
    challenges = data.get("challenges") or []
    if len(challenges) != 2:
        raise ValueError(f"Expected 2 challenges, got {len(challenges)}")
    out: list[dict[str, Any]] = []
    for ch in challenges:
        if not isinstance(ch, dict):
            raise ValueError("Invalid challenge item")
        out.append(
            {
                "title": str(ch.get("title") or "").strip(),
                "description": str(ch.get("description") or "").strip(),
                "mood": str(ch.get("mood") or "").strip().lower(),
                "category": str(ch.get("category") or "").strip().lower(),
            }
        )
    return out


def generate_agent_daily_quote(
    mindsets_payload: dict[str, Any],
    avoid_quotes: list[str],
    calendar_date_iso: str,
) -> str:
    """Single JSON quote line for the Syndicate dashboard; avoids past lines."""
    from .prompts import AGENT_QUOTE_SYSTEM

    user = json.dumps(
        {
            "stored_mindsets": mindsets_payload,
            "quotes_to_avoid": avoid_quotes[:60],
            "calendar_date": calendar_date_iso,
        },
        ensure_ascii=False,
    )
    data = chat_json(AGENT_QUOTE_SYSTEM, user, max_tokens=220, temperature=0.88)
    q = str(data.get("quote") or "").strip()
    if len(q) < 12:
        raise ValueError("Agent quote too short")
    return q
