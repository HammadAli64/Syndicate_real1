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
  example_task: string;
  benefits: string;
  based_on_mindset: string;
  suitable_moods: string[];
  category?: string;
  difficulty?: string;
  points?: number;
  slot?: number;
};

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
