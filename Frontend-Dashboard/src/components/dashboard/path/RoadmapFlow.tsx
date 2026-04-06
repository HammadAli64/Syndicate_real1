"use client";

import { Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GoalId, RoadmapStep } from "./goalPathData";
import { GOAL_OPTIONS, ROADMAPS } from "./goalPathData";
import { ArrowConnectorHorizontal, ArrowConnectorVertical } from "./ArrowConnector";
import { FlowCard } from "./FlowCard";
import { cn } from "../dashboardPrimitives";

function ProgressStrip({ steps, currentIndex }: { steps: RoadmapStep[]; currentIndex: number }) {
  return (
    <div className="-mx-1 mb-5 flex max-w-full flex-nowrap items-center gap-x-1.5 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-0.5 [scrollbar-color:rgba(197,179,88,0.35)_rgba(0,0,0,0.4)] sm:mb-6 sm:gap-x-2 sm:pb-3">
      <div className="flex min-w-min items-center gap-x-1.5 sm:gap-x-2">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const cur = i === currentIndex;
          const short = s.title.split("/")[0]!.trim();
          return (
            <Fragment key={s.id}>
              {i > 0 ? (
                <span className="shrink-0 font-mono text-[10px] font-bold text-[rgba(197,179,88,0.45)] sm:text-[11px]" aria-hidden>
                  →
                </span>
              ) : null}
              <span
                className={cn(
                  "cut-frame-sm shrink-0 whitespace-nowrap border px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.14em]",
                  done &&
                    "border-emerald-400/45 bg-emerald-950/20 text-emerald-100/90 shadow-[0_0_12px_rgba(52,211,153,0.12)]",
                  cur &&
                    "border-[rgba(250,204,21,0.55)] bg-[rgba(255,215,0,0.08)] text-[color:var(--gold)] shadow-[0_0_0_1px_rgba(250,204,21,0.2),0_0_20px_rgba(250,204,21,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]",
                  !done && !cur && "border-white/14 bg-black/35 text-white/48"
                )}
              >
                {done ? `${short} ✓` : short}
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function RoadmapFlow({
  goal,
  currentIndex,
  onCompleteStep
}: {
  goal: GoalId;
  currentIndex: number;
  onCompleteStep: () => void;
}) {
  const steps = ROADMAPS[goal];
  const goalLabel = GOAL_OPTIONS.find((g) => g.id === goal)?.label ?? "Your goal";
  const done = currentIndex >= steps.length;

  const leftStep: RoadmapStep | null = currentIndex > 0 ? steps[currentIndex - 1]! : null;
  const centerStep = !done ? steps[currentIndex]! : null;
  const rightStep = !done && currentIndex + 1 < steps.length ? steps[currentIndex + 1]! : null;

  return (
    <div className="relative mt-8 border-t border-[rgba(197,179,88,0.22)] pt-6 sm:mt-10 sm:pt-8">
      <div className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--gold-neon)] sm:text-[11px] sm:tracking-[0.3em]">
        Roadmap
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-white/68 sm:text-[13px] md:text-[14px]">
        Three steps visible — complete the center focus to advance.
      </p>

      {!done ? <ProgressStrip steps={steps} currentIndex={currentIndex} /> : null}

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="cut-frame-sm cyber-frame border border-emerald-400/40 bg-[linear-gradient(165deg,rgba(52,211,153,0.12),rgba(6,20,14,0.92))] px-4 py-6 text-center shadow-[0_0_32px_rgba(52,211,153,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-6 sm:py-7"
          >
            <div className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200 sm:text-[12px]">Path complete</div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/75 sm:text-[14px]">
              You finished the <span className="text-[color:var(--gold)]/90">{goalLabel}</span> track. Refine with courses below or switch
              goals.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${goal}-${currentIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex w-full min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-stretch lg:gap-3 xl:gap-4"
          >
            {/* Left — completed or origin */}
            <div className="min-w-0 flex-1">
              {leftStep ? (
                <FlowCard
                  variant="completed"
                  title={leftStep.title}
                  outcome={leftStep.outcome}
                  why={leftStep.why}
                  earningLine={leftStep.earningAfter}
                  icon={leftStep.icon}
                />
              ) : (
                <FlowCard
                  variant="completed"
                  title="Goal set"
                  outcome={goalLabel}
                  why="Foundation locked in — execute the center card, then unlock the next milestone."
                  icon="✓"
                />
              )}
            </div>

            <div className="flex justify-center lg:hidden">
              <ArrowConnectorVertical />
            </div>
            <div className="hidden min-w-[2rem] max-w-[3.5rem] flex-1 items-center justify-center lg:flex">
              <ArrowConnectorHorizontal />
            </div>

            {/* Center — current */}
            <div className="min-w-0 flex-[1.15] lg:flex-[1.2]">
              {centerStep ? (
                <FlowCard
                  variant="current"
                  title={centerStep.title}
                  outcome={centerStep.outcome}
                  why={centerStep.why}
                  earningLine={centerStep.earningAfter}
                  icon={centerStep.icon}
                />
              ) : null}
            </div>

            <div className="flex justify-center lg:hidden">
              <ArrowConnectorVertical />
            </div>
            <div className="hidden min-w-[2rem] max-w-[3.5rem] flex-1 items-center justify-center lg:flex">
              <ArrowConnectorHorizontal />
            </div>

            {/* Right — next preview */}
            <div className="min-w-0 flex-1">
              {rightStep ? (
                <FlowCard variant="next" title={rightStep.title} outcome={rightStep.outcome} why={rightStep.why} icon={rightStep.icon} />
              ) : (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center cut-frame-sm border border-dashed border-[rgba(250,204,21,0.28)] bg-black/40 px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:min-h-[13rem]">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--gold)]/70 sm:text-[11px]">
                    Final stretch
                  </p>
                  <p className="mt-2 max-w-[16rem] text-[12px] leading-relaxed text-white/58 sm:text-[13px]">
                    Complete this step to close out your path.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!done && centerStep ? (
        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-[rgba(197,179,88,0.12)] bg-black/25 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3.5">
          <p className="text-[12px] leading-relaxed text-white/62 md:max-w-[58%]">
            <span className="font-semibold text-[color:var(--gold)]">Unlock after completing current step</span> — future stages stay muted
            until you ship this milestone.
          </p>
          <motion.button
            type="button"
            onClick={onCompleteStep}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cut-frame-sm cyber-frame gold-stroke hud-hover-glow shrink-0 border border-[rgba(250,204,21,0.45)] bg-[linear-gradient(165deg,rgba(255,215,0,0.12),rgba(0,0,0,0.55))] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--gold)] shadow-[0_0_24px_rgba(250,204,21,0.12)] sm:px-5"
          >
            Mark step complete
          </motion.button>
        </div>
      ) : null}

      {!done ? (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          Step {currentIndex + 1} of {steps.length} · saved on this device
        </p>
      ) : null}
    </div>
  );
}
