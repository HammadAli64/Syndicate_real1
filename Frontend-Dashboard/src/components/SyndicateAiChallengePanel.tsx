"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  challengesApiUrl,
  ensureSyndicateSessionOrRedirect,
  fetchAdminTasksActive,
  fetchChallengesTodayUntilComplete,
  fetchLeaderboard,
  fetchSyndicateProgress,
  getChallengeBenefits,
  getChallengeExamples,
  patchSyndicateProgress,
  postAdminTaskClaimPoints,
  postAdminTaskSubmit,
  postScoreMissionResponse,
  postSyndicateStreakRecord,
  postSyndicateStreakRestore,
  postUserCustomChallenge,
  SyndicateSessionLostError,
  syncLeaderboard,
  type AdminTaskRow,
  type LeaderboardRow,
  type MissionScoreResponse
} from "@/app/challenges/services/challengesApi";
import type { ChallengeRow } from "@/app/challenges/services/challengesApi";
import {
  getSyndicateAuthHeaders,
  getSyndicateAuthToken,
  getSyndicateProfileAvatarUrl,
  getSyndicateUser,
  logoutSyndicateSession
} from "@/lib/syndicateAuth";
import { applySyncedStateFromServer, collectSyncedState, onSyndicatePersist } from "@/lib/syndicateProgressSync";
import { getSyndicateApiBase } from "@/lib/syndicateApiBase";
import { syndicateUserStorageKey as ls } from "@/lib/syndicateStorageKeys";

const API_BASE = getSyndicateApiBase();

export type { ChallengeRow } from "@/app/challenges/services/challengesApi";

const CATEGORIES = ["business", "money", "fitness", "power", "grooming", "personal"] as const;

const CAT_LABEL: Record<string, string> = {
  business: "Business",
  money: "Money",
  fitness: "Fitness",
  power: "Power",
  grooming: "Grooming",
  personal: "Your mission"
};

/** Moods for Stats & profile filtering (matches API + challenge suitable_moods). */
const STATS_MOODS = ["energetic", "happy", "tired"] as const;

const STATS_MOOD_LABEL: Record<string, string> = {
  energetic: "Energetic",
  happy: "Happy",
  tired: "Tired"
};

const _MOOD_ORDER: Record<string, number> = { energetic: 0, happy: 1, tired: 2 };

function compareRowsByMoodThenSlot(a: ChallengeRow, b: ChallengeRow): number {
  const ma = (a.mood || "").toLowerCase();
  const mb = (b.mood || "").toLowerCase();
  const oa = ma in _MOOD_ORDER ? _MOOD_ORDER[ma] : 99;
  const ob = mb in _MOOD_ORDER ? _MOOD_ORDER[mb] : 99;
  if (oa !== ob) return oa - ob;
  return (a.slot || 0) - (b.slot || 0);
}

/**
 * Narrow hints for inferring a single bucket when `suitable_moods` does not name a mood explicitly.
 * Avoid generic words like "focus" or "positive" — they appeared in almost every row and made every mood match.
 */
const STATS_MOOD_HINTS_INFER: Record<(typeof STATS_MOODS)[number], string[]> = {
  energetic: ["energetic", "energy", "motivated", "drive", "active", "momentum", "upbeat", "vigor"],
  happy: ["happy", "joy", "grateful", "celebrate", "optimism", "uplift", "cheerful", "delight"],
  tired: ["tired", "rest", "relax", "recovery", "ease", "slow", "exhausted", "fatigue", "burnout", "comfort", "gentle", "healing", "empathy"]
};

/** Best-effort primary mood for a row when the dropdown filter is applied. */
function inferStatsMoodForRow(row: ChallengeRow): (typeof STATS_MOODS)[number] {
  const p = row.payload;
  const sm = Array.isArray(p?.suitable_moods) ? p.suitable_moods.map((x) => String(x).toLowerCase()) : [];
  for (const mk of STATS_MOODS) {
    if (sm.some((s) => moodTagEqualsFilter(s, mk))) return mk;
  }

  const text = [...sm, p?.challenge_title ?? "", p?.challenge_description ?? "", p?.based_on_mindset ?? ""]
    .join(" ")
    .toLowerCase();

  let best: (typeof STATS_MOODS)[number] = STATS_MOODS[0];
  let bestScore = -1;
  for (const mk of STATS_MOODS) {
    let sc = 0;
    for (const h of STATS_MOOD_HINTS_INFER[mk]) {
      if (text.includes(h)) sc += h.length;
    }
    if (sc > bestScore) {
      bestScore = sc;
      best = mk;
    }
  }
  return bestScore > 0 ? best : "energetic";
}

function isPrimaryStatsMood(s: string): s is (typeof STATS_MOODS)[number] {
  return (STATS_MOODS as readonly string[]).includes(s);
}

/** True if a mood tag equals the filter (exact match after trim); never use substring — "unhappy" must not match "happy". */
function moodTagEqualsFilter(tag: string, filterMood: string): boolean {
  const t = String(tag).toLowerCase().trim();
  const m = filterMood.toLowerCase();
  if (t === m) return true;
  for (const part of t.split(/[/|,]+/)) {
    if (part.trim() === m) return true;
  }
  return false;
}

/** Filter by mood: daily batches store exact mood on `row.mood` (one per category × mood). */
function challengeMatchesStatsMood(row: ChallengeRow, mood: string): boolean {
  const rowMood = (row.mood || "").toLowerCase();
  if (rowMood === "custom") return true;
  const m = mood.toLowerCase();
  if (rowMood === "sad") {
    return m === "tired";
  }

  if (isPrimaryStatsMood(rowMood)) {
    return rowMood === m;
  }

  const list = row.payload?.suitable_moods;
  const sm = Array.isArray(list) ? list.map((x) => String(x).toLowerCase()) : [];

  if (rowMood && rowMood !== "daily" && rowMood === m) return true;
  if (sm.some((s) => moodTagEqualsFilter(s, m))) return true;

  return inferStatsMoodForRow(row) === m;
}

/**
 * When multiple system rows share the same (category, mood) (legacy two-slot data), completing one
 * hides the other incomplete row. Single-slot batches never duplicate keys.
 */
function applyMoodCategoryPairHide(rows: ChallengeRow[], doneIds: Set<number>): ChallengeRow[] {
  const key = (r: ChallengeRow): string | null => {
    if (r.user_created) return null;
    const cat = (r.category || r.payload?.category || "").toLowerCase();
    const mood = (r.mood || "").toLowerCase();
    if (!cat || !mood || mood === "custom" || mood === "daily") return null;
    return `${cat}|${mood}`;
  };
  const byKey = new Map<string, ChallengeRow[]>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(r);
  }
  const hide = new Set<number>();
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    const done = group.filter((x) => doneIds.has(x.id));
    const undone = group.filter((x) => !doneIds.has(x.id));
    if (done.length >= 1 && undone.length >= 1) {
      for (const x of undone) hide.add(x.id);
    }
  }
  return rows.filter((r) => !hide.has(r.id));
}

/** One system mission per (category, primary mood); keeps lowest slot then lowest id (legacy double-slot rows). */
function dedupePrimaryMoodSystemRows(rows: ChallengeRow[]): ChallengeRow[] {
  const winners = new Map<string, ChallengeRow>();
  for (const r of rows) {
    if (r.user_created) continue;
    const cat = (r.category || r.payload?.category || "").toLowerCase();
    const mood = (r.mood || "").toLowerCase();
    if (!cat || !isPrimaryStatsMood(mood)) continue;
    const k = `${cat}|${mood}`;
    const prev = winners.get(k);
    if (!prev) {
      winners.set(k, r);
      continue;
    }
    const rs = r.slot ?? 1;
    const ps = prev.slot ?? 1;
    if (rs < ps || (rs === ps && r.id < prev.id)) winners.set(k, r);
  }
  return rows.filter((r) => {
    if (r.user_created) return true;
    const cat = (r.category || r.payload?.category || "").toLowerCase();
    const mood = (r.mood || "").toLowerCase();
    if (!cat || !isPrimaryStatsMood(mood)) return true;
    const w = winners.get(`${cat}|${mood}`);
    return w?.id === r.id;
  });
}

/** Distinct slices for pie (categories). */
const PIE_COLORS = ["#ffd54a", "#4fd1b8", "#7b9cff", "#ff7ab8", "#c792ea", "#ff9f43", "#00e5ff", "#69f0ae"];

/** One color per day in the weekly bar chart (7 bars). */
const WEEK_BAR_COLORS = ["#ff6b9d", "#ffd54a", "#4fd1b8", "#7b9cff", "#c792ea", "#ff9f43", "#69f0ae"];

/** Native `<select>`: colors from globals.css (`.syndicate-select--*`) so options stay legible on Windows. */
const SYNDICATE_SELECT_BASE =
  "syndicate-select syndicate-readable min-h-[40px] min-w-0 w-full max-w-full cursor-pointer rounded-lg px-3 py-2 text-[14px] font-medium outline-none transition focus:outline-none focus:ring-2 sm:w-auto sm:min-w-[132px] sm:max-w-none";

const SYNDICATE_SELECT_MOOD = `${SYNDICATE_SELECT_BASE} syndicate-select--mood focus:ring-[rgba(160,170,255,0.35)]`;

const SYNDICATE_SELECT_CATEGORY = `${SYNDICATE_SELECT_BASE} syndicate-select--category focus:ring-[rgba(255,215,0,0.28)]`;

const SYNDICATE_SELECT_STATUS = `${SYNDICATE_SELECT_BASE} syndicate-select--status focus:ring-[rgba(72,220,180,0.35)]`;

const SYNDICATE_DATE_INPUT =
  "syndicate-date-input syndicate-readable mt-1.5 block w-full rounded-lg border border-[rgba(255,215,0,0.4)] bg-[#0a0e14] px-3 py-2.5 text-[15px] font-medium text-white/95 outline-none focus:border-[rgba(255,215,0,0.7)] focus:ring-2 focus:ring-[rgba(255,215,0,0.12)]";
/** Max agent-generated missions completable per day (not how many appear on the board). */
const MAX_AGENT_COMPLETIONS_PER_DAY = 4;
const MAX_CUSTOM_COMPLETIONS_PER_DAY = 2;
const POINTS_PER_10_POUNDS = 100;
const POUNDS_PER_100_POINTS = 10;
const DEFAULT_PROFILE_NAME = "Operator";
const MAX_PROFILE_IMAGE_DATA_URL_CHARS = 350_000;
const MAX_PROFILE_IMAGE_URL_LEN = 2048;
const MAX_PROFILE_IMAGE_FILE_BYTES = 280 * 1024;

function isValidProfileImageValue(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  if (t.length > MAX_PROFILE_IMAGE_DATA_URL_CHARS) return false;
  if (t.startsWith("data:image/")) return true;
  if (t.length > MAX_PROFILE_IMAGE_URL_LEN) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function avatarFromSavedProfileImage(saved: string, fallback: string): string {
  const t = saved.trim();
  if (!t || !isValidProfileImageValue(t)) return fallback;
  return t;
}

/** Nav / secondary: dark gold frame — reads “arcade HUD”, not corporate blue chrome */
const GAME_BTN =
  "rounded-md border border-[rgba(255,215,0,0.42)] bg-[linear-gradient(180deg,rgba(42,32,12,0.96)_0%,rgba(14,10,6,0.98)_100%)] text-[#f5e6a8] [box-shadow:inset_0_1px_0_rgba(255,220,140,0.24),0_0_16px_rgba(255,160,0,0.1)] transition hover:brightness-110";
const GAME_BTN_NAV_IDLE =
  "border-white/18 text-white/62 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-[rgba(255,215,0,0.35)] hover:text-white/88";
const CTA_BTN =
  "rounded-md border border-[#fede00] bg-[linear-gradient(180deg,#fff06a_0%,#fede00_45%,#d5b900_100%)] text-black [box-shadow:inset_0_1px_0_rgba(255,250,180,0.92),inset_0_-2px_0_rgba(120,104,0,0.72),0_0_16px_rgba(254,222,0,0.48)] hover:brightness-110";
const HUD_LABEL = "text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--gold)]/48";
const HUD_VALUE = "mt-1 font-mono font-black text-[#fefce8]/94";

/** Files in `public/assets/rewards/` (spaces encoded for URLs). */
function rewardsPublicAsset(filename: string): string {
  return `/assets/rewards/${encodeURIComponent(filename)}`;
}

const REWARD_MILESTONES = [
  {
    id: "rw-20",
    unlock_points: 20,
    bonus_points: 5,
    title: "Bronze coin",
    image: rewardsPublicAsset("Screenshot 2026-04-02 173802.png")
  },
  {
    id: "rw-50",
    unlock_points: 50,
    bonus_points: 10,
    title: "Silver coin",
    image: rewardsPublicAsset("Screenshot 2026-04-02 173814.png")
  },
  {
    id: "rw-100",
    unlock_points: 100,
    bonus_points: 20,
    title: "Gold coin",
    image: rewardsPublicAsset("Screenshot 2026-04-02 173830.png")
  },
  {
    id: "rw-150",
    unlock_points: 150,
    bonus_points: 30,
    title: "Blackcoin",
    image: rewardsPublicAsset("Screenshot 2026-04-02 173840.png")
  },
  {
    id: "rw-200",
    unlock_points: 200,
    bonus_points: 50,
    title: "Lamborghini",
    image: rewardsPublicAsset("lambo.png")
  },
  {
    id: "rw-350",
    unlock_points: 350,
    bonus_points: 100,
    title: "Private jet",
    image: rewardsPublicAsset("jet.png")
  }
] as const;

type DayBucket = { total: number; byCategory: Record<string, number> };
type HistoryV1 = { days: Record<string, DayBucket> };

function loadHistory(): HistoryV1 {
  if (typeof window === "undefined") return { days: {} };
  try {
    const raw = window.localStorage.getItem(ls("points_history_v1"));
    if (!raw) return { days: {} };
    const p = JSON.parse(raw) as HistoryV1;
    if (!p.days || typeof p.days !== "object") return { days: {} };
    return p;
  } catch {
    return { days: {} };
  }
}

function saveHistory(h: HistoryV1) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("points_history_v1"), JSON.stringify(h));
  onSyndicatePersist();
}

function appendPointsForDay(iso: string, category: string, pts: number) {
  const h = loadHistory();
  if (!h.days[iso]) h.days[iso] = { total: 0, byCategory: {} };
  h.days[iso].total += pts;
  const k = category.toLowerCase();
  h.days[iso].byCategory[k] = (h.days[iso].byCategory[k] || 0) + pts;
  saveHistory(h);
}

type ChallengeDayV1 = {
  /** Calendar date (YYYY-MM-DD) → number of challenges completed that day (first-time submits). */
  completionsByDate: Record<string, number>;
  /** Calendar date → challenge count when that day’s list was loaded (best effort). */
  offeredByDate: Record<string, number>;
};

function loadChallengeDay(): ChallengeDayV1 {
  if (typeof window === "undefined") return { completionsByDate: {}, offeredByDate: {} };
  try {
    const raw = window.localStorage.getItem(ls("challenge_day_v1"));
    if (!raw) return { completionsByDate: {}, offeredByDate: {} };
    const p = JSON.parse(raw) as Partial<ChallengeDayV1>;
    return {
      completionsByDate: typeof p.completionsByDate === "object" && p.completionsByDate ? p.completionsByDate : {},
      offeredByDate: typeof p.offeredByDate === "object" && p.offeredByDate ? p.offeredByDate : {}
    };
  } catch {
    return { completionsByDate: {}, offeredByDate: {} };
  }
}

function saveChallengeDay(d: ChallengeDayV1) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("challenge_day_v1"), JSON.stringify(d));
  onSyndicatePersist();
}

/** Remember how many challenges were on the list for that calendar day (updates when the list loads). */
function recordOfferedSnapshot(iso: string, count: number) {
  if (!iso || count < 0) return;
  const d = loadChallengeDay();
  d.offeredByDate[iso] = count;
  saveChallengeDay(d);
}

/** Increment completed count for a calendar day (one increment per newly finished challenge). */
function recordCompletionForDay(iso: string) {
  const d = loadChallengeDay();
  d.completionsByDate[iso] = (d.completionsByDate[iso] ?? 0) + 1;
  saveChallengeDay(d);
}

function resetChallengeDayForDate(iso: string) {
  const d = loadChallengeDay();
  delete d.completionsByDate[iso];
  delete d.offeredByDate[iso];
  saveChallengeDay(d);
}

function calendarIsoFromRows(rows: ChallengeRow[]): string {
  if (!rows.length) return todayLocalISO();
  const cd = rows[0].challenge_date;
  if (cd == null || cd === "") return todayLocalISO();
  return String(cd).slice(0, 10);
}

function isoDateAddDays(iso: string, delta: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDatesFrom(todayIso: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(isoDateAddDays(todayIso, -i));
  }
  return out;
}

function shortWeekday(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()] ?? iso;
}

