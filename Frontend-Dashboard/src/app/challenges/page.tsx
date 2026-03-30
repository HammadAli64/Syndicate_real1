"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ChallengeCard } from "./components/ChallengeCard";
import {
  generateChallenges,
  type MoodChallengeResult,
  type MoodId
} from "./services/challengeAPI";
import { fetchChallengesRoot, type ChallengeRow } from "./services/challengesApi";

const MOODS: { id: MoodId; label: string }[] = [
  { id: "energetic", label: "Energetic" },
  { id: "happy", label: "Happy" },
  { id: "sad", label: "Sad" },
  { id: "tired", label: "Tired" }
];

const CATEGORIES: { id: string; label: string }[] = [
  { id: "business", label: "Business" },
  { id: "money", label: "Money" },
  { id: "fitness", label: "Fitness" },
  { id: "power", label: "Power" },
  { id: "grooming", label: "Grooming" }
];

export default function ChallengesPage() {
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [mood, setMood] = useState<MoodId>("energetic");
  const [category, setCategory] = useState("business");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<MoodChallengeResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchChallengesRoot();
        if (!cancelled) setRows(data.results ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onGenerate() {
    setGenError(null);
    setGenLoading(true);
    setGenerated([]);
    try {
      const data = await generateChallenges(mood, category);
      setGenerated(data.results ?? []);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setGenLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(255,215,0,0.2)] pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--gold)]/80">Syndicate</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Challenges</h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Today&apos;s batch from <code className="text-white/70">GET /api/challenges/</code>. Generate two mood-based challenges via{" "}
            <code className="text-white/70">POST /api/challenges/generate/</code> when mindsets are ingested.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-[rgba(255,215,0,0.45)] bg-black/50 px-4 py-2 text-sm font-semibold text-[color:var(--gold)] transition hover:bg-black/70"
        >
          ← Dashboard
        </Link>
      </div>

      <section className="rounded-xl border border-[rgba(255,215,0,0.28)] bg-[linear-gradient(165deg,rgba(255,215,0,0.06),rgba(0,30,50,0.35))] p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--gold)]">Mood-based generation</h2>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Pick a mood and category, then generate two challenges tailored to that combination (server uses your ingested mindsets).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-white/45">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value as MoodId)}
              className="syndicate-select syndicate-select--mood syndicate-readable mt-1 min-h-[40px] min-w-[160px] cursor-pointer rounded-lg px-3 py-2 text-sm font-medium outline-none focus:outline-none focus:ring-2 focus:ring-[rgba(160,170,255,0.35)]"
            >
              {MOODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-white/45">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="syndicate-select syndicate-select--category syndicate-readable mt-1 min-h-[40px] min-w-[160px] cursor-pointer rounded-lg px-3 py-2 text-sm font-medium outline-none focus:outline-none focus:ring-2 focus:ring-[rgba(255,215,0,0.28)]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={genLoading}
            onClick={() => void onGenerate()}
            className="rounded-lg border border-[rgba(0,255,180,0.45)] bg-[rgba(0,255,180,0.1)] px-5 py-2.5 text-sm font-semibold text-[#baffdd] transition hover:bg-[rgba(0,255,180,0.16)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {genLoading ? "Generating…" : "Generate 2 challenges"}
          </button>
        </div>
        {genError ? (
          <div className="mt-4 rounded-lg border border-[rgba(255,80,80,0.45)] bg-[rgba(255,59,59,0.08)] px-4 py-3 text-sm text-[#ffc9c9]">{genError}</div>
        ) : null}
        {generated.length > 0 ? (
          <ul className="mt-6 space-y-4">
            {generated.map((ch, i) => (
              <li
                key={`${ch.title}-${i}`}
                className="rounded-lg border border-white/10 bg-black/35 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  {ch.mood} · {ch.category}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{ch.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{ch.description}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="border-t border-white/10 pt-6">
        <h2 className="text-base font-semibold text-white/90">Today&apos;s batch</h2>
        <p className="mt-1 text-sm text-white/45">Saved challenges from the API (same data as Syndicate when synced).</p>
      </div>

      {loading ? <p className="text-sm text-white/45">Loading…</p> : null}
      {error ? (
        <div className="rounded-lg border border-[rgba(255,80,80,0.45)] bg-[rgba(255,59,59,0.08)] px-4 py-3 text-sm text-[#ffc9c9]">{error}</div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <p className="text-sm text-white/50">No saved challenges yet. Run the Django API with documents ingested, or generate above.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <ChallengeCard key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
