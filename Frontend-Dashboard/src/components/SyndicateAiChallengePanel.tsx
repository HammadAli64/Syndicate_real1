"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
  fetchAgentQuote,
  fetchLeaderboard,
  getChallengeBenefits,
  getChallengeExamples,
  syncLeaderboard,
  type LeaderboardRow
} from "@/app/challenges/services/challengesApi";
import type { ChallengeRow } from "@/app/challenges/services/challengesApi";

const API_BASE = (process.env.NEXT_PUBLIC_SYNDICATE_API_URL ?? "http://127.0.0.1:8000/api").replace(/\/$/, "");

export type { ChallengeRow } from "@/app/challenges/services/challengesApi";

const LS_POINTS = "syndicate:points_total";
const LS_DONE = "syndicate:completed_challenge_ids";
const LS_RESPONSES = "syndicate:challenge_responses";
const LS_STREAK = "syndicate:streak_count";
const LS_LAST_DAY = "syndicate:last_activity_day";
const LS_STREAK_BEFORE = "syndicate:streak_before_break";
const LS_BREAK_AT = "syndicate:streak_break_date";
const LS_DEVICE = "syndicate:device_id";
const LS_HISTORY = "syndicate:points_history_v1";
const LS_DISPLAY_NAME = "syndicate:display_name";
const LS_AGENT_QUOTE_CACHE = "syndicate:agent_quote_v2";
/** Per calendar day: how many challenges were loaded vs completed (this device). */
const LS_CHALLENGE_DAY = "syndicate:challenge_day_v1";

const CATEGORIES = ["business", "money", "fitness", "power", "grooming"] as const;

const CAT_LABEL: Record<string, string> = {
  business: "Business",
  money: "Money",
  fitness: "Fitness",
  power: "Power",
  grooming: "Grooming"
};

/** Moods for Stats & profile filtering (matches API + challenge suitable_moods). */
const STATS_MOODS = ["energetic", "happy", "sad", "tired"] as const;

const STATS_MOOD_LABEL: Record<string, string> = {
  energetic: "Energetic",
  happy: "Happy",
  sad: "Sad",
  tired: "Tired"
};

/**
 * Narrow hints for inferring a single bucket when `suitable_moods` does not name a mood explicitly.
 * Avoid generic words like "focus" or "positive" — they appeared in almost every row and made every mood match.
 */
const STATS_MOOD_HINTS_INFER: Record<(typeof STATS_MOODS)[number], string[]> = {
  energetic: ["energetic", "energy", "motivated", "drive", "active", "momentum", "upbeat", "vigor"],
  happy: ["happy", "joy", "grateful", "celebrate", "optimism", "uplift", "cheerful", "delight"],
  sad: ["sad", "comfort", "gentle", "healing", "empathy", "validation", "grief", "sorrow"],
  tired: ["tired", "rest", "relax", "recovery", "ease", "slow", "exhausted", "fatigue", "burnout"]
};

/** Best-effort primary mood for a row when the dropdown filter is applied. */
function inferStatsMoodForRow(row: ChallengeRow): (typeof STATS_MOODS)[number] {
  const p = row.payload;
  const sm = Array.isArray(p?.suitable_moods) ? p.suitable_moods.map((x) => String(x).toLowerCase()) : [];
  const smBlob = sm.join(" ");

  for (const mk of STATS_MOODS) {
    if (smBlob.includes(mk)) return mk;
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

/** Filter by mood: new daily batches store exact mood on `row.mood` (per category × 2). */
function challengeMatchesStatsMood(row: ChallengeRow, mood: string): boolean {
  const m = mood.toLowerCase();
  const rowMood = (row.mood || "").toLowerCase();

  if (isPrimaryStatsMood(rowMood)) {
    return rowMood === m;
  }

  const list = row.payload?.suitable_moods;
  const sm = Array.isArray(list) ? list.map((x) => String(x).toLowerCase()) : [];

  if (rowMood && rowMood !== "daily" && (rowMood === m || rowMood.includes(m))) return true;
  if (sm.some((s) => s.includes(m))) return true;

  return inferStatsMoodForRow(row) === m;
}

/** Distinct slices for pie (categories). */
const PIE_COLORS = ["#ffd54a", "#4fd1b8", "#7b9cff", "#ff7ab8", "#c792ea", "#ff9f43", "#00e5ff", "#69f0ae"];

/** One color per day in the weekly bar chart (7 bars). */
const WEEK_BAR_COLORS = ["#ff6b9d", "#ffd54a", "#4fd1b8", "#7b9cff", "#c792ea", "#ff9f43", "#69f0ae"];

/** Native `<select>`: colors from globals.css (`.syndicate-select--*`) so options stay legible on Windows. */
const SYNDICATE_SELECT_BASE =
  "syndicate-select syndicate-readable min-h-[40px] min-w-[132px] cursor-pointer rounded-lg px-3 py-2 text-[14px] font-medium outline-none transition focus:outline-none focus:ring-2";

const SYNDICATE_SELECT_MOOD = `${SYNDICATE_SELECT_BASE} syndicate-select--mood focus:ring-[rgba(160,170,255,0.35)]`;

const SYNDICATE_SELECT_CATEGORY = `${SYNDICATE_SELECT_BASE} syndicate-select--category focus:ring-[rgba(255,215,0,0.28)]`;

const SYNDICATE_SELECT_STATUS = `${SYNDICATE_SELECT_BASE} syndicate-select--status focus:ring-[rgba(72,220,180,0.35)]`;

const SYNDICATE_DATE_INPUT =
  "syndicate-date-input syndicate-readable mt-1.5 block w-full rounded-lg border border-[rgba(255,215,0,0.4)] bg-[#0a0e14] px-3 py-2.5 text-[15px] font-medium text-white/95 outline-none focus:border-[rgba(255,215,0,0.7)] focus:ring-2 focus:ring-[rgba(255,215,0,0.12)]";

type DayBucket = { total: number; byCategory: Record<string, number> };
type HistoryV1 = { days: Record<string, DayBucket> };

function loadHistory(): HistoryV1 {
  if (typeof window === "undefined") return { days: {} };
  try {
    const raw = window.localStorage.getItem(LS_HISTORY);
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
  window.localStorage.setItem(LS_HISTORY, JSON.stringify(h));
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
    const raw = window.localStorage.getItem(LS_CHALLENGE_DAY);
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
  window.localStorage.setItem(LS_CHALLENGE_DAY, JSON.stringify(d));
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

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(isoA: string, isoB: string): number {
  const d0 = new Date(isoA + "T12:00:00");
  const d1 = new Date(isoB + "T12:00:00");
  return Math.round((d1.getTime() - d0.getTime()) / 86400000);
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(LS_DEVICE);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(LS_DEVICE, id);
  }
  return id;
}

function loadDoneIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LS_DONE);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function loadTotalPoints(): number {
  if (typeof window === "undefined") return 0;
  const n = parseInt(window.localStorage.getItem(LS_POINTS) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

function loadStreak(): number {
  if (typeof window === "undefined") return 0;
  const n = parseInt(window.localStorage.getItem(LS_STREAK) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

function loadResponses(): Record<number, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_RESPONSES);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, string>;
  } catch {
    return {};
  }
}

function persistDone(ids: Set<number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_DONE, JSON.stringify([...ids]));
}

function persistPoints(n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_POINTS, String(n));
}

function persistResponses(r: Record<number, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_RESPONSES, JSON.stringify(r));
}

