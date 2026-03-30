"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { challengesApiUrl } from "@/app/challenges/services/challengesApi";
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

const CATEGORIES = ["business", "money", "fitness", "power", "grooming"] as const;

const CAT_LABEL: Record<string, string> = {
  business: "Business",
  money: "Money",
  fitness: "Fitness",
  power: "Power",
  grooming: "Grooming"
};

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
  const title = row.payload?.challenge_title ?? "Challenge";
  const diff = row.difficulty || row.payload?.difficulty || "medium";
  const pts = row.points ?? row.payload?.points ?? 0;

  return (
    <div className="syndicate-readable flex min-h-[200px] flex-col justify-between rounded-lg border border-[rgba(255,215,0,0.35)] bg-black/50 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", difficultyStyle(diff))}>
            {diff} · {pts} pts
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
        <h4 className="text-[17px] font-semibold leading-snug text-white [text-shadow:none] md:text-[20px] md:leading-snug">{title}</h4>
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

  useEffect(() => {
    setText(initialResponse);
  }, [initialResponse, row.id]);

  return (
    <div className="syndicate-readable">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-[13px] font-semibold text-[color:var(--gold)] underline-offset-4 hover:underline"
      >
        ← Back to challenges
      </button>
      <div className="rounded-lg border border-[rgba(255,215,0,0.4)] bg-black/55 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded border border-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase text-white/70">{row.category}</span>
          <span className={cn("rounded border px-2 py-0.5 text-[11px] font-semibold uppercase", difficultyStyle(row.difficulty))}>
            {row.difficulty} · {row.points} pts
          </span>
        </div>
        <h3 className="text-[22px] font-bold leading-snug text-white md:text-[26px] md:leading-tight">{p.challenge_title}</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-white/80">{p.challenge_description}</p>
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-white/50">Example</div>
          <p className="mt-1 text-[14px] text-white/82">{p.example_task}</p>
        </div>
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-white/50">Benefit</div>
          <p className="mt-1 text-[14px] text-white/82">{p.benefits}</p>
        </div>
        <p className="mt-4 text-[13px] text-white/60">
          <span className="text-white/45">Mindset: </span>
          <span className="text-[color:var(--gold)]/90">{p.based_on_mindset}</span>
        </p>

        <div className="mt-6 border-t border-white/10 pt-4">
          <label className="mb-2 block text-[12px] font-semibold text-white/70" htmlFor="challenge-response">
            Your response
          </label>
          <textarea
            id="challenge-response"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Write how you will complete this challenge or what you learned…"
            className="syndicate-readable w-full resize-y rounded-md border border-[rgba(255,215,0,0.35)] bg-black/60 px-3 py-2 text-[14px] text-white/90 outline-none placeholder:text-white/35 focus:border-[rgba(255,215,0,0.65)]"
          />
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => onSubmit(text.trim())}
            className="syndicate-readable mt-3 rounded-md border border-[rgba(255,215,0,0.6)] bg-[rgba(255,215,0,0.15)] px-5 py-2.5 text-[14px] font-semibold text-[color:var(--gold)] transition hover:bg-[rgba(255,215,0,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
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
  const [doneFilter, setDoneFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [canClaimRestore, setCanClaimRestore] = useState(false);
  const [referralMsg, setReferralMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    evaluateStreakBreakOnMount();
    setPointsTotal(loadTotalPoints());
    setDoneIds(loadDoneIds());
    setStreak(loadStreak());
  }, []);

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
      const k = (r.category || r.payload?.category || "").toLowerCase();
      if (catFilter !== "all" && k !== catFilter) return false;
      const done = doneIds.has(r.id);
      if (doneFilter === "complete" && !done) return false;
      if (doneFilter === "incomplete" && done) return false;
      return true;
    });
  }, [rows, catFilter, doneFilter, doneIds]);

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
      total += selected.points || 0;
      persistDone(nextDone);
      persistPoints(total);
      setDoneIds(nextDone);
      setPointsTotal(total);

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="syndicate-readable flex min-h-[120px] flex-col justify-between rounded-lg border border-[rgba(255,215,0,0.38)] bg-black/50 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Total points</div>
          <span className="text-[32px] font-bold tabular-nums leading-none text-[color:var(--gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.35)]">
            {pointsTotal}
          </span>
        </div>
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

      <div className="syndicate-readable flex flex-wrap items-center gap-3 rounded-lg border border-[rgba(255,215,0,0.2)] bg-black/40 px-4 py-3 [box-shadow:0_0_16px_rgba(0,0,0,0.35)]">
        <span className="text-[11px] font-semibold uppercase text-white/45">Category</span>
        <select
          value={catFilter}
          onChange={(e) =>
            setCatFilter(e.target.value as "all" | (typeof CATEGORIES)[number])
          }
          className="rounded border border-[rgba(255,215,0,0.35)] bg-black/60 px-2 py-1 text-[13px] text-white"
        >
          <option value="all">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CAT_LABEL[c]}
            </option>
          ))}
        </select>
        <span className="text-[11px] font-semibold uppercase text-white/45">Status</span>
        <select
          value={doneFilter}
          onChange={(e) => setDoneFilter(e.target.value as typeof doneFilter)}
          className="rounded border border-[rgba(255,215,0,0.35)] bg-black/60 px-2 py-1 text-[13px] text-white"
        >
          <option value="all">All</option>
          <option value="complete">Complete</option>
          <option value="incomplete">Incomplete</option>
        </select>
      </div>

      {error ? (
        <div className="syndicate-readable rounded-md border border-[rgba(255,59,59,0.45)] bg-[rgba(255,59,59,0.10)] px-3 py-2 text-[13px] text-[#ffc9c9]">{error}</div>
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {list.map((row) => (
                <CompactCard key={row.id} row={row} done={doneIds.has(row.id)} onView={() => setSelected(row)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
