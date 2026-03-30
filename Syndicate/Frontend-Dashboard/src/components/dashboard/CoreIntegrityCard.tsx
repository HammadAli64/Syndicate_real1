"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import type { DashboardNavKey, DashboardSnapshots } from "./types";
import { Card, type ThemeMode } from "./dashboardPrimitives";

export function CoreIntegrityCard({
  themeMode,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const s = snapshots.coreIntegrity;
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);
  const pct = Math.max(0, Math.min(100, s.integrityPct));
  const gid = useId().replace(/:/g, "");
  const intelUpgrades = Math.max(0, Math.floor((pct - 40) / 15));

  return (
    <Card
      themeMode={themeMode}
      title="The Vault"
      accentKey="energy"
      headerImageSrc="/assets/dashboard/stake.svg"
      right={
        <motion.button
          type="button"
          onClick={() => onNavigate("dashboard")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#ead6ff]"
        >
          Open →
        </motion.button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white/55">Available intel upgrades</div>
          <div className="mt-2 font-mono text-[26px] font-black tabular-nums text-white/90">{intelUpgrades}</div>
          <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            Vault state: <span className="text-emerald-300/90">Ready</span>
          </div>
          <div className="relative mx-auto mt-2 h-[120px] w-[120px]">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={`url(#${gid}-integrityGrad)`}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 326.73} 326.73`}
              />
              <defs>
                <linearGradient id={`${gid}-integrityGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(196,126,255,0.95)" />
                  <stop offset="100%" stopColor="rgba(0,255,170,0.85)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="font-mono text-[22px] font-black tabular-nums text-white/90">{Math.round(pct)}%</div>
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">core integrity</div>
            </div>
          </div>
          <div className="mt-2 font-mono text-[11px] text-white/55">Mission readiness: <span className="font-mono font-black text-white/85">{pct > 75 ? "GREEN" : pct > 55 ? "AMBER" : "RED"}</span></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <motion.button
              type="button"
              onClick={() => onNavigate("dashboard")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-md border border-[rgba(0,255,170,0.35)] bg-[rgba(0,255,170,0.08)] px-4 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#b4ffd8] hover:border-[rgba(0,255,170,0.65)]"
            >
              Upgrade
            </motion.button>
            <motion.button
              type="button"
              onClick={() => onNavigate("dashboard")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-md border border-white/15 bg-black/20 px-4 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70 hover:border-white/30"
            >
              Archive
            </motion.button>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white/55">Load curve</div>
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.14em] text-white/55">
              {hoverPoint != null ? `T${hoverPoint + 1}` : "hover"}
            </div>
          </div>
          <div className="relative mt-2 flex items-end gap-1">
            {s.loadSeries.slice(-8).map((v, i) => {
              const h = Math.max(10, Math.min(90, v * 2));
              return (
                <motion.div
                  key={i}
                  onMouseEnter={() => setHoverPoint(i)}
                  onMouseLeave={() => setHoverPoint(null)}
                  whileHover={{ scaleY: 1.06 }}
                  className="relative flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    background: "linear-gradient(180deg, rgba(196,126,255,0.75), rgba(0,255,170,0.35))"
                  }}
                >
                  <span
                    className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
                    style={{
                      background: hoverPoint === i ? "rgba(0,255,255,0.85)" : "rgba(255,0,170,0.75)",
                      boxShadow: hoverPoint === i ? "0 0 18px rgba(0,255,255,0.45)" : "0 0 18px rgba(255,0,170,0.35)"
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
          {hoverPoint != null ? (
            <div className="mt-2 rounded-md border border-[rgba(196,126,255,0.30)] bg-black/40 px-3 py-2 font-mono text-[12px] text-white/70">
              Throughput: <span className="font-black text-white/90">{s.loadSeries.slice(-8)[hoverPoint]}</span>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white/55">System uptime</div>
              <div className="mt-1 font-mono text-[14px] font-black text-white/85">{s.systemUptimeDays} days</div>
            </div>
            <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white/55">Energy reserve</div>
              <div className="mt-1 font-mono text-[14px] font-black text-white/85">{Math.round(s.energyLevel)}%</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
