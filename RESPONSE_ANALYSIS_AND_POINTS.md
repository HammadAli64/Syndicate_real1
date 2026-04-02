# Response Analysis and Points Logic

This document explains how user responses are analyzed and how points are awarded in this project.

---

## 1) Standard mission response scoring (AI/daily/custom missions)

### API endpoint
- `POST /api/challenges/score_response/`
- Backend handler:
  - `Backend/apps/challenges/views.py` -> `mission_score_response()`

### Inputs
- `response_text`
- `challenge_title`
- `difficulty` (`easy` / `medium` / `hard`)
- `max_points`
- `elapsed_seconds`

### Scoring function
- Implemented in:
  - `Backend/apps/challenges/services.py` -> `score_mission_response(...)`
- Returns:
  - `awarded_points`
  - `max_points`
  - `score_ratio`
  - `breakdown` object with detailed factors

### What is analyzed
The scoring breakdown includes:
- `word_count`
- `word_score`
- `elapsed_seconds`
- `target_seconds`
- `time_score`
- `relevance_score`
- `keyword_score`
- `unique_ratio`
- `repetition_penalty`
- `syndicate_bonus`

### Exact formula used
From `score_mission_response(...)` in `Backend/apps/challenges/services.py`:

1. `word_score = min(1.0, word_count / 60.0)`

2. `target_seconds` by difficulty:
   - easy: `8 * 60` (480)
   - medium: `15 * 60` (900)
   - hard: `22 * 60` (1320)

3. `time_score = max(0.0, 1.0 - (elapsed_seconds / target_seconds))`

4. `unique_ratio = unique_words / word_count` (0 if no words)

5. `repetition_penalty = max(0.0, (1.0 - unique_ratio) * 0.35)`

6. Build title keyword set:
   - tokenize title
   - keep words with length `>= 4`
   - remove stopwords

7. `relevance_score = overlap(title_keywords, response_words) / len(title_keywords)`

8. Hard gate:
   - if `relevance_score <= 0` then `awarded_points = 0` and return immediately.

9. `keyword_score = overlap / max(1, min(len(title_keywords), 3))`
   - clamped to `[0, 1]`

10. `syndicate_bonus = 0.08` if response contains word `"syndicate"`, else `0.0`

11. Weighted score:
   - `weighted =`
     - `0.40 * relevance_score`
     - `+ 0.24 * keyword_score`
     - `+ 0.18 * word_score`
     - `+ 0.12 * time_score`
     - `+ 0.06 * unique_ratio`

12. Final ratio:
   - `score_ratio = clamp( weighted - repetition_penalty + syndicate_bonus , 0, 1 )`

13. Final points:
   - `awarded_points = round(max_points * score_ratio)`
   - then clamped to `[0, max_points]`

### Difficulty and max points
- The scorer multiplies by the incoming `max_points` from the selected challenge row.
- Difficulty affects `target_seconds` (time component), not only the label.

### Simple example
If:
- `max_points = 10`
- `score_ratio = 0.63`

Then:
- `awarded_points = round(10 * 0.63) = 6`

### Point award behavior
- Frontend stores awarded points per mission in local state/storage.
- First completion of a mission adds `awarded_points` to `points_total`.
- Mission completion updates history/category totals for charts and stats.

---

## 2) Admin / Mega Mission scoring (manual review path)

### Submit endpoint
- `POST /api/challenges/admin_tasks/submit/`
- Saves:
  - response text
  - optional attachment (including recorded video)
  - elapsed timing metadata

### Review path
- Admin reviews submission in Django admin (`AdminTaskSubmission`).
- Admin sets:
  - `status` = `reviewed` (or rejected)
  - `awarded_points` = points to grant

### Claim endpoint (user side)
- `POST /api/challenges/admin_tasks/claim_points/`
- Sums all reviewed, unclaimed positive submissions for that user/device.
- Marks those submission rows as `points_claimed = true`.
- Returns:
  - `points_awarded`
  - `submission_ids`

### Frontend behavior
- User sees reviewed status in Mega Mission card.
- Claim button appears under reviewed result if claimable.
- On click, returned `points_awarded` is added to `points_total`.

---

## 3) Streak interaction with responses

### Standard missions
- On first completion in a calendar day, frontend calls:
  - `POST /api/challenges/me/streak_record/`

### Admin / Mega submissions
- After successful submit, frontend also calls streak record if today is not already recorded.

### Rule
- At least one completed task in a day keeps streak progressing day-to-day.
- Missing a full day can break/reset per backend normalization rules.

---

## 4) Where total points are persisted

- Frontend keeps `points_total` in synced state for UX.
- Backend now also persists user `points_total` and `level` in DB model:
  - `SyndicateUserProgress.points_total`
  - `SyndicateUserProgress.level`
- Progress API `GET/PATCH /api/challenges/me/progress/` returns these values.

---

## 5) Quick verification checklist

### Standard mission
1. Open mission and submit response.
2. Confirm `score_response` returns breakdown and awarded points.
3. Confirm total points increases in UI.

### Mega mission
1. Submit admin task response.
2. In admin, set status `reviewed` and `awarded_points > 0`.
3. In user UI, click claim button under reviewed result.
4. Confirm total points increases and submission becomes claimed.

