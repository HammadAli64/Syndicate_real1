"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "../dashboardPrimitives";

export type FlowCardVariant = "completed" | "current" | "next" | "locked";

export function FlowCard({
  variant,
  title,
  outcome,
  why,
  earningLine,
  icon,
  className
}: {
  variant: FlowCardVariant;
  title: string;
  outcome: string;
  why: string;
  earningLine?: string;
  icon?: string;
  className?: string;
}) {
  const isCurrent = variant === "current";
  const isCompleted = variant === "completed";
  const isNext = variant === "next";
  const isLocked = variant === "locked";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileHover={!isLocked && !isCompleted ? { scale: 1.015 } : { scale: 1.01 }}
      className={cn(
        "relative flex min-h-[10.5rem] min-w-0 flex-1 flex-col overflow-hidden border bg-[#080808]/95 text-left",
        "cut-frame-sm cyber-frame transition-[transform,opacity,box-shadow,border-color] duration-300",
        isCurrent &&
          "z-[2] border-[rgba(250,204,21,0.62)] shadow-[0_0_0_1px_rgba(250,204,21,0.35),0_0_32px_rgba(250,204,21,0.22),0_0_64px_rgba(250,204,21,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] sm:min-h-[13rem] lg:scale-[1.02]",
        isCompleted &&
          "border-[rgba(197,179,88,0.32)] bg-[#060606]/90 opacity-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        isNext &&
          "border-[rgba(197,179,88,0.28)] bg-[#070707]/92 text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        isLocked && "pointer-events-none border-[rgba(255,255,255,0.08)] opacity-50 blur-[1px]",
        className
      )}
    >
      {isCurrent ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-100 [background:linear-gradient(180deg,rgba(255,215,0,0.14),rgba(250,204,21,0.03)_38%,transparent_62%),radial-gradient(ellipse_90%_55%_at_50%_0%,rgba(250,204,21,0.12),transparent_65%)]"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(420px_200px_at_50%_0%,rgba(197,179,88,0.1),transparent_68%)]"
          aria-hidden
        />
      )}
      <div className="relative flex flex-1 flex-col p-3 sm:p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "font-mono text-[18px] leading-none sm:text-[20px]",
              isCompleted && "text-white/35",
              isCurrent && "text-[color:var(--gold)] drop-shadow-[0_0_12px_rgba(250,204,21,0.35)]",
              isNext && "text-[color:var(--gold)]/75"
            )}
          >
            {icon ?? "◆"}
          </span>
          {isCompleted ? (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-emerald-400/55 bg-emerald-950/50 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.25)]">
              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </span>
          ) : isCurrent ? (
            <span className="rounded-md border border-[rgba(250,204,21,0.55)] bg-[rgba(255,215,0,0.12)] px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-[color:var(--gold)] shadow-[0_0_14px_rgba(250,204,21,0.2)] sm:text-[9px]">
              Focus
            </span>
          ) : isNext ? (
            <span className="rounded-md border border-white/12 bg-black/40 px-2 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-white/55 sm:text-[9px]">
              Next
            </span>
          ) : (
            <span className="font-mono text-[8px] font-black uppercase tracking-[0.2em] text-white/35">Locked</span>
          )}
        </div>
        <div
          className={cn(
            "mt-3 text-[13px] font-bold leading-snug sm:text-[15px] md:text-[16px]",
            isCompleted && "text-white/62",
            !isCompleted && "text-white/95"
          )}
        >
          {title}
        </div>
        <p
          className={cn(
            "mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.16em]",
            isCompleted ? "text-emerald-200/55" : "text-[color:var(--gold)]/88"
          )}
        >
          {outcome}
        </p>
        <p
          className={cn(
            "mt-2 flex-1 text-[12px] leading-relaxed sm:mt-2.5 sm:text-[13px] md:text-[14px]",
            isCompleted ? "text-white/48" : "text-white/68"
          )}
        >
          {why}
        </p>
        {earningLine ? (
          <div className="mt-3 border-t border-[rgba(197,179,88,0.18)] pt-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200/85 sm:text-[11px]">
            Earn → {earningLine}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
