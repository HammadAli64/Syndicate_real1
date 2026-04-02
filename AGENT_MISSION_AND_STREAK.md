# Agent Mission Generation & Streak Restore

This file explains how the system currently generates missions and how streak restore works.

---

## 1) How the agent generates missions

### Entry API
- Frontend loads daily missions from:
  - `GET /api/challenges/today/`
- Backend route:
  - `Backend/apps/challenges/views.py` -> `challenges_today()`

### Source knowledge
- Generation uses the latest ingested mindset document from `MindsetKnowledge`.
- If no mindset is ingested, generation is blocked with:
  - `"Ingest a document first."`

### Daily generation matrix
- Categories:
  - `business`, `money`, `fitness`, `power`, `grooming`
- Moods:
  - `energetic`, `happy`, `tired`
- Slots:
  - 2 per category+mood
- Total daily system missions:
  - `5 categories * 3 moods * 2 = 30`

### Core generator flow
- Implemented in:
  - `Backend/apps/challenges/services.py`
- Main function for daily per-user batch:
  - `ensure_daily_challenges_for_device(...)`
- It calls OpenAI helpers in:
  - `Backend/api/services/openai_client.py`
- Prompt templates live in:
  - `Backend/api/services/prompts.py`

### Validation and persistence
- AI outputs are validated (mood/category/shape/title checks).
- Valid rows are persisted to `GeneratedChallenge` with fields like:
  - `challenge_date`, `mood`, `category`, `slot`, `payload`
- Old mission rows are pruned (older than 2 days).

### Important behavior
- No `sad` mood generation now.
- No clone/copy from existing users for new user daily missions.
- New user gets generated missions through the AI path.

---

## 2) Streak: does restore work?

Yes, streak restore is implemented and should work when the referral flow is completed.

### DB-backed streak
- Model: `SyndicateUserProgress`
- Streak fields:
  - `streak_count`
  - `last_activity_date`
- Streak is server-authoritative in DB.

### Daily streak increase logic
- Endpoint:
  - `POST /api/challenges/me/streak_record/`
- Called when user completes first task of a day.
- Rules:
  - If activity is on consecutive next day -> `streak + 1`
  - If one or more full days are missed -> streak chain restarts from `1` when user is active again
- On read (`GET /me/progress/`), long inactivity normalization can reset streak and store restore hints.

### Streak restore flow (referral)
- Referral endpoints:
  - `POST /api/challenges/referral/create/`
  - `POST /api/challenges/referral/redeem/`
  - `GET  /api/challenges/referral/status/`
  - `POST /api/challenges/referral/claim/`
- Restore endpoint:
  - `POST /api/challenges/me/streak_restore/`
- After successful referral claim, frontend calls `me/streak_restore` with previous streak value.
- Backend sets `streak_count` in DB and clears restore hint keys in progress state.

### Why restore might look not working
- User did not complete full referral sequence (create -> redeem -> claim).
- Wrong account/session used between inviter and redeemer.
- Restore window expired.
- Frontend state stale (refresh needed after claim).

---

## 3) Quick test checklist

### Mission generation
1. Ingest mindset data.
2. Call `GET /api/challenges/today/`.
3. Confirm ~30 generated system missions (plus custom rows if any).

### Streak
1. Complete at least one mission today -> streak should update.
2. Complete at least one mission next day -> streak increments by 1.
3. Miss full day(s) -> streak resets/restarts as per backend rules.

### Streak restore
1. Break streak so restore hints exist.
2. Run referral create/redeem/claim.
3. Confirm `POST /me/streak_restore/` returns updated `streak_count`.
4. Confirm UI reflects restored streak.

