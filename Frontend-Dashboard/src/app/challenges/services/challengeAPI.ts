/**
 * Mood + category challenge generation — POST /api/challenges/generate/
 * Reuses the same API base as challengesApi.ts (NEXT_PUBLIC_SYNDICATE_API_URL).
 */
import { challengesApiUrl } from "./challengesApi";

export type MoodId = "energetic" | "happy" | "sad" | "tired";

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

/** Two validated challenges for the given mood and category (requires ingested mindsets on the server). */
export async function generateChallenges(
  mood: MoodId | string,
  category: string
): Promise<GenerateChallengesResponse> {
  const r = await fetch(challengesApiUrl("generate/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mood: mood.trim(), category: category.trim() })
  });
  const j = (await r.json()) as GenerateChallengesResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Generate failed");
  }
  return j;
}
