"use client";

import { Target } from "lucide-react";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { cn } from "@/components/dashboard/dashboardPrimitives";

/** Sections where the FAB is shown (maps to SPA nav keys on `/`). */
const FAB_SECTION_KEYS = new Set(["dashboard", "programs", "affiliate", "resources", "monk"]);

/** Match sidebar nav buttons: cut-frame-sm + premium-gold-border + hud hover language */
const FAB_SHELL =
  "cut-frame-sm hud-hover-glow glass-dark premium-gold-border gold-glow-hover transition";

function prefetchOpsDeckChunks() {
  void import("@/features/productivity/control-center/QuickAccessGrid");
}

export function FloatingGoalsButton() {
  const { openGoalsPanel, isGoalsPanelOpen, shellSectionKey } = useGoalsPanel();
  const allowed = shellSectionKey != null && FAB_SECTION_KEYS.has(shellSectionKey);

  if (!allowed || isGoalsPanelOpen) return null;

  return (
    <button
      type="button"
      onClick={openGoalsPanel}
      onPointerEnter={prefetchOpsDeckChunks}
      onFocus={prefetchOpsDeckChunks}
      className={cn(
        "group",
        FAB_SHELL,
        "fixed z-[195] flex items-center justify-center border border-[rgba(197,179,88,0.22)] bg-black/45 text-left text-[color:var(--gold)]",
        "motion-reduce:transition-none",
        /* Mobile: icon-only, minimal footprint + safe area */
        "bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] right-3 h-10 w-10 gap-0 p-0 sm:bottom-6 sm:right-5 sm:h-auto sm:w-auto sm:justify-start sm:gap-2.5 sm:px-3 sm:py-2.5",
        "md:bottom-6 md:right-6 md:max-w-[calc(100vw-1.5rem)]",
        "hover:bg-black/45",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(197,179,88,0.45)]"
      )}
      aria-label="Open Goals and Milestones"
      aria-haspopup="dialog"
      aria-expanded={false}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[rgba(197,179,88,0.14)] bg-black/25 text-[color:var(--gold)]/85 sm:h-7 sm:w-7">
        <Target className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} aria-hidden />
      </span>
      <span className="hidden text-[12px] font-extrabold uppercase leading-tight tracking-[0.12em] text-[color:var(--gold)]/90 sm:inline md:text-[13px] md:tracking-[0.14em]">
        Goals &amp; Milestones
      </span>
      <span className="ml-auto hidden h-px w-[28px] bg-[linear-gradient(90deg,rgba(197,179,88,0.0),rgba(197,179,88,0.35))] opacity-0 transition group-hover:opacity-100 sm:block" />
    </button>
  );
}