/** If user missed ≥1 full day of activity, streak resets to 0. */
function evaluateStreakBreakOnMount(): void {
  if (typeof window === "undefined") return;
  const last = window.localStorage.getItem(LS_LAST_DAY);
  if (!last) return;
  const today = todayLocalISO();
  if (last >= today) return;
  const gap = daysBetween(last, today);
  if (gap >= 2) {
    const s = parseInt(window.localStorage.getItem(LS_STREAK) || "0", 10);
    if (s > 0) {
      window.localStorage.setItem(LS_STREAK_BEFORE, String(s));
      window.localStorage.setItem(LS_STREAK, "0");
      window.localStorage.setItem(LS_BREAK_AT, today);
    }
  }
}

function withinRestoreWindow(): boolean {
  if (typeof window === "undefined") return false;
  const br = window.localStorage.getItem(LS_BREAK_AT);
  if (!br) return false;
  const start = new Date(br + "T12:00:00");
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + 7);
  return new Date() <= deadline;
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
  onView
}: {
  row: ChallengeRow;
  done: boolean;
  onView: () => void;
}) {
  const p = row.payload;
  const title = p?.challenge_title ?? "Challenge";
  const pts = row.points ?? p?.points ?? 0;

  return (
    <div className="syndicate-readable flex min-h-[220px] flex-col justify-between rounded-lg border border-[rgba(255,215,0,0.35)] bg-black/50 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)] sm:min-h-[240px] sm:p-5">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded border border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.08)] px-2.5 py-0.5 text-[11px] font-bold tabular-nums uppercase tracking-wide text-[color:var(--gold)]">
            {pts} pts
          </span>
          {done ? (
            <span className="rounded border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              Complete
            </span>
          ) : (
            <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
              Incomplete
            </span>
          )}
        </div>
        <h4 className="min-h-[4.5rem] text-[19px] font-semibold leading-[1.32] tracking-tight text-white sm:min-h-[5.25rem] sm:text-[21px] md:min-h-[5.75rem] md:text-[23px] md:leading-[1.3] lg:text-[24px]">
          {title}
        </h4>
      </div>
      <button
        type="button"
        onClick={onView}
        className="syndicate-readable mt-4 w-full rounded-md border border-[rgba(255,215,0,0.55)] bg-[rgba(255,215,0,0.1)] py-2.5 text-[13px] font-semibold text-[color:var(--gold)] transition hover:bg-[rgba(255,215,0,0.18)]"
      >
        View detail
      </button>
    </div>
  );
}

function DetailPane({
  row,
  initialResponse,
  onBack,
  onSubmit
}: {
  row: ChallengeRow;
  initialResponse: string;
  onBack: () => void;
  onSubmit: (text: string) => void;
}) {
  const p = row.payload;
  const [text, setText] = useState(initialResponse);
  const examples = getChallengeExamples(p);
  const benefits = getChallengeBenefits(p);

  useEffect(() => {
    setText(initialResponse);
  }, [initialResponse, row.id]);

  return (
    <div className="syndicate-readable syndicate-detail-pane">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-[14px] font-semibold text-[color:var(--gold)] underline-offset-4 hover:underline"
      >
        ← Back to challenges
      </button>
      <div className="rounded-lg border border-[rgba(255,215,0,0.4)] bg-black/55 p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded border border-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase text-white/75">
            {row.category}
          </span>
          <span className={cn("rounded border px-2 py-0.5 text-[11px] font-semibold uppercase", difficultyStyle(row.difficulty))}>
            {row.difficulty} · {row.points} pts
          </span>
        </div>
        <h3 className="text-[26px] font-bold leading-[1.2] tracking-tight text-white md:text-[32px] md:leading-[1.15]">
          {p.challenge_title}
        </h3>

        <section className="mt-6">
          <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]/85">About this challenge</h4>
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
            <p className="mt-3 text-[15px] text-white/55">No examples listed for this challenge.</p>
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
            <p className="mt-3 text-[15px] text-white/55">No benefits listed for this challenge.</p>
          )}
        </section>

        <p className="mt-7 text-[15px] leading-relaxed text-white/70">
          <span className="text-white/50">Mindset: </span>
          <span className="text-[color:var(--gold)]/95">{p.based_on_mindset}</span>
        </p>

        <div className="mt-8 border-t border-white/10 pt-5">
          <label className="mb-2 block text-[13px] font-semibold text-white/80" htmlFor="challenge-response">
            Your response
          </label>
          <textarea
            id="challenge-response"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Write how you will complete this challenge or what you learned…"
            className="syndicate-readable w-full resize-y rounded-md border border-[rgba(255,215,0,0.35)] bg-black/60 px-3 py-2.5 text-[15px] leading-relaxed text-white/95 outline-none placeholder:text-white/35 focus:border-[rgba(255,215,0,0.65)]"
          />
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => onSubmit(text.trim())}
            className="syndicate-readable mt-3 rounded-md border border-[rgba(255,215,0,0.6)] bg-[rgba(255,215,0,0.15)] px-5 py-2.5 text-[15px] font-semibold text-[color:var(--gold)] transition hover:bg-[rgba(255,215,0,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit completion
          </button>
        </div>
      </div>
    </div>
  );
}

