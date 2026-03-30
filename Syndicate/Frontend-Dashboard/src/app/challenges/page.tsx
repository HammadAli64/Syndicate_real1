"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ChallengeCard } from "./components/ChallengeCard";
import { fetchChallengesRoot, type ChallengeRow } from "./services/challengesApi";

export default function ChallengesPage() {
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(255,215,0,0.2)] pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--gold)]/80">Syndicate</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Challenges</h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Data from <code className="text-white/70">GET /api/challenges/</code> — today&apos;s batch when mindsets are ready.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-[rgba(255,215,0,0.45)] bg-black/50 px-4 py-2 text-sm font-semibold text-[color:var(--gold)] transition hover:bg-black/70"
        >
          ← Dashboard
        </Link>
      </div>

      {loading ? <p className="text-sm text-white/45">Loading…</p> : null}
      {error ? (
        <div className="rounded-lg border border-[rgba(255,80,80,0.45)] bg-[rgba(255,59,59,0.08)] px-4 py-3 text-sm text-[#ffc9c9]">{error}</div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <p className="text-sm text-white/50">No challenges yet. Run the Django API with documents ingested, or open Syndicate Mode on the dashboard.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <ChallengeCard key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
