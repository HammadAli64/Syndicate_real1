"use client";

import type { ChallengeRow } from "../services/challengesApi";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function difficultyStyle(d: string) {
  const x = d.toLowerCase();
  if (x === "easy") return "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
  if (x === "hard") return "border-rose-500/50 bg-rose-500/10 text-rose-200";
  return "border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.08)] text-[color:var(--gold)]";
}

type Props = {
  row: ChallengeRow;
  onOpen?: (row: ChallengeRow) => void;
};

export function ChallengeCard({ row, onOpen }: Props) {
  const title = row.payload?.challenge_title ?? "Challenge";
  const diff = row.difficulty || row.payload?.difficulty || "medium";
  const pts = row.points ?? row.payload?.points ?? 0;

  return (
    <article className="syndicate-readable flex min-h-[180px] flex-col justify-between rounded-lg border border-[rgba(255,215,0,0.35)] bg-black/55 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", difficultyStyle(diff))}>
            {diff} · {pts} pts
          </span>
          {row.category ? (
            <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
              {row.category}
            </span>
          ) : null}
        </div>
        <h2 className="text-[16px] font-semibold leading-snug text-white md:text-[18px]">{title}</h2>
      </div>
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(row)}
          className="syndicate-readable mt-4 w-full rounded-md border border-[rgba(255,215,0,0.55)] bg-[rgba(255,215,0,0.1)] py-2.5 text-[13px] font-semibold text-[color:var(--gold)] transition hover:bg-[rgba(255,215,0,0.18)]"
        >
          View detail
        </button>
      ) : null}
    </article>
  );
}
