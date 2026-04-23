/**
 * Mood + category challenge generation — POST /api/challenges/generate/
 * Reuses the same API base as challengesApi.ts (NEXT_PUBLIC_SYNDICATE_API_URL).
 */
import { challengesApiUrl, ensureSyndicateSessionOrRedirect } from "./challengesApi";
import { getSyndicateAuthHeaders, getSyndicateAuthToken } from "@/lib/syndicateAuth";
import { syndicateUserStorageKey } from "@/lib/syndicateStorageKeys";

export type MoodId = "energetic" | "happy" | "tired";

export type MoodChallengeResult = {
  title: string;
  description: string;
  mood: string;
  category: string;
};
 
export type GenerateChallengesResponse = {
  results: MoodChallengeResult[];
  detail?: string;
};

function readSyndicateDeviceId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(syndicateUserStorageKey("device_id")) ?? undefined;
}

/** Two validated challenges for the given mood and category (requires ingested mindsets on the server). */
export async function generateChallenges(
  mood: MoodId | string,
  category: string,
  opts?: { deviceId?: string }
): Promise<GenerateChallengesResponse> {
  const deviceId = opts?.deviceId ?? readSyndicateDeviceId();
  const body: Record<string, string> = { mood: mood.trim(), category: category.trim() };
  if (deviceId) body.device_id = deviceId;
  const tokenBefore = getSyndicateAuthToken();
  const r = await fetch(challengesApiUrl("generate/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify(body)
  });
  ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
  const j = (await r.json()) as GenerateChallengesResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Generate failed");
  }
  return j;
}