function aggregateCategoryTotals(h: HistoryV1): Record<string, number> {
  const out: Record<string, number> = {};
  for (const day of Object.values(h.days)) {
    for (const [k, v] of Object.entries(day.byCategory)) {
      out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SyndicateHelpTopic =
  | "custom-mission"
  | "hud-points"
  | "hud-streak"
  | "points-to-pounds"
  | "unlock"
  | "mega-mission";

function SyndicateHelpMark({
  topic,
  label,
  onOpen
}: {
  topic: SyndicateHelpTopic;
  label: string;
  onOpen: (t: SyndicateHelpTopic) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(topic)}
      aria-label={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-red-500/90 bg-red-950/80 text-[17px] font-black leading-none text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.45)] transition hover:border-red-400 hover:bg-red-900/90 hover:text-red-300 hover:shadow-[0_0_20px_rgba(248,113,113,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 sm:h-9 sm:w-9 sm:text-[19px]"
    >
      ?
    </button>
  );
}

function SyndicateHelpOverlay({ topic, onClose }: { topic: SyndicateHelpTopic; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const title =
    topic === "custom-mission"
      ? "Create your mission"
      : topic === "hud-points"
        ? "Points"
        : topic === "hud-streak"
          ? "Streak"
          : topic === "points-to-pounds"
            ? "Points to pounds"
            : topic === "unlock"
              ? "Unlock & redeem rewards"
              : "Mega mission";

  return (
    <div
      className="fixed inset-0 z-[180] flex items-end justify-center bg-black/75 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="syndicate-help-title"
      onClick={onClose}
    >
      <div
        className="syndicate-readable max-h-[min(80vh,32rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[rgba(255,215,0,0.35)] bg-[linear-gradient(180deg,rgba(24,18,10,0.98),rgba(8,6,4,0.99))] p-5 shadow-[0_0_40px_rgba(0,0,0,0.55)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="syndicate-help-title" className="text-left text-[18px] font-black uppercase tracking-[0.08em] text-[color:var(--gold)] sm:text-[20px]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-white/25 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div className="mt-4 space-y-3 text-left text-[15px] leading-relaxed text-white/88">
          {topic === "custom-mission" ? (
            <>
              <p>
                You can create up to <strong className="text-white">two custom missions per calendar day</strong>. Each needs a title (at least three characters) and a difficulty you choose.
              </p>
              <p>
                The server fills in points in the <strong className="text-white">0–9</strong> range, plus description, examples, and benefits, and stores a short mindset summary that can shape your next{" "}
                <strong className="text-white">custom missions</strong> and <strong className="text-white">mood + category</strong> picks.
              </p>
              <p>Finishing a custom mission uses the same daily completion limits as the main mission board.</p>
            </>
          ) : topic === "hud-points" ? (
            <>
              <p>
                <strong className="text-amber-100">Points</strong> are your <strong className="text-white">lifetime total</strong> earned from daily missions, mega-mission payouts when you claim them, and bonus points when you redeem tiers under Unlock &amp; redeem rewards.
              </p>
              <p>
                That total drives your <strong className="text-white">syndicate level</strong> (same point thresholds as the reward cards). You can spend part of your balance by converting to pounds in the <strong className="text-white">Points to pounds</strong> section—only if you have enough points for the amount you enter.
              </p>
            </>
          ) : topic === "hud-streak" ? (
            <>
              <p>
                <strong className="text-fuchsia-100">Streak</strong> is your <strong className="text-white">run of consecutive calendar days</strong> where you completed at least one qualifying mission. The server tracks your last activity date; starting a new day with a completion extends the count.
              </p>
              <p>If you miss a day, the streak can reset to zero. When you are inside the restore window, use <strong className="text-white">Restore streak</strong> on this card (referral invite or redeem a friend&apos;s code) to bring it back, as described in that block.</p>
            </>
          ) : topic === "points-to-pounds" ? (
            <>
              <p>
                You can <strong className="text-white">convert mission points into pounds</strong> at the rate on this screen ({POINTS_PER_10_POUNDS} points = £{POUNDS_PER_100_POINTS}). Enter how many points to convert and tap Convert; that amount is <strong className="text-white">deducted from your points total</strong> and the same value in pounds is added to your <strong className="text-white">pounds balance</strong> right away.
              </p>
              <p>
                Use your pounds balance for real value in the product: <strong className="text-white">you can unlock courses with these pounds</strong> (and any other paid unlocks your account offers). Because conversion lowers your points, keep enough points if you are still working toward the next Unlock &amp; redeem tier.
              </p>
            </>
          ) : topic === "unlock" ? (
            <>
              <p>
                Rewards redeem <strong className="text-white">in order</strong>: Level 1, then 2, then 3, and so on. You must redeem the previous tier before the next one can be redeemed, even if you already have enough points.
              </p>
              <p>
                Each card shows the <strong className="text-white">points threshold</strong> for that tier and the <strong className="text-white">bonus points</strong> you get when you redeem. Redeeming adds those bonus points to your total.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-white">Mega mission</strong> is the bonus track: tasks published by admins show up here, often with a visible time limit from when they were posted.
              </p>
              <p>
                You submit a <strong className="text-white">written response</strong> and can attach a file or recording where the form allows. Staff review submissions in admin; you get <strong className="text-white">one submission per device per task</strong>.
              </p>
              <p>After approval, use <strong className="text-white">Claim reviewed points</strong> on that task to receive the payout—this pipeline is separate from your daily syndicate missions.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Scroll the dashboard shell and window so mission detail opens at the top (not the list bottom). */
function scrollSyndicateShellToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll("[data-syndicate-scroll-root]").forEach((el) => {
    (el as HTMLElement).scrollTop = 0;
  });
}

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(ls("device_id"));
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ls("device_id"), id);
  }
  return id;
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

function loadTotalPoints(): number {
  if (typeof window === "undefined") return 0;
  const n = parseInt(window.localStorage.getItem(ls("points_total")) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

function loadResponses(): Record<number, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("challenge_responses"));
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, string>;
  } catch {
    return {};
  }
}

function persistDone(ids: Set<number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("completed_challenge_ids"), JSON.stringify([...ids]));
  onSyndicatePersist();
}

function persistPoints(n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("points_total"), String(n));
  onSyndicatePersist();
}

function persistResponses(r: Record<number, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("challenge_responses"), JSON.stringify(r));
  onSyndicatePersist();
}

function loadMissionStartTimes(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("mission_started_at_v1"));
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, number>;
  } catch {
    return {};
  }
}

function persistMissionStartTimes(map: Record<number, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("mission_started_at_v1"), JSON.stringify(map));
  onSyndicatePersist();
}

function loadRedeemedRewards(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(ls("redeemed_rewards_v1"));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistRedeemedRewards(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("redeemed_rewards_v1"), JSON.stringify([...ids]));
  onSyndicatePersist();
}

function loadPoundsBalance(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(ls("pounds_balance_v1")) || "0";
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function persistPoundsBalance(v: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("pounds_balance_v1"), String(Math.max(0, v)));
  onSyndicatePersist();
}

function loadMissionScores(): Record<number, MissionScoreResponse> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("mission_scores_v1"));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MissionScoreResponse>;
    const out: Record<number, MissionScoreResponse> = {};
    for (const [k, v] of Object.entries(parsed || {})) {
      const id = parseInt(k, 10);
      if (Number.isFinite(id) && v && typeof v === "object") out[id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function persistMissionScores(map: Record<number, MissionScoreResponse>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("mission_scores_v1"), JSON.stringify(map));
  onSyndicatePersist();
}

function loadMissionAwardedPoints(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("mission_awarded_points_v1"));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const out: Record<number, number> = {};
    for (const [k, v] of Object.entries(parsed || {})) {
      const id = parseInt(k, 10);
      if (Number.isFinite(id) && Number.isFinite(v)) out[id] = Number(v);
    }
    return out;
  } catch {
    return {};
  }
}

function persistMissionAwardedPoints(map: Record<number, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("mission_awarded_points_v1"), JSON.stringify(map));
  onSyndicatePersist();
}

/** e.g. 264 → "4m 24s", 3725 → "1h 2m 5s" */
function formatDurationReadable(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (rs > 0 || parts.length === 0) parts.push(`${rs}s`);
  return parts.join(" ");
}

