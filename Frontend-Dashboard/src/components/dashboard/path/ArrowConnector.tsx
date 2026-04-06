"use client";

import { motion } from "framer-motion";
import { cn } from "../dashboardPrimitives";

const GOLD = "rgba(253,224,71,0.98)";
const GOLD_DIM = "rgba(250,204,21,0.65)";

export function ArrowConnectorHorizontal({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full min-w-[1.5rem] max-w-[4rem] flex-1 items-center gap-0.5", className)}>
      <div className="relative h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-black/65 ring-1 ring-[rgba(250,204,21,0.28)]">
        <motion.div
          className="absolute bottom-0 left-0 top-0 w-[40%] rounded-full opacity-90"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            boxShadow: `0 0 12px ${GOLD_DIM}`
          }}
          animate={{ x: ["-40%", "220%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <svg
        className="h-5 w-5 shrink-0 text-[color:var(--gold)] drop-shadow-[0_0_10px_rgba(250,204,21,0.45)]"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function ArrowConnectorVertical({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-12 w-full flex-col items-center justify-center gap-0.5", className)}>
      <div className="relative h-9 w-[3px] overflow-hidden rounded-full bg-black/65 ring-1 ring-[rgba(250,204,21,0.28)]">
        <motion.div
          className="absolute left-0 right-0 top-0 h-[38%] w-full rounded-full opacity-90"
          style={{
            background: `linear-gradient(180deg, transparent, ${GOLD}, transparent)`,
            boxShadow: `0 0 10px ${GOLD_DIM}`
          }}
          animate={{ y: ["-45%", "200%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <svg
        className="h-5 w-5 text-[color:var(--gold)] drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
