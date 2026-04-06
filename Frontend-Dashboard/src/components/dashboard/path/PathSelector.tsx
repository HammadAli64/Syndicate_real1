"use client";

import { motion } from "framer-motion";
import type { GoalId } from "./goalPathData";
import { GOAL_OPTIONS } from "./goalPathData";
import { cn } from "../dashboardPrimitives";

export function PathSelector({ selected, onSelect }: { selected: GoalId; onSelect: (g: GoalId) => void }) {
  return (
    <div className="relative">
      <div className="font-mono text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--gold-neon)]/88 sm:text-[11px] sm:tracking-[0.28em]">
        Your path
      </div>
      <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-white/65 sm:text-[13px]">
        Choose a focus. Your roadmap and course flow update automatically.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-5 lg:gap-3">
        {GOAL_OPTIONS.map((g) => {
          const on = selected === g.id;
          return (
            <motion.button
              key={g.id}
              type="button"
              onClick={() => onSelect(g.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "cut-frame-sm cyber-frame relative min-h-[52px] w-full min-w-0 border px-3 py-2.5 text-left transition-[box-shadow,border-color,background-color,color] duration-300",
                "font-mono text-[10px] font-black uppercase leading-tight tracking-[0.12em] sm:min-h-[56px] sm:px-3.5 sm:py-3 sm:text-[11px] sm:tracking-[0.14em]",
                on
                  ? "z-[1] border-[rgba(250,204,21,0.55)] bg-[linear-gradient(165deg,rgba(255,215,0,0.14),rgba(20,18,8,0.92))] text-[color:var(--gold)] shadow-[0_0_0_1px_rgba(250,204,21,0.35),0_0_28px_rgba(250,204,21,0.18),0_0_56px_rgba(250,204,21,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-[rgba(197,179,88,0.2)] bg-[linear-gradient(165deg,rgba(255,255,255,0.04),rgba(0,0,0,0.5))] text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(250,204,21,0.38)] hover:text-white/92 hover:shadow-[0_0_20px_rgba(250,204,21,0.08)]"
              )}
            >
              <span className="block truncate uppercase">{g.label}</span>
              <span
                className={cn(
                  "mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.18em]",
                  on ? "text-[color:var(--gold)]/75" : "text-white/45"
                )}
              >
                {g.short}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