/** Plain language for popups, e.g. 264 → "4 minutes and 24 seconds". */
function formatDurationForPopup(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  const parts: string[] = [];
  if (h === 1) parts.push("1 hour");
  else if (h > 1) parts.push(`${h} hours`);
  if (m === 1) parts.push("1 minute");
  else if (m > 1) parts.push(`${m} minutes`);
  if (rs === 1) parts.push("1 second");
  else if (rs > 0 || parts.length === 0) parts.push(`${rs} seconds`);
  if (parts.length <= 1) return parts[0] ?? "0 seconds";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function startOfLocalDayMs(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function secondsUntilLocalMidnight(nowMs: number): number {
  const d = new Date(nowMs);
  const next = new Date(d);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((next.getTime() - nowMs) / 1000));
}

function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(rs).padStart(2, "0")}`;
}

function friendlyAdminTaskError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (!msg) return "Admin tasks are temporarily unavailable.";
  if (msg.toLowerCase().includes("unexpected token")) {
    return "Admin tasks endpoint is unavailable right now. Please try again later.";
  }
  return msg;
}

function withinRestoreWindow(): boolean {
  if (typeof window === "undefined") return false;
  const br = window.localStorage.getItem(ls("streak_break_date"));
  if (!br) return false;
  const start = new Date(br + "T12:00:00");
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + 7);
  return new Date() <= deadline;
}

function restoreDaysLeft(): number {
  if (typeof window === "undefined") return 0;
  const br = window.localStorage.getItem(ls("streak_break_date"));
  if (!br) return 0;
  const start = new Date(br + "T12:00:00");
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + 7);
  const ms = deadline.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / 86400000));
}

function difficultyStyle(d: string) {
  const x = d.toLowerCase();
  if (x === "easy") return "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
  if (x === "hard") return "border-rose-500/50 bg-rose-500/10 text-rose-200";
  return "border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.08)] text-[color:var(--gold)]";
}

function CompactCard({
  row,
  done,
  dayCountdownSec,
  onView,
}: {
  row: ChallengeRow;
  done: boolean;
  dayCountdownSec: number;
  onView: () => void;
}) {
  const p = row.payload;
  const title = p?.challenge_title ?? "Mission";
  const pts = row.points ?? p?.points ?? 0;

  return (
    <div className="syndicate-readable relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-lg border border-[rgba(0,255,255,0.28)] bg-[linear-gradient(160deg,rgba(4,14,24,0.92),rgba(0,0,0,0.84)_52%,rgba(40,12,56,0.72))] p-4 [box-shadow:0_0_0_1px_rgba(255,215,0,0.2),0_0_26px_rgba(0,255,255,0.12)] sm:min-h-[240px] sm:p-5">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_4px)]" />
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded border border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.08)] px-2.5 py-0.5 text-[11px] font-bold tabular-nums uppercase tracking-wide text-[color:var(--gold)]">
            {pts} pts
          </span>
          <span className="rounded border border-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/75">
            Mood: {row.mood || "daily"}
          </span>
          {row.user_created ? (
            <span className="rounded border border-[rgba(120,200,255,0.45)] bg-[rgba(0,80,120,0.25)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a8d8ff]">
              Yours
            </span>
          ) : null}
          {done ? (
            <span className="rounded border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              Complete
            </span>
          ) : (
            <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
              Incomplete
            </span>
          )}
          {!done ? (
            <span className="rounded border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
              {formatCountdown(dayCountdownSec)}
            </span>
          ) : null}
        </div>
        <h4 className="min-h-[3.25rem] text-[17px] font-semibold leading-[1.32] tracking-tight text-white [text-shadow:0_0_18px_rgba(120,200,255,0.2)] sm:min-h-[4.5rem] sm:text-[19px] md:min-h-[5.25rem] md:text-[21px] lg:min-h-[5.75rem] lg:text-[23px] lg:leading-[1.3] xl:text-[24px]">
          {title}
        </h4>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={onView}
          className={cn(
            "syndicate-readable min-h-[44px] w-full touch-manipulation py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] transition sm:min-h-0",
            CTA_BTN
          )}
        >
          View mission
        </button>
      </div>
    </div>
  );
}

function DetailPane({
  row,
  initialResponse,
  submitting,
  scorePreview,
  awardedPoints,
  submitDisabled,
  submitLockedMessage,
  nowMs,
  done,
  /** Wall-clock ms when user opened this mission (detail); used for elapsed scoring. */
  taskTimerStartMs,
  onBack,
  onSubmit,
  onLogout
}: {
  row: ChallengeRow;
  initialResponse: string;
  submitting?: boolean;
  scorePreview?: MissionScoreResponse | null;
  awardedPoints?: number | null;
  submitDisabled?: boolean;
  submitLockedMessage?: string | null;
  nowMs: number;
  done?: boolean;
  taskTimerStartMs?: number | null;
  onBack: () => void;
  onSubmit: (text: string) => Promise<void>;
  onLogout?: () => void;
}) {
  const p = row.payload;
  const [text, setText] = useState(initialResponse);
  const examples = getChallengeExamples(p);
  const benefits = getChallengeBenefits(p);
  const readOnlyCompleted = !!done;
  const missionElapsedSec =
    !done && taskTimerStartMs != null && taskTimerStartMs > 0
      ? Math.max(0, Math.floor((nowMs - taskTimerStartMs) / 1000))
      : 0;

  useEffect(() => {
    setText(initialResponse);
  }, [initialResponse, row.id]);
  const remainingSec = secondsUntilLocalMidnight(nowMs);

  return (
    <div
      id="syndicate-mission-detail-top"
      className="syndicate-readable syndicate-detail-pane mx-auto w-full min-w-0 max-w-[min(100%,48rem)] scroll-mt-24 px-2 sm:px-3 md:px-4"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[14px] font-semibold text-[color:var(--gold)] underline-offset-4 hover:underline"
        >
          ← Back to missions
        </button>
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="text-[13px] font-semibold uppercase tracking-wide text-red-400 underline-offset-4 transition hover:text-red-300 hover:underline"
          >
            Log out
          </button>
        ) : null}
      </div>
      <div className="rounded-lg border border-[rgba(0,255,255,0.3)] bg-[linear-gradient(165deg,rgba(5,14,24,0.94),rgba(0,0,0,0.84)_52%,rgba(46,10,58,0.64))] p-4 [box-shadow:0_0_0_1px_rgba(255,215,0,0.2),0_0_28px_rgba(0,255,255,0.1)] sm:p-6 md:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded border border-white/25 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-tight tracking-wide text-white/80 sm:text-[10px]">
            {row.category}
          </span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]",
              difficultyStyle(row.difficulty)
            )}
          >
            {row.difficulty} · {row.points} pts
          </span>
          {!done ? (
            <span
              className="rounded border border-cyan-400/40 bg-cyan-500/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums tracking-wide text-cyan-200/95 sm:text-[10px]"
              title="Time until local midnight (daily mission window)"
            >
              {formatCountdown(remainingSec)}
            </span>
          ) : null}
        </div>
        {!done && taskTimerStartMs != null ? (
          <div
            className="mb-3 w-full max-w-[min(24rem,100%)] rounded-md border border-[rgba(255,215,0,0.5)] bg-[rgba(255,215,0,0.08)] px-2.5 py-2 sm:px-3 sm:py-2"
            title="Mission and daily window timers"
          >
            <p className="syndicate-nav-headline text-[clamp(0.82rem,2.9vw,1.05rem)] leading-tight sm:text-[clamp(0.88rem,2.4vw,1.15rem)] md:text-[clamp(0.95rem,2vw,1.2rem)]">
              Your mission has started
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-mono text-[clamp(0.95rem,2.8vw,1.35rem)] font-black tabular-nums leading-none text-[color:var(--gold)] sm:text-[clamp(1.05rem,2.2vw,1.5rem)]">
              <span className="text-[color:var(--gold)]/95" title="Elapsed since you first opened this mission (used for scoring)">
                {formatDurationReadable(missionElapsedSec)}
              </span>
            </div>
          </div>
        ) : null}
        {!done && taskTimerStartMs != null ? (
          <p className="mb-3 text-[11px] font-medium leading-snug text-white/60 sm:text-[12px]">
            Time counts <span className="text-white/75">since you first opened</span> this mission (not the time of day). Going back and opening again does not reset it.
            Faster completion can improve your score.
          </p>
        ) : null}
        <h3 className="text-[19px] font-bold leading-[1.2] tracking-tight text-white sm:text-[23px] md:text-[27px] md:leading-[1.15]">
          {p.challenge_title}
        </h3>

        <section className="mt-6">
          <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]/85">About this mission</h4>
          <p className="mt-3 text-[16px] leading-[1.65] text-white/92 antialiased md:text-[17px] md:leading-[1.7]">
            {p.challenge_description}
          </p>
        </section>

        <section className="mt-7">
          <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]/85">Examples</h4>
          {examples.length ? (
            <ul className="mt-3 list-none space-y-3">
              {examples.map((line, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/90 antialiased md:text-[16px]">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(255,215,0,0.5)] text-[12px] font-bold text-[color:var(--gold)]">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] text-white/55">No examples listed for this mission.</p>
          )}
        </section>

        <section className="mt-7">
          <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]/85">Benefits</h4>
          {benefits.length ? (
            <ul className="mt-3 list-none space-y-3">
              {benefits.map((line, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/90 antialiased md:text-[16px]">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--gold)]/80" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] text-white/55">No benefits listed for this mission.</p>
          )}
        </section>

        <p className="mt-7 text-[15px] leading-relaxed text-white/70">
          <span className="text-white/50">Mindset: </span>
          <span className="text-[color:var(--gold)]/95">{p.based_on_mindset}</span>
        </p>

        <div className="mt-8 border-t border-white/10 pt-5">
          <label className="mb-2 block text-[13px] font-semibold text-white/80" htmlFor="mission-response">
            {readOnlyCompleted ? "Your submitted response" : "Your response"}
          </label>
          {readOnlyCompleted ? (
            text.trim() ? (
              <div className="syndicate-readable rounded-md border border-[rgba(255,215,0,0.35)] bg-black/60 px-3 py-2.5 text-[15px] leading-relaxed text-white/95">
                {text}
              </div>
            ) : (
              <p className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-[13px] text-white/65">
                No response was submitted for this completed mission.
              </p>
            )
          ) : (
            <>
              <textarea
                id="mission-response"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Write how you will complete this mission or what you learned…"
                className="syndicate-readable min-h-[140px] w-full resize-y rounded-md border border-[rgba(255,215,0,0.35)] bg-black/60 px-3 py-3 text-[16px] leading-relaxed text-white/95 outline-none placeholder:text-white/35 focus:border-[rgba(255,215,0,0.65)] sm:min-h-[120px] sm:text-[15px]"
              />
              <button
                type="button"
                disabled={!text.trim() || submitting || submitDisabled}
                onClick={() => void onSubmit(text.trim())}
                className={cn(
                  "syndicate-readable mt-3 px-5 py-2.5 text-[15px] font-bold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-40",
                  CTA_BTN
                )}
              >
                {submitting ? "Scoring..." : "Submit completion"}
              </button>
            </>
          )}
          {submitLockedMessage ? <p className="mt-2 text-[12px] text-rose-200/90">{submitLockedMessage}</p> : null}
          {awardedPoints !== null && awardedPoints !== undefined ? (
            <>
              <p className="mt-2 rounded-md border border-emerald-300/45 bg-emerald-500/10 px-3 py-2 text-[13px] font-bold text-emerald-100">
                You earned <span className="text-[16px] font-black">+{awardedPoints}</span> points.
              </p>
            </>
          ) : null}
          {readOnlyCompleted && (awardedPoints === null || awardedPoints === undefined) ? (
            <p className="mt-2 text-[12px] text-white/60">Points record is unavailable for this older completed mission.</p>
          ) : null}
          {scorePreview ? (
            <>
              <p className="mt-2 text-[12px] leading-relaxed text-white/70">
                Score: <span className="font-semibold text-[color:var(--gold)]">{scorePreview.awarded_points}</span> /{" "}
                {scorePreview.max_points} points · Words: {scorePreview.breakdown.word_count} · Time:{" "}
                <span className="font-medium text-white/85">
                  {formatDurationReadable(scorePreview.breakdown.elapsed_seconds)}
                </span>{" "}
                ({scorePreview.breakdown.elapsed_seconds}s) · Relevance:{" "}
                {Math.round(scorePreview.breakdown.relevance_score * 100)}%
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SyndicateAiChallengePanel() {
  const router = useRouter();
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>("load");
  /** True while today/ API reports incremental generation still running (partial rows may not match filters yet). */
  const [dailyBatchStreaming, setDailyBatchStreaming] = useState(false);
  const [selected, setSelected] = useState<ChallengeRow | null>(null);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<number>>(() => new Set());
  const [streak, setStreak] = useState(0);
  /** Server `last_activity_date` (YYYY-MM-DD); first mission completion of the day triggers streak_record. */
  const [lastActivityIso, setLastActivityIso] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<"all" | (typeof CATEGORIES)[number]>("all");
  const [doneFilter, setDoneFilter] = useState<"all" | "complete" | "incomplete">("incomplete");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [canClaimRestore, setCanClaimRestore] = useState(false);
  const [referralMsg, setReferralMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  /** Inline stats + profile panel (not a modal). */
  const [showStatsProfile, setShowStatsProfile] = useState(false);
  const [syndicateView, setSyndicateView] = useState<"dashboard" | "challenges">("dashboard");
  /** Filter missions inside Stats & profile by mood (default: energetic). */
  const [statsMood, setStatsMood] = useState<string>("energetic");
  const [customTitle, setCustomTitle] = useState("");
  const [customDifficulty, setCustomDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [profileName, setProfileName] = useState(DEFAULT_PROFILE_NAME);
  const [profileImageSaved, setProfileImageSaved] = useState("");
  const [profileImageDraft, setProfileImageDraft] = useState("");
  const [profileSettingsMsg, setProfileSettingsMsg] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leaderboardErr, setLeaderboardErr] = useState<string | null>(null);
  const [challengeLogVersion, setChallengeLogVersion] = useState(0);
  const [historyFilterDate, setHistoryFilterDate] = useState(() => todayLocalISO());
  const [missionStartMap, setMissionStartMap] = useState<Record<number, number>>({});
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [submitBusy, setSubmitBusy] = useState(false);
  const [lastScore, setLastScore] = useState<MissionScoreResponse | null>(null);
  const [missionScores, setMissionScores] = useState<Record<number, MissionScoreResponse>>({});
  const [missionAwardedMap, setMissionAwardedMap] = useState<Record<number, number>>({});
  const [missionCompleteToast, setMissionCompleteToast] = useState<{
    title: string;
    points: number;
    elapsedSeconds: number;
  } | null>(null);
  const [redeemedRewards, setRedeemedRewards] = useState<Set<string>>(() => new Set());
  const [syndicateHelpPanel, setSyndicateHelpPanel] = useState<SyndicateHelpTopic | null>(null);
  const [adminTasks, setAdminTasks] = useState<AdminTaskRow[]>([]);
  const [adminTaskDrafts, setAdminTaskDrafts] = useState<Record<number, string>>({});
  const [adminTaskFiles, setAdminTaskFiles] = useState<Record<number, File | null>>({});
  const [adminTaskRecording, setAdminTaskRecording] = useState<Record<number, boolean>>({});
  const [adminTaskBusyId, setAdminTaskBusyId] = useState<number | null>(null);
  const [adminTaskMsg, setAdminTaskMsg] = useState<string | null>(null);
  /** Client start time (ms) when a bonus task becomes available — sent as `started_at_ms` so admin sees elapsed time. */
  const [adminTaskStartedAtMs, setAdminTaskStartedAtMs] = useState<Record<number, number>>({});
  const [poundsBalance, setPoundsBalance] = useState(0);
  const [convertPointsInput, setConvertPointsInput] = useState("100");
  const lineGradientUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const lastSeenDayRef = useRef<string>(todayLocalISO());
  const bonusMissionSectionRef = useRef<HTMLElement | null>(null);
  const streakRestoreSectionRef = useRef<HTMLDivElement | null>(null);
  const initialLoadOnceRef = useRef(false);
  /** After a 401 on bonus-task polling, stop hitting the endpoint until remount (avoids log spam / useless requests). */
  const adminTasksPollPausedRef = useRef(false);
  const adminTaskRecorderRef = useRef<Record<number, MediaRecorder | null>>({});
  const adminTaskStreamRef = useRef<Record<number, MediaStream | null>>({});
  const adminTaskChunksRef = useRef<Record<number, BlobPart[]>>({});

  const handleSyndicateLogout = useCallback(() => {
    void fetch(`${API_BASE}/auth/logout/`, {
      method: "POST",
      headers: getSyndicateAuthHeaders(true),
      body: "{}"
    }).catch(() => null).finally(() => {
      logoutSyndicateSession();
      router.replace("/syndicate/login?next=/");
    });
  }, [router]);

  const saveProfile = useCallback(() => {
    const accountEmail = getSyndicateUser()?.email?.trim() || "";
    const n = profileName.trim() || accountEmail || "Anonymous";
    const img = profileImageDraft.trim();
    if (img && !isValidProfileImageValue(img)) {
      setProfileSettingsMsg("Use an https image link, or upload a smaller image (under 280 KB).");
      return;
    }
    setProfileSettingsMsg(null);
    window.localStorage.setItem(ls("display_name"), n);
    setProfileName(n);
    if (img) {
      window.localStorage.setItem(ls("profile_image_url"), img);
      setProfileImageSaved(img);
    } else {
      window.localStorage.removeItem(ls("profile_image_url"));
      setProfileImageSaved("");
    }
    onSyndicatePersist();
    void syncLeaderboard(pointsTotal, n);
    setShowStatsProfile(false);
    setSyndicateView("dashboard");
    scrollSyndicateShellToTop();
  }, [profileName, profileImageDraft, pointsTotal]);

  const clearProfilePhoto = useCallback(() => {
    setProfileSettingsMsg(null);
    setProfileImageDraft("");
    setProfileImageSaved("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ls("profile_image_url"));
    }
    onSyndicatePersist();
  }, []);

  const onProfileImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_PROFILE_IMAGE_FILE_BYTES) {
      setProfileSettingsMsg("Choose an image under 280 KB, or paste an image URL.");
      e.target.value = "";
      return;
    }
    setProfileSettingsMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      if (data.length > MAX_PROFILE_IMAGE_DATA_URL_CHARS) {
        setProfileSettingsMsg("That image is too large. Try a smaller file or a URL.");
        return;
      }
      setProfileImageDraft(data);
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let res = await fetchSyndicateProgress();
        if (cancelled) return;
        if (Object.keys(res.state ?? {}).length > 0) {
          applySyncedStateFromServer(res.state);
        } else {
          const local = collectSyncedState();
          if (Object.keys(local).length > 0) {
            res = await patchSyndicateProgress(local);
            applySyncedStateFromServer(res.state);
          }
        }
        if (!cancelled) {
          setStreak(res.streak_count);
          setLastActivityIso(res.last_activity_date);
        }
      } catch {
        /* offline / network — keep namespaced localStorage */
      }
      if (cancelled) return;
      setMounted(true);
      setPointsTotal(loadTotalPoints());
      setDoneIds(loadDoneIds());
      setMissionStartMap(loadMissionStartTimes());
      setMissionScores(loadMissionScores());
      setMissionAwardedMap(loadMissionAwardedPoints());
      setRedeemedRewards(loadRedeemedRewards());
      setPoundsBalance(loadPoundsBalance());
      if (typeof window !== "undefined") {
        const savedName = window.localStorage.getItem(ls("display_name"));
        const sessionUser = getSyndicateUser();
        const accountEmail = (sessionUser?.email || "").trim();
        const nextName = (savedName || accountEmail || DEFAULT_PROFILE_NAME).trim() || DEFAULT_PROFILE_NAME;
        setProfileName(nextName);
        if (!savedName && accountEmail) {
          window.localStorage.setItem(ls("display_name"), nextName);
          onSyndicatePersist();
        }
        const imgRaw = window.localStorage.getItem(ls("profile_image_url")) || "";
        setProfileImageSaved(imgRaw);
        setProfileImageDraft(imgRaw);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    return () => {
      const recs = adminTaskRecorderRef.current;
      const streams = adminTaskStreamRef.current;
      for (const rec of Object.values(recs)) {
        try {
          rec?.state !== "inactive" && rec?.stop();
        } catch {
          /* ignore */
        }
      }
      for (const stream of Object.values(streams)) {
        try {
          stream?.getTracks().forEach((tr) => tr.stop());
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const visibleAdminTasks = useMemo(() => {
    return adminTasks.filter((t) => {
      if (!t.expires_at) return true;
      return new Date(t.expires_at).getTime() > nowTick;
    });
  }, [adminTasks, nowTick]);

  const dashboardAvatarUrl = useMemo(
    () => avatarFromSavedProfileImage(profileImageSaved, getSyndicateProfileAvatarUrl()),
    [profileImageSaved]
  );

  const profilePreviewAvatarUrl = useMemo(() => {
    const d = profileImageDraft.trim();
    if (d && isValidProfileImageValue(d)) return d;
    return avatarFromSavedProfileImage(profileImageSaved, getSyndicateProfileAvatarUrl());
  }, [profileImageDraft, profileImageSaved]);

  useEffect(() => {
    setAdminTaskStartedAtMs((prev) => {
      const next = { ...prev };
      for (const t of adminTasks) {
        if (!t.submission && next[t.id] == null) {
          next[t.id] = Date.now();
        }
      }
      return next;
    });
  }, [adminTasks]);

  const hasActionableBonusMission = useMemo(
    () => visibleAdminTasks.some((t) => t.submission == null),
    [visibleAdminTasks]
  );

  const goToBonusMissions = useCallback(() => {
    setSyndicateView("dashboard");
    window.setTimeout(() => {
      bonusMissionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const pieDailyData = useMemo(() => {
    const today = todayLocalISO();
    const h = loadHistory();
    const day = h.days[today];
    return CATEGORIES.map((c, i) => ({
      name: CAT_LABEL[c] ?? c,
      value: day?.byCategory[c] ?? 0,
      fill: PIE_COLORS[i % PIE_COLORS.length]
    }));
  }, [pointsTotal]);

  /** Lifetime points per category — used on main Syndicate dashboard pie. */
  const pieLifetimeCategoryData = useMemo(() => {
    const h = loadHistory();
    const totals: Record<string, number> = {};
    for (const c of CATEGORIES) totals[c] = 0;
    for (const day of Object.values(h.days)) {
      for (const [k, v] of Object.entries(day.byCategory)) {
        if (CATEGORIES.includes(k as (typeof CATEGORIES)[number])) {
          totals[k] = (totals[k] ?? 0) + (typeof v === "number" ? v : 0);
        }
      }
    }
    return CATEGORIES.map((c, i) => ({
      name: CAT_LABEL[c] ?? c,
      value: totals[c] ?? 0,
      fill: PIE_COLORS[i % PIE_COLORS.length]
    }));
  }, [pointsTotal]);

  /**
   * Same gates as reward cards: Level 0 until 20 pts, then Level 1; 50 → 2; 100 → 3; … (not 100 pts per level).
   */
  const syndicateProgressHud = useMemo(() => {
    const safePts = Math.max(0, pointsTotal);
    let syndicateLevel = 0;
    for (const m of REWARD_MILESTONES) {
      if (safePts >= m.unlock_points) syndicateLevel += 1;
      else break;
    }
    const nextMilestone = REWARD_MILESTONES.find((m) => safePts < m.unlock_points);
    const atMaxTier = !nextMilestone;
    const ptsToNextLevel = nextMilestone ? Math.max(0, nextMilestone.unlock_points - safePts) : 0;
    const nextLevelNumber = nextMilestone
      ? REWARD_MILESTONES.findIndex((m) => m.id === nextMilestone.id) + 1
      : null;
    const nextTierTotalPoints = nextMilestone?.unlock_points ?? null;
    return { syndicateLevel, ptsToNextLevel, nextLevelNumber, atMaxTier, nextTierTotalPoints };
  }, [pointsTotal]);

  const weeklyBarData = useMemo(() => {
    const today = todayLocalISO();
    const h = loadHistory();
    return lastNDatesFrom(today, 7).map((iso, i) => ({
      name: shortWeekday(iso),
      points: h.days[iso]?.total ?? 0,
      fill: WEEK_BAR_COLORS[i % WEEK_BAR_COLORS.length]
    }));
  }, [pointsTotal]);

  const monthlyLineData = useMemo(() => {
    const today = todayLocalISO();
    const h = loadHistory();
    return lastNDatesFrom(today, 30).map((iso) => ({
      name: iso.slice(5),
      points: h.days[iso]?.total ?? 0
    }));
  }, [pointsTotal]);

  const bestWorst = useMemo(() => {
    const totals = aggregateCategoryTotals(loadHistory());
    let best: { cat: string; pts: number } | null = null;
    let worst: { cat: string; pts: number } | null = null;
    for (const c of CATEGORIES) {
      const pts = totals[c] ?? 0;
      if (!best || pts > best.pts) best = { cat: c, pts };
      if (!worst || pts < worst.pts) worst = { cat: c, pts };
    }
    return { best, worst, totals };
  }, [pointsTotal]);

  const todayPointsFromHistory = useMemo(() => {
    const h = loadHistory();
    return h.days[todayLocalISO()]?.total ?? 0;
  }, [pointsTotal]);

  const dashboardBestCategoryLabel = useMemo(() => {
    const sum = CATEGORIES.reduce((s, c) => s + (bestWorst.totals[c] ?? 0), 0);
    if (sum === 0 || !bestWorst.best) return "—";
    return CAT_LABEL[bestWorst.best.cat] ?? bestWorst.best.cat;
  }, [bestWorst, pointsTotal]);

  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(() => {
      const email = getSyndicateUser()?.email?.trim() || "";
      void syncLeaderboard(pointsTotal, profileName.trim() || email || "Anonymous").catch(() => {
        /* offline */
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, [mounted, pointsTotal, profileName]);

  useEffect(() => {
    if (!showStatsProfile) return;
    setLeaderboardErr(null);
    void fetchLeaderboard()
      .then((r) => setLeaderboard(r.results))
      .catch(() => setLeaderboardErr("Could not load leaderboard."));
  }, [showStatsProfile]);

  const pollReferral = useCallback(async () => {
    const device = getDeviceId();
    const tokenBefore = getSyndicateAuthToken();
    try {
      const r = await fetch(challengesApiUrl(`referral/status/?device_id=${encodeURIComponent(device)}`), {
        headers: getSyndicateAuthHeaders(false),
        cache: "no-store"
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = await r.json();
      if (r.ok) setCanClaimRestore(!!j.can_claim);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (streak !== 0 || !withinRestoreWindow()) return;
    void pollReferral();
    const t = window.setInterval(() => void pollReferral(), 12000);
    return () => window.clearInterval(t);
  }, [streak, pollReferral]);

  const filteredRows = useMemo(() => {
    const base = rows.filter((r) => {
      if (!challengeMatchesStatsMood(r, statsMood)) return false;
      const k = (r.category || r.payload?.category || "").toLowerCase();
      if (catFilter !== "all" && k !== catFilter) return false;
      const done = doneIds.has(r.id);
      if (doneFilter === "complete" && !done) return false;
      if (doneFilter === "incomplete" && done) return false;
      return true;
    });
    return dedupePrimaryMoodSystemRows(applyMoodCategoryPairHide(base, doneIds));
  }, [rows, catFilter, doneFilter, doneIds, statsMood]);

  useEffect(() => {
    if (!selected) return;
    if (filteredRows.some((r) => r.id === selected.id)) return;
    setSelected(null);
  }, [filteredRows, selected]);

  const byCategoryFiltered = useMemo(() => {
    const m: Record<string, ChallengeRow[]> = {};
    for (const c of CATEGORIES) m[c] = [];
    for (const r of filteredRows) {
      const k = (r.category || r.payload?.category || "").toLowerCase();
      if (CATEGORIES.includes(k as (typeof CATEGORIES)[number])) {
        m[k].push(r);
      }
    }
    for (const c of CATEGORIES) {
      m[c].sort(compareRowsByMoodThenSlot);
      m[c] = m[c].slice(0, 3);
    }
    return m;
  }, [filteredRows]);
  const dailyVisibleMissionRows = useMemo(() => {
    const grouped: Record<string, ChallengeRow[]> = {};
    for (const c of CATEGORIES) grouped[c] = [];
    for (const r of rows) {
      const k = (r.category || r.payload?.category || "").toLowerCase();
      if (CATEGORIES.includes(k as (typeof CATEGORIES)[number])) grouped[k].push(r);
    }
    const out: ChallengeRow[] = [];
    const seen = new Set<number>();
    for (const c of CATEGORIES) {
      const top = grouped[c].sort(compareRowsByMoodThenSlot).slice(0, 3);
      for (const r of top) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
      }
    }
    return out;
  }, [rows]);
  const userMissionRows = useMemo(() => {
    const seen = new Set<number>();
    const out: ChallengeRow[] = [];
    for (const c of CATEGORIES) {
      for (const r of byCategoryFiltered[c] ?? []) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
      }
    }
    for (const r of byCategoryFiltered.other ?? []) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  }, [byCategoryFiltered]);
  const userCompletedCount = useMemo(() => userMissionRows.filter((r) => doneIds.has(r.id)).length, [userMissionRows, doneIds]);
  const userRemainingCount = useMemo(() => Math.max(0, dailyVisibleMissionRows.length - userCompletedCount), [dailyVisibleMissionRows.length, userCompletedCount]);
  const dayCountdownSec = useMemo(() => secondsUntilLocalMidnight(nowTick), [nowTick]);
  const completedAgentTodayCount = useMemo(
    () => rows.filter((r) => !r.user_created && doneIds.has(r.id)).length,
    [rows, doneIds]
  );
  const completedCustomTodayCount = useMemo(
    () => rows.filter((r) => !!r.user_created && doneIds.has(r.id)).length,
    [rows, doneIds]
  );
  const completedTotalTodayCount = useMemo(
    () => completedAgentTodayCount + completedCustomTodayCount,
    [completedAgentTodayCount, completedCustomTodayCount]
  );
  const totalDailyCompletionCap = useMemo(
    () => MAX_AGENT_COMPLETIONS_PER_DAY + (rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0),
    [rows]
  );
  const pendingDailyCompletionSlots = useMemo(
    () => Math.max(0, totalDailyCompletionCap - completedTotalTodayCount),
    [totalDailyCompletionCap, completedTotalTodayCount]
  );
  const getStartLimitMessage = useCallback(
    (row: ChallengeRow): string | null => {
      if (row.user_created) {
        if (completedCustomTodayCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) {
          return `Daily limit reached: you can complete only ${MAX_CUSTOM_COMPLETIONS_PER_DAY} custom missions per day.`;
        }
        return null;
      }
      if (completedAgentTodayCount >= MAX_AGENT_COMPLETIONS_PER_DAY) {
        return `Daily limit reached: you can complete only ${MAX_AGENT_COMPLETIONS_PER_DAY} generated missions per day.`;
      }
      return null;
    },
    [completedAgentTodayCount, completedCustomTodayCount]
  );

  /** Isolated from mood filter updates so Recharts does not redraw on every mood change. */
  const statsProfileChartsLeftColumn = useMemo(
    () => (
      <div className="min-w-0 space-y-10">
        <div>
          <h3 className="mb-3 text-[15px] font-bold uppercase tracking-[0.12em] text-white/80 sm:text-[16px]">
            Today · mission points by category (pie)
          </h3>
          <div className="h-[300px] w-full sm:h-[420px] md:h-[480px] lg:h-[520px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={pieDailyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  innerRadius="22%"
                  outerRadius="78%"
                  paddingAngle={2}
                  labelLine={false}
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                >
                  {pieDailyData.map((e, i) => (
                    <Cell key={e.name} stroke="rgba(0,0,0,0.35)" strokeWidth={1} fill={e.fill ?? PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid rgba(255,215,0,0.35)",
                    borderRadius: 8,
                    fontSize: 15
                  }}
                  labelStyle={{ color: "#fff", fontSize: 15 }}
                />
                <Legend wrapperStyle={{ fontSize: 15, paddingTop: 12 }} iconType="circle" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-bold uppercase tracking-[0.12em] text-white/80 sm:text-[16px]">
            Weekly · mission points (bar)
          </h3>
          <div className="h-[220px] w-full min-h-[200px] sm:h-[260px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 14 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 14 }} />
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid rgba(255,215,0,0.35)",
                    borderRadius: 8,
                    fontSize: 15
                  }}
                  labelStyle={{ color: "#fff", fontSize: 15 }}
                />
                <Bar dataKey="points" radius={[6, 6, 0, 0]}>
                  {weeklyBarData.map((entry, i) => (
                    <Cell key={`w-${entry.name}-${i}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-bold uppercase tracking-[0.12em] text-white/80 sm:text-[16px]">
            Monthly · daily mission points (line)
          </h3>
          <div className="h-[220px] w-full min-h-[200px] sm:h-[260px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`syndicate-line-${lineGradientUid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff6b9d" />
                    <stop offset="22%" stopColor="#ffd54a" />
                    <stop offset="44%" stopColor="#4fd1b8" />
                    <stop offset="66%" stopColor="#7b9cff" />
                    <stop offset="88%" stopColor="#c792ea" />
                    <stop offset="100%" stopColor="#69f0ae" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} interval={4} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 14 }} />
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid rgba(255,215,0,0.35)",
                    borderRadius: 8,
                    fontSize: 15
                  }}
                  labelStyle={{ color: "#fff", fontSize: 15 }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke={`url(#syndicate-line-${lineGradientUid})`}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 1, fill: "#ffd54a", stroke: "#1a1a1a" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    ),
    [pieDailyData, weeklyBarData, monthlyLineData, lineGradientUid]
  );

  const loadFast = useCallback(async () => {
    setError(null);
    setBusy("load");
    try {
      const device = getDeviceId();
      const tokenBefore = getSyndicateAuthToken();
      const td = await fetchChallengesTodayUntilComplete(device, {
        onPartial: (partial) => {
          const list = partial.results ?? [];
          setRows(list);
          setDailyBatchStreaming(partial.generating === true && partial.batch_complete === false);
          if (list.length > 0) setBusy(null);
        }
      });
      setDailyBatchStreaming(false);
      const list = td.results ?? [];
      setRows(list);
      if (list.length > 0) {
        setBusy(null);
      }

      const [stRes, at] = await Promise.all([
        fetch(`${API_BASE}/mindset/status/`, { headers: getSyndicateAuthHeaders(false) }),
        fetchAdminTasksActive(device).catch(() => ({ results: [] as AdminTaskRow[] } as const))
      ]);
      ensureSyndicateSessionOrRedirect(stRes, !!tokenBefore);
      const st = await stRes.json();
      if ("unauthorized" in at && at.unauthorized) adminTasksPollPausedRef.current = true;
      setAdminTasks(at.results ?? []);

      if (!st.ready) {
        setError(
          typeof td.detail === "string" && td.detail
            ? td.detail
            : "Mindsets are not loaded on the server yet. Add documents under Backend/data/uploads/ and ingest, or use the admin upload API."
        );
      }
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) {
        return;
      }
      setError(
        e instanceof Error ? e.message : "Cannot reach the API. Run: python manage.py runserver (in Backend/)"
      );
      setRows([]);
      setDailyBatchStreaming(false);
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    if (initialLoadOnceRef.current) return;
    initialLoadOnceRef.current = true;
    void loadFast();
  }, [loadFast]);

  // Keep bonus tasks fresh with lightweight polling; only while dashboard is visible.
  useEffect(() => {
    if (!mounted || syndicateView !== "dashboard") return;
    let cancelled = false;
    const run = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (!getSyndicateAuthToken() || adminTasksPollPausedRef.current) return;
      try {
        const out = await fetchAdminTasksActive(getDeviceId());
        if (cancelled) return;
        if (out.unauthorized) {
          adminTasksPollPausedRef.current = true;
          setAdminTasks([]);
          return;
        }
        setAdminTasks(out.results ?? []);
      } catch {
        /* ignore intermittent network errors */
      }
    };
    void run();
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    window.addEventListener("visibilitychange", onVisible);
    const t = window.setInterval(() => void run(), 30000);
    return () => {
      cancelled = true;
      window.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(t);
    };
  }, [mounted, syndicateView]);

  useEffect(() => {
    if (!mounted || !rows.length) return;
    const iso = calendarIsoFromRows(rows);
    const offeredToday = MAX_AGENT_COMPLETIONS_PER_DAY + (rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0);
    recordOfferedSnapshot(iso, offeredToday);
    setChallengeLogVersion((v) => v + 1);
  }, [mounted, rows]);

  const challengeDayData = useMemo(() => {
    void challengeLogVersion;
    return loadChallengeDay();
  }, [challengeLogVersion]);

  const filteredDayChallengeStats = useMemo(() => {
    const iso = historyFilterDate;
    const today = todayLocalISO();
    const isSelectedToday = iso === today;
    const offeredToday = MAX_AGENT_COMPLETIONS_PER_DAY + (rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0);
    const offered =
      isSelectedToday
        ? offeredToday
        : challengeDayData.offeredByDate[iso] ?? null;
    const completed = isSelectedToday
      ? Math.min(offeredToday, rows.filter((r) => doneIds.has(r.id)).length)
      : challengeDayData.completionsByDate[iso] ?? 0;
    const missed = offered !== null ? Math.max(0, offered - completed) : null;
    const achievedPoints = loadHistory().days[iso]?.total ?? 0;
    return { offered, completed, missed, achievedPoints, isSelectedToday };
  }, [challengeDayData, historyFilterDate, rows, doneIds, challengeLogVersion, pointsTotal]);

  const lastSevenDayChallengeRows = useMemo(() => {
    const today = todayLocalISO();
    const dates = lastNDatesFrom(today, 7).slice().reverse();
    const offeredToday = MAX_AGENT_COMPLETIONS_PER_DAY + (rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0);
    const h = loadHistory();
    return dates.map((iso) => {
      const isRowToday = iso === today;
      const offered =
        isRowToday
          ? offeredToday
          : challengeDayData.offeredByDate[iso] ?? null;
      const completed = isRowToday
        ? Math.min(offeredToday, rows.filter((r) => doneIds.has(r.id)).length)
        : challengeDayData.completionsByDate[iso] ?? 0;
      const missed = offered !== null ? Math.max(0, offered - completed) : null;
      const achievedPoints = h.days[iso]?.total ?? 0;
      return { iso, offered, completed, missed, achievedPoints };
    });
  }, [challengeDayData, rows, doneIds, challengeLogVersion, pointsTotal]);

  const regenerateNewDay = useCallback(async () => {
    setError(null);
    setBusy("regen");
    try {
      const tokenBefore = getSyndicateAuthToken();
      const r = await fetch(challengesApiUrl("generate_daily/"), {
        method: "POST",
        headers: getSyndicateAuthHeaders(true),
        body: JSON.stringify({ force: true })
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = (await r.json()) as { detail?: string; results?: ChallengeRow[] };
      if (!r.ok) {
        setError(typeof j.detail === "string" ? j.detail : "Regenerate failed");
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ls("completed_challenge_ids"));
        window.localStorage.removeItem(ls("challenge_responses"));
        window.localStorage.removeItem(ls("mission_started_at_v1"));
        resetChallengeDayForDate(todayLocalISO());
        onSyndicatePersist();
      }
      // Keep lifetime points; only reset per-day completion state.
      setPointsTotal(loadTotalPoints());
      setDoneIds(new Set());
      setMissionStartMap({});
      try {
        const pr = await fetchSyndicateProgress();
        setStreak(pr.streak_count);
        setLastActivityIso(pr.last_activity_date);
        applySyncedStateFromServer(pr.state ?? {});
      } catch {
        /* streak unchanged if progress fetch fails */
      }
      const refreshed = await fetchChallengesTodayUntilComplete(getDeviceId(), {
        onPartial: (p) => {
          setRows(p.results ?? []);
          setDailyBatchStreaming(p.generating === true && p.batch_complete === false);
        }
      });
      setDailyBatchStreaming(false);
      setRows(refreshed.results ?? []);
      setSelected(null);
      setChallengeLogVersion((v) => v + 1);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setError("Regenerate failed (network).");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const today = todayLocalISO();
    if (today !== lastSeenDayRef.current && busy !== "regen") {
      lastSeenDayRef.current = today;
      void regenerateNewDay();
    }
  }, [nowTick, mounted, busy, regenerateNewDay]);

  const userCustomCount = useMemo(() => rows.filter((r) => r.user_created).length, [rows]);

  /** First time user opens mission detail, start the timer; reopening the same mission does not reset it. */
  const openMissionDetail = useCallback((row: ChallengeRow) => {
    if (!doneIds.has(row.id)) {
      setMissionStartMap((prev) => {
        if (prev[row.id] != null) return prev;
        const t = Date.now();
        const next = { ...prev, [row.id]: t };
        persistMissionStartTimes(next);
        return next;
      });
    }
    setSelected(row);
  }, [doneIds]);

  const createUserCustomTask = useCallback(async () => {
    const t = customTitle.trim();
    if (t.length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) {
      setError(`Maximum ${MAX_CUSTOM_COMPLETIONS_PER_DAY} custom missions per calendar day.`);
      return;
    }
    setError(null);
    setBusy("custom");
    try {
      const { result } = await postUserCustomChallenge(getDeviceId(), t, customDifficulty);
      setRows((prev) => [...prev, result]);
      setCustomTitle("");
      setChallengeLogVersion((v) => v + 1);
      openMissionDetail(result);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setError(e instanceof Error ? e.message : "Could not create mission");
    } finally {
      setBusy(null);
    }
  }, [customTitle, customDifficulty, userCustomCount, openMissionDetail]);

  async function createInviteCode() {
    setReferralMsg(null);
    try {
      const tokenBefore = getSyndicateAuthToken();
      const r = await fetch(challengesApiUrl("referral/create/"), {
        method: "POST",
        headers: getSyndicateAuthHeaders(true),
        body: JSON.stringify({ device_id: getDeviceId() })
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = await r.json();
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Failed");
        return;
      }
      setInviteCode(j.code);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setReferralMsg("Could not create code.");
    }
  }

  async function redeemFriend() {
    setReferralMsg(null);
    try {
      const tokenBefore = getSyndicateAuthToken();
      const r = await fetch(challengesApiUrl("referral/redeem/"), {
        method: "POST",
        headers: getSyndicateAuthHeaders(true),
        body: JSON.stringify({ code: friendCode.trim().toUpperCase(), device_id: getDeviceId() })
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = await r.json();
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Invalid");
        return;
      }
      setReferralMsg("Code applied. Thanks for helping a friend.");
      setFriendCode("");
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setReferralMsg("Network error.");
    }
  }

  async function claimRestore() {
    setReferralMsg(null);
    try {
      const tokenBefore = getSyndicateAuthToken();
      const r = await fetch(challengesApiUrl("referral/claim/"), {
        method: "POST",
        headers: getSyndicateAuthHeaders(true),
        body: JSON.stringify({ device_id: getDeviceId() })
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = await r.json();
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Cannot claim");
        return;
      }
      const prev = parseInt(window.localStorage.getItem(ls("streak_before_break")) || "1", 10);
      const restored = await postSyndicateStreakRestore(Math.max(1, prev));
      applySyncedStateFromServer(restored.state ?? {});
      window.localStorage.removeItem(ls("streak_before_break"));
      window.localStorage.removeItem(ls("streak_break_date"));
      setStreak(restored.streak_count);
      setLastActivityIso(restored.last_activity_date);
      onSyndicatePersist();
      setCanClaimRestore(false);
      setReferralMsg("Streak restored.");
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setReferralMsg("Network error.");
    }
  }

  async function submitAdminTask(taskId: number) {
    const draft = (adminTaskDrafts[taskId] || "").trim();
    if (draft.length < 3) {
      setAdminTaskMsg("Write at least a short response before submitting.");
      return;
    }
    setAdminTaskMsg(null);
    setAdminTaskBusyId(taskId);
    try {
      const device = getDeviceId();
      await postAdminTaskSubmit({
        deviceId: device,
        taskId,
        responseText: draft,
        startedAtMs: adminTaskStartedAtMs[taskId],
        attachment: adminTaskFiles[taskId] ?? null
      });
      const refreshed = await fetchAdminTasksActive(device);
      setAdminTasks(refreshed.results ?? []);
      setAdminTaskFiles((prev) => ({ ...prev, [taskId]: null }));
      setAdminTaskRecording((prev) => ({ ...prev, [taskId]: false }));
      setAdminTaskStartedAtMs((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      const today = todayLocalISO();
      if (lastActivityIso !== today) {
        try {
          const sr = await postSyndicateStreakRecord(today);
          setStreak(sr.streak_count);
          setLastActivityIso(sr.last_activity_date);
        } catch {
          /* keep UI stale until next progress fetch */
        }
      }
      setAdminTaskMsg("Saved. We will give you points later after analysis.");
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setAdminTaskMsg(friendlyAdminTaskError(e));
    } finally {
      setAdminTaskBusyId(null);
    }
  }

  async function startAdminTaskVideoRecord(taskId: number) {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setAdminTaskMsg("Camera recording is not supported in this browser.");
      return;
    }
    if (adminTaskRecording[taskId]) return;
    setAdminTaskMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const rec = new MediaRecorder(stream);
      adminTaskChunksRef.current[taskId] = [];
      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) adminTaskChunksRef.current[taskId].push(e.data);
      };
      rec.onstop = () => {
        const chunks = adminTaskChunksRef.current[taskId] || [];
        const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
        if (blob.size > 0) {
          const ext = rec.mimeType.includes("mp4") ? "mp4" : "webm";
          const file = new File([blob], `admin-task-${taskId}-${Date.now()}.${ext}`, { type: blob.type || "video/webm" });
          setAdminTaskFiles((prev) => ({ ...prev, [taskId]: file }));
        }
        stream.getTracks().forEach((tr) => tr.stop());
        adminTaskRecorderRef.current[taskId] = null;
        adminTaskStreamRef.current[taskId] = null;
        setAdminTaskRecording((prev) => ({ ...prev, [taskId]: false }));
      };
      adminTaskRecorderRef.current[taskId] = rec;
      adminTaskStreamRef.current[taskId] = stream;
      rec.start();
      setAdminTaskRecording((prev) => ({ ...prev, [taskId]: true }));
      setAdminTaskMsg("Recording started. Press Stop to attach video.");
    } catch {
      setAdminTaskMsg("Camera access was blocked or unavailable.");
    }
  }

  function stopAdminTaskVideoRecord(taskId: number) {
    const rec = adminTaskRecorderRef.current[taskId];
    if (!rec) return;
    try {
      rec.state !== "inactive" && rec.stop();
      setAdminTaskMsg("Video captured and attached.");
    } catch {
      setAdminTaskMsg("Could not stop recording.");
    }
  }

  async function claimReviewedAdminPoints() {
    setAdminTaskMsg(null);
    try {
      const out = await postAdminTaskClaimPoints(getDeviceId());
      if (out.points_awarded > 0) {
        const next = pointsTotal + out.points_awarded;
        persistPoints(next);
        setPointsTotal(next);
        setAdminTaskMsg(`+${out.points_awarded} points added from admin-reviewed tasks.`);
      } else {
        setAdminTaskMsg("No reviewed task points available yet.");
      }
      const refreshed = await fetchAdminTasksActive(getDeviceId());
      setAdminTasks(refreshed.results ?? []);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setAdminTaskMsg(friendlyAdminTaskError(e));
    }
  }

  useLayoutEffect(() => {
    if (!selected) return;
    scrollSyndicateShellToTop();
  }, [selected]);

  async function handleSubmit(text: string) {
    if (!selected) return;
    if (doneIds.has(selected.id)) {
      setError("Mission already completed. You can only view your submitted response.");
      return;
    }
    if (!doneIds.has(selected.id)) {
      if (selected.user_created) {
        if (completedCustomTodayCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) {
          setError("You can complete up to 2 custom missions per day.");
          return;
        }
      } else if (completedAgentTodayCount >= MAX_AGENT_COMPLETIONS_PER_DAY) {
        setError(`You can complete up to ${MAX_AGENT_COMPLETIONS_PER_DAY} generated missions per day.`);
        return;
      }
    }
    setSubmitBusy(true);
    try {
      const id = selected.id;
      const responses = loadResponses();
      responses[id] = text;
      persistResponses(responses);

      const startedAt = missionStartMap[id] ?? Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      // elapsedSeconds = first open of this mission’s detail → submit (timer not reset on repeat opens).
      const scored = await postScoreMissionResponse({
        responseText: text,
        challengeTitle: selected.payload?.challenge_title ?? "Mission",
        difficulty: selected.difficulty || selected.payload?.difficulty || "medium",
        maxPoints: selected.points || 0,
        elapsedSeconds
      });
      setLastScore(scored);
      const nextScores = { ...missionScores, [id]: scored };
      persistMissionScores(nextScores);
      setMissionScores(nextScores);
      const nextAwarded = { ...missionAwardedMap, [id]: scored.awarded_points || 0 };
      persistMissionAwardedPoints(nextAwarded);
      setMissionAwardedMap(nextAwarded);

      const nextDone = new Set(doneIds);
      let total = pointsTotal;
      const today = todayLocalISO();

      if (!nextDone.has(id)) {
        nextDone.add(id);
        const pts = scored.awarded_points || 0;
        total += pts;
        setMissionCompleteToast({
          title: (selected.payload?.challenge_title ?? "Mission").trim() || "Mission",
          points: pts,
          elapsedSeconds
        });
        persistDone(nextDone);
        persistPoints(total);
        setDoneIds(nextDone);
        setPointsTotal(total);
        const cat = (selected.category || selected.payload?.category || "business").toLowerCase();
        appendPointsForDay(today, cat, pts);
        recordCompletionForDay(today);
        setChallengeLogVersion((v) => v + 1);

        if (lastActivityIso !== today) {
          try {
            const sr = await postSyndicateStreakRecord(today);
            setStreak(sr.streak_count);
            setLastActivityIso(sr.last_activity_date);
          } catch {
            /* streak stays stale until next progress fetch */
          }
        }
      }

      const nextStarts = { ...missionStartMap };
      delete nextStarts[id];
      persistMissionStartTimes(nextStarts);
      setMissionStartMap(nextStarts);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setError(e instanceof Error ? e.message : "Unable to score mission response.");
    } finally {
      setSubmitBusy(false);
    }
  }

  useEffect(() => {
    if (missionCompleteToast === null) return;
    const t = window.setTimeout(() => setMissionCompleteToast(null), 5200);
    return () => window.clearTimeout(t);
  }, [missionCompleteToast]);

  const initialResp = selected ? loadResponses()[selected.id] ?? "" : "";
  const selectedScorePreview = selected ? missionScores[selected.id] ?? lastScore : null;
  const selectedAwardedPoints =
    selected && typeof missionAwardedMap[selected.id] === "number"
      ? missionAwardedMap[selected.id]
      : selectedScorePreview
        ? selectedScorePreview.awarded_points
        : null;

  const showRestore = mounted && streak === 0 && withinRestoreWindow();
  const restoreDaysLeftCount = useMemo(() => (showRestore ? restoreDaysLeft() : 0), [showRestore, nowTick]);
  const openStreakRestoreSection = useCallback(() => {
    setShowStatsProfile(true);
    window.setTimeout(() => {
      streakRestoreSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
  }, []);
  const selectedAlreadyDone = selected ? doneIds.has(selected.id) : false;
  const selectedSubmitLocked =
    !!selected &&
    !selectedAlreadyDone &&
    ((!!selected.user_created && completedCustomTodayCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) ||
      (!selected.user_created && completedAgentTodayCount >= MAX_AGENT_COMPLETIONS_PER_DAY));
  const selectedSubmitLockedMessage =
    !!selected && !selectedAlreadyDone
      ? selected.user_created
        ? completedCustomTodayCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY
          ? "Daily limit reached: only 2 custom missions can be completed."
          : null
        : completedAgentTodayCount >= MAX_AGENT_COMPLETIONS_PER_DAY
          ? `Daily limit reached: only ${MAX_AGENT_COMPLETIONS_PER_DAY} generated missions can be completed.`
          : null
      : null;

  function redeemRewardMilestone(id: string) {
    const idx = REWARD_MILESTONES.findIndex((r) => r.id === id);
    const reward = idx >= 0 ? REWARD_MILESTONES[idx] : undefined;
    if (!reward) return;
    if (idx > 0) {
      const prevId = REWARD_MILESTONES[idx - 1]!.id;
      if (!redeemedRewards.has(prevId)) return;
    }
    if (pointsTotal < reward.unlock_points) return;
    if (redeemedRewards.has(id)) return;
    const nextRedeemed = new Set(redeemedRewards);
    nextRedeemed.add(id);
    persistRedeemedRewards(nextRedeemed);
    setRedeemedRewards(nextRedeemed);
    const nextTotal = pointsTotal + reward.bonus_points;
    persistPoints(nextTotal);
    setPointsTotal(nextTotal);
    setError(null);
  }

  function convertPointsToPounds() {
    const raw = parseInt(convertPointsInput, 10);
    if (!Number.isFinite(raw) || raw <= 0) {
      setError("Enter a valid points amount.");
      return;
    }
    if (raw > pointsTotal) {
      setError("Not enough points to convert.");
      return;
    }
    const poundsToAdd = (raw / POINTS_PER_10_POUNDS) * POUNDS_PER_100_POINTS;
    const nextPoints = Math.max(0, pointsTotal - raw);
    const nextPounds = poundsBalance + poundsToAdd;
    persistPoints(nextPoints);
    setPointsTotal(nextPoints);
    persistPoundsBalance(nextPounds);
    setPoundsBalance(nextPounds);
    setError(null);
  }

  const completionToast =
    missionCompleteToast !== null ? (
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed left-3 right-3 top-auto bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] max-w-none rounded-lg border border-white/15 bg-[rgba(12,18,24,0.96)] px-4 py-4 text-[15px] font-normal leading-relaxed text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.55)] sm:left-auto sm:right-6 sm:top-6 sm:bottom-auto sm:max-w-[min(20rem,calc(100vw-2rem))]"
      >
        <p className="text-[16px] font-medium text-white">You completed this challenge.</p>
        <p className="mt-2 line-clamp-3 text-[14px] text-white/75">{missionCompleteToast.title}</p>
        <p className="mt-3 text-[14px] text-white/90">
          <span className="text-white/55">Time: </span>
          {formatDurationForPopup(missionCompleteToast.elapsedSeconds)}
          <span className="text-white/45"> ({missionCompleteToast.elapsedSeconds}s)</span>
        </p>
        <p className="mt-2 text-[14px] text-white/90">
          <span className="text-white/55">Points: </span>
          <span className="font-semibold text-amber-200">+{missionCompleteToast.points}</span>
        </p>
      </div>
    ) : null;

  const syndicateHelpModal =
    syndicateHelpPanel !== null ? (
      <SyndicateHelpOverlay topic={syndicateHelpPanel} onClose={() => setSyndicateHelpPanel(null)} />
    ) : null;

  if (selected) {
    return (
      <>
        {completionToast}
        {syndicateHelpModal}
        <DetailPane
          row={selected}
          initialResponse={initialResp}
          submitting={submitBusy}
          scorePreview={selectedScorePreview}
          awardedPoints={selectedAwardedPoints}
          submitDisabled={selectedSubmitLocked}
          submitLockedMessage={selectedSubmitLockedMessage}
          nowMs={nowTick}
          done={doneIds.has(selected.id)}
          taskTimerStartMs={doneIds.has(selected.id) ? null : missionStartMap[selected.id] ?? null}
          onBack={() => setSelected(null)}
          onSubmit={handleSubmit}
          onLogout={handleSyndicateLogout}
        />
      </>
    );
  }

  return (
    <>
      {completionToast}
      {syndicateHelpModal}
      <div className="syndicate-dash-outer relative mx-auto w-full min-w-0 max-w-[min(100%,100rem)] space-y-5 border px-0 py-3 sm:py-5 max-md:space-y-4 max-md:border-0 max-md:bg-[linear-gradient(168deg,#050508_0%,#0d0818_44%,#0a0610_100%)] max-md:px-0 max-md:pb-3 max-md:pt-0 max-md:shadow-none">
      <div className="pointer-events-none absolute inset-0 -z-10 syndicate-dash-scanlines max-md:opacity-35" />
      <div className="syndicate-dash-header mb-2 flex w-full min-w-0 flex-col gap-4 rounded-2xl border px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4 max-md:mb-0 max-md:rounded-none max-md:border-x-0 max-md:border-t-0 max-md:border-b-[rgba(255,215,0,0.24)] max-md:px-2 max-md:py-3">
        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 text-[13px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/88 sm:text-[14px]">
            <span className="inline-flex h-3 w-3 shrink-0 animate-pulse rounded-full bg-[color:var(--gold)] shadow-[0_0_14px_rgba(255,215,0,0.85)]" />
            On the board
          </div>
          <h3 className="syndicate-nav-headline text-[22px] sm:text-[28px] md:text-[34px] lg:text-[38px]">
            Syndicate Mode: Missions
          </h3>
        </div>
        <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setSyndicateView("dashboard");
              setShowStatsProfile(false);
            }}
            className={cn(
              "min-h-[44px] min-w-0 touch-manipulation px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] transition sm:min-w-[140px] sm:px-4 sm:py-3 sm:text-[12px] sm:tracking-[0.08em]",
              GAME_BTN,
              syndicateView === "dashboard"
                ? "border-[rgba(255,215,0,0.78)] text-[color:var(--gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.28)]"
                : GAME_BTN_NAV_IDLE
            )}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              setSyndicateView("challenges");
              setShowStatsProfile(false);
            }}
            className={cn(
              "min-h-[44px] min-w-0 touch-manipulation px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] transition sm:min-w-[140px] sm:px-4 sm:py-3 sm:text-[12px] sm:tracking-[0.08em]",
              GAME_BTN,
              syndicateView === "challenges"
                ? "border-[rgba(244,114,182,0.65)] text-[#fce7f3] [text-shadow:0_0_14px_rgba(244,114,182,0.35)]"
                : GAME_BTN_NAV_IDLE
            )}
          >
            Missions
          </button>
          <button
            type="button"
            aria-expanded={showStatsProfile}
            aria-controls="syndicate-stats-profile"
            onClick={() => setShowStatsProfile(true)}
            className={cn(
              "min-h-[44px] min-w-0 touch-manipulation px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] transition sm:min-w-[140px] sm:px-4 sm:py-3 sm:text-[12px] sm:tracking-[0.08em]",
              GAME_BTN,
              showStatsProfile
                ? "border-[rgba(168,85,247,0.72)] text-[#ede9fe] [text-shadow:0_0_14px_rgba(167,139,250,0.35)]"
                : GAME_BTN_NAV_IDLE
            )}
          >
            Stats & profile
          </button>
          <button
            type="button"
            onClick={handleSyndicateLogout}
            className="col-span-2 min-h-[44px] w-full touch-manipulation rounded-md border border-red-500/70 bg-[linear-gradient(180deg,rgba(185,28,28,0.45)_0%,rgba(127,29,29,0.55)_100%)] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-red-50 shadow-[inset_0_1px_0_rgba(254,202,202,0.35),0_0_14px_rgba(239,68,68,0.25)] transition hover:brightness-110 sm:col-span-1 sm:w-auto sm:min-w-[100px]"
          >
            Log out
          </button>
        </div>
      </div>

      {hasActionableBonusMission ? (
        <button
          type="button"
          onClick={goToBonusMissions}
          className="syndicate-readable group mb-3 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-[rgba(255,215,0,0.5)] bg-[linear-gradient(92deg,rgba(255,215,0,0.12),rgba(0,220,255,0.06),rgba(255,215,0,0.1))] px-4 py-3 text-left shadow-[0_0_22px_rgba(255,215,0,0.18)] transition hover:border-[rgba(255,215,0,0.75)] hover:shadow-[0_0_28px_rgba(255,215,0,0.28)] sm:text-center"
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-[color:var(--gold)] shadow-[0_0_12px_rgba(254,222,0,0.85)]"
              aria-hidden
            />
            <span className="text-[13px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)] sm:text-[14px]">
              Bonus mission activated
            </span>
          </span>
          <span className="text-[12px] font-semibold text-cyan-100/90 sm:text-[13px]">
            Click to go to the bonus mission section
          </span>
        </button>
      ) : null}

      {showStatsProfile ? (
        <section
          id="syndicate-stats-profile"
          className="syndicate-readable w-full min-w-0 scroll-mt-4 rounded-3xl border border-[rgba(255,215,0,0.4)] bg-[linear-gradient(165deg,rgba(255,215,0,0.1),rgba(8,28,62,0.62)_42%,rgba(96,44,156,0.34))] p-5 sm:p-7 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_0_1px_rgba(0,255,255,0.18),0_0_48px_rgba(0,0,0,0.6)] max-md:rounded-none max-md:border-x-0 max-md:border-t-0 max-md:border-b-[rgba(255,215,0,0.28)] max-md:p-4 max-md:shadow-none"
        >
          <h2 className="mb-2 text-[20px] font-black uppercase leading-tight tracking-[0.1em] text-[color:var(--gold)] sm:text-[24px]">
            Stats &amp; profile
          </h2>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 min-w-0 lg:order-1">{statsProfileChartsLeftColumn}</div>

            <div className="order-1 min-w-0 space-y-7 lg:order-2 lg:border-l lg:border-white/10 lg:pl-10">
              <div className="rounded-2xl border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.28))] p-5 sm:p-6 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  <div className="min-w-0 border-b border-white/10 pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
                    <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-cyan-200/75">Day ends</div>
                    <div
                      className="mt-2 font-mono text-[clamp(1.75rem,5vw,2.5rem)] font-black tabular-nums leading-none tracking-tight text-cyan-200 [text-shadow:0_0_16px_rgba(34,211,238,0.4),0_1px_0_rgba(0,0,0,0.85)] sm:text-[clamp(2rem,4vw,2.75rem)]"
                      title="Time until local midnight (daily mission window)"
                    >
                      {formatCountdown(dayCountdownSec)}
                    </div>
                    <p className="mt-2 text-[11px] font-medium leading-snug text-white/45">Resets with the local day.</p>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/60">Total points</div>
                    <div className="mt-2 text-[36px] font-black tabular-nums leading-none text-[color:var(--gold)] sm:text-[42px]">{pointsTotal}</div>
                  </div>
                </div>
              </div>

              <div
                id="syndicate-profile-settings"
                className="scroll-mt-6 space-y-5 rounded-2xl border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.32))] p-5 sm:p-6 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.06)]"
              >
                <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/55">Profile</div>
                <div>
                  <label className="text-[12px] font-semibold text-white/55">Account email</label>
                  <div className="mt-1 break-all text-[15px] font-medium text-white/90">{getSyndicateUser()?.email ?? "—"}</div>
                  <p className="mt-1 text-[12px] text-white/45">Sign-in address (read-only).</p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="mx-auto shrink-0 sm:mx-0">
                    <div className="text-[12px] font-semibold text-white/55">Photo preview</div>
                    <div className="mt-2 h-28 w-24 overflow-hidden rounded-md border-2 border-cyan-300/70 bg-black/40 sm:h-32 sm:w-28">
                      <img src={profilePreviewAvatarUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer rounded-lg border border-white/25 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white/85 hover:bg-white/10">
                        Upload photo
                        <input type="file" accept="image/*" className="sr-only" onChange={onProfileImageFile} />
                      </label>
                      <button
                        type="button"
                        onClick={clearProfilePhoto}
                        className="rounded-lg border border-white/20 px-4 py-2 text-[13px] font-semibold text-white/70 hover:bg-white/5"
                      >
                        Reset to default
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-white/70" htmlFor="syndicate-display-name">
                    Display name (dashboard &amp; leaderboard)
                  </label>
                  <input
                    id="syndicate-display-name"
                    value={profileName}
                    onChange={(e) => {
                      setProfileSettingsMsg(null);
                      setProfileName(e.target.value);
                    }}
                    placeholder={getSyndicateUser()?.email || "Name"}
                    className="syndicate-readable mt-2 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2.5 text-[16px] text-white placeholder:text-white/35"
                  />
                  <p className="mt-1 text-[12px] text-white/45">Defaults to your account email until you change it.</p>
                </div>
                {profileSettingsMsg ? (
                  <p className="text-[13px] text-amber-200/95">{profileSettingsMsg}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => saveProfile()}
                  className="rounded-lg border border-[rgba(0,255,180,0.45)] bg-[rgba(0,255,180,0.12)] px-6 py-2.5 text-[15px] font-bold text-[#baffdd] hover:bg-[rgba(0,255,180,0.2)]"
                >
                  Save profile
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[rgba(255,215,0,0.32)] bg-black/35 p-4 [box-shadow:0_0_16px_rgba(255,215,0,0.08)]">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-white/55">Best category</div>
                  <div className="mt-2 text-[16px] font-semibold leading-snug text-white">
                    {CATEGORIES.reduce((s, c) => s + (bestWorst.totals[c] ?? 0), 0) > 0 && bestWorst.best
                      ? `${CAT_LABEL[bestWorst.best.cat] ?? bestWorst.best.cat} (${bestWorst.best.pts} pts)`
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-[rgba(255,215,0,0.32)] bg-black/35 p-4 [box-shadow:0_0_16px_rgba(255,215,0,0.08)]">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-white/55">Lowest category</div>
                  <div className="mt-2 text-[16px] font-semibold leading-snug text-white">
                    {CATEGORIES.reduce((s, c) => s + (bestWorst.totals[c] ?? 0), 0) > 0 && bestWorst.worst
                      ? `${CAT_LABEL[bestWorst.worst.cat] ?? bestWorst.worst.cat} (${bestWorst.worst.pts} pts)`
                      : "—"}
                  </div>
                </div>
              </div>

              <div
                ref={streakRestoreSectionRef}
                id="syndicate-streak-restore"
                className="scroll-mt-6 rounded-2xl border border-[rgba(120,200,255,0.4)] bg-[rgba(0,40,80,0.24)] p-5 sm:p-6 [box-shadow:inset_0_0_0_1px_rgba(180,240,255,0.08)]"
              >
                <div className="text-[15px] font-bold uppercase tracking-wide text-[#a8d8ff]">Restore streak (invite a friend)</div>
                <p className="mt-2 text-[15px] leading-relaxed text-white/65">
                  After a streak break (7-day window), share a code or redeem a friend&apos;s code.
                </p>
                {showRestore ? (
                  <p className="mt-2 text-[14px] font-semibold text-amber-200/95">
                    {restoreDaysLeftCount} day{restoreDaysLeftCount === 1 ? "" : "s"} left to restore your streak.
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void createInviteCode()}
                    className="rounded-md border border-[rgba(120,200,255,0.55)] bg-black/40 px-4 py-2 text-[14px] font-semibold text-[#b5e8ff]"
                  >
                    Generate invite code
                  </button>
                  {inviteCode ? (
                    <code className="rounded border border-white/20 bg-black/50 px-3 py-2 font-mono text-[14px] text-[color:var(--gold)]">{inviteCode}</code>
                  ) : null}
                  {canClaimRestore ? (
                    <button
                      type="button"
                      onClick={() => void claimRestore()}
                      className="rounded-md border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-[14px] font-semibold text-emerald-200"
                    >
                      Claim streak restore
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="w-full min-w-0 flex-1 sm:min-w-[12rem]">
                    <label className="text-[13px] font-medium text-white/60">Friend&apos;s code</label>
                    <input
                      value={friendCode}
                      onChange={(e) => setFriendCode(e.target.value)}
                      placeholder="SYN-…"
                      className="syndicate-readable mt-1.5 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2.5 font-mono text-[15px] text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void redeemFriend()}
                    className="w-full min-h-[44px] shrink-0 rounded-md border border-white/30 px-4 py-2.5 text-[14px] font-semibold text-white/90 sm:w-auto sm:min-h-0"
                  >
                    Redeem
                  </button>
                </div>
                {referralMsg ? <p className="mt-3 text-[14px] text-[#b5ecff]/90">{referralMsg}</p> : null}
              </div>

              <div className="rounded-2xl border border-[rgba(120,200,255,0.34)] bg-[rgba(0,35,55,0.35)] p-4 [box-shadow:inset_0_0_0_1px_rgba(180,240,255,0.08)]">
                <h3 className="text-[16px] font-black uppercase tracking-[0.12em] text-[#a8d8ff] sm:text-[17px]">
                  History by date
                </h3>
                <p className="mt-1 text-[13px] text-white/65">Check your mission performance for any date.</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="w-full min-w-0 sm:w-auto sm:min-w-[12rem]">
                    <label htmlFor="syndicate-history-date" className="text-[12px] font-semibold text-white/70">
                      Filter date
                    </label>
                    <input
                      id="syndicate-history-date"
                      type="date"
                      max={todayLocalISO()}
                      value={historyFilterDate}
                      onChange={(e) => setHistoryFilterDate(e.target.value || todayLocalISO())}
                      className={SYNDICATE_DATE_INPUT}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryFilterDate(todayLocalISO())}
                    className={cn(
                      "min-h-[44px] w-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] sm:min-h-0 sm:w-auto",
                      CTA_BTN
                    )}
                  >
                    Today
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 max-[360px]:grid-cols-1 sm:grid-cols-4">
                  <div className="rounded-lg border border-white/12 bg-black/35 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/55">Offered</div>
                    <div className="mt-1 text-[20px] font-black text-white">{filteredDayChallengeStats.offered ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/80">Completed</div>
                    <div className="mt-1 text-[20px] font-black text-cyan-100">{filteredDayChallengeStats.completed}</div>
                  </div>
                  <div className="rounded-lg border border-orange-300/30 bg-orange-500/10 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-orange-100/85">Missed</div>
                    <div className="mt-1 text-[20px] font-black text-orange-100">{filteredDayChallengeStats.missed ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.08)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--gold)]/90">Achieved pts</div>
                    <div className="mt-1 text-[20px] font-black tabular-nums text-[color:var(--gold)]">
                      {filteredDayChallengeStats.achievedPoints}
                    </div>
                  </div>
                </div>
                <div className="mt-4 -mx-1 max-h-[210px] overflow-x-auto overflow-y-auto overscroll-x-contain rounded-lg border border-white/10 bg-black/25 sm:mx-0">
                  <table className="w-full min-w-[min(100%,480px)] text-left text-[12px] sm:min-w-[480px]">
                    <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/55">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2 text-right">Offered</th>
                        <th className="px-3 py-2 text-right">Completed</th>
                        <th className="px-3 py-2 text-right">Missed</th>
                        <th className="px-3 py-2 text-right text-[color:var(--gold)]/90">Achieved pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastSevenDayChallengeRows.map((row) => (
                        <tr
                          key={row.iso}
                          className={cn("border-t border-white/6 text-white/90", row.iso === historyFilterDate ? "bg-cyan-500/10" : "")}
                        >
                          <td className="px-3 py-2">{row.iso}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.offered ?? "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-cyan-100">{row.completed}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-orange-100">{row.missed ?? "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-[color:var(--gold)]">{row.achievedPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 min-w-0 border-t border-[rgba(255,215,0,0.2)] pt-8">
            <div className="min-w-0 rounded-2xl border border-[rgba(120,200,255,0.34)] bg-[rgba(0,35,55,0.45)] p-4 sm:p-7 [box-shadow:inset_0_0_0_1px_rgba(180,240,255,0.08),0_0_24px_rgba(0,0,0,0.35)]">
              <h3 className="text-[20px] font-black uppercase tracking-[0.12em] text-[#a8d8ff] sm:text-[24px]">
                Leaderboard · Top 10
              </h3>
              <p className="mt-2 text-[14px] text-white/70">
                Top performers ranked by total points.
              </p>
              {leaderboardErr ? (
                <p className="mt-4 text-[15px] text-rose-300/90">{leaderboardErr}</p>
              ) : leaderboard.length === 0 ? (
                <p className="mt-4 text-[15px] leading-relaxed text-white/55">No entries yet. Earn points and sync automatically.</p>
              ) : (
                <>
                  <ul
                    className="mt-4 space-y-2 md:hidden"
                    aria-label="Leaderboard top 10"
                  >
                    {leaderboard.slice(0, 10).map((e, i) => (
                      <li
                        key={e.user_id != null ? `u${e.user_id}` : `${e.rank}-${e.display_name}-${i}`}
                        className="flex min-w-0 items-center gap-3 rounded-lg border border-white/12 bg-black/40 px-3 py-3"
                      >
                        <span className="w-7 shrink-0 text-center text-[13px] font-bold tabular-nums text-white/70">{e.rank}</span>
                        <div className="shrink-0">
                          {e.avatar_url ? (
                            <img
                              src={e.avatar_url}
                              alt=""
                              className="h-10 w-10 rounded-full border border-white/20 bg-black/40 object-cover"
                            />
                          ) : (
                            <span className="inline-block h-10 w-10 rounded-full border border-white/15 bg-white/10" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-white">{e.display_name}</p>
                        </div>
                        <span className="shrink-0 text-[15px] font-black tabular-nums text-[color:var(--gold)]" title="Total points">
                          {e.points_total}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 -mx-2 hidden overflow-x-auto overflow-y-visible overscroll-x-contain rounded-lg border border-white/12 bg-black/35 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:mx-0 md:block">
                    <table className="w-full min-w-[560px] text-left text-[15px]">
                      <thead className="border-b border-white/10 text-[12px] uppercase tracking-[0.12em] text-white/60">
                        <tr>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3 w-14" aria-hidden />
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.slice(0, 10).map((e, i) => (
                          <tr
                            key={e.user_id != null ? `u${e.user_id}` : `${e.rank}-${e.display_name}-${i}`}
                            className="border-t border-white/5 text-white/90"
                          >
                            <td className="px-4 py-3 tabular-nums text-white/75">{e.rank}</td>
                            <td className="px-4 py-3">
                              {e.avatar_url ? (
                                <img
                                  src={e.avatar_url}
                                  alt=""
                                  className="h-9 w-9 rounded-full border border-white/20 bg-black/40 object-cover"
                                />
                              ) : (
                                <span className="inline-block h-9 w-9 rounded-full border border-white/15 bg-white/10" />
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold">{e.display_name}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-[color:var(--gold)]">{e.points_total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {!showStatsProfile && syndicateView === "dashboard" ? (
          <section className="syndicate-readable w-full min-w-0 px-2 py-2 sm:px-3 sm:py-3">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
            <div className="border-b border-fuchsia-300/45 p-2 sm:p-3">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex w-full min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
                  <div className="h-28 w-24 shrink-0 overflow-hidden rounded-md border-2 border-cyan-300/80 bg-black/30 shadow-[0_0_30px_rgba(103,232,249,0.45)] sm:h-32 sm:w-28">
                    <img src={dashboardAvatarUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/70">Your profile</div>
                    <div className="mt-1 break-words text-[24px] font-black leading-none text-white sm:text-[28px]">
                      {profileName.trim() || getSyndicateUser()?.email || DEFAULT_PROFILE_NAME}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatsProfile(true);
                        window.setTimeout(() => {
                          document.getElementById("syndicate-profile-settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 50);
                      }}
                      className="mt-2 text-[12px] font-bold uppercase tracking-[0.12em] text-cyan-200/90 underline decoration-cyan-400/40 underline-offset-2 hover:text-white"
                    >
                      Edit name &amp; photo
                    </button>
                    <div className="mt-2 text-[12px] text-white/70">Your streak, your name, your run.</div>
                    <p className="mt-2 w-full min-w-0 text-[15px] font-semibold leading-relaxed text-[#f5e6c8]/90 sm:text-[16px]">
                      Chip away at missions — heat builds with every day you show up.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block" aria-hidden />
              </div>
              <div className="mt-4 grid grid-cols-1 items-stretch gap-3 min-[420px]:grid-cols-3">
                <div className="flex min-h-[150px] flex-col border border-sky-300/70 bg-[linear-gradient(135deg,rgba(56,189,248,0.38),rgba(59,130,246,0.28)_45%,rgba(10,20,60,0.92)_100%)] px-3 py-3 text-center [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] [box-shadow:0_0_16px_rgba(56,189,248,0.3),inset_0_1px_0_rgba(210,240,255,0.45)] min-[420px]:min-h-[182px] sm:px-3 sm:py-3">
                  <div className={cn(HUD_LABEL, "text-[11px] text-sky-100/90 sm:text-[12px]")}>Level</div>
                  <div className="mt-0.5 text-[28px] font-black tabular-nums leading-none text-sky-50 sm:text-[34px]">
                    {syndicateProgressHud.syndicateLevel}
                  </div>
                  <div className="mt-2 text-[11px] font-bold uppercase leading-tight tracking-[0.1em] text-sky-200/90 sm:text-[12px]">
                    Syndicate level
                  </div>
                  <div className="mt-2 flex flex-1 flex-col justify-end space-y-1 text-[12px] font-semibold leading-snug text-sky-100/92 sm:text-[13px]">
                    {syndicateProgressHud.atMaxTier ? (
                      <p>Highest syndicate level — all reward tiers reached.</p>
                    ) : syndicateProgressHud.nextLevelNumber != null && syndicateProgressHud.nextTierTotalPoints != null ? (
                      <>
                        <p>
                          <span className="font-black tabular-nums text-sky-50">
                            {syndicateProgressHud.ptsToNextLevel === 1
                              ? "1 pt"
                              : `${syndicateProgressHud.ptsToNextLevel} pts`}
                          </span>{" "}
                          to reach{" "}
                          <span className="font-black text-sky-50">Level {syndicateProgressHud.nextLevelNumber}</span>
                        </p>
                        <p className="text-[11px] font-medium leading-snug text-sky-200/88 sm:text-[12px]">
                          Level {syndicateProgressHud.nextLevelNumber} unlocks at{" "}
                          <span className="font-bold tabular-nums text-sky-100">
                            {syndicateProgressHud.nextTierTotalPoints}
                          </span>{" "}
                          total points (same as reward Level {syndicateProgressHud.nextLevelNumber}).
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex min-h-[150px] flex-col border border-amber-300/75 bg-[linear-gradient(135deg,rgba(251,191,36,0.38),rgba(245,158,11,0.3)_45%,rgba(66,32,2,0.92)_100%)] px-3 py-3 text-center [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] [box-shadow:0_0_16px_rgba(245,158,11,0.32),inset_0_1px_0_rgba(255,237,170,0.45)] min-[420px]:min-h-[182px]">
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn(HUD_LABEL, "text-amber-100/85")}>Points</div>
                    <SyndicateHelpMark topic="hud-points" label="How points work" onOpen={setSyndicateHelpPanel} />
                  </div>
                  <div className="mt-1 text-[22px] font-black tabular-nums text-amber-50 sm:text-[24px]">{pointsTotal}</div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-200/85 sm:text-[11px]">Total earned</div>
                  <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                    <p className="text-[10px] leading-snug text-amber-100/82">
                      Lifetime points from missions, bonus tasks, and reward bonuses.
                    </p>
                    <p className="mt-1 text-[10px] leading-snug text-amber-200/70">Spend milestones in Unlock &amp; rewards.</p>
                  </div>
                </div>
                <div className="flex min-h-[150px] flex-col border border-fuchsia-300/70 bg-[linear-gradient(135deg,rgba(244,114,182,0.36),rgba(168,85,247,0.28)_45%,rgba(48,11,62,0.9)_100%)] px-3 py-3 text-center [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] [box-shadow:0_0_16px_rgba(217,70,239,0.28),inset_0_1px_0_rgba(245,208,254,0.4)] min-[420px]:min-h-[182px]">
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn(HUD_LABEL, "text-fuchsia-100/85")}>Streak 🔥</div>
                    <SyndicateHelpMark topic="hud-streak" label="How streak works" onOpen={setSyndicateHelpPanel} />
                  </div>
                  <div className="mt-1 text-[20px] font-black text-fuchsia-100">🔥 {streak}d</div>
                  <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-fuchsia-200/80">Consecutive days</div>
                  <div className="mt-auto flex flex-1 flex-col justify-end gap-1.5 pt-2">
                    <p className="text-[10px] leading-snug text-fuchsia-100/78">
                      Complete at least one mission per day to keep the streak alive.
                    </p>
                    <button
                      type="button"
                      onClick={openStreakRestoreSection}
                      className="mx-auto text-[10px] font-bold uppercase tracking-[0.12em] text-fuchsia-200 underline decoration-fuchsia-400/50 underline-offset-2 transition hover:text-white hover:decoration-white"
                    >
                      {showRestore ? `Restore streak (${restoreDaysLeftCount}d left)` : "Restore streak"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px] text-white/70">
                  <span>Daily completion quota</span>
                  <span className="font-mono">{completedTotalTodayCount}/{Math.max(1, totalDailyCompletionCap)}</span>
                </div>
                <div className="h-3 bg-white/10">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#22d3ee,#818cf8,#facc15)]"
                    style={{ width: `${Math.min(100, Math.round((completedTotalTodayCount / Math.max(1, totalDailyCompletionCap)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className={cn("border-b border-[rgba(255,215,0,0.28)] pb-3", "bg-transparent")}>
                <div className={HUD_LABEL}>Mission stats</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="border border-cyan-300/45 bg-cyan-500/10 p-2 [box-shadow:0_0_14px_rgba(34,211,238,0.18)]">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/85">Completed</div>
                    <div className="text-[22px] font-black text-cyan-100">{completedTotalTodayCount}</div>
                  </div>
                  <div className="border border-orange-300/45 bg-orange-500/10 p-2 [box-shadow:0_0_14px_rgba(249,115,22,0.2)]">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-orange-100/85">Pending</div>
                    <div className="text-[22px] font-black text-orange-100">{pendingDailyCompletionSlots}</div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-white/60">
                  Daily: {completedAgentTodayCount}/{MAX_AGENT_COMPLETIONS_PER_DAY} · Custom: {completedCustomTodayCount}/
                  {rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-white/12 bg-black/25 px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100/85">Best category</span>
                  <span className="text-[13px] font-black uppercase tracking-[0.06em] text-[color:var(--gold)]">
                    {dashboardBestCategoryLabel}
                  </span>
                </div>
                <div className="mt-3 h-[220px] w-full min-w-0 sm:h-[250px] md:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completed", value: Math.max(0, completedTotalTodayCount) },
                          { name: "Pending", value: Math.max(0, pendingDailyCompletionSlots) }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={92}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        <Cell fill="#22d3ee" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
                        <Cell fill="#f97316" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#141414",
                          border: "1px solid rgba(120,200,255,0.35)",
                          borderRadius: 8,
                          fontSize: 12
                        }}
                        labelStyle={{ color: "#fff", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className={cn("border-b border-[rgba(255,215,0,0.28)] pb-3", "bg-transparent")}>
              <div className={HUD_LABEL}>Daily mission</div>
              <div className="mt-1 text-[26px] font-black leading-tight text-white">{rows[0]?.payload?.challenge_title ?? "No mission loaded"}</div>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-white/75">
                <span className="border border-white/15 px-2 py-0.5">{rows[0]?.points ?? 0} XP</span>
                <span>{doneIds.size} completed today</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSyndicateView("challenges")}
                  className={cn("px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => setSyndicateView("challenges")}
                  className={cn("px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                >
                  Open
                </button>
              </div>
            </div>

            <div className={cn("border-b border-[rgba(244,114,182,0.32)] pb-3", "bg-transparent")}>
              <div className={HUD_LABEL}>Quick actions</div>
              <div className="mt-2 grid gap-2">
                <button
                  type="button"
                  onClick={() => setSyndicateView("challenges")}
                  className={cn("px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                >
                  Play missions
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatsProfile(true)}
                  className={cn("px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                >
                  Open stats
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <>
          {!showStatsProfile && syndicateView === "dashboard" ? (
          <section className="syndicate-readable mt-5 w-full min-w-0 rounded-2xl border border-[rgba(255,215,0,0.28)] bg-[linear-gradient(180deg,rgba(255,200,80,0.06),rgba(20,12,8,0.35))] px-2 py-4 sm:mt-6 sm:px-3 sm:py-5 [box-shadow:inset_0_0_0_1px_rgba(255,215,0,0.08)] max-md:mt-4 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-2 max-md:shadow-none">
            <div className="text-center">
              <h3 className="flex flex-wrap items-center justify-center gap-2 text-[20px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)] sm:text-[24px]">
                <span>Unlock & redeem rewards</span>
                <SyndicateHelpMark topic="unlock" label="How unlock and redeem rewards work" onOpen={setSyndicateHelpPanel} />
              </h3>
              <p className="mt-1 text-[14px] font-semibold text-white/70 sm:text-[15px]">
                Redeem in order: Level 1, then 2, then 3… Meet each points threshold and redeem before the next tier opens.
              </p>
            </div>
            <p className="mt-3 text-center text-[17px] font-extrabold text-cyan-100 sm:text-[20px]">
              Earn points to unlock these rewards and get more points.
            </p>
            <div className="mt-5 grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
              {REWARD_MILESTONES.map((rw, levelIndex) => {
                const level = levelIndex + 1;
                const prevRedeemed = levelIndex === 0 || redeemedRewards.has(REWARD_MILESTONES[levelIndex - 1]!.id);
                const hasPoints = pointsTotal >= rw.unlock_points;
                const canRedeem = prevRedeemed && hasPoints;
                const redeemed = redeemedRewards.has(rw.id);
                const readyToRedeem = hasPoints && prevRedeemed && !redeemed;
                const sequentialBlocked = !prevRedeemed && !redeemed;
                return (
                  <div
                    key={rw.id}
                    className={cn(
                      "flex min-h-[188px] flex-col rounded-xl border px-1.5 pb-2.5 pt-2.5 text-center [box-shadow:0_0_0_1px_rgba(255,215,0,0.12),0_0_12px_rgba(255,180,0,0.1)] sm:min-h-[280px] sm:px-3 sm:pb-3 sm:pt-3 md:min-h-[300px]",
                      redeemed
                        ? "border-emerald-300/70 bg-emerald-500/10 [box-shadow:0_0_14px_rgba(52,211,153,0.38)]"
                        : readyToRedeem
                          ? "border-[rgba(255,215,0,0.8)] bg-[rgba(255,215,0,0.09)] [box-shadow:0_0_14px_rgba(255,215,0,0.38)]"
                          : "border-[rgba(255,215,0,0.32)] bg-black/45 [box-shadow:0_0_12px_rgba(255,200,80,0.12)]",
                      sequentialBlocked && "opacity-[0.82] [filter:grayscale(0.45)]"
                    )}
                  >
                    <div className="flex flex-1 flex-col items-center">
                      <div className="mx-auto mb-2 flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/12 bg-black/35 sm:mb-2.5 sm:h-[80px] sm:w-[80px]">
                        <img
                          src={rw.image}
                          alt={rw.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="text-[12px] font-black uppercase tracking-[0.12em] text-cyan-200 sm:text-[15px] sm:tracking-[0.14em]">Level {level}</div>
                      <div className="mt-1 w-full max-w-full px-0.5 text-[10px] font-black uppercase leading-tight tracking-[0.04em] text-white sm:max-w-[11rem] sm:text-[13px] sm:leading-snug sm:tracking-[0.06em]">
                        {rw.title}
                      </div>
                      <div className="mt-2 text-[12px] font-semibold tabular-nums text-white/88 sm:mt-3 sm:text-[15px]">
                        Req:{" "}
                        <span className="font-bold text-[color:var(--gold)] [text-shadow:0_0_12px_rgba(254,222,0,0.25)]">
                          {rw.unlock_points}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] font-semibold tabular-nums text-cyan-100 sm:mt-1.5 sm:text-[15px]">
                        Bonus{" "}
                        <span className="font-bold text-emerald-200 [text-shadow:0_0_10px_rgba(52,211,153,0.2)]">
                          +{rw.bonus_points}
                        </span>
                      </div>
                      <div className="mt-2 flex min-h-[2.25rem] w-full flex-col items-center justify-center px-0.5 sm:mt-3 sm:min-h-[2.75rem]">
                        {sequentialBlocked ? (
                          <p className="text-center text-[10px] font-bold leading-tight text-amber-200 sm:text-[13px] sm:leading-snug">
                            Redeem level {level - 1} first
                          </p>
                        ) : !redeemed && prevRedeemed && !hasPoints ? (
                          <p className="text-center text-[10px] font-semibold leading-tight text-white/60 sm:text-[13px] sm:leading-snug">
                            Need {rw.unlock_points} pts
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canRedeem || redeemed}
                      onClick={() => redeemRewardMilestone(rw.id)}
                      className={cn(
                        "mt-auto w-full shrink-0 px-1 py-2 text-[10px] font-extrabold uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-45 sm:px-2 sm:py-3 sm:text-[13px] sm:tracking-[0.08em]",
                        CTA_BTN
                      )}
                    >
                      {redeemed ? "Redeemed" : canRedeem ? "Redeem" : "Locked"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-white/45">
              Reward art lives in <code className="text-white/70">public/assets/rewards/</code> — swap files there and update <code className="text-white/70">REWARD_MILESTONES</code> if filenames change.
            </p>
          </section>
          ) : null}

          {!showStatsProfile && syndicateView === "dashboard" ? (
          <section
            id="syndicate-bonus-missions"
            ref={bonusMissionSectionRef}
            className="syndicate-readable mt-10 w-full min-w-0 scroll-mt-8 space-y-6 max-md:mt-6"
          >
            <header className="w-full px-1 text-center sm:px-2">
              <h2 className="flex flex-wrap items-center justify-center gap-3 font-black uppercase leading-[1.02] tracking-[0.1em] text-[color:var(--gold)] [text-shadow:0_0_28px_rgba(255,215,0,0.45),0_0_64px_rgba(34,211,238,0.12)] text-[clamp(2rem,9vw,4rem)] sm:tracking-[0.14em] md:text-[clamp(2.5rem,6vw,4.25rem)]">
                <span>Mega mission</span>
                <SyndicateHelpMark topic="mega-mission" label="How mega missions work" onOpen={setSyndicateHelpPanel} />
              </h2>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70 sm:mt-3 sm:text-xs sm:tracking-[0.28em]">
                Bonus track · admin-reviewed payouts
              </p>
            </header>

            <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(255,215,0,0.28)] bg-[linear-gradient(165deg,rgba(32,24,10,0.94),rgba(10,8,6,0.92))] [box-shadow:0_0_0_1px_rgba(255,215,0,0.1),0_12px_40px_rgba(0,0,0,0.45)] max-md:rounded-xl max-md:border max-md:shadow-[0_0_0_1px_rgba(255,215,0,0.08)] lg:flex-row">
              <div className="min-w-0 flex-1 border-b border-white/10 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:py-6 lg:pl-6 lg:pr-8">
                <p className="text-center text-[13px] font-bold uppercase tracking-[0.18em] text-[color:var(--gold)]/85 sm:text-[14px] lg:text-left">
                  Bonus missions
                </p>
                <h3 className="mt-2 text-center text-[26px] font-black uppercase tracking-[0.07em] text-[#fde68a] [text-shadow:0_0_24px_rgba(255,215,0,0.22)] sm:text-[28px] lg:text-left lg:text-[32px]">
                  Admin review
                </h3>
                <p className="mt-4 text-[17px] font-medium leading-[1.65] text-white/90 sm:text-[18px] lg:text-left">
                  When an admin posts a bonus task, it appears below. Submit your <span className="font-semibold text-white">written response</span> and
                  optionally an <span className="font-semibold text-white">attachment</span> — both are stored and visible to staff in Django admin.
                </p>
                <ul className="mt-5 space-y-3 text-left text-[16px] font-medium leading-snug text-white/85 sm:text-[17px] sm:leading-relaxed">
                  <li className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-[20px] font-bold leading-none text-cyan-300">·</span>
                    <span>One submission per device per task. After approval, use Claim reviewed points.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-[20px] font-bold leading-none text-amber-300">·</span>
                    <span className="text-amber-50/95">Task visibility uses admin-set hours from post time — submit before the countdown ends.</span>
                  </li>
                </ul>
              </div>
              <div className="flex shrink-0 flex-col justify-center gap-2 border-t border-white/5 bg-black/20 p-4 sm:p-5 lg:w-[min(100%,280px)] lg:border-l lg:border-t-0 lg:px-5">
                <p className="text-center text-[13px] font-bold uppercase tracking-[0.12em] text-white/75 sm:text-left">After review</p>
                <p className="text-center text-[13px] leading-snug text-cyan-100/85 sm:text-left">
                  Claim buttons appear under each reviewed result.
                </p>
                {adminTaskMsg ? <p className="text-center text-[14px] leading-snug text-cyan-100 sm:text-left">{adminTaskMsg}</p> : null}
              </div>
            </div>

            {visibleAdminTasks.length === 0 ? (
              <div className="rounded-2xl border border-[rgba(255,215,0,0.28)] bg-[linear-gradient(180deg,rgba(255,200,80,0.05),rgba(0,0,0,0.2))] px-5 py-8 text-center [box-shadow:0_0_20px_rgba(255,200,80,0.1)]">
                <p className="text-[17px] font-semibold text-[#fef3c7]/95">No bonus tasks right now</p>
                <p className="mt-2 w-full min-w-0 text-[15px] leading-relaxed text-white/70">
                  When an admin creates a task, it will show here. Complete daily missions and check back.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {visibleAdminTasks.map((t) => {
                  const sub = t.submission ?? null;
                  const expiresMs = t.expires_at ? new Date(t.expires_at).getTime() : 0;
                  const leftSec = expiresMs > 0 ? Math.max(0, Math.floor((expiresMs - nowTick) / 1000)) : 0;
                  const submittedLabel =
                    sub?.submitted_at != null
                      ? (() => {
                          try {
                            return new Date(sub.submitted_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short"
                            });
                          } catch {
                            return sub.submitted_at;
                          }
                        })()
                      : null;
                  const fileName = adminTaskFiles[t.id]?.name;
                  const isRecording = !!adminTaskRecording[t.id];
                  return (
                    <article
                      key={t.id}
                      className="overflow-hidden rounded-2xl border border-cyan-300/40 bg-[linear-gradient(180deg,rgba(0,32,52,0.55),rgba(0,0,0,0.72))] [box-shadow:0_8px_32px_rgba(0,0,0,0.45)]"
                    >
                      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 sm:px-5 sm:py-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {t.expires_at ? (
                              <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/90">Time left</span>
                                <span className="font-mono text-[16px] font-black tabular-nums text-amber-50 sm:text-lg">
                                  {formatCountdown(leftSec)}
                                </span>
                              </div>
                            ) : null}
                            {t.admin_note ? (
                              <div className="max-w-[100%] rounded-lg border border-fuchsia-300/50 bg-fuchsia-500/15 px-2.5 py-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-100/90">Admin note</span>
                                <p className="mt-0.5 text-[12px] font-semibold leading-snug text-fuchsia-50">{t.admin_note}</p>
                              </div>
                            ) : null}
                            <span className="rounded border border-[rgba(255,215,0,0.5)] bg-[rgba(255,215,0,0.1)] px-2 py-0.5 text-[11px] font-black text-[color:var(--gold)]">
                              {t.points_target} pts
                            </span>
                          </div>
                          <h4 className="mt-2 text-[18px] font-black uppercase leading-tight tracking-[0.05em] text-white sm:text-[20px]">
                            {t.title}
                          </h4>
                        </div>
                      </header>

                      {t.image_url ? (
                        <div className="border-b border-white/10">
                          <div className="aspect-[21/9] max-h-52 w-full overflow-hidden bg-black/50">
                            <img src={t.image_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        </div>
                      ) : null}

                      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
                        <div className="min-w-0 border-b border-white/10 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:border-white/10">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Task instructions</p>
                          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/45 p-4 text-[14px] leading-relaxed text-white/88 [scrollbar-color:rgba(255,255,255,0.25)_transparent] sm:text-[15px] sm:leading-relaxed">
                            <div className="whitespace-pre-wrap break-words">{t.description || "No additional instructions."}</div>
                          </div>
                        </div>

                        <div className="min-w-0 bg-black/25 p-4 sm:p-5">
                          {sub ? (
                            <div className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 p-4 text-[14px] leading-snug text-cyan-100/95">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-200/80">Submission received</p>
                              {submittedLabel ? (
                                <p className="mt-2 font-semibold text-white/95">
                                  {submittedLabel}
                                  {sub.has_attachment ? <span className="text-cyan-200/90"> · File included</span> : null}
                                </p>
                              ) : null}
                              {typeof sub.elapsed_seconds === "number" && sub.elapsed_seconds > 0 ? (
                                <p className="mt-1 text-[12px] text-cyan-100/82">
                                  Completed in {formatDurationReadable(sub.elapsed_seconds)} ({sub.elapsed_seconds}s)
                                </p>
                              ) : null}
                              <p className="mt-2 text-[13px] text-cyan-100/88">
                                {sub.status === "pending"
                                  ? "Pending admin review."
                                  : sub.status === "reviewed"
                                    ? sub.points_claimed
                                      ? `Approved: +${sub.awarded_points} points claimed.`
                                      : `Approved: +${sub.awarded_points} points.`
                                    : "Reviewed: no points awarded."}
                              </p>
                              {sub.status === "reviewed" && !sub.points_claimed && (sub.awarded_points || 0) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => void claimReviewedAdminPoints()}
                                  className={cn("mt-2 w-full px-3 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                                >
                                  Claim +{sub.awarded_points} points
                                </button>
                              ) : null}
                              {sub.status !== "pending" && sub.reviewed_at ? (
                                <p className="mt-1 text-[12px] text-cyan-100/72">
                                  Reviewed at{" "}
                                  {(() => {
                                    try {
                                      return new Date(sub.reviewed_at).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short"
                                      });
                                    } catch {
                                      return sub.reviewed_at;
                                    }
                                  })()}
                                </p>
                              ) : null}
                              {sub.review_notes ? (
                                <p className="mt-2 rounded-lg border border-white/12 bg-black/25 px-2.5 py-2 text-[12px] leading-snug text-cyan-50/90">
                                  Admin note: {sub.review_notes}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200/85">Your response</p>
                                <p className="mt-1 text-[12px] text-white/55">Required text. Add file evidence below (upload or live camera recording, max 50MB).</p>
                              </div>
                              <div>
                                <label className="sr-only" htmlFor={`admin-task-response-${t.id}`}>
                                  Written response
                                </label>
                                <textarea
                                  id={`admin-task-response-${t.id}`}
                                  rows={5}
                                  value={adminTaskDrafts[t.id] ?? ""}
                                  onChange={(e) => setAdminTaskDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                  placeholder="Describe what you did, paste links, or explain how you completed the task…"
                                  className="w-full rounded-xl border border-white/18 bg-black/55 px-3 py-3 text-[15px] leading-relaxed text-white outline-none ring-cyan-400/30 placeholder:text-white/35 focus:border-cyan-400/50 focus:ring-2"
                                />
                              </div>
                              <div className="rounded-xl border border-white/12 bg-black/35 p-3">
                                <label className="block text-[12px] font-semibold text-white/80" htmlFor={`admin-task-file-${t.id}`}>
                                  Attachment <span className="font-normal text-white/45">(optional)</span>
                                </label>
                                <input
                                  id={`admin-task-file-${t.id}`}
                                  type="file"
                                  className="mt-2 block w-full cursor-pointer text-[13px] text-white/85 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-cyan-500/30 file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-cyan-50 hover:file:bg-cyan-500/40"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0] ?? null;
                                    if (isRecording) stopAdminTaskVideoRecord(t.id);
                                    setAdminTaskFiles((prev) => ({ ...prev, [t.id]: f }));
                                  }}
                                />
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {!isRecording ? (
                                    <button
                                      type="button"
                                      onClick={() => void startAdminTaskVideoRecord(t.id)}
                                      className="rounded-lg border border-cyan-300/55 bg-cyan-500/18 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-cyan-100 hover:bg-cyan-500/28"
                                    >
                                      Record video
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => stopAdminTaskVideoRecord(t.id)}
                                      className="rounded-lg border border-rose-300/60 bg-rose-500/20 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-rose-100 hover:bg-rose-500/30"
                                    >
                                      Stop recording
                                    </button>
                                  )}
                                  {isRecording ? (
                                    <span className="text-[12px] font-semibold text-rose-200">Recording… camera is live</span>
                                  ) : null}
                                </div>
                                {fileName ? (
                                  <p className="mt-2 text-[12px] text-cyan-200/90">Selected: {fileName}</p>
                                ) : (
                                  <p className="mt-2 text-[11px] text-white/40">PDF, images, zip, or recorded video. Shown to admin with your text.</p>
                                )}
                              </div>
                              <button
                                type="button"
                                disabled={adminTaskBusyId === t.id || !(adminTaskDrafts[t.id] || "").trim()}
                                onClick={() => void submitAdminTask(t.id)}
                                className={cn(
                                  "w-full px-4 py-3 text-[14px] font-bold uppercase tracking-[0.08em]",
                                  CTA_BTN
                                )}
                              >
                                {adminTaskBusyId === t.id ? "Submitting…" : "Submit for admin review"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          ) : null}

          {!showStatsProfile && syndicateView === "dashboard" ? (
          <section className="syndicate-readable mt-10 w-full min-w-0 border-t border-[rgba(255,215,0,0.28)] px-2 py-6 sm:px-3 sm:py-7">
            <div className="text-center">
              <h3 className="flex flex-wrap items-center justify-center gap-3 text-[24px] font-black uppercase tracking-[0.1em] text-[color:var(--gold)] [text-shadow:0_0_22px_rgba(255,215,0,0.18)] sm:text-[28px] md:text-[32px]">
                <span>Points to pounds</span>
                <SyndicateHelpMark
                  topic="points-to-pounds"
                  label="How points to pounds and course unlocks work"
                  onOpen={setSyndicateHelpPanel}
                />
              </h3>
              <div className="mt-1 text-[17px] font-bold tabular-nums text-white/88 sm:mt-2 sm:text-[18px]">
                Rate: 100 points = 10 pounds
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-3xl text-center text-[17px] font-medium leading-[1.65] text-white/88 sm:text-[18px] sm:leading-relaxed">
              Convert your mission points into cash value. Enter any points amount you want to convert, and your pounds balance updates instantly using the current rate.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-cyan-400/65 bg-[linear-gradient(135deg,rgba(34,211,238,0.28),rgba(6,182,212,0.2)_45%,rgba(6,28,42,0.94)_100%)] px-3 py-3 text-center [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] [box-shadow:0_0_16px_rgba(34,211,238,0.3),inset_0_1px_0_rgba(200,250,255,0.35)]">
                <div className={cn(HUD_LABEL, "text-cyan-100/80")}>Day ends</div>
                <div
                  className={cn(
                    HUD_VALUE,
                    "text-[22px] text-cyan-100 [text-shadow:0_0_14px_rgba(34,211,238,0.35),0_1px_0_rgba(0,0,0,0.8)] sm:text-[26px]"
                  )}
                  title="Time until local midnight (daily mission window)"
                >
                  {formatCountdown(dayCountdownSec)}
                </div>
              </div>
              <div className="border border-sky-300/70 bg-[linear-gradient(135deg,rgba(56,189,248,0.34),rgba(59,130,246,0.24)_45%,rgba(10,20,60,0.92)_100%)] px-3 py-3 text-center [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] [box-shadow:0_0_14px_rgba(56,189,248,0.28),inset_0_1px_0_rgba(210,240,255,0.42)]">
                <div className={HUD_LABEL}>Available points</div>
                <div className={cn(HUD_VALUE, "text-[24px] text-sky-100")}>{pointsTotal}</div>
              </div>
              <div className="border border-emerald-300/70 bg-[linear-gradient(135deg,rgba(16,185,129,0.34),rgba(20,184,166,0.24)_45%,rgba(2,44,34,0.9)_100%)] px-3 py-3 text-center [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] [box-shadow:0_0_14px_rgba(16,185,129,0.26),inset_0_1px_0_rgba(190,255,225,0.4)]">
                <div className={HUD_LABEL}>Pounds balance</div>
                <div className={cn(HUD_VALUE, "text-[24px] text-emerald-100")}>£{poundsBalance.toFixed(2)}</div>
              </div>
              <div className="border border-amber-300/75 bg-[linear-gradient(135deg,rgba(251,191,36,0.34),rgba(245,158,11,0.26)_45%,rgba(66,32,2,0.92)_100%)] px-3 py-3 text-center [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] [box-shadow:0_0_14px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,237,170,0.42)]">
                <div className={HUD_LABEL}>Will receive</div>
                <div className={cn(HUD_VALUE, "text-[24px] text-amber-100")}>
                  £
                  {(
                    (((Math.max(0, parseFloat(convertPointsInput || "0")) || 0) / POINTS_PER_10_POUNDS) * POUNDS_PER_100_POINTS) || 0
                  ).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="w-full min-w-0 sm:w-auto">
                <label className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/70">Points to convert</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={convertPointsInput}
                  onChange={(e) => setConvertPointsInput(e.target.value)}
                  className="mt-1.5 block min-h-[44px] w-full max-w-full rounded-md border border-[rgba(255,215,0,0.45)] bg-[linear-gradient(180deg,rgba(28,22,12,0.92),rgba(10,8,6,0.96))] px-3 py-2.5 text-[16px] tabular-nums text-[#fefce8] [box-shadow:inset_0_1px_0_rgba(255,220,160,0.12)] sm:max-w-[220px] sm:text-[15px]"
                />
              </div>
              <button
                type="button"
                onClick={convertPointsToPounds}
                className={cn("min-h-[44px] w-full px-5 py-3 text-[15px] font-bold uppercase tracking-[0.08em] sm:w-auto", CTA_BTN)}
              >
                Convert now
              </button>
            </div>
          </section>
          ) : null}

          {syndicateView === "challenges" ? (
          <>
          <h3 className="syndicate-readable mt-2 text-[21px] font-black uppercase tracking-[0.1em] text-[color:var(--gold)] sm:text-[24px]">
            Today&apos;s missions
          </h3>
          <div className="syndicate-readable mt-3 w-full min-w-0 border-t border-[rgba(120,200,255,0.45)] px-2 py-3 sm:px-3 sm:py-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[18px] font-black uppercase tracking-[0.1em] text-[#a8d8ff] sm:text-[20px]">Create your mission</div>
              <SyndicateHelpMark topic="custom-mission" label="How creating your own mission works" onOpen={setSyndicateHelpPanel} />
            </div>
            <p className="mt-2 w-full min-w-0 text-[15px] leading-relaxed text-white/80 sm:text-[16px]">
              Up to <strong className="text-white/80">two</strong> per day. You set the title and difficulty; the server fills in{" "}
              <strong className="text-white/80">random points from 0–9</strong>, description, examples, and benefits, and keeps a short mindset summary for your next{" "}
              <strong className="text-white/80">custom missions</strong> and <strong className="text-white/80">mood + category</strong> picks.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 sm:min-w-[220px]">
                <label htmlFor="syndicate-custom-title" className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/70">
                  Title
                </label>
                <input
                  id="syndicate-custom-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  maxLength={220}
                  placeholder="What you want to accomplish today…"
                  disabled={busy !== null || userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY}
                  className="syndicate-readable mt-1.5 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2.5 text-[16px] text-white placeholder:text-white/45 disabled:opacity-45"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="syndicate-custom-diff" className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/70">
                  Difficulty
                </label>
                <select
                  id="syndicate-custom-diff"
                  value={customDifficulty}
                  onChange={(e) => setCustomDifficulty(e.target.value as "easy" | "medium" | "hard")}
                  disabled={busy !== null || userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY}
                  className={cn(SYNDICATE_SELECT_STATUS, "w-full min-w-0 sm:w-auto")}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <button
                type="button"
                disabled={busy !== null || userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY || customTitle.trim().length < 3}
                onClick={() => void createUserCustomTask()}
                className="rounded-lg border border-[rgba(120,200,255,0.55)] bg-[rgba(0,100,160,0.2)] px-5 py-2.5 text-[14px] font-bold uppercase tracking-wide text-[#b5e8ff] transition hover:bg-[rgba(0,100,160,0.35)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy === "custom" ? "Creating…" : "Create mission"}
              </button>
            </div>
            <p className="mt-3 text-[14px] font-medium text-white/70">
              {userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY
                ? "You’ve used both custom mission slots for today."
                : `${MAX_CUSTOM_COMPLETIONS_PER_DAY - userCustomCount} custom mission slot${MAX_CUSTOM_COMPLETIONS_PER_DAY - userCustomCount === 1 ? "" : "s"} left today.`}
            </p>
          </div>
          <div
            className={cn(
              "syndicate-readable grid grid-cols-1 gap-3 rounded-xl border border-[rgba(255,215,0,0.4)] bg-[linear-gradient(180deg,rgba(20,20,24,0.94)_0%,rgba(6,8,14,0.98)_100%)] px-4 py-3.5 [box-shadow:0_0_0_1px_rgba(255,215,0,0.14),0_0_24px_rgba(0,0,0,0.52)]",
              "md:grid-cols-3 md:items-end md:gap-3",
              "max-md:rounded-none max-md:border-x-0 max-md:px-3"
            )}
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="syndicate-dashboard-mood" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
                Mood
              </label>
              <select
                id="syndicate-dashboard-mood"
                value={statsMood}
                onChange={(e) => setStatsMood(e.target.value)}
                className={cn(SYNDICATE_SELECT_MOOD, "w-full min-w-0")}
                aria-label="Filter missions by mood"
              >
                {STATS_MOODS.map((m) => (
                  <option key={m} value={m}>
                    {STATS_MOOD_LABEL[m]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="syndicate-dashboard-category" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
                Category
              </label>
              <select
                id="syndicate-dashboard-category"
                value={catFilter}
                onChange={(e) =>
                  setCatFilter(e.target.value as "all" | (typeof CATEGORIES)[number])
                }
                className={cn(SYNDICATE_SELECT_CATEGORY, "w-full min-w-0")}
                aria-label="Filter missions by category"
              >
                <option value="all">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CAT_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="syndicate-dashboard-status" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
                Status
              </label>
              <select
                id="syndicate-dashboard-status"
                value={doneFilter}
                onChange={(e) => setDoneFilter(e.target.value as typeof doneFilter)}
                className={cn(SYNDICATE_SELECT_STATUS, "w-full min-w-0")}
                aria-label="Filter missions by completion status"
              >
                <option value="all">All</option>
                <option value="complete">Complete</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="syndicate-readable rounded-md border border-[rgba(255,59,59,0.55)] bg-[linear-gradient(180deg,rgba(255,59,59,0.16),rgba(255,59,59,0.08))] px-3 py-2 text-[13px] text-[#ffc9c9]">{error}</div>
          ) : null}

          {busy === "regen" ? (
            <div className="syndicate-readable rounded-md border border-[rgba(255,215,0,0.35)] bg-[rgba(30,22,0,0.3)] px-3 py-2 text-[12px] text-white/60">
              Regenerating today&apos;s missions and applying a fresh &quot;new day&quot; on this browser…
            </div>
          ) : null}
          {busy === "custom" ? (
            <div className="syndicate-readable rounded-md border border-[rgba(120,200,255,0.4)] bg-[rgba(0,25,40,0.45)] px-3 py-2 text-[12px] text-[#a8d8ff]/90">
              Building your mission (description, examples, benefits)…
            </div>
          ) : null}

          {busy === "load" && rows.length === 0 && !error ? (
            <div
              className="syndicate-readable flex flex-col items-center justify-center gap-4 py-16"
              role="status"
              aria-live="polite"
              aria-label="Loading missions"
            >
              <div
                className="h-11 w-11 animate-spin rounded-full border-2 border-[rgba(255,215,0,0.35)] border-t-[color:var(--gold)]"
                aria-hidden
              />
              <p className="text-[14px] text-white/50">Loading missions…</p>
            </div>
          ) : null}

          {dailyBatchStreaming && filteredRows.length === 0 && rows.length > 0 && !error ? (
            <div
              className="syndicate-readable flex flex-col items-center justify-center gap-3 rounded-md border border-[rgba(120,200,255,0.25)] bg-[rgba(0,30,48,0.35)] py-12"
              role="status"
              aria-live="polite"
              aria-label="Loading more missions"
            >
              <div
                className="h-9 w-9 animate-spin rounded-full border-2 border-[rgba(255,215,0,0.35)] border-t-[color:var(--gold)]"
                aria-hidden
              />
              <p className="text-[13px] font-medium text-cyan-100/85">Generating missions…</p>
              <p className="max-w-sm px-4 text-center text-[12px] text-white/50">
                More categories and moods are still loading. This is not your final list.
              </p>
            </div>
          ) : null}

          {!busy && !dailyBatchStreaming && filteredRows.length === 0 && rows.length > 0 ? (
            <div className="syndicate-readable rounded-md border border-white/10 py-8 text-center text-[13px] text-white/50">No missions match these filters.</div>
          ) : null}

          {!busy && !dailyBatchStreaming && rows.length === 0 && !error ? (
            <div className="syndicate-readable rounded-lg border border-white/10 bg-black/35 py-10 text-center text-[13px] text-white/55">
              No missions for today. Check that the API is running, mindsets are ingested on the server, then reload.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {CATEGORIES.map((cat) => {
              const list = byCategoryFiltered[cat] ?? [];
              if (list.length === 0) return null;
              return (
                <div key={cat}>
                  <h4 className="syndicate-readable mb-3 border-b border-[rgba(255,215,0,0.2)] pb-2 text-[13px] font-bold uppercase tracking-[0.2em] text-[color:var(--gold)]/90">
                    {CAT_LABEL[cat] ?? cat}
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {list.map((row) => (
                      <CompactCard
                        key={row.id}
                        row={row}
                        done={doneIds.has(row.id)}
                        dayCountdownSec={dayCountdownSec}
                        onView={() => openMissionDetail(row)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {(byCategoryFiltered.other ?? []).length > 0 ? (
              <div key="other-cat">
                <h4 className="syndicate-readable mb-3 border-b border-[rgba(255,215,0,0.2)] pb-2 text-[13px] font-bold uppercase tracking-[0.2em] text-white/75">
                  Other
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {(byCategoryFiltered.other ?? []).map((row) => (
                    <CompactCard
                      key={row.id}
                      row={row}
                      done={doneIds.has(row.id)}
                      dayCountdownSec={dayCountdownSec}
                      onView={() => openMissionDetail(row)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          </>
          ) : null}
        </>
      
    </div>
    </>
  );
}
