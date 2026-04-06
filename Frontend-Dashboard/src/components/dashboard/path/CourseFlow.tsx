"use client";

import { motion } from "framer-motion";
import type { DashboardNavKey } from "../types";
import type { CourseRec } from "./goalPathData";
import { ArrowConnectorHorizontal, ArrowConnectorVertical } from "./ArrowConnector";
import { cn } from "../dashboardPrimitives";

function CourseFlowCard({
  course,
  variant,
  onContinue
}: {
  course: CourseRec;
  variant: "support" | "focus" | "future";
  onContinue: () => void;
}) {
  const focus = variant === "focus";
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      whileHover={{ scale: focus ? 1.02 : 1.012 }}
      className={cn(
        "relative flex min-h-[11.5rem] min-w-0 flex-1 flex-col overflow-hidden border bg-[#080808]/95 sm:min-h-[13rem]",
        "cut-frame-sm cyber-frame transition-[box-shadow,border-color] duration-300",
        focus
          ? "z-[2] border-[rgba(250,204,21,0.58)] shadow-[0_0_0_1px_rgba(250,204,21,0.3),0_0_28px_rgba(250,204,21,0.2),0_0_52px_rgba(250,204,21,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] lg:scale-[1.02]"
          : "border-[rgba(197,179,88,0.26)] bg-[linear-gradient(165deg,rgba(255,255,255,0.03),rgba(0,0,0,0.55))] text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      )}
    >
      {focus ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-90 [background:linear-gradient(180deg,rgba(168,85,247,0.08),transparent_45%),radial-gradient(400px_200px_at_40%_0%,rgba(250,204,21,0.1),transparent_65%)]"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(380px_180px_at_40%_0%,rgba(168,85,247,0.07),transparent_62%)]"
          aria-hidden
        />
      )}
      <div className="relative flex flex-1 flex-col p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "font-mono text-[8px] font-black uppercase tracking-[0.2em] sm:text-[9px]",
              focus ? "text-[color:var(--gold)]/80" : "text-white/48"
            )}
          >
            {variant === "focus" ? "Recommended now" : variant === "support" ? "Supporting" : "Up next"}
          </span>
          {focus ? (
            <span className="rounded-md border border-[rgba(250,204,21,0.5)] bg-[rgba(255,215,0,0.1)] px-2 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.18em] text-[color:var(--gold)] shadow-[0_0_12px_rgba(250,204,21,0.15)] sm:text-[9px]">
              Flow
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-[13px] font-bold leading-snug text-white/95 sm:mt-3.5 sm:text-[15px] md:text-[16px]">{course.title}</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-white/65 sm:text-[13px] md:text-[14px]">{course.outcome}</p>
        <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200/85 sm:text-[11px]">{course.earningHint}</p>
        <div className="mt-auto pt-4">
          <motion.button
            type="button"
            onClick={onContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full cut-frame-sm border px-3 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] transition sm:py-3 sm:text-[11px]",
              focus
                ? "border-[rgba(250,204,21,0.55)] bg-[linear-gradient(165deg,rgba(255,215,0,0.14),rgba(0,0,0,0.5))] text-[color:var(--gold)] shadow-[0_0_20px_rgba(250,204,21,0.12)] hover:border-[rgba(250,204,21,0.7)]"
                : "border-[rgba(197,179,88,0.3)] bg-black/45 text-white/78 hover:border-[rgba(250,204,21,0.35)] hover:text-white/92"
            )}
          >
            Continue path
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function CourseFlow({
  courses,
  onNavigate
}: {
  courses: [CourseRec, CourseRec, CourseRec];
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const go = () => onNavigate("programs");
  const [a, b, c] = courses;

  return (
    <div className="relative mt-8 border-t border-[rgba(197,179,88,0.22)] pt-6 sm:mt-10 sm:pt-8">
      <div className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--gold-neon)] sm:text-[11px] sm:tracking-[0.3em]">
        Next opportunities
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-white/68 sm:text-[13px] md:text-[14px]">
        Natural progression — earn more and sharpen skills without noise.
      </p>

      <div className="mt-5 flex w-full min-w-0 flex-col gap-3 sm:mt-6 sm:gap-4 lg:flex-row lg:items-stretch lg:gap-3 xl:gap-4">
        <div className="min-w-0 flex-1">
          <CourseFlowCard course={a} variant="support" onContinue={go} />
        </div>
        <div className="flex justify-center lg:hidden">
          <ArrowConnectorVertical />
        </div>
        <div className="hidden min-w-[2rem] max-w-[3.5rem] flex-1 items-center justify-center lg:flex">
          <ArrowConnectorHorizontal />
        </div>
        <div className="min-w-0 flex-[1.15] lg:flex-[1.2]">
          <CourseFlowCard course={b} variant="focus" onContinue={go} />
        </div>
        <div className="flex justify-center lg:hidden">
          <ArrowConnectorVertical />
        </div>
        <div className="hidden min-w-[2rem] max-w-[3.5rem] flex-1 items-center justify-center lg:flex">
          <ArrowConnectorHorizontal />
        </div>
        <div className="min-w-0 flex-1">
          <CourseFlowCard course={c} variant="future" onContinue={go} />
        </div>
      </div>
    </div>
  );
}