export function SyndicateAiChallengePanel() {
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>("load");
  const [selected, setSelected] = useState<ChallengeRow | null>(null);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<number>>(() => new Set());
  const [streak, setStreak] = useState(0);
  const [catFilter, setCatFilter] = useState<"all" | (typeof CATEGORIES)[number]>("all");
  const [doneFilter, setDoneFilter] = useState<"all" | "complete" | "incomplete">("incomplete");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [canClaimRestore, setCanClaimRestore] = useState(false);
  const [referralMsg, setReferralMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  /** Inline stats + profile panel (not a modal). */
  const [showStatsProfile, setShowStatsProfile] = useState(false);
  /** Filter challenges inside Stats & profile by mood (default: energetic). */
  const [statsMood, setStatsMood] = useState<string>("energetic");
  const [profileName, setProfileName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leaderboardErr, setLeaderboardErr] = useState<string | null>(null);
  const [challengeLogVersion, setChallengeLogVersion] = useState(0);
  const [historyFilterDate, setHistoryFilterDate] = useState(() => todayLocalISO());
  const lineGradientUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  useEffect(() => {
    setMounted(true);
    evaluateStreakBreakOnMount();
    setPointsTotal(loadTotalPoints());
    setDoneIds(loadDoneIds());
    setStreak(loadStreak());
    if (typeof window !== "undefined") {
      setProfileName(window.localStorage.getItem(LS_DISPLAY_NAME) ?? "");
    }
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

  const [agentQuoteText, setAgentQuoteText] = useState("");
  const [agentQuoteHint, setAgentQuoteHint] = useState<string | null>(null);
  const agentQuoteReadyRef = useRef(false);

  useEffect(() => {
    const today = todayLocalISO();
    try {
      const raw = window.localStorage.getItem(LS_AGENT_QUOTE_CACHE);
      if (raw) {
        const j = JSON.parse(raw) as { date: string; text: string };
        if (j.date === today && j.text) {
          setAgentQuoteText(j.text);
          agentQuoteReadyRef.current = true;
        }
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    void fetchAgentQuote()
      .then((res) => {
        if (cancelled) return;
        if (res.quote) {
          setAgentQuoteText(res.quote);
          setAgentQuoteHint(null);
          agentQuoteReadyRef.current = true;
          try {
            window.localStorage.setItem(LS_AGENT_QUOTE_CACHE, JSON.stringify({ date: res.date, text: res.quote }));
          } catch {
            /* ignore */
          }
        } else if (!agentQuoteReadyRef.current) {
          setAgentQuoteHint(res.detail ?? "Brief not available yet.");
        }
      })
      .catch(() => {
        if (cancelled || agentQuoteReadyRef.current) return;
        setAgentQuoteHint("Unable to load agent brief. Check the API and OPENAI_API_KEY.");
      });

    const onVis = () => {
      if (document.visibilityState !== "visible" || cancelled) return;
      void fetchAgentQuote()
        .then((res) => {
          if (cancelled || !res.quote) return;
          setAgentQuoteText(res.quote);
          setAgentQuoteHint(null);
          try {
            window.localStorage.setItem(LS_AGENT_QUOTE_CACHE, JSON.stringify({ date: res.date, text: res.quote }));
          } catch {
            /* ignore */
          }
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(() => {
      void syncLeaderboard(getDeviceId(), pointsTotal, profileName.trim() || "Anonymous").catch(() => {
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
    try {
      const r = await fetch(challengesApiUrl(`referral/status/?device_id=${encodeURIComponent(device)}`));
      const j = await r.json();
      if (r.ok) setCanClaimRestore(!!j.can_claim);
    } catch {
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
    return rows.filter((r) => {
      if (!challengeMatchesStatsMood(r, statsMood)) return false;
      const k = (r.category || r.payload?.category || "").toLowerCase();
      if (catFilter !== "all" && k !== catFilter) return false;
      const done = doneIds.has(r.id);
      if (doneFilter === "complete" && !done) return false;
      if (doneFilter === "incomplete" && done) return false;
      return true;
    });
  }, [rows, catFilter, doneFilter, doneIds, statsMood]);

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
      m[c].sort((a, b) => (a.slot || 0) - (b.slot || 0));
    }
    return m;
  }, [filteredRows]);

  const statsMoodFilteredRows = useMemo(() => {
    return rows.filter((r) => challengeMatchesStatsMood(r, statsMood));
  }, [rows, statsMood]);

  /** Isolated from mood filter updates so Recharts does not redraw on every mood change. */
  const statsProfileChartsLeftColumn = useMemo(
    () => (
      <div className="min-w-0 space-y-10">
        <div>
          <h3 className="mb-3 text-[15px] font-bold uppercase tracking-[0.12em] text-white/80 sm:text-[16px]">
            Today · points by category (pie)
          </h3>
          <div className="h-[260px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDailyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={96}
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
                <Legend wrapperStyle={{ fontSize: 15, paddingTop: 8 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-bold uppercase tracking-[0.12em] text-white/80 sm:text-[16px]">
            Weekly · points (bar)
          </h3>
          <div className="h-[260px] w-full sm:h-[280px]">
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
            Monthly · daily points (line)
          </h3>
          <div className="h-[280px] w-full sm:h-[300px]">
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
      const [stRes, tdRes] = await Promise.all([
        fetch(`${API_BASE}/mindset/status/`),
        fetch(challengesApiUrl("today/"))
      ]);
      const st = await stRes.json();
      const td = await tdRes.json();

      if (!st.ready) {
        const boot = await fetch(`${API_BASE}/syndicate/bootstrap/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auto_ingest: true,
            auto_challenge: true,
            mood: "stressed",
            force_reingest: false
          })
        });
        const bj = await boot.json();
        if (!boot.ok) {
          setError(typeof bj.detail === "string" ? bj.detail : "Sync failed");
          setRows([]);
          return;
        }
        const td2 = await fetch(challengesApiUrl("today/")).then((r) => r.json());
        setRows(td2.results ?? []);
        return;
      }

      if (!tdRes.ok) {
        setError(typeof td.detail === "string" ? td.detail : "Could not load today’s challenges");
        setRows([]);
        return;
      }
      setRows(td.results ?? []);
    } catch {
      setError("Cannot reach the API. Run: python manage.py runserver (in Backend/)");
      setRows([]);
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    void loadFast();
  }, [loadFast]);

  useEffect(() => {
    if (!mounted || !rows.length) return;
    const iso = calendarIsoFromRows(rows);
    recordOfferedSnapshot(iso, rows.length);
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
    const offered =
      isSelectedToday && rows.length > 0
        ? rows.length
        : challengeDayData.offeredByDate[iso] ?? null;
    const completed = isSelectedToday
      ? rows.filter((r) => doneIds.has(r.id)).length
      : challengeDayData.completionsByDate[iso] ?? 0;
    const missed = offered !== null ? Math.max(0, offered - completed) : null;
    return { offered, completed, missed, isSelectedToday };
  }, [challengeDayData, historyFilterDate, rows, doneIds]);

  const lastSevenDayChallengeRows = useMemo(() => {
    const today = todayLocalISO();
    const dates = lastNDatesFrom(today, 7).slice().reverse();
    return dates.map((iso) => {
      const isRowToday = iso === today;
      const offered =
        isRowToday && rows.length > 0
          ? rows.length
          : challengeDayData.offeredByDate[iso] ?? null;
      const completed = isRowToday
        ? rows.filter((r) => doneIds.has(r.id)).length
        : challengeDayData.completionsByDate[iso] ?? 0;
      const missed = offered !== null ? Math.max(0, offered - completed) : null;
      return { iso, offered, completed, missed };
    });
  }, [challengeDayData, rows, doneIds, challengeLogVersion]);

  const regenerateNewDay = useCallback(async () => {
    setError(null);
    setBusy("regen");
    try {
      const r = await fetch(challengesApiUrl("generate_daily/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true })
      });
      const j = (await r.json()) as { detail?: string; results?: ChallengeRow[] };
      if (!r.ok) {
        setError(typeof j.detail === "string" ? j.detail : "Regenerate failed");
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LS_DONE);
        window.localStorage.removeItem(LS_RESPONSES);
        window.localStorage.setItem(LS_POINTS, "0");
        window.localStorage.setItem(LS_STREAK, "0");
        window.localStorage.removeItem(LS_LAST_DAY);
        window.localStorage.removeItem(LS_STREAK_BEFORE);
        window.localStorage.removeItem(LS_BREAK_AT);
        resetChallengeDayForDate(todayLocalISO());
      }
      setPointsTotal(0);
      setDoneIds(new Set());
      setStreak(0);
      setRows(j.results ?? []);
      setSelected(null);
      setChallengeLogVersion((v) => v + 1);
    } catch {
      setError("Regenerate failed (network).");
    } finally {
      setBusy(null);
    }
  }, []);

  async function createInviteCode() {
    setReferralMsg(null);
    try {
      const r = await fetch(challengesApiUrl("referral/create/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: getDeviceId() })
      });
      const j = await r.json();
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Failed");
        return;
      }
      setInviteCode(j.code);
    } catch {
      setReferralMsg("Could not create code.");
    }
  }

  async function redeemFriend() {
    setReferralMsg(null);
    try {
      const r = await fetch(challengesApiUrl("referral/redeem/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: friendCode.trim().toUpperCase(), device_id: getDeviceId() })
      });
      const j = await r.json();
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Invalid");
        return;
      }
      setReferralMsg("Code applied. Thanks for helping a friend.");
      setFriendCode("");
    } catch {
      setReferralMsg("Network error.");
    }
  }

  async function claimRestore() {
    setReferralMsg(null);
    try {
      const r = await fetch(challengesApiUrl("referral/claim/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: getDeviceId() })
      });
      const j = await r.json();
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Cannot claim");
        return;
      }
      const prev = parseInt(window.localStorage.getItem(LS_STREAK_BEFORE) || "1", 10);
      window.localStorage.setItem(LS_STREAK, String(Math.max(1, prev)));
      window.localStorage.removeItem(LS_STREAK_BEFORE);
      window.localStorage.removeItem(LS_BREAK_AT);
      setStreak(Math.max(1, prev));
      setCanClaimRestore(false);
      setReferralMsg("Streak restored.");
    } catch {
      setReferralMsg("Network error.");
    }
  }

  function handleSubmit(text: string) {
    if (!selected) return;
    const id = selected.id;
    const responses = loadResponses();
    responses[id] = text;
    persistResponses(responses);

    const nextDone = new Set(doneIds);
    let total = pointsTotal;
    const today = todayLocalISO();
    const lastDay = window.localStorage.getItem(LS_LAST_DAY);

    if (!nextDone.has(id)) {
      nextDone.add(id);
      const pts = selected.points || 0;
      total += pts;
      persistDone(nextDone);
      persistPoints(total);
      setDoneIds(nextDone);
      setPointsTotal(total);
      const cat = (selected.category || selected.payload?.category || "business").toLowerCase();
      appendPointsForDay(today, cat, pts);
      recordCompletionForDay(today);
      setChallengeLogVersion((v) => v + 1);

      if (lastDay !== today) {
        const prevStreak = parseInt(window.localStorage.getItem(LS_STREAK) || "0", 10);
        let nextStreak = 1;
        if (lastDay) {
          const gap = daysBetween(lastDay, today);
          nextStreak = gap === 1 ? prevStreak + 1 : 1;
        }
        window.localStorage.setItem(LS_STREAK, String(nextStreak));
        window.localStorage.setItem(LS_LAST_DAY, today);
        setStreak(nextStreak);
      }
    }
    setSelected(null);
  }

  const initialResp = selected ? loadResponses()[selected.id] ?? "" : "";

  const showRestore = mounted && streak === 0 && withinRestoreWindow();

  if (selected) {
    return (
      <DetailPane
        row={selected}
        initialResponse={initialResp}
        onBack={() => setSelected(null)}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="space-y-4">
      {!showStatsProfile ? (
        <aside className="syndicate-readable relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[rgba(255,215,0,0.28)] bg-[linear-gradient(135deg,rgba(255,215,0,0.07),rgba(20,30,50,0.55)_50%,rgba(60,20,80,0.12))] px-4 py-4 text-center sm:px-6 sm:py-5 [box-shadow:0_0_28px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(-45deg,rgba(255,215,0,0.03)_0,rgba(255,215,0,0.03)_1px,transparent_1px,transparent_10px)]" aria-hidden />
          <div className="relative">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded border border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.1)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--gold)] sm:text-[11px]">
                Syndicate agent
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/40 sm:text-[11px]">Daily brief</span>
            </div>
            <p className="text-[15px] font-bold leading-relaxed text-white/88 sm:text-[16px] md:text-[17px]">
              {agentQuoteText
                ? agentQuoteText
                : agentQuoteHint
                  ? agentQuoteHint
                  : "Syncing agent brief…"}
            </p>
          </div>
        </aside>
      ) : null}

      <div className="mb-3 flex flex-col gap-4 border-b border-[rgba(255,215,0,0.22)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 text-[13px] font-extrabold uppercase tracking-[0.2em] text-white/75 sm:text-[14px]">
            <span className="inline-flex h-3 w-3 shrink-0 animate-pulse rounded-full bg-[#ff3b3b] shadow-[0_0_14px_rgba(255,59,59,0.9)]" />
            System Status: ACTIVE
          </div>
          <h3 className="text-[26px] font-black uppercase leading-tight tracking-[0.08em] text-[color:var(--gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.5)] sm:text-[34px] md:text-[38px]">
            Syndicate Mode: Challenges
          </h3>
        </div>
        <div className="flex shrink-0 justify-start sm:justify-end">
          <button
            type="button"
            aria-expanded={showStatsProfile}
            aria-controls="syndicate-stats-profile"
            onClick={() => setShowStatsProfile((s) => !s)}
            className={cn(
              "rounded-lg border px-5 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.18em] transition sm:px-6 sm:py-4 sm:text-[14px]",
              showStatsProfile
                ? "border-[rgba(0,255,180,0.55)] bg-[rgba(0,255,180,0.12)] text-[#baffdd] [box-shadow:0_0_20px_rgba(0,255,180,0.18)]"
                : "border-[rgba(255,215,0,0.55)] bg-[rgba(255,215,0,0.1)] text-[color:var(--gold)] hover:bg-[rgba(255,215,0,0.18)]"
            )}
          >
            {showStatsProfile ? "Hide stats & profile" : "Stats & profile"}
          </button>
        </div>
      </div>

      {showStatsProfile ? (
        <section
          id="syndicate-stats-profile"
          className="syndicate-readable scroll-mt-4 rounded-xl border border-[rgba(255,215,0,0.32)] bg-[linear-gradient(165deg,rgba(255,215,0,0.08),rgba(0,40,60,0.38)_45%,rgba(80,40,120,0.14))] p-6 sm:p-8 [box-shadow:0_0_32px_rgba(0,0,0,0.5)]"
        >
          <h2 className="mb-2 text-[20px] font-black uppercase leading-tight tracking-[0.1em] text-[color:var(--gold)] sm:text-[24px]">
            Stats &amp; profile
          </h2>

          <div className="mb-10 rounded-xl border border-[rgba(255,215,0,0.35)] bg-[rgba(0,0,0,0.38)] p-5 sm:p-6 [box-shadow:0_0_24px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="min-w-0 text-[17px] font-black uppercase leading-tight tracking-[0.14em] text-[color:var(--gold)] [text-shadow:0_0_18px_rgba(255,215,0,0.35)] sm:text-[19px]">
                Challenges by mood
              </h3>
              <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
                <label htmlFor="syndicate-stats-mood" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Mood
                </label>
                <select
                  id="syndicate-stats-mood"
                  value={statsMood}
                  onChange={(e) => setStatsMood(e.target.value)}
                  className={SYNDICATE_SELECT_MOOD}
                >
                  {STATS_MOODS.map((m) => (
                    <option key={m} value={m}>
                      {STATS_MOOD_LABEL[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-white/55">
              Default is <strong className="text-white/75">Energetic</strong>. Pick a mood to show today&apos;s challenges that fit that tone (uses{" "}
              <strong className="text-white/70">suitable moods</strong> from each challenge plus keyword hints).
              {statsMoodFilteredRows.length === 0 ? (
                <>
                  {" "}
                  <span className="text-white/50">
                    No challenges match &quot;{STATS_MOOD_LABEL[statsMood] ?? statsMood}&quot; for today yet. Try another mood, or reload after new challenges are generated.
                  </span>
                </>
              ) : null}
            </p>
            {statsMoodFilteredRows.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {statsMoodFilteredRows.map((row) => (
                  <CompactCard
                    key={row.id}
                    row={row}
                    done={doneIds.has(row.id)}
                    onView={() => setSelected(row)}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            {statsProfileChartsLeftColumn}

            <div className="min-w-0 space-y-7 lg:border-l lg:border-white/10 lg:pl-10">
              <div className="rounded-lg border border-white/12 bg-black/45 p-5 sm:p-6">
                <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/60">Total points</div>
                <div className="mt-2 text-[36px] font-black tabular-nums leading-none text-[color:var(--gold)] sm:text-[42px]">{pointsTotal}</div>
              </div>

              <div>
                <label className="text-[14px] font-semibold text-white/70">Display name (leaderboard)</label>
                <div className="mt-2 flex flex-wrap gap-3">
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Anonymous"
                    className="syndicate-readable min-w-[200px] flex-1 rounded-lg border border-white/25 bg-black/50 px-3 py-2.5 text-[16px] text-white placeholder:text-white/35"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const n = profileName.trim() || "Anonymous";
                      window.localStorage.setItem(LS_DISPLAY_NAME, n);
                      setProfileName(n);
                      void syncLeaderboard(getDeviceId(), pointsTotal, n);
                    }}
                    className="rounded-lg border border-[rgba(0,255,180,0.45)] bg-[rgba(0,255,180,0.08)] px-5 py-2.5 text-[15px] font-semibold text-[#baffdd]"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-[rgba(255,215,0,0.25)] bg-black/40 p-4">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-white/55">Best category</div>
                  <div className="mt-2 text-[16px] font-semibold leading-snug text-white">
                    {CATEGORIES.reduce((s, c) => s + (bestWorst.totals[c] ?? 0), 0) > 0 && bestWorst.best
                      ? `${CAT_LABEL[bestWorst.best.cat] ?? bestWorst.best.cat} (${bestWorst.best.pts} pts)`
                      : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-[rgba(255,215,0,0.25)] bg-black/40 p-4">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-white/55">Lowest category</div>
                  <div className="mt-2 text-[16px] font-semibold leading-snug text-white">
                    {CATEGORIES.reduce((s, c) => s + (bestWorst.totals[c] ?? 0), 0) > 0 && bestWorst.worst
                      ? `${CAT_LABEL[bestWorst.worst.cat] ?? bestWorst.worst.cat} (${bestWorst.worst.pts} pts)`
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[rgba(120,200,255,0.35)] bg-[rgba(0,40,80,0.22)] p-5 sm:p-6">
                <div className="text-[15px] font-bold uppercase tracking-wide text-[#a8d8ff]">Restore streak (invite a friend)</div>
                <p className="mt-2 text-[15px] leading-relaxed text-white/65">
                  After a streak break (7-day window), share a code or redeem a friend&apos;s code.
                </p>
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
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="min-w-[180px] flex-1">
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
                    className="rounded-md border border-white/30 px-4 py-2.5 text-[14px] font-semibold text-white/90"
                  >
                    Redeem
                  </button>
                </div>
                {referralMsg ? <p className="mt-3 text-[14px] text-[#b5ecff]/90">{referralMsg}</p> : null}
              </div>

              <div>
                <h3 className="text-[15px] font-bold uppercase tracking-[0.12em] text-white/75 sm:text-[16px]">Leaderboard · top 10</h3>
                {leaderboardErr ? (
                  <p className="mt-3 text-[15px] text-rose-300/90">{leaderboardErr}</p>
                ) : leaderboard.length === 0 ? (
                  <p className="mt-3 text-[15px] leading-relaxed text-white/55">No entries yet. Earn points and sync automatically.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto rounded-lg border border-white/12 bg-black/35">
                    <table className="w-full min-w-[300px] text-left text-[15px]">
                      <thead className="border-b border-white/10 text-[12px] uppercase tracking-[0.12em] text-white/60">
                        <tr>
                          <th className="px-4 py-3">Number</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((e, i) => (
                          <tr key={`${e.rank}-${e.display_name}-${i}`} className="border-t border-white/5 text-white/90">
                            <td className="px-4 py-3 tabular-nums text-white/65">{e.rank}</td>
                            <td className="px-4 py-3 font-medium">{e.display_name}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-[color:var(--gold)]">{e.points_total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-[rgba(255,215,0,0.2)] pt-8">
            <div className="rounded-xl border border-[rgba(120,200,255,0.3)] bg-[rgba(0,35,55,0.45)] p-5 sm:p-7 [box-shadow:0_0_24px_rgba(0,0,0,0.35)]">
              <h3 className="text-[16px] font-black uppercase tracking-[0.12em] text-[#a8d8ff] sm:text-[17px]">
                Challenge history · completed vs missed
              </h3>
              <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-white/62">
                Pick a date to see how many challenges were on your list that day, how many you completed, and how many were left undone.
                &quot;Offered&quot; is saved when this page loads that day&apos;s challenges on this device — past days only appear if you opened Syndicate then.
              </p>
              <div className="mt-5 flex flex-wrap items-end gap-3 sm:gap-4">
                <div className="min-w-[200px]">
                  <label htmlFor="syndicate-history-date" className="text-[13px] font-semibold text-white/65">
                    Filter by date
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
                  className="rounded-lg border border-[rgba(0,255,180,0.45)] bg-[rgba(0,255,180,0.08)] px-4 py-2.5 text-[14px] font-semibold text-[#baffdd]"
                >
                  Jump to today
                </button>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-white/12 bg-black/40 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Challenges offered</div>
                  <div className="mt-2 text-[28px] font-black tabular-nums leading-none text-white/95 sm:text-[32px]">
                    {filteredDayChallengeStats.offered !== null ? filteredDayChallengeStats.offered : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-[rgba(0,255,180,0.28)] bg-black/40 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7dffc8]/80">Completed</div>
                  <div className="mt-2 text-[28px] font-black tabular-nums leading-none text-[#baffdd] sm:text-[32px]">
                    {filteredDayChallengeStats.completed}
                  </div>
                </div>
                <div className="rounded-lg border border-[rgba(255,120,120,0.35)] bg-black/40 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-200/75">Missed / not done</div>
                  <div className="mt-2 text-[28px] font-black tabular-nums leading-none text-rose-100/95 sm:text-[32px]">
                    {filteredDayChallengeStats.missed !== null ? filteredDayChallengeStats.missed : "—"}
                  </div>
                </div>
              </div>
              <div className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/30">
                <table className="w-full min-w-[520px] text-left text-[14px]">
                  <caption className="sr-only">Last seven days challenge completion</caption>
                  <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.12em] text-white/55">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Offered</th>
                      <th className="px-4 py-3 text-right">Completed</th>
                      <th className="px-4 py-3 text-right">Missed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSevenDayChallengeRows.map((row) => (
                      <tr
                        key={row.iso}
                        className={cn(
                          "border-t border-white/6 text-white/88",
                          row.iso === historyFilterDate ? "bg-[rgba(120,200,255,0.08)]" : ""
                        )}
                      >
                        <td className="px-4 py-3 font-medium">
                          {row.iso}
                          <span className="ml-2 text-[12px] text-white/45">{shortWeekday(row.iso)}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.offered !== null ? row.offered : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#baffdd]/95">{row.completed}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-rose-100/90">{row.missed !== null ? row.missed : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!showStatsProfile ? (
      <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="syndicate-readable flex min-h-[128px] flex-col justify-between rounded-lg border border-[rgba(255,215,0,0.38)] bg-black/50 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)]">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">Total points</div>
          <span className="text-[34px] font-bold tabular-nums leading-none text-[color:var(--gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.35)] sm:text-[36px]">
            {pointsTotal}
          </span>
          <p className="mt-1 text-[11px] leading-snug text-white/38">All time on this device</p>
        </div>
        <div className="syndicate-readable flex min-h-[128px] flex-col justify-between rounded-lg border border-[rgba(255,200,100,0.28)] bg-black/50 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)]">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">Today&apos;s points</div>
          <span className="text-[34px] font-bold tabular-nums leading-none text-[#ffe08a] [text-shadow:0_0_12px_rgba(255,215,0,0.25)] sm:text-[36px]">
            {todayPointsFromHistory}
          </span>
          <p className="mt-1 text-[11px] leading-snug text-white/38">From completions logged today</p>
        </div>
        <div className="syndicate-readable flex min-h-[128px] flex-col justify-between rounded-lg border border-[rgba(180,140,255,0.35)] bg-black/50 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)]">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">Best category</div>
          <span className="text-[22px] font-bold leading-tight text-[#d4c4ff] sm:text-[24px]">{dashboardBestCategoryLabel}</span>
          <p className="mt-1 text-[11px] leading-snug text-white/38">By lifetime points in history</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:max-w-md">
          <div className="syndicate-readable flex min-h-[120px] flex-col gap-1 rounded-lg border border-[rgba(0,255,180,0.22)] bg-black/50 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Day streak</div>
            <span className="text-[32px] font-bold tabular-nums leading-none text-[#baffdd] [text-shadow:0_0_12px_rgba(0,255,180,0.25)]">
              {streak}
            </span>
            <p className="mt-auto pt-2 text-[10px] leading-snug text-white/40">
              +1 when you finish at least one challenge today after yesterday. Miss a day → streak resets.
            </p>
          </div>
        </div>
        <div className="syndicate-readable flex shrink-0 flex-col justify-center rounded-lg border border-[rgba(255,215,0,0.35)] bg-black/40 p-4 lg:w-[200px]">
          <button
            type="button"
            disabled={busy === "regen" || busy === "load"}
            onClick={() => void regenerateNewDay()}
            className="rounded-md border border-[rgba(255,215,0,0.55)] bg-[rgba(255,215,0,0.12)] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[color:var(--gold)] transition hover:bg-[rgba(255,215,0,0.2)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy === "regen" ? "Regenerating…" : "Regenerate new day"}
          </button>
          <p className="mt-2 text-[10px] leading-snug text-white/45">
            New challenges from the API. Resets points, completions, streak, and responses on this device.
          </p>
        </div>
      </div>

      <div className="syndicate-readable rounded-xl border border-[rgba(255,215,0,0.32)] bg-black/45 p-5 sm:p-6 [box-shadow:0_0_24px_rgba(0,0,0,0.4)]">
        <div className="mb-1 text-[15px] font-black uppercase tracking-[0.12em] text-[color:var(--gold)] sm:text-[17px]">
          Points by category
        </div>
        <p className="mb-4 text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
          Lifetime share of points per category on this device (each segment uses a distinct color).
        </p>
        {pieLifetimeCategoryData.reduce((s, d) => s + d.value, 0) === 0 ? (
          <p className="text-[15px] leading-relaxed text-white/55">
            Complete challenges to see colored segments — your progress will appear here.
          </p>
        ) : (
          <div className="h-[min(320px,55vw)] min-h-[240px] w-full sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieLifetimeCategoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="32%"
                  outerRadius="78%"
                  paddingAngle={2}
                  labelLine={false}
                  label={({ name, percent }) =>
                    (percent ?? 0) > 0.04 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ""
                  }
                >
                  {pieLifetimeCategoryData.map((e, i) => (
                    <Cell key={e.name} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} fill={e.fill} />
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
                  itemStyle={{ fontSize: 15 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 15, paddingTop: 12 }}
                  iconType="circle"
                  formatter={(value) => <span className="text-white/90">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {showRestore ? (
        <div className="syndicate-readable rounded-lg border border-[rgba(120,200,255,0.35)] bg-[rgba(0,40,80,0.25)] p-4">
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#a8d8ff]">Streak restore (7 days)</div>
          <p className="mt-1 text-[13px] leading-relaxed text-white/65">
            Your streak hit 0. Generate a unique code and ask a friend to enter it here on their device. When they do, you can claim your streak back.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void createInviteCode()}
              className="rounded-md border border-[rgba(120,200,255,0.5)] bg-black/40 px-3 py-1.5 text-[12px] font-semibold text-[#b5e8ff]"
            >
              Generate invite code
            </button>
            {inviteCode ? (
              <code className="rounded border border-white/20 bg-black/50 px-2 py-1.5 text-[13px] font-mono text-[color:var(--gold)]">{inviteCode}</code>
            ) : null}
            {canClaimRestore ? (
              <button
                type="button"
                onClick={() => void claimRestore()}
                className="rounded-md border border-emerald-500/50 bg-emerald-500/15 px-3 py-1.5 text-[12px] font-semibold text-emerald-200"
              >
                Claim streak restore
              </button>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <label className="text-[11px] text-white/50">Enter a friend&apos;s code</label>
              <input
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value)}
                placeholder="SYN-…"
                className="syndicate-readable mt-1 w-full rounded border border-white/20 bg-black/50 px-2 py-1.5 font-mono text-[13px] text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => void redeemFriend()}
              className="rounded-md border border-white/25 px-3 py-2 text-[12px] font-semibold text-white/85"
            >
              Submit friend code
            </button>
          </div>
          {referralMsg ? <p className="mt-2 text-[12px] text-[#b5ecff]/90">{referralMsg}</p> : null}
        </div>
      ) : null}
      </>
      ) : null}

      {!showStatsProfile ? (
        <>
          <h3 className="syndicate-readable mt-2 text-[17px] font-black uppercase tracking-[0.1em] text-[color:var(--gold)] sm:text-[19px]">
            Today&apos;s challenges
          </h3>
          <div className="syndicate-readable flex flex-wrap items-center gap-3 rounded-lg border border-[rgba(255,215,0,0.28)] bg-[linear-gradient(180deg,rgba(20,20,24,0.85)_0%,rgba(8,10,14,0.92)_100%)] px-4 py-3.5 [box-shadow:0_0_20px_rgba(0,0,0,0.45)]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">Mood</span>
            <select
              id="syndicate-dashboard-mood"
              value={statsMood}
              onChange={(e) => setStatsMood(e.target.value)}
              className={SYNDICATE_SELECT_MOOD}
              aria-label="Filter challenges by mood"
            >
              {STATS_MOODS.map((m) => (
                <option key={m} value={m}>
                  {STATS_MOOD_LABEL[m]}
                </option>
              ))}
            </select>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">Category</span>
            <select
              value={catFilter}
              onChange={(e) =>
                setCatFilter(e.target.value as "all" | (typeof CATEGORIES)[number])
              }
              className={SYNDICATE_SELECT_CATEGORY}
            >
              <option value="all">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CAT_LABEL[c]}
                </option>
              ))}
            </select>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">Status</span>
            <select
              value={doneFilter}
              onChange={(e) => setDoneFilter(e.target.value as typeof doneFilter)}
              className={SYNDICATE_SELECT_STATUS}
            >
              <option value="all">All</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>

          {error ? (
            <div className="syndicate-readable rounded-md border border-[rgba(255,59,59,0.45)] bg-[rgba(255,59,59,0.10)] px-3 py-2 text-[13px] text-[#ffc9c9]">{error}</div>
          ) : null}

          {busy === "regen" ? (
            <div className="syndicate-readable rounded-md border border-[rgba(255,215,0,0.25)] bg-black/30 px-3 py-2 text-[12px] text-white/55">
              Regenerating today&apos;s challenges and applying a fresh &quot;new day&quot; on this browser…
            </div>
          ) : null}

          {busy === "load" && rows.length === 0 && !error ? (
            <div className="syndicate-readable py-12 text-center text-[14px] text-white/45">Loading challenges…</div>
          ) : null}

          {!busy && filteredRows.length === 0 && rows.length > 0 ? (
            <div className="syndicate-readable rounded-md border border-white/10 py-8 text-center text-[13px] text-white/50">No challenges match these filters.</div>
          ) : null}

          {!busy && rows.length === 0 && !error ? (
            <div className="syndicate-readable rounded-lg border border-white/10 bg-black/35 py-10 text-center text-[13px] text-white/55">
              No challenges for today. Ensure the API is running, documents are in <code className="text-white/70">data/uploads</code>, and <code className="text-white/70">OPENAI_API_KEY</code> is set — then reload the page.
            </div>
          ) : null}

          {CATEGORIES.map((cat) => {
            const list = byCategoryFiltered[cat] ?? [];
            if (list.length === 0) return null;
            return (
              <div key={cat}>
                <h4 className="syndicate-readable mb-3 border-b border-[rgba(255,215,0,0.2)] pb-2 text-[13px] font-bold uppercase tracking-[0.2em] text-[color:var(--gold)]/90">
                  {CAT_LABEL[cat] ?? cat}
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                  {list.map((row) => (
                    <CompactCard key={row.id} row={row} done={doneIds.has(row.id)} onView={() => setSelected(row)} />
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                {(byCategoryFiltered.other ?? []).map((row) => (
                  <CompactCard key={row.id} row={row} done={doneIds.has(row.id)} onView={() => setSelected(row)} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
