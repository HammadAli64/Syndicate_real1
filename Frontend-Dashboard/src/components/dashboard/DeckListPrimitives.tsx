"use client";

import type { ReactNode } from "react";
import { cn } from "./dashboardPrimitives";

export type DeckSortDir = "asc" | "desc";

/** Toolbar + list chrome aligned with Quick Access deck accents (high-contrast glow). */
export type DeckToolbarTone = "cyan" | "fuchsia" | "gold" | "rose" | "emerald";

const TOOLBAR_INPUT: Record<
  DeckToolbarTone,
  string
> = {
  cyan:
    "border-cyan-400/35 bg-black/60 text-cyan-50/95 placeholder:text-cyan-200/35 focus:border-cyan-300/85 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_24px_rgba(34,211,238,0.35)]",
  fuchsia:
    "border-fuchsia-400/38 bg-black/60 text-fuchsia-50/95 placeholder:text-fuchsia-200/35 focus:border-fuchsia-300/85 focus:shadow-[0_0_0_1px_rgba(217,70,239,0.45),0_0_24px_rgba(192,132,252,0.38)]",
  gold:
    "border-[rgba(255,215,0,0.42)] bg-black/60 text-[color:var(--gold)]/95 placeholder:text-[rgba(255,230,150,0.35)] focus:border-[rgba(255,230,120,0.85)] focus:shadow-[0_0_0_1px_rgba(255,215,0,0.45),0_0_26px_rgba(255,200,0,0.28)]",
  rose:
    "border-rose-400/40 bg-black/60 text-rose-50/95 placeholder:text-rose-200/35 focus:border-rose-300/85 focus:shadow-[0_0_0_1px_rgba(251,113,133,0.5),0_0_24px_rgba(251,113,133,0.35)]",
  emerald:
    "border-emerald-400/40 bg-black/60 text-emerald-50/95 placeholder:text-emerald-200/35 focus:border-emerald-300/85 focus:shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_0_24px_rgba(16,185,129,0.35)]"
};

const TOOLBAR_BTN: Record<DeckToolbarTone, string> = {
  cyan:
    "border-cyan-400/35 bg-black/55 text-cyan-100/80 hover:border-cyan-300/75 hover:text-cyan-50 hover:shadow-[0_0_18px_rgba(34,211,238,0.35)]",
  fuchsia:
    "border-fuchsia-400/38 bg-black/55 text-fuchsia-100/80 hover:border-fuchsia-300/75 hover:text-fuchsia-50 hover:shadow-[0_0_18px_rgba(217,70,239,0.32)]",
  gold:
    "border-[rgba(255,215,0,0.38)] bg-black/55 text-[color:var(--gold)]/80 hover:border-[rgba(255,230,140,0.72)] hover:text-[color:var(--gold)] hover:shadow-[0_0_20px_rgba(255,200,0,0.22)]",
  rose:
    "border-rose-400/38 bg-black/55 text-rose-100/80 hover:border-rose-300/75 hover:text-rose-50 hover:shadow-[0_0_18px_rgba(251,113,133,0.32)]",
  emerald:
    "border-emerald-400/38 bg-black/55 text-emerald-100/80 hover:border-emerald-300/75 hover:text-emerald-50 hover:shadow-[0_0_18px_rgba(52,211,153,0.32)]"
};

export function DeckListToolbar({
  search,
  onSearchChange,
  sortLabel,
  sortDir,
  onSortDirToggle,
  placeholder = "Filter…",
  tone = "gold"
}: {
  search: string;
  onSearchChange: (v: string) => void;
  sortLabel: string;
  sortDir: DeckSortDir;
  onSortDirToggle: () => void;
  placeholder?: string;
  tone?: DeckToolbarTone;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-w-[160px] flex-1 rounded-md px-2.5 py-1.5 font-mono text-[12px] outline-none motion-safe:transition-[box-shadow,border-color] motion-safe:duration-200",
          TOOLBAR_INPUT[tone]
        )}
      />
      <button
        type="button"
        onClick={onSortDirToggle}
        className={cn(
          "shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] motion-safe:transition-[box-shadow,border-color,color] motion-safe:duration-200",
          TOOLBAR_BTN[tone]
        )}
        title="Toggle sort direction"
      >
        {sortLabel} {sortDir === "desc" ? "↓" : "↑"}
      </button>
    </div>
  );
}

const BADGE_BASE = "inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em]";

