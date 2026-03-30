"use client";

import { motion } from "framer-motion";
import type { DashboardNavKey } from "./types";

export type ThemeMode = "default" | "danger" | "cyberpunk";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function themeAccent(themeMode: ThemeMode) {
  return themeMode === "danger"
    ? { border: "rgba(255,72,72,0.72)", glow: "rgba(255,72,72,0.28)", text: "#ffd2d2" }
    : themeMode === "cyberpunk"
      ? { border: "rgba(196,126,255,0.72)", glow: "rgba(196,126,255,0.26)", text: "#ead6ff" }
      : { border: "rgba(255,215,0,0.62)", glow: "rgba(255,215,0,0.22)", text: "#ffe7a1" };
}

export function accentByKey(key: DashboardNavKey | "alerts" | "success" | "energy") {
  switch (key) {
    case "programs":
      return { border: "rgba(255,215,0,0.62)", glow: "rgba(255,215,0,0.22)", fill: "rgba(255,215,0,0.12)", text: "#ffe7a1" };
    case "monk":
      return { border: "rgba(0,255,255,0.62)", glow: "rgba(0,255,255,0.22)", fill: "rgba(0,255,255,0.16)", text: "#d7ffff" };
    case "affiliate":
      return { border: "rgba(0,255,122,0.62)", glow: "rgba(0,255,122,0.22)", fill: "rgba(0,255,122,0.14)", text: "#b4ffd8" };
    case "resources":
      return { border: "rgba(255,215,0,0.58)", glow: "rgba(255,215,0,0.20)", fill: "rgba(255,215,0,0.12)", text: "#ffe7a1" };
    case "support":
      return { border: "rgba(255,165,0,0.62)", glow: "rgba(255,165,0,0.22)", fill: "rgba(255,165,0,0.14)", text: "#ffd9a6" };
    case "settings":
      return { border: "rgba(210,210,210,0.42)", glow: "rgba(255,255,255,0.12)", fill: "rgba(255,255,255,0.06)", text: "#eaeaea" };
    case "alerts":
      return { border: "rgba(255,59,59,0.72)", glow: "rgba(255,59,59,0.26)", fill: "rgba(255,59,59,0.14)", text: "#ffd1d1" };
    case "success":
      return { border: "rgba(0,255,122,0.72)", glow: "rgba(0,255,122,0.26)", fill: "rgba(0,255,122,0.14)", text: "#b4ffd8" };
    case "energy":
      return { border: "rgba(255,215,0,0.72)", glow: "rgba(255,215,0,0.26)", fill: "rgba(255,215,0,0.14)", text: "#ffe7a1" };
    default:
      return { border: "rgba(255,215,0,0.62)", glow: "rgba(255,215,0,0.22)", fill: "rgba(255,215,0,0.12)", text: "#ffe7a1" };
  }
}

export function Card({
  themeMode,
  title,
  right,
  children,
  className,
  accentKey,
  headerImageSrc
}: {
  themeMode: ThemeMode;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  accentKey?: DashboardNavKey | "alerts" | "success" | "energy";
  headerImageSrc?: string;
}) {
  const t = themeAccent(themeMode);
  const a = accentKey ? accentByKey(accentKey) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={cn(
        "dashboard-card cyber-corners group relative overflow-hidden border p-4 transition",
        "bg-[rgba(10,10,10,0.70)] backdrop-blur-[12px]",
        "opacity-70 hover:opacity-100",
        className
      )}
      style={{
        borderColor: a?.border ?? t.border,
        ["--card-accent-border" as any]: a?.border ?? t.border,
        ["--card-accent-glow" as any]: a?.glow ?? t.glow
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(760px_280px_at_18%_0%,rgba(255,215,0,0.16),rgba(0,0,0,0)_64%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(720px_280px_at_88%_0%,rgba(196,126,255,0.14),rgba(0,0,0,0)_62%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0px,rgba(255,255,255,0.02)_1px,transparent_7px,transparent_14px)]" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(255,215,0,0.10),rgba(0,255,255,0.06),rgba(0,0,0,0)_60%)]" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="font-mono text-[12px] font-extrabold uppercase tracking-[0.2em] text-white/88 group-hover:text-white/95">
          {title}
        </div>
        {right}
      </div>
      {headerImageSrc ? (
        <div className="relative mt-3 overflow-hidden rounded-md border border-white/10 bg-black/40">
          <div className="absolute inset-0 opacity-85 [background:linear-gradient(90deg,rgba(0,0,0,0.92),rgba(0,0,0,0.35),rgba(0,0,0,0.92))]" />
          <img
            src={headerImageSrc}
            alt=""
            className="h-[72px] w-full object-cover opacity-90"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 0 1px ${(a?.border ?? t.border)}` }} />
        </div>
      ) : null}
      <div className="relative mt-3">{children}</div>
    </motion.div>
  );
}

export function ProgressBar({ pct, tone }: { pct: number; tone: "gold" | "ice" | "danger" }) {
  const bg =
    tone === "danger"
      ? "linear-gradient(90deg, rgba(255,59,59,0.95), rgba(255,165,0,0.90))"
      : tone === "ice"
        ? "linear-gradient(90deg, rgba(0,255,255,0.85), rgba(196,126,255,0.85))"
        : "linear-gradient(90deg, rgba(255,215,0,0.95), rgba(255,165,0,0.85))";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/15 bg-black/55">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ background: bg, boxShadow: "0 0 18px rgba(255,215,0,0.18)" }}
      />
    </div>
  );
}
