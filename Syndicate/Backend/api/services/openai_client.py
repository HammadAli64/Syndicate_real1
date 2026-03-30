"""OpenAI API helpers for ingest and challenge generation."""
from __future__ import annotations

import json
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


def chat_json(system: str, user: str) -> dict[str, Any]:
    """Return parsed JSON object from OpenAI chat completion."""
    client = _client()
    resp = client.chat.completions.create(
        model=_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.7,
        response_format={"type": "json_object"},
    )
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
    return chat_json(CHALLENGE_SYSTEM, user)


POINTS_BY_DIFFICULTY = {"easy": 5, "medium": 10, "hard": 15}


def generate_daily_challenges_batch(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
) -> list[dict[str, Any]]:
    """Returns 10 challenge dicts with category, difficulty, points, and content fields."""
    from .prompts import DAILY_BATCH_SYSTEM

    user = json.dumps(
        {
            "stored_mindsets": mindsets_payload,
            "titles_to_avoid": avoid_titles[:80],
        },
        ensure_ascii=False,
    )
    data = chat_json(DAILY_BATCH_SYSTEM, user)
    challenges = data.get("challenges") or []
    if len(challenges) != 10:
        raise ValueError(f"Expected 10 challenges in batch, got {len(challenges)}")

    normalized: list[dict[str, Any]] = []
    for ch in challenges:
        diff = str(ch.get("difficulty") or "medium").lower().strip()
        if diff not in POINTS_BY_DIFFICULTY:
            diff = "medium"
        ch = dict(ch)
        ch["difficulty"] = diff
        ch["points"] = POINTS_BY_DIFFICULTY[diff]
        normalized.append(ch)
    return normalized
