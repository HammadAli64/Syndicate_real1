"use client";

import { useId } from "react";
import type { DashboardNavKey } from "./types";

type Props = {
  nextNodeIndex: 0 | 1 | 2;
  onNavigate: (nav: DashboardNavKey) => void;
};

const NODES: Array<{ id: string; label: string; sub: string; x: number; y: number }> = [
  { id: "n0", label: "Java Foundations", sub: "Tier I", x: 72, y: 88 },
  { id: "n1", label: "Spring & Services", sub: "Tier II", x: 200, y: 88 },
  { id: "n2", label: "Backend Architecture", sub: "Tier III", x: 328, y: 88 }
];

export function SkillTreePanel({ nextNodeIndex, onNavigate }: Props) {
  const uid = useId().replace(/:/g, "");
  return (
    <div className="relative rounded-md border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Skill tree</div>
        <button
          type="button"
          onClick={() => onNavigate("programs")}
          className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300/80 hover:text-emerald-200"
        >
          Open programs →
        </button>
      </div>
      <svg viewBox="0 0 400 140" className="h-[140px] w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-st-line`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(196,126,255,0.55)" />
            <stop offset="100%" stopColor="rgba(0,255,170,0.45)" />
          </linearGradient>
          <filter id={`${uid}-st-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 72 88 L 200 88 L 328 88"
          fill="none"
          stroke={`url(#${uid}-st-line)`}
          strokeWidth="2"
          strokeDasharray="4 6"
          opacity="0.85"
        />
        <circle cx="136" cy="88" r="3" fill="rgba(255,0,170,0.55)" />
        <circle cx="264" cy="88" r="3" fill="rgba(0,255,255,0.45)" />
        {NODES.map((n, i) => {
          const isNext = i === nextNodeIndex;
          return (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
              {isNext ? (
                <circle r="34" fill="none" stroke="rgba(196,126,255,0.35)" strokeWidth="1.5" filter={`url(#${uid}-st-glow)`} className="motion-safe:animate-pulse" />
              ) : null}
              <rect x="-58" y="-28" width="116" height="56" rx="8" fill="rgba(8,8,12,0.92)" stroke={isNext ? "rgba(0,255,170,0.55)" : "rgba(255,255,255,0.12)"} strokeWidth="1.2" />
              <text x="0" y="-6" textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize="10" fontFamily="var(--font-mono), ui-monospace, monospace" fontWeight="700">
                {n.label}
              </text>
              <text x="0" y="10" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="var(--font-mono), ui-monospace, monospace">
                {n.sub}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 font-mono text-[10px] text-white/45">
        Next logical unlock glows <span className="text-emerald-300/90">Tier {nextNodeIndex + 1}</span>.
      </div>
    </div>
  );
}
