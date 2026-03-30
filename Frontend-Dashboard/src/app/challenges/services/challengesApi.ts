/**
 * Challenges API — base URL from existing env (single .env / NEXT_PUBLIC_SYNDICATE_API_URL).
 * All paths are under /api/challenges/ on the Django server.
 */
const API_BASE = (process.env.NEXT_PUBLIC_SYNDICATE_API_URL ?? "http://127.0.0.1:8000/api").replace(/\/$/, "");

export function challengesApiUrl(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE}/challenges/${p}`;
}

export type ChallengePayload = {
  challenge_title: string;
  challenge_description: string;
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
};

export type ChallengesTodayResponse = {
  results: ChallengeRow[];
  detail?: string;
};

export async function fetchChallengesToday(): Promise<ChallengesTodayResponse> {
  const r = await fetch(challengesApiUrl("today/"), { cache: "no-store" });
  const j = (await r.json()) as ChallengesTodayResponse;
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load challenges");
  }
  return j;
}

export async function fetchChallengesRoot(): Promise<ChallengesTodayResponse> {
  const r = await fetch(challengesApiUrl(""), { cache: "no-store" });
  const j = (await r.json()) as ChallengesTodayResponse;
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load challenges");
  }
  return j;
}

export async function postRegenerateDaily(force = true): Promise<ChallengesTodayResponse> {
  const r = await fetch(challengesApiUrl("generate_daily/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force })
  });
  const j = (await r.json()) as ChallengesTodayResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Regenerate failed");
  }
  return j as ChallengesTodayResponse;
}

export async function postGeneratePair(category: string): Promise<ChallengesTodayResponse> {
  const r = await fetch(challengesApiUrl("generate_pair/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  display_name: string;
  points_total: number;
  updated_at: string;
};

export async function fetchLeaderboard(): Promise<{ results: LeaderboardRow[] }> {
  const r = await fetch(challengesApiUrl("leaderboard/"), { cache: "no-store" });
  const j = (await r.json()) as { results?: LeaderboardRow[] };
  if (!r.ok) {
    throw new Error("Leaderboard unavailable");
  }
  return { results: j.results ?? [] };
}

export async function syncLeaderboard(
  deviceId: string,
  pointsTotal: number,
  displayName?: string
): Promise<void> {
  await fetch(challengesApiUrl("leaderboard/sync/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_id: deviceId,
      points_total: pointsTotal,
      display_name: displayName ?? "Anonymous"
    })
  });
}

export type AgentQuoteResponse = {
  quote: string;
  date: string;
  detail?: string;
};

/** AI-generated daily brief; cached server-side per calendar date. */
export async function fetchAgentQuote(): Promise<AgentQuoteResponse> {
  const r = await fetch(challengesApiUrl("agent_quote/"), { cache: "no-store" });
  const j = (await r.json()) as AgentQuoteResponse;
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Agent quote failed");
  }
  return j;
}
