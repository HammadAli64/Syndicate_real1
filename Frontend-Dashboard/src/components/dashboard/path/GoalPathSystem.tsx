"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { DashboardNavKey } from "../types";
import type { DashboardCourseLike } from "../useDashboardSnapshots";
import { themeAccent, type ThemeMode } from "../dashboardPrimitives";
import type { CourseRec, GoalId } from "./goalPathData";
import { ROADMAPS, coursesForGoalStep } from "./goalPathData";
import { PathSelector } from "./PathSelector";
import { RoadmapFlow } from "./RoadmapFlow";
import { CourseFlow } from "./CourseFlow";

const LS_KEY = "dashboarded:goal-path-v1";

type Persisted = {
  goal: GoalId;
  stepByGoal: Partial<Record<GoalId, number>>;
};

function readPersist(): Persisted {
  if (typeof window === "undefined") return { goal: "web_dev", stepByGoal: {} };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { goal: "web_dev", stepByGoal: {} };
    const j = JSON.parse(raw) as Partial<Persisted>;
    const goal = (j.goal as GoalId) ?? "web_dev";
    if (!ROADMAPS[goal]) return { goal: "web_dev", stepByGoal: {} };
    return { goal, stepByGoal: typeof j.stepByGoal === "object" && j.stepByGoal ? j.stepByGoal : {} };
  } catch {
    return { goal: "web_dev", stepByGoal: {} };
  }
}

function writePersist(p: Persisted) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

function personalizeCourses(
  goal: GoalId,
  stepIdx: number,
  triple: [CourseRec, CourseRec, CourseRec],
  courses: DashboardCourseLike[]
): [CourseRec, CourseRec, CourseRec] {
  if (!courses.length) return triple;
  const step = ROADMAPS[goal][stepIdx];
  if (!step) return triple;
  const token =
    step.title
      .split(/[\s/]+/)[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") ?? "";
  if (token.length < 2) return triple;
  const match = courses.find((c) => c.title.toLowerCase().includes(token));
  if (!match) return triple;
  const [a, b, c] = triple;
  return [a, { ...b, title: match.title }, c];
}

export function GoalPathSystem({
  themeMode,
  courses,
  onNavigate
}: {
  themeMode: ThemeMode;
  courses: DashboardCourseLike[];
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const t = themeAccent(themeMode);
  const [persist, setPersist] = useState<Persisted>(() => readPersist());

  useEffect(() => {
    writePersist(persist);
  }, [persist]);

  const goal = persist.goal;
  const maxLen = ROADMAPS[goal].length;
  const currentIndex = Math.max(0, persist.stepByGoal[goal] ?? 0);

  const setGoal = useCallback((g: GoalId) => {
    setPersist((p) => ({ ...p, goal: g }));
  }, []);

  const completeStep = useCallback(() => {
    setPersist((p) => {
      const g = p.goal;
      const idx = p.stepByGoal[g] ?? 0;
      if (idx >= ROADMAPS[g].length) return p;
      return { ...p, stepByGoal: { ...p.stepByGoal, [g]: idx + 1 } };
    });
  }, []);

  const courseStepIdx = Math.min(currentIndex, Math.max(0, maxLen - 1));
  const courseTriple = useMemo(() => {
    const row = coursesForGoalStep(goal, courseStepIdx);
    const t: [CourseRec, CourseRec, CourseRec] = [row[0]!, row[1]!, row[2]!];
    return personalizeCourses(goal, courseStepIdx, t, courses);
  }, [goal, courseStepIdx, courses]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="cut-frame cyber-frame gold-stroke relative w-full min-w-0 max-w-none overflow-hidden border border-[rgba(197,179,88,0.32)] bg-[#050505]/90 p-4 backdrop-blur-[12px] sm:p-5 md:p-7"
      style={{
        borderColor: t.border,
        boxShadow: `0 0 0 1px ${t.glow}, 0 0 48px rgba(250,204,21,0.06), 0 24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,215,0,0.06)`
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-100 [background:radial-gradient(ellipse_120%_70%_at_50%_-15%,rgba(250,204,21,0.11),rgba(0,0,0,0)_55%),radial-gradient(900px_420px_at_85%_0%,rgba(197,179,88,0.07),rgba(0,0,0,0)_58%),linear-gradient(180deg,rgba(255,215,0,0.03),rgba(0,0,0,0)_28%)]"
        aria-hidden
      />
      <div className="relative">
        <header className="border-b border-[rgba(197,179,88,0.2)] pb-4 sm:pb-5">
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--gold-neon)] sm:text-[11px] sm:tracking-[0.3em]">
            Goal-based path
          </div>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/72 sm:text-[14px]">
            Clear milestones, guided courses, earning cues — minimal, premium progression.
          </p>
        </header>

        <div className="mt-5 sm:mt-6">
          <PathSelector selected={goal} onSelect={setGoal} />
        </div>
        <RoadmapFlow goal={goal} currentIndex={currentIndex} onCompleteStep={completeStep} />
        <CourseFlow courses={courseTriple} onNavigate={onNavigate} />
      </div>
    </motion.div>
  );
}
