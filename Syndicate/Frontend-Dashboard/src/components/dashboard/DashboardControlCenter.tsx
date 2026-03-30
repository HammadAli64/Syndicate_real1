"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DashboardNavKey, DashboardSnapshots, NotificationItem } from "./types";
import { useDashboardSnapshots, type DashboardCourseLike } from "./useDashboardSnapshots";
import { accentByKey, Card, cn, ProgressBar, themeAccent, type ThemeMode } from "./dashboardPrimitives";
import { TacticalMissionHub } from "./TacticalMissionHub";
import { BlackBoxIntelPanel } from "./BlackBoxIntelPanel";
import { SkillTreePanel } from "./SkillTreePanel";
import { CoreIntegrityCard } from "./CoreIntegrityCard";

export type { ThemeMode };

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function NotificationBell({
  themeMode,
  notifications,
  onNavigate
}: {
  themeMode: ThemeMode;
  notifications: NotificationItem[];
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const t = themeAccent(themeMode);
  const panelRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        className="cut-frame-sm cyber-frame gold-stroke hud-hover-glow grid h-10 w-10 place-items-center border bg-black/50 text-white/80 hover:text-white"
        style={{ borderColor: t.border }}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 20.2a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 20.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M18.2 16.2H5.8l1.1-1.3V11a5.1 5.1 0 0 1 10.2 0v3.9l1.1 1.3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-white/10 bg-[rgba(255,59,59,0.95)] text-[10px] font-black text-white shadow-[0_0_16px_rgba(255,59,59,0.35)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="cut-frame cyber-frame gold-stroke absolute right-0 top-[calc(100%+10px)] z-50 w-[min(420px,92vw)] overflow-hidden border bg-[#060606]/95 p-3 backdrop-blur-md"
            style={{ borderColor: t.border, boxShadow: `0 0 0 1px ${t.glow}, 0 0 26px ${t.glow}` }}
            role="menu"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/60">
                Notifications
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                {unread} unread
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {notifications.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (n.cta?.nav) onNavigate(n.cta.nav);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-md border bg-black/35 px-3 py-2 text-left transition hover:bg-black/55",
                    n.read ? "border-white/10" : "border-[rgba(255,215,0,0.30)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[12px] font-bold text-white/80">{n.title}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                      {timeAgo(n.ts)}
                    </div>
                  </div>
                  {n.message ? <div className="mt-1 text-[12px] text-white/60">{n.message}</div> : null}
                  {n.cta?.label ? (
                    <div className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--gold)]/90">
                      {n.cta.label} →
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CommandBar({
  themeMode,
  onNavigate,
  onQuickAction
}: {
  themeMode: ThemeMode;
  onNavigate: (nav: DashboardNavKey) => void;
  onQuickAction: (action: "continue_program" | "join_challenge" | "share_referral") => void;
}) {
  const [q, setQ] = useState("");
  const t = themeAccent(themeMode);
  type CmdItem =
    | { kind: "nav"; label: string; key: DashboardNavKey }
    | { kind: "action"; label: string; action: "continue_program" | "join_challenge" | "share_referral" };

  const items: CmdItem[] = useMemo(
    () => [
      { kind: "nav", label: "Go: Programs", key: "programs" },
      { kind: "nav", label: "Go: Syndicate Mode", key: "monk" },
      { kind: "nav", label: "Go: Affiliate Portal", key: "affiliate" },
      { kind: "nav", label: "Go: Resources", key: "resources" },
      { kind: "nav", label: "Go: Support", key: "support" },
      { kind: "nav", label: "Go: Settings", key: "settings" },
      { kind: "action", label: "Action: Continue program", action: "continue_program" },
      { kind: "action", label: "Action: Join challenge", action: "join_challenge" },
      { kind: "action", label: "Action: Share referral", action: "share_referral" }
    ],
    []
  );

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items.slice(0, 6);
    return items.filter((it) => it.label.toLowerCase().includes(s)).slice(0, 8);
  }, [items, q]);

  return (
    <div className="relative">
      <div
        className="cut-frame-sm border bg-black/40 px-3 py-2"
        style={{ borderColor: t.border, boxShadow: `0 0 0 1px ${t.glow}` }}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/60" fill="none" aria-hidden="true">
            <path d="M10.5 18.2a7.7 7.7 0 1 1 0-15.4a7.7 7.7 0 0 1 0 15.4Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16.2 16.2L20.4 20.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Command / search… (Programs, Syndicate, Resources)"
            className="w-full bg-transparent text-[12px] font-semibold text-white/80 placeholder:text-white/35 outline-none"
          />
          <div className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            Ctrl K
          </div>
        </div>
      </div>

      {results.length ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-md border border-white/10 bg-[#050505]/95 backdrop-blur-md">
          {results.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => {
                setQ("");
                if (r.kind === "nav") onNavigate(r.key);
                else onQuickAction(r.action);
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12px] text-white/75 hover:bg-white/5"
            >
              <span className="font-semibold">{r.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Enter</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HeroStatusPanel({
  themeMode,
  userName,
  userRole,
  profileAvatar,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  userName: string;
  userRole: string;
  profileAvatar: string;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const s = snapshots;
  const t = themeAccent(themeMode);
  return (
    <div
      className="cut-frame cyber-frame gold-stroke relative overflow-hidden border border-white/15 bg-white/[0.05] p-4 backdrop-blur-[10px] md:p-5"
      style={{ borderColor: t.border, boxShadow: `0 0 0 1px ${t.glow}, 0 0 64px ${t.glow}` }}
    >
      <div className="absolute inset-0 opacity-75 [background:radial-gradient(900px_420px_at_30%_0%,rgba(255,215,0,0.18),rgba(0,0,0,0)_62%)]" />
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(800px_320px_at_90%_0%,rgba(196,126,255,0.16),rgba(0,0,0,0)_62%)]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={profileAvatar}
            alt="Profile avatar"
            className="h-14 w-14 rounded-lg border border-white/10 bg-black/30 object-cover p-0.5"
          />
          <div className="min-w-0">
            <div className="font-mono text-[14px] font-black uppercase tracking-[0.12em] text-[color:var(--gold)]/92">
              {userName}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              {userRole} • Rank: <span className="text-white/80">{s.syndicate.rankLabel}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="group relative inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-1">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/22" fill="none" aria-hidden="true">
                  <path d="M12 3.8l6.2 3.6v7.2L12 18.2l-6.2-3.6V7.4L12 3.8Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7.8 9.2h8.4M7.8 12h6.2M7.8 14.8h8.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                </svg>
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Diamond</span>
                <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-50 hidden w-[260px] -translate-x-1/2 rounded-md border border-white/10 bg-black/90 p-2 text-[11px] text-white/70 shadow-[0_0_28px_rgba(168,85,247,0.18)] group-hover:block">
                  <div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200/85">Future state</div>
                  <div className="mt-1">Sync remaining <span className="font-mono font-black text-white/90">28%</span> XP to unlock Diamond-tier HUD.</div>
                </div>
              </div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Next rank preview</div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
                <span>XP toward next rank</span>
                <span className="text-white/85">{s.syndicate.xpPct}%</span>
              </div>
              <div className="mt-2">
                <ProgressBar pct={s.syndicate.xpPct} tone={themeMode === "danger" ? "danger" : themeMode === "cyberpunk" ? "ice" : "gold"} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { k: "Active programs", v: String(Math.max(1, s.programs.length)), nav: "programs" as const, clickable: true },
              { k: "Active challenges", v: s.syndicate.activeMissionTitle ? "1" : "0", nav: "monk" as const, clickable: true },
              { k: "Network resource credits", v: `${s.affiliate.earnings}`, nav: "affiliate" as const, clickable: true },
              { k: "Core integrity", v: "Stable", nav: "dashboard" as const, clickable: false }
            ].map((x) => (
              x.clickable ? (
                <button
                  key={x.k}
                  type="button"
                  onClick={() => onNavigate(x.nav)}
                  className="rounded-md border bg-black/40 px-3 py-2 text-left hover:bg-black/65"
                  style={{
                    borderColor: accentByKey(x.nav).border,
                    boxShadow: `0 0 0 1px ${accentByKey(x.nav).glow}`
                  }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">{x.k}</div>
                  <div className="mt-1 font-mono text-[14px] font-black tabular-nums text-white/92">{x.v}</div>
                </button>
              ) : (
                <div
                  key={x.k}
                  className="rounded-md border bg-black/40 px-3 py-2 text-left"
                  style={{
                    borderColor: "rgba(196,126,255,0.65)",
                    boxShadow: "0 0 0 1px rgba(196,126,255,0.22)"
                  }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">{x.k}</div>
                  <div className="mt-1 font-mono text-[14px] font-black tabular-nums text-white/92">{x.v}</div>
                </div>
              )
            ))}
          </div>
          <div className="shrink-0 pl-1">
            <NotificationBell themeMode={themeMode} notifications={s.notifications} onNavigate={onNavigate} />
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="rounded-md border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
          style={{
            borderColor: accentByKey("alerts").border,
            background: accentByKey("alerts").fill,
            color: accentByKey("alerts").text,
            boxShadow: `0 0 22px ${accentByKey("alerts").glow}`
          }}
        >
          Streak: {s.syndicate.streakDays} days
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button
            type="button"
            onClick={() => onNavigate("programs")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border bg-black/30 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/95 hover:bg-black/45"
            style={{ borderColor: accentByKey("energy").border, boxShadow: `0 0 20px ${accentByKey("energy").glow}` }}
          >
            Continue Program
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onNavigate("monk")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border bg-black/30 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] hover:bg-black/45"
            style={{ borderColor: accentByKey("monk").border, color: accentByKey("monk").text, boxShadow: `0 0 20px ${accentByKey("monk").glow}` }}
          >
            Join Challenge
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function ContinueWorkPanel({
  themeMode,
  snapshots,
  onNavigate,
  ghostMode
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
  ghostMode?: boolean;
}) {
  const lastProgram = snapshots.programs[0] ?? null;
  return (
    <Card
      themeMode={themeMode}
      title="Continue Work (Primary CTA)"
      accentKey="energy"
      right={
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          {ghostMode ? "Ghost protocol" : "Dynamic"}
        </div>
      }
    >
      <div className={cn("grid grid-cols-1 gap-3", ghostMode ? "lg:grid-cols-1" : "lg:grid-cols-2")}>
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Resume last program</div>
          <div className="mt-2 text-[16px] font-black uppercase tracking-[0.08em] text-white/85">
            {lastProgram ? lastProgram.title : "No program yet"}
          </div>
          <div className="mt-2 text-[12px] text-white/60">{lastProgram?.meta ?? "Pick a program to start tracking progress."}</div>
          <div className="mt-3">
            <ProgressBar pct={lastProgram?.progressPct ?? 0} tone="gold" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("programs")}
              className="rounded-md border border-[rgba(255,215,0,0.35)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/90 hover:border-[rgba(255,215,0,0.7)]"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => onNavigate("programs")}
              className="rounded-md border border-white/15 bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70 hover:border-white/30"
            >
              View Programs
            </button>
          </div>
        </div>

        {!ghostMode ? (
          <div className="rounded-md border border-white/10 bg-black/35 p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Resume last challenge</div>
            <div className="mt-2 text-[16px] font-black uppercase tracking-[0.08em] text-white/85">
              {snapshots.syndicate.activeMissionTitle ?? "No active mission"}
            </div>
            <div className="mt-2 text-[12px] text-white/60">Category: {String(snapshots.syndicate.category ?? "skills")}</div>
            <div className="mt-3">
              <ProgressBar pct={snapshots.syndicate.xpPct} tone="ice" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate("monk")}
                className="rounded-md border border-[rgba(0,255,255,0.28)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#bfefff] hover:border-[rgba(0,255,255,0.55)]"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => onNavigate("monk")}
                className="rounded-md border border-white/15 bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70 hover:border-white/30"
              >
                Start Next
              </button>
            </div>
          </div>
        ) : null}

        <TacticalMissionHub />

        {!ghostMode ? <BlackBoxIntelPanel /> : null}
      </div>
    </Card>
  );
}

function UnifiedProgressEngine({
  themeMode,
  snapshots
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
}) {
  const avgProgram = snapshots.programs.length
    ? Math.round(snapshots.programs.reduce((a, p) => a + p.progressPct, 0) / snapshots.programs.length)
    : 0;
  const challenge = Math.round(snapshots.syndicate.xpPct);
  const rank = Math.round(snapshots.goals.rankProgressPct);
  const contribution = Math.round((avgProgram * 0.4 + challenge * 0.4 + rank * 0.2) || 0);

  return (
    <Card themeMode={themeMode} title="Unified Progress Engine" right={<div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Multi-metric</div>}>
      <div className="relative">
        <div className="engine-scanline pointer-events-none" aria-hidden />
        <div className="overflow-x-auto">
          <div className="grid min-w-[680px] grid-cols-4 gap-3 md:min-w-0 md:grid-cols-2 xl:grid-cols-4">
            {[
              { k: "Program completion", v: avgProgram, tone: "gold" as const },
              { k: "Challenge progress", v: challenge, tone: "ice" as const },
              { k: "Rank progression", v: rank, tone: themeMode === "danger" ? ("danger" as const) : ("gold" as const) },
              { k: "Contribution score", v: contribution, tone: "gold" as const }
            ].map((m) => (
              <div key={m.k} className="rounded-md border border-white/10 bg-black/35 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{m.k}</div>
                <div className="mt-1 font-mono text-[18px] font-black tabular-nums text-white/85">{m.v}%</div>
                <div className="mt-2">
                  <ProgressBar pct={m.v} tone={m.tone} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProgramsSnapshot({
  themeMode,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const top = snapshots.programs.slice(0, 4);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(
    typeof window !== "undefined" ? window.localStorage.getItem("dashboarded:activeProgramId") : null
  );
  return (
    <Card
      themeMode={themeMode}
      title="Programs Snapshot"
      accentKey="programs"
      headerImageSrc="/assets/dashboard/programs.svg"
      right={
        <motion.button
          type="button"
          onClick={() => onNavigate("programs")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/95"
        >
          Open →
        </motion.button>
      }
    >
      <div className="space-y-2">
        {top.length ? (
          top.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ scale: 1.01 }}
              className="rounded-md border border-white/10 bg-black/40 px-3 py-2 transition hover:border-[rgba(255,215,0,0.40)] hover:bg-black/65"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-14 overflow-hidden rounded-md border border-white/10 bg-black/30">
                    <img
                      src={p.imageSrc || "/assets/programs/youtube-automation.svg"}
                      alt=""
                      className="h-full w-full object-cover opacity-90"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-black text-white/85">{p.title}</div>
                    <div className="truncate text-[11px] font-semibold text-white/55">{p.meta}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") window.localStorage.setItem("dashboarded:activeProgramId", p.id);
                      setActiveProgramId(p.id);
                    }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition",
                      activeProgramId === p.id
                        ? "border-[rgba(0,255,122,0.55)] bg-[rgba(0,255,122,0.12)] text-[#b4ffd8]"
                        : "border-white/15 bg-black/20 text-white/70 hover:border-[rgba(0,255,122,0.45)]"
                    )}
                  >
                    {activeProgramId === p.id ? "Active" : "Pin"}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => onNavigate("programs")}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-md border border-[rgba(255,215,0,0.35)] bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/90 hover:border-[rgba(255,215,0,0.7)]"
                  >
                    Open
                  </motion.button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-full">
                  <ProgressBar pct={p.progressPct} tone="gold" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">{p.progressPct}%</div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="rounded-md border border-white/10 bg-black/35 p-3">
            <div className="text-[12px] font-semibold text-white/75">No started program yet.</div>
            <div className="mt-1 text-[12px] text-white/60">
              Start one program and pin it as Active. Here’s a clean starter visual for YouTube automation.
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-md border border-white/10 bg-black/30 p-3">
              <div className="h-12 w-20 overflow-hidden rounded-md border border-white/10 bg-black/30">
                <img src="/assets/programs/youtube-automation.svg" alt="" className="h-full w-full object-cover opacity-90" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-black text-white/85">YouTube Automation (faceless)</div>
                <div className="text-[11px] font-semibold text-white/55">Script → Voice → Edit → Publish</div>
              </div>
              <motion.button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") window.localStorage.setItem("dashboarded:activeProgramId", "b");
                  setActiveProgramId("b");
                  onNavigate("programs");
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-md border border-[rgba(0,255,122,0.42)] bg-[rgba(0,255,122,0.10)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#b4ffd8] hover:border-[rgba(0,255,122,0.70)]"
              >
                Start
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function SyndicateSnapshotCard({
  themeMode,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const s = snapshots.syndicate;
  return (
    <Card
      themeMode={themeMode}
      title="Syndicate Mode Snapshot"
      accentKey="monk"
      headerImageSrc="/assets/dashboard/syndicate.svg"
      right={
        <motion.button
          type="button"
          onClick={() => onNavigate("monk")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d7ffff]"
        >
          Open →
        </motion.button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Rank</div>
          <div className="mt-1 text-[18px] font-black text-white/85">{s.rankLabel}</div>
          <div className="mt-2 text-[12px] text-white/60">Level {s.level} • {s.durationDays} day cycle</div>
          <div className="mt-3">
            <ProgressBar pct={s.xpPct} tone={themeMode === "danger" ? "danger" : themeMode === "cyberpunk" ? "ice" : "gold"} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-white/60">
            <span>XP earned</span>
            <span className="font-black text-white/80">{s.xpPct}%</span>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Next rank checklist</div>
          <div className="mt-2 space-y-2">
            {s.nextRankChecklist.slice(0, 4).map((x) => (
              <div key={x} className="flex items-start gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-white/70">
                <span className="mt-[3px] inline-flex h-2 w-2 rounded-full bg-[color:var(--gold)]/80" />
                <span className="font-semibold">{x}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Active challenge</div>
          <div className="mt-1 text-[13px] font-black text-white/85">{s.activeMissionTitle ?? "—"}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Leaderboard</div>
          <div className="mt-1 text-[13px] font-black text-white/85">#{s.leaderboardPos ?? "—"}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Streak</div>
          <div className="mt-1 text-[13px] font-black text-white/85">{s.streakDays} days</div>
        </div>
      </div>
    </Card>
  );
}

function AffiliateSnapshotCard({
  themeMode,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const a = snapshots.affiliate;
  const [hoverMetric, setHoverMetric] = useState<string | null>(null);
  return (
    <Card
      themeMode={themeMode}
      title="Affiliate Portal Snapshot"
      accentKey="affiliate"
      headerImageSrc="/assets/dashboard/affiliate.svg"
      right={
        <motion.button
          type="button"
          onClick={() => onNavigate("affiliate")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b4ffd8]"
        >
          Open →
        </motion.button>
      }
    >
      <div className="rounded-md border border-white/10 bg-black/35 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Referral link</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="min-w-0 truncate text-[12px] font-semibold text-white/70">{a.referralLink ?? "—"}</div>
          <motion.button
            type="button"
            onClick={() => {
              if (a.referralLink) navigator.clipboard?.writeText(a.referralLink);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 hover:border-[rgba(0,255,122,0.45)] hover:text-[#b4ffd8]"
          >
            Copy
          </motion.button>
        </div>
      </div>

      {/* Mini funnel visualization (hoverable) */}
      <div className="mt-3 rounded-md border border-[rgba(0,255,122,0.18)] bg-black/30 p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Funnel</div>
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b4ffd8]">
            {hoverMetric ? hoverMetric : "hover"}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { k: "Infiltrations", v: a.clicks, pct: 100, tone: "rgba(0,255,122,0.55)" },
            { k: "Operatives", v: a.conversions, pct: Math.max(4, Math.min(100, Math.round((a.conversions / Math.max(1, a.clicks)) * 100))), tone: "rgba(255,215,0,0.55)" },
            { k: "Credits", v: `${a.earnings}`, pct: Math.max(8, Math.min(100, Math.round((a.earnings / 1200) * 100))), tone: "rgba(196,126,255,0.55)" }
          ].map((m) => (
            <motion.div
              key={m.k}
              onMouseEnter={() => setHoverMetric(`${m.k}: ${m.v}`)}
              onMouseLeave={() => setHoverMetric(null)}
              whileHover={{ y: -2 }}
              className="rounded-md border border-white/10 bg-black/35 p-2"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{m.k}</div>
              <div className="mt-1 font-mono text-[13px] font-black tabular-nums text-white/90">{String(m.v)}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-black/50">
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.tone, boxShadow: `0 0 18px ${m.tone}` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["System infiltrations", a.clicks],
          ["Operatives synced", a.conversions],
          ["Network resource credits", a.earnings]
        ].map(([k, v]) => (
          <motion.div
            key={String(k)}
            whileHover={{ y: -2 }}
            className="rounded-md border border-white/10 bg-black/35 px-3 py-2 transition hover:border-[rgba(0,255,122,0.35)] hover:bg-black/60"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{k}</div>
            <div className="mt-1 font-mono text-[14px] font-black tabular-nums text-white/92">{String(v)}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-white/10 bg-black/35 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Recent</div>
        <div className="mt-2 space-y-2">
          {a.recent.slice(0, 3).map((r) => (
            <motion.div
              key={r.who + r.ts}
              whileHover={{ y: -2 }}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/30 px-3 py-2 transition hover:border-[rgba(0,255,122,0.35)] hover:bg-black/60"
            >
              <div className="text-[12px] font-semibold text-white/80">
                {r.who} •{" "}
                <span
                  className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]"
                  style={{
                    borderColor:
                      r.status === "purchased"
                        ? "rgba(0,255,122,0.45)"
                        : r.status === "joined"
                          ? "rgba(255,215,0,0.35)"
                          : "rgba(255,255,255,0.18)",
                    color:
                      r.status === "purchased"
                        ? "#b4ffd8"
                        : r.status === "joined"
                          ? "#ffe7a1"
                          : "rgba(255,255,255,0.72)"
                  }}
                >
                  {r.status}
                </span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{timeAgo(r.ts)}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <motion.button
            type="button"
            onClick={() => onNavigate("affiliate")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border border-[rgba(255,215,0,0.35)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/90 hover:border-[rgba(255,215,0,0.7)]"
          >
            Quick Share
          </motion.button>
        </div>
      </div>
    </Card>
  );
}

function ResourcesSnapshotCard({
  themeMode,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const r = snapshots.resources;
  return (
    <Card
      themeMode={themeMode}
      title="Resources Snapshot"
      accentKey="resources"
      headerImageSrc="/assets/dashboard/resources.svg"
      right={
        <motion.button
          type="button"
          onClick={() => onNavigate("resources")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/95"
        >
          Open →
        </motion.button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Recently accessed</div>
          <div className="mt-2 space-y-2">
            {r.recent.slice(0, 3).map((x) => (
              <div key={x.title} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/30 px-3 py-2">
                <div className="min-w-0 truncate text-[12px] font-semibold text-white/75">{x.title}</div>
                <div className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">{x.tag}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Recommended</div>
          <div className="mt-2 space-y-2">
            {r.recommended.slice(0, 3).map((x) => (
              <div key={x.title} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/30 px-3 py-2">
                <div className="min-w-0 truncate text-[12px] font-semibold text-white/75">{x.title}</div>
                <div className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">{x.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {r.tags.slice(0, 6).map((t) => (
          <span key={t} className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
            {t}
          </span>
        ))}
      </div>
    </Card>
  );
}

function ActivityTimelineCard({
  themeMode,
  snapshots
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
}) {
  const icon = (cat: string) => {
    if (cat === "program") return "rgba(255,215,0,0.75)";
    if (cat === "syndicate") return "rgba(0,255,255,0.55)";
    if (cat === "affiliate") return "rgba(0,255,122,0.55)";
    if (cat === "system") return "rgba(196,126,255,0.55)";
    return "rgba(255,255,255,0.25)";
  };

  return (
    <Card themeMode={themeMode} title="Activity Timeline" right={<div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Unified</div>}>
      <div className="space-y-2">
        {snapshots.activity.slice(0, 10).map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-white/10 bg-black/35 px-3 py-2">
            <div className="flex min-w-0 items-start gap-2">
              <span className="mt-[5px] inline-flex h-2.5 w-2.5 rounded-full" style={{ background: icon(a.category), boxShadow: `0 0 14px ${icon(a.category)}` }} />
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-white/78">
                  {a.title}{" "}
                  <span className="ml-2 rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
                    {a.category}
                  </span>
                </div>
                {a.detail ? <div className="truncate text-[12px] text-white/58">{a.detail}</div> : null}
              </div>
            </div>
            <div className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">{timeAgo(a.ts)}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GoalsMilestonesCard({
  themeMode,
  snapshots
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
}) {
  const g = snapshots.goals;
  return (
    <Card themeMode={themeMode} title="Goals & Milestones" right={<div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Tracker</div>}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Rank goal</div>
          <div className="mt-1 text-[16px] font-black text-white/85">{g.rankGoalLabel}</div>
          <div className="mt-2">
            <ProgressBar pct={g.rankProgressPct} tone="gold" />
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Completion goal</div>
          <div className="mt-1 text-[16px] font-black text-white/85">{Math.round(g.completionGoalPct)}%</div>
          <div className="mt-2">
            <ProgressBar pct={g.completionGoalPct} tone="ice" />
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["Earnings", g.earningsGoalPct],
          ["Integrity", g.integrityGoalPct]
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-md border border-white/10 bg-black/35 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{k}</div>
            <div className="mt-1 text-[14px] font-black text-white/85">{Math.round(Number(v))}%</div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-white/10 bg-black/35 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Milestones</div>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          {g.milestones.slice(0, 6).map((m) => (
            <div key={m.label} className={cn("rounded-md border px-3 py-2", m.reached ? "border-[rgba(0,255,122,0.35)] bg-[rgba(0,255,122,0.08)]" : "border-white/10 bg-black/30")}>
              <div className="text-[12px] font-semibold text-white/75">{m.label}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{m.reached ? "Reached" : `Target ${m.pct}%`}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function SkillTreeAugmentationCard({
  themeMode,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const p0 = snapshots.programs[0]?.progressPct ?? 0;
  const nextNodeIndex: 0 | 1 | 2 = p0 < 34 ? 0 : p0 < 67 ? 1 : 2;
  const r = snapshots.recommendations;
  const tips = [r.systemTip, r.reminder].filter(Boolean) as Array<{ title: string; reason: string; nav: DashboardNavKey }>;

  return (
    <Card
      themeMode={themeMode}
      title="Skill tree augmentation"
      accentKey="programs"
      right={<div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Path</div>}
    >
      <SkillTreePanel nextNodeIndex={nextNodeIndex} onNavigate={onNavigate} />
      {tips.length ? (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {tips.map((t) => (
            <button
              key={t.title}
              type="button"
              onClick={() => onNavigate(t.nav)}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-left font-mono hover:bg-black/50"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-300/70">Telemetry</div>
              <div className="mt-1 text-[12px] font-bold text-white/85">{t.title}</div>
              <div className="mt-0.5 text-[11px] text-white/55">{t.reason}</div>
            </button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function GlobalQuickActions({
  themeMode,
  onNavigate,
  ghostProtocol,
  onToggleGhostProtocol
}: {
  themeMode: ThemeMode;
  onNavigate: (nav: DashboardNavKey) => void;
  ghostProtocol: boolean;
  onToggleGhostProtocol: () => void;
}) {
  const t = themeAccent(themeMode);
  const a = accentByKey("energy");
  const extIcon = (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M14 5h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14L19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 14v5H5V5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
  return (
    <div className="fixed bottom-3 left-3 right-3 z-[9999] mt-4">
      <div
        className="cut-frame-sm relative overflow-hidden border bg-[#050505]/88 p-3 backdrop-blur-md"
        style={{ borderColor: a.border, boxShadow: `0 0 0 1px ${a.glow}, 0 0 42px ${a.glow}` }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-75 [background:radial-gradient(820px_220px_at_20%_0%,rgba(255,215,0,0.22),rgba(0,0,0,0)_64%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(90deg,rgba(255,215,0,0.06)_0px,rgba(255,215,0,0.06)_1px,transparent_14px,transparent_24px)]" />
        {/* Animated scan line */}
        <motion.div
          className="pointer-events-none absolute left-0 top-0 h-[2px] w-[180px] opacity-70"
          style={{ background: "linear-gradient(90deg, rgba(255,215,0,0), rgba(255,215,0,0.65), rgba(0,255,255,0.25), rgba(0,0,0,0))" }}
          animate={{ x: ["-20%", "120%"] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="font-mono text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70">
              External Command Deck
            </div>
            <div
              className="relative inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ borderColor: accentByKey("alerts").border, background: accentByKey("alerts").fill, color: accentByKey("alerts").text }}
            >
              <motion.span
                className="inline-flex h-2 w-2 rounded-full"
                style={{ background: "rgba(255,59,59,0.95)", boxShadow: "0 0 18px rgba(255,59,59,0.55)" }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
              LIVE
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              type="button"
              onClick={onToggleGhostProtocol}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] transition",
                ghostProtocol
                  ? "border-[rgba(0,255,255,0.55)] bg-[rgba(0,255,255,0.12)] text-[#bfefff] shadow-[0_0_22px_rgba(0,255,255,0.25)]"
                  : "border-white/20 bg-black/40 text-white/70 hover:border-white/35 hover:text-white/90"
              )}
              title="Ghost Protocol: collapse dashboard to Primary CTA + task matrix"
            >
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  ghostProtocol ? "bg-cyan-300 shadow-[0_0_12px_rgba(0,255,255,0.8)]" : "bg-white/40"
                )}
              />
              Ghost protocol
            </motion.button>
            {[
              ["Continue program", "programs"],
              ["Join challenge", "monk"],
              ["Share referral", "affiliate"]
            ].map(([label, key]) => (
              <motion.button
                key={label}
                type="button"
                onClick={() => onNavigate(key as DashboardNavKey)}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-2 rounded-md border bg-black/35 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] transition"
                style={{
                  borderColor: accentByKey(key as DashboardNavKey).border,
                  color: accentByKey(key as DashboardNavKey).text,
                  boxShadow: `0 0 0 1px ${accentByKey(key as DashboardNavKey).glow}`
                }}
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(255,215,0,0.14),rgba(0,255,255,0.06),rgba(0,0,0,0)_62%)]" />
                <span className="relative">{label}</span>
                <span className="relative opacity-80">{extIcon}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardControlCenter({
  themeMode,
  userName,
  userRole,
  profileAvatar,
  courses,
  onNavigate
}: {
  themeMode: ThemeMode;
  userName: string;
  userRole: string;
  profileAvatar: string;
  courses: DashboardCourseLike[];
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const snapshots = useDashboardSnapshots({ userName, courses });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [ghostProtocol, setGhostProtocol] = useState(false);
  const [ghostGlitching, setGhostGlitching] = useState(false);
  const glitchTimerRef = useRef<number | null>(null);
  const integrityHigh = snapshots.coreIntegrity.integrityPct > 90;

  const toggleGhostProtocol = useCallback(() => {
    setGhostGlitching(true);
    if (glitchTimerRef.current != null) window.clearTimeout(glitchTimerRef.current);
    glitchTimerRef.current = window.setTimeout(() => {
      setGhostProtocol((v) => !v);
      setGhostGlitching(false);
      glitchTimerRef.current = null;
    }, 480);
  }, []);

  useEffect(
    () => () => {
      if (glitchTimerRef.current != null) window.clearTimeout(glitchTimerRef.current);
    },
    []
  );

  return (
    <div
      className={cn(
        "relative space-y-4 rounded-lg transition-[box-shadow] duration-700",
        integrityHigh && !ghostProtocol && "dashboard-integrity-pulse",
        ghostGlitching && "ghost-protocol-glitch",
        ghostProtocol && "ghost-protocol-active"
      )}
    >
      <div className={cn("ghost-muted space-y-4", ghostProtocol && "ghost-muted")}>
        <HeroStatusPanel
          themeMode={themeMode}
          userName={userName}
          userRole={userRole}
          profileAvatar={profileAvatar}
          snapshots={snapshots}
          onNavigate={onNavigate}
        />

        <div className="ghost-exempt">
          <ContinueWorkPanel themeMode={themeMode} snapshots={snapshots} onNavigate={onNavigate} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card
            themeMode={themeMode}
            title="Command / Search"
          >
            <CommandBar
              themeMode={themeMode}
              onNavigate={onNavigate}
              onQuickAction={(a) => {
                if (a === "continue_program") onNavigate("programs");
                else if (a === "join_challenge") onNavigate("monk");
                else if (a === "share_referral") onNavigate("affiliate");
              }}
            />
          </Card>
          <SkillTreeAugmentationCard themeMode={themeMode} snapshots={snapshots} onNavigate={onNavigate} />
        </div>

        <UnifiedProgressEngine themeMode={themeMode} snapshots={snapshots} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ProgramsSnapshot themeMode={themeMode} snapshots={snapshots} onNavigate={onNavigate} />
          <SyndicateSnapshotCard themeMode={themeMode} snapshots={snapshots} onNavigate={onNavigate} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AffiliateSnapshotCard themeMode={themeMode} snapshots={snapshots} onNavigate={onNavigate} />
          <CoreIntegrityCard themeMode={themeMode} snapshots={snapshots} onNavigate={onNavigate} />
        </div>

        <ResourcesSnapshotCard themeMode={themeMode} snapshots={snapshots} onNavigate={onNavigate} />

        <div className="cut-frame-sm border border-white/10 bg-white/[0.05] p-3 backdrop-blur-[10px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-mono text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/60">
              Advanced insights
            </div>
            <motion.button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-md border border-[rgba(255,215,0,0.28)] bg-black/30 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/92 hover:border-[rgba(255,215,0,0.65)]"
            >
              {advancedOpen ? "Hide" : "Show"}
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {advancedOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2"
              >
                <ActivityTimelineCard themeMode={themeMode} snapshots={snapshots} />
                <GoalsMilestonesCard themeMode={themeMode} snapshots={snapshots} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <GlobalQuickActions
        themeMode={themeMode}
        onNavigate={onNavigate}
        ghostProtocol={ghostProtocol}
        onToggleGhostProtocol={toggleGhostProtocol}
      />
    </div>
  );
}

