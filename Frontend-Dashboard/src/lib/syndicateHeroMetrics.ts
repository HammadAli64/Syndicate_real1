/**
 * Live Syndicate Mode stats for the dashboard hero (points, rank tiers, mission board).
 * Milestone thresholds match `REWARD_MILESTONES` in SyndicateAiChallengePanel.
 */
import type { ChallengeRow } from "@/app/challenges/services/challengesApi";
import { syndicateUserStorageKey as ls } from "@/lib/syndicateStorageKeys";

const MISSION_BOARD_TTL_MS = 24 * 60 * 60 * 1000;

const REWARD_MILESTONES = [
  { unlock_points: 20, shortRank: "Bronze" },
  { unlock_points: 50, shortRank: "Silver" },
  { unlock_points: 100, shortRank: "Gold" },
  { unlock_points: 150, shortRank: "Blackcoin" },
  { unlock_points: 200, shortRank: "Elite" },
  { unlock_points: 350, shortRank: "Apex" }
] as const;

function clampPct(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function loadDoneIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(ls("completed_challenge_ids"));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

export function challengeIsDone(id: number): boolean {
  return loadDoneIds().has(id);
}

function loadMissionMissedLogCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(ls("mission_missed_log_v1"));
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function rowOnBoard(row: ChallengeRow, nowMs: number): boolean {
  const t = Date.parse(row.created_at);
  if (Number.isNaN(t)) return true;
  return nowMs - t < MISSION_BOARD_TTL_MS;
}

export function readSyndicatePointsTotal(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(ls("points_total"));
  const n = parseInt(raw || "0", 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function computeSyndicateRankFromPoints(pointsTotal: number) {
  const safe = Math.max(0, pointsTotal);
  let unlocked = 0;
  let rankLabel = "Recruit";
  for (const m of REWARD_MILESTONES) {
    if (safe >= m.unlock_points) {
      unlocked += 1;
      rankLabel = m.shortRank;
    }
  }
  const nextMilestone = REWARD_MILESTONES.find((m) => safe < m.unlock_points);
  const prevThreshold = unlocked === 0 ? 0 : REWARD_MILESTONES[unlocked - 1]!.unlock_points;
  let xpPct = 0;
  let pointsToNext: number | null = null;
  if (nextMilestone) {
    const span = Math.max(1, nextMilestone.unlock_points - prevThreshold);
    xpPct = clampPct(((safe - prevThreshold) / span) * 100);
    pointsToNext = Math.max(0, nextMilestone.unlock_points - safe);
  } else {
    xpPct = 100;
    pointsToNext = 0;
  }
  return {
    rankLabel,
    nextRankLabel: nextMilestone?.shortRank ?? "Peak",
    xpPct,
    syndicateLevel: unlocked,
    pointsToNext
  };
}

export type MissionBoardStats = {
  activeMissionCount: number;
  completedMissionsCount: number;
  pendingMissionsCount: number;
  activeMissionsPct: number;
  missedChallengesPct: number;
};

export function computeMissionBoardStats(rows: ChallengeRow[], nowMs: number): MissionBoardStats {
  const done = loadDoneIds();
  const onBoardRows = rows.filter((r) => rowOnBoard(r, nowMs));
  const totalOnBoard = onBoardRows.length;
  const completedOnBoard = onBoardRows.filter((r) => done.has(r.id)).length;
  const activeLive = onBoardRows.filter((r) => !done.has(r.id)).length;
  const activeMissionsPct = totalOnBoard > 0 ? clampPct((completedOnBoard / totalOnBoard) * 100) : 0;

  const missedCount = loadMissionMissedLogCount();
  const denom = Math.max(1, missedCount + completedOnBoard + activeLive);
  const missedChallengesPct = clampPct((missedCount / denom) * 100);

  return {
    activeMissionCount: activeLive,
    completedMissionsCount: completedOnBoard,
    pendingMissionsCount: activeLive,
    activeMissionsPct,
    missedChallengesPct
  };
}
