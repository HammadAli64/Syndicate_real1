"use client";

import type { ChallengeRow } from "../services/challengesApi";

type Props = {
  row: ChallengeRow;
  onOpen?: (row: ChallengeRow) => void;
};

export function ChallengeCard({ row, onOpen }: Props) {
  const p = row.payload;
  const title = p?.challenge_title ?? "Challenge";
  const pts = row.points ?? p?.points ?? 0;

  return (
    <article className="syndicate-readable flex min-h-[220px] flex-col justify-between rounded-lg border border-[rgba(255,215,0,0.35)] bg-black/55 p-4 [box-shadow:0_0_20px_rgba(0,0,0,0.4)] sm:min-h-[240px] sm:p-5">
      <div>
        <div className="mb-3">
          <span className="rounded border border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.08)] px-2.5 py-0.5 text-[11px] font-bold tabular-nums uppercase tracking-wide text-[color:var(--gold)]">
            {pts} pts
          </span>
        </div>
        <h2 className="min-h-[4.5rem] text-[19px] font-semibold leading-[1.32] tracking-tight text-white sm:min-h-[5.25rem] sm:text-[21px] md:min-h-[5.75rem] md:text-[23px] lg:text-[24px]">
          {title}
        </h2>
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
