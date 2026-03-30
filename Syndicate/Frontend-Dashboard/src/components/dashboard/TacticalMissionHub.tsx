"use client";

import { useEffect, useMemo, useState } from "react";

const FOCUS_SEC = 25 * 60;

type Mission = {
  id: string;
  title: string;
  matrix: "do" | "schedule" | "delegate" | "defer";
  label: string;
};

const MISSIONS: Mission[] = [
  { id: "m1", title: "Finish OOP module slice", matrix: "do", label: "Q1 · Do" },
  { id: "m2", title: "Syndicate focus mission", matrix: "schedule", label: "Q2 · Plan" },
  { id: "m3", title: "Referral pulse check", matrix: "delegate", label: "Q3 · Handoff" },
  { id: "m4", title: "Resource deep-dive", matrix: "defer", label: "Q4 · Buffer" }
];

function formatMmSs(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TacticalMissionHub() {
  const [activeId, setActiveId] = useState(MISSIONS[0].id);
  const [focusRemaining, setFocusRemaining] = useState<Record<string, number>>({});
  const [headerMissionRemaining, setHeaderMissionRemaining] = useState<number>(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFocusRemaining((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const k of Object.keys(next)) {
          if (next[k] > 0) {
            next[k] -= 1;
            changed = true;
            if (next[k] <= 0) delete next[k];
          }
        }
        return changed ? next : prev;
      });
      setHeaderMissionRemaining((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const grid = useMemo(() => {
    const order: Mission["matrix"][] = ["do", "schedule", "delegate", "defer"];
    return order.map((m) => MISSIONS.find((x) => x.matrix === m)!);
  }, []);

  return (
    <div className="rounded-md border border-white/10 bg-black/35 p-3 shadow-[inset_0_0_0_1px_rgba(196,126,255,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Tactical mission hub</div>
        <div className="flex items-center gap-2">
          {headerMissionRemaining > 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-cyan-400/20 bg-cyan-500/5 px-2 py-1">
              <div className="font-mono text-[10px] font-black tabular-nums text-cyan-200/90">{formatMmSs(headerMissionRemaining)}</div>
              <div className="h-2 w-24 overflow-hidden rounded-full border border-white/10 bg-black/50">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.round(((FOCUS_SEC - headerMissionRemaining) / FOCUS_SEC) * 100)}%`,
                    background: "linear-gradient(90deg, rgba(0,255,255,0.75), rgba(196,126,255,0.65))",
                    boxShadow: "0 0 18px rgba(0,255,255,0.18)"
                  }}
                />
              </div>
              <div className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/45">Neural sync</div>
            </div>
          ) : (
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-fuchsia-400/40">2×2 matrix</div>
          )}
          <button
            type="button"
            onClick={() => setHeaderMissionRemaining(FOCUS_SEC)}
            className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200/90 hover:border-emerald-400/55"
          >
            Start mission
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {grid.map((mission) => {
          const isActive = activeId === mission.id;
          const rem = focusRemaining[mission.id] ?? 0;
          const syncing = rem > 0;
          return (
            <button
              key={mission.id}
              type="button"
              onClick={() => setActiveId(mission.id)}
              className={[
                "relative cursor-pointer overflow-hidden rounded-md border bg-black/40 p-2.5 text-left transition",
                isActive
                  ? "border-fuchsia-400/45 shadow-[inset_0_0_0_1px_rgba(196,126,255,0.28),0_0_20px_rgba(196,126,255,0.16)]"
                  : "border-white/10 hover:border-white/20 hover:bg-black/55"
              ].join(" ")}
            >
              <div className="relative z-[1]">
                <div className="text-[9px] font-mono font-bold uppercase tracking-[0.14em] text-white/45">{mission.label}</div>
                <div className="mt-1 text-[12px] font-semibold leading-snug text-white/80">{mission.title}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusRemaining((prev) => ({
                        ...prev,
                        [mission.id]: prev[mission.id] && prev[mission.id] > 0 ? 0 : FOCUS_SEC
                      }));
                    }}
                    className="rounded border border-fuchsia-500/35 bg-fuchsia-500/10 px-2 py-1 text-[9px] font-mono font-black uppercase tracking-[0.12em] text-fuchsia-200/90 hover:border-fuchsia-400/55"
                  >
                    {syncing ? "Abort focus" : "Focus mode"}
                  </button>
                  {syncing ? <span className="font-mono text-[10px] font-bold tabular-nums text-emerald-300/90">{formatMmSs(rem)}</span> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