export function MissionStatusBadge({ status }: { status: "active" | "missed" | "done" }) {
  if (status === "active")
    return (
      <span
        className={cn(
          BADGE_BASE,
          "border border-emerald-300/65 bg-emerald-950/80 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.35),0_0_16px_rgba(16,185,129,0.45),0_0_28px_rgba(52,211,153,0.2)]"
        )}
      >
        Active
      </span>
    );
  if (status === "missed")
    return (
      <span
        className={cn(
          BADGE_BASE,
          "border border-rose-400/60 bg-rose-950/75 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.4),0_0_18px_rgba(251,113,133,0.42),0_0_32px_rgba(244,63,94,0.2)]"
        )}
      >
        Missed
      </span>
    );
  return (
    <span
      className={cn(
        BADGE_BASE,
        "border border-cyan-400/45 bg-cyan-950/70 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.28)]"
      )}
    >
      Complete
    </span>
  );
}

export function ReminderStatusBadge({ status }: { status: "active" | "completed" }) {
  if (status === "active")
    return (
      <span
        className={cn(
          BADGE_BASE,
          "border border-cyan-400/55 bg-cyan-950/75 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_16px_rgba(34,211,238,0.4),0_0_28px_rgba(6,182,212,0.15)]"
        )}
      >
        Incomplete
      </span>
    );
  return (
    <span
      className={cn(
        BADGE_BASE,
        "border border-fuchsia-400/50 bg-fuchsia-950/70 text-fuchsia-100 shadow-[0_0_0_1px_rgba(192,132,252,0.35),0_0_16px_rgba(168,85,247,0.38)]"
      )}
    >
      Complete
    </span>
  );
}

export function PriorityPoints({ points, tone = "ice" }: { points: number; tone?: "ice" | "gold" | "violet" }) {
  const cls =
    tone === "gold"
      ? "text-[color:var(--gold)]/90"
      : tone === "violet"
        ? "text-[#ead6ff]"
        : "text-[#bfefff]";
  return (
    <span className={cn("font-mono text-[10px] font-black tabular-nums", cls)}>
      {points} <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/35">pts</span>
    </span>
  );
}

export function DueDateLine({
  label,
  value,
  urgent
}: {
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={cn(
        "text-[10px] text-white/50",
        urgent &&
          "font-semibold text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
      )}
    >
      <span className="text-white/35">{label}</span> {value}
    </div>
  );
}

export type DeckListItemTone = DeckToolbarTone;

const ITEM_SURFACE: Record<DeckListItemTone, string> = {
  cyan:
    "border-cyan-500/30 bg-black/50 shadow-[inset_0_1px_0_rgba(34,211,238,0.08)] hover:border-cyan-400/55 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_22px_rgba(34,211,238,0.18)]",
  fuchsia:
    "border-fuchsia-500/30 bg-black/50 shadow-[inset_0_1px_0_rgba(192,132,252,0.08)] hover:border-fuchsia-400/55 hover:shadow-[0_0_0_1px_rgba(192,132,252,0.28),0_0_22px_rgba(168,85,247,0.2)]",
  gold:
    "border-[rgba(255,215,0,0.28)] bg-black/50 shadow-[inset_0_1px_0_rgba(255,215,0,0.06)] hover:border-[rgba(255,230,140,0.5)] hover:shadow-[0_0_0_1px_rgba(255,215,0,0.22),0_0_22px_rgba(255,200,0,0.14)]",
  rose:
    "border-rose-500/32 bg-black/50 shadow-[inset_0_1px_0_rgba(251,113,133,0.08)] hover:border-rose-400/55 hover:shadow-[0_0_0_1px_rgba(251,113,133,0.28),0_0_22px_rgba(251,113,133,0.18)]",
  emerald:
    "border-emerald-500/32 bg-black/50 shadow-[inset_0_1px_0_rgba(52,211,153,0.08)] hover:border-emerald-400/55 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.28),0_0_22px_rgba(16,185,129,0.2)]"
};

type DeckListItemProps = {
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  dimmed?: boolean;
  tone?: DeckListItemTone;
};

export function DeckListItem({ title, subtitle, badge, footer, dimmed, tone = "gold" }: DeckListItemProps) {
  return (
    <div
      className={cn(
        "rounded-md px-2.5 py-2 motion-safe:transition-[box-shadow,border-color,opacity] motion-safe:duration-200 md:px-3 md:py-2.5",
        ITEM_SURFACE[tone],
        dimmed && "opacity-80 saturate-[0.92]"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-1">
        <div className="min-w-0 flex-1 text-[13px] font-bold leading-snug text-[#f2ebe3]/95">{title}</div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {subtitle ? <div className="mt-0.5">{subtitle}</div> : null}
      {footer ? <div className="mt-1">{footer}</div> : null}
    </div>
  );
}

export function filterBySearch<T>(rows: T[], getText: (row: T) => string, q: string): T[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((r) => getText(r).toLowerCase().includes(needle));
}
