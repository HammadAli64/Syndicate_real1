/**
 * Challenges API — base URL from existing env (single .env / NEXT_PUBLIC_SYNDICATE_API_URL).
 * All paths are under /api/challenges/ on the Django server.
 */
import { getSyndicateAuthHeaders } from "@/lib/syndicateAuth";
const API_BASE = (process.env.NEXT_PUBLIC_SYNDICATE_API_URL ?? "http://127.0.0.1:8000/api").replace(/\/$/, "");

export function challengesApiUrl(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE}/challenges/${p}`;
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = {
    ...(init?.headers ?? {}),
    ...getSyndicateAuthHeaders(false)
  };
  return fetch(url, { ...init, headers });
}

export type SyndicateProgressPayload = {
  state: Record<string, string>;
  streak_count: number;
  last_activity_date: string | null;
};

function parseProgressJson(j: {
  state?: Record<string, unknown>;
  streak_count?: unknown;
  last_activity_date?: unknown;
  detail?: string;
}): SyndicateProgressPayload {
  const raw = j.state || {};
  const state: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined) continue;
    state[k] = typeof v === "string" ? v : String(v);
  }
  const sc = j.streak_count;
  const streak_count = typeof sc === "number" && Number.isFinite(sc) ? sc : parseInt(String(sc ?? "0"), 10) || 0;
  const lad = j.last_activity_date;
  const last_activity_date =
    lad == null || lad === "" ? null : typeof lad === "string" ? lad.slice(0, 10) : String(lad).slice(0, 10);
  return { state, streak_count, last_activity_date };
}

export async function fetchSyndicateProgress(): Promise<SyndicateProgressPayload> {
  const r = await apiFetch(challengesApiUrl("me/progress/"), { cache: "no-store" });
  const j = (await r.json()) as { state?: Record<string, unknown>; streak_count?: unknown; last_activity_date?: unknown; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load progress");
  return parseProgressJson(j);
}

export async function patchSyndicateProgress(state: Record<string, string>): Promise<SyndicateProgressPayload> {
  const r = await apiFetch(challengesApiUrl("me/progress/"), {
    method: "PATCH",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ state })
  });
  const j = (await r.json()) as { state?: Record<string, unknown>; streak_count?: unknown; last_activity_date?: unknown; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to save progress");
  return parseProgressJson(j);
}

export async function postSyndicateStreakRecord(activityDate?: string): Promise<{ ok: boolean; streak_count: number; last_activity_date: string }> {
  const body: Record<string, string> = {};
  if (activityDate) body.activity_date = activityDate;
  const r = await apiFetch(challengesApiUrl("me/streak_record/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify(body)
  });
  const j = (await r.json()) as { ok?: boolean; streak_count?: unknown; last_activity_date?: string; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Could not update streak");
  const sc = j.streak_count;
  const streak_count = typeof sc === "number" && Number.isFinite(sc) ? sc : parseInt(String(sc ?? "0"), 10) || 0;
  const last_activity_date = (j.last_activity_date || activityDate || "").slice(0, 10);
  return { ok: !!j.ok, streak_count, last_activity_date };
}

export async function postSyndicateStreakRestore(streakCount: number): Promise<SyndicateProgressPayload> {
  const r = await apiFetch(challengesApiUrl("me/streak_restore/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ streak_count: streakCount })
  });
  const j = (await r.json()) as { state?: Record<string, unknown>; streak_count?: unknown; last_activity_date?: unknown; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Could not restore streak");
  return parseProgressJson(j);
}

export type ChallengePayload = {
  challenge_title: string;
  challenge_description: string;
  /** Set when row was created via user_task API. */
  user_created?: boolean;
  /** Legacy single field; prefer example_tasks */
  example_task?: string;
  /** Legacy single field; prefer benefits_list */
  benefits?: string;
  example_tasks?: string[];
  benefits_list?: string[];
  based_on_mindset: string;
  suitable_moods: string[];
  category?: string;
  difficulty?: string;
  points?: number;
  slot?: number;
};

function splitLegacyLines(text: string | undefined, max: number): string[] {
  const t = (text ?? "").trim();
  if (!t) return [];
  let parts = t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, max);
  parts = t
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, max);
  const sents = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sents.length >= 2) return sents.slice(0, max);
  return [t];
}

/** Up to three example lines for UI (new API or legacy). */
export function getChallengeExamples(p: ChallengePayload): string[] {
  if (Array.isArray(p.example_tasks) && p.example_tasks.length) {
    const xs = p.example_tasks.map((x) => String(x).trim()).filter(Boolean);
    if (xs.length) return xs.slice(0, 3);
  }
  return splitLegacyLines(p.example_task, 3);
}

/** Up to three benefit lines for UI (new API or legacy). */
export function getChallengeBenefits(p: ChallengePayload): string[] {
  if (Array.isArray(p.benefits_list) && p.benefits_list.length) {
    const xs = p.benefits_list.map((x) => String(x).trim()).filter(Boolean);
    if (xs.length) return xs.slice(0, 3);
  }
  return splitLegacyLines(p.benefits, 3);
}

export type ChallengeRow = {
  id: number;
  mood: string;
  category: string;
  difficulty: string;
  points: number;
  slot: number;
  challenge_date: string | null;
  payload: ChallengePayload;
  created_at: string;
  /** True when this row was created via POST user_task/ for this device. */
  user_created?: boolean;
};

export type ChallengesTodayResponse = {
  results: ChallengeRow[];
  detail?: string;
};

export async function fetchChallengesToday(deviceId?: string): Promise<ChallengesTodayResponse> {
  const q = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const r = await apiFetch(challengesApiUrl(`today/${q}`), { cache: "no-store" });
  const j = (await r.json()) as ChallengesTodayResponse;
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load missions");
  }
  return j;
}

export async function postUserCustomChallenge(
  deviceId: string,
  title: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<{ result: ChallengeRow }> {
  const r = await apiFetch(challengesApiUrl("user_task/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ device_id: deviceId, title: title.trim(), difficulty })
  });
  const j = (await r.json()) as { result?: ChallengeRow; detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Could not create mission");
  }
  if (!j.result) {
    throw new Error("Invalid response");
  }
  return { result: j.result };
}

export async function fetchChallengesRoot(): Promise<ChallengesTodayResponse> {
  const r = await apiFetch(challengesApiUrl(""), { cache: "no-store" });
  const j = (await r.json()) as ChallengesTodayResponse;
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load missions");
  }
  return j;
}

export async function postRegenerateDaily(force = true): Promise<ChallengesTodayResponse> {
  const r = await apiFetch(challengesApiUrl("generate_daily/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ force })
  });
  const j = (await r.json()) as ChallengesTodayResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Regenerate failed");
  }
  return j as ChallengesTodayResponse;
}

export async function postGeneratePair(category: string): Promise<ChallengesTodayResponse> {
  const r = await apiFetch(challengesApiUrl("generate_pair/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ category })
  });
  const j = (await r.json()) as ChallengesTodayResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Generate pair failed");
  }
  return j as ChallengesTodayResponse;
}

export type LeaderboardRow = {
  rank: number;
  user_id?: number | null;
  display_name: string;
  points_total: number;
  updated_at: string;
  avatar_url?: string;
};

export async function fetchLeaderboard(): Promise<{ results: LeaderboardRow[] }> {
  const r = await apiFetch(challengesApiUrl("leaderboard/"), { cache: "no-store" });
  const j = (await r.json()) as { results?: LeaderboardRow[] };
  if (!r.ok) {
    throw new Error("Leaderboard unavailable");
  }
  return { results: j.results ?? [] };
}

export async function syncLeaderboard(pointsTotal: number, displayName?: string): Promise<void> {
  await apiFetch(challengesApiUrl("leaderboard/sync/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({
      points_total: pointsTotal,
      display_name: displayName ?? "Anonymous"
    })
  });
}

export type MissionScoreResponse = {
  awarded_points: number;
  max_points: number;
  score_ratio: number;
  breakdown: {
    word_count: number;
    word_score: number;
    elapsed_seconds: number;
    target_seconds: number;
    time_score: number;
    relevance_score: number;
    unique_ratio: number;
    repetition_penalty: number;
    syndicate_bonus: number;
  };
};

export async function postScoreMissionResponse(args: {
  responseText: string;
  challengeTitle: string;
  difficulty: string;
  maxPoints: number;
  elapsedSeconds: number;
}): Promise<MissionScoreResponse> {
  const r = await apiFetch(challengesApiUrl("score_response/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({
      response_text: args.responseText.trim(),
      challenge_title: args.challengeTitle,
      difficulty: args.difficulty,
      max_points: args.maxPoints,
      elapsed_seconds: args.elapsedSeconds
    })
  });
  const j = (await r.json()) as MissionScoreResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Could not score mission response");
  }
  return j;
}

export type AdminTaskRow = {
  id: number;
  title: string;
  description: string;
  points_target: number;
  /** Visibility duration set by admin in Django admin panel. */
  visibility_hours?: number;
  /** Short admin hint shown near countdown on frontend. */
  admin_note?: string;
  image_url?: string;
  active: boolean;
  /** ISO datetime — task expires based on admin-set visibility hours. */
  created_at?: string;
  expires_at?: string;
  submission?: {
    status: "pending" | "reviewed" | "rejected";
    awarded_points: number;
    points_claimed: boolean;
    submitted_at: string;
    elapsed_seconds?: number;
    review_notes?: string;
    reviewed_at?: string | null;
    has_attachment?: boolean;
  } | null;
};

export async function fetchAdminTasksActive(deviceId: string): Promise<{ results: AdminTaskRow[] }> {
  const r = await apiFetch(challengesApiUrl(`admin_tasks/active/?device_id=${encodeURIComponent(deviceId)}`), { cache: "no-store" });
  const j = (await r.json()) as { results?: AdminTaskRow[]; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load admin tasks");
  return { results: j.results ?? [] };
}

export async function postAdminTaskSubmit(args: {
  deviceId: string;
  taskId: number;
  responseText: string;
  startedAtMs?: number;
  attachment?: File | null;
}): Promise<{ ok: boolean; status: string; message?: string; submitted_at?: string }> {
  const url = challengesApiUrl("admin_tasks/submit/");
  if (args.attachment) {
    const fd = new FormData();
    fd.append("device_id", args.deviceId);
    fd.append("task_id", String(args.taskId));
    fd.append("response_text", args.responseText);
    if (args.startedAtMs != null) fd.append("started_at_ms", String(args.startedAtMs));
    fd.append("attachment", args.attachment);
    const r = await apiFetch(url, { method: "POST", body: fd });
    const j = (await r.json()) as { ok?: boolean; status?: string; message?: string; detail?: string; submitted_at?: string };
    if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to submit task response");
    return { ok: !!j.ok, status: j.status ?? "pending", message: j.message, submitted_at: j.submitted_at };
  }
  const r = await apiFetch(url, {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({
      device_id: args.deviceId,
      task_id: args.taskId,
      response_text: args.responseText,
      started_at_ms: args.startedAtMs ?? null
    })
  });
  const j = (await r.json()) as { ok?: boolean; status?: string; message?: string; detail?: string; submitted_at?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to submit task response");
  return { ok: !!j.ok, status: j.status ?? "pending", message: j.message, submitted_at: j.submitted_at };
}

export async function postAdminTaskClaimPoints(deviceId: string): Promise<{ points_awarded: number; submission_ids: number[] }> {
  const r = await apiFetch(challengesApiUrl("admin_tasks/claim_points/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ device_id: deviceId })
  });
  const j = (await r.json()) as { points_awarded?: number; submission_ids?: number[]; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to claim admin task points");
  return { points_awarded: j.points_awarded ?? 0, submission_ids: j.submission_ids ?? [] };
}
