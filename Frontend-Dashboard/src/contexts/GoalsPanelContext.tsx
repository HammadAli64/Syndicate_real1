"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { ThemeMode } from "@/components/dashboard/dashboardPrimitives";

export type GoalsPanelContextValue = {
  isGoalsPanelOpen: boolean;
  openGoalsPanel: () => void;
  closeGoalsPanel: () => void;
  toggleGoalsPanel: () => void;
  /** Main shell nav key (e.g. dashboard, programs) — drives FAB visibility */
  shellSectionKey: string | null;
  setShellSectionKey: (key: string | null) => void;
  themeMode: ThemeMode;
  setPanelThemeMode: (mode: ThemeMode) => void;
};

const GoalsPanelContext = createContext<GoalsPanelContextValue | null>(null);

export function GoalsPanelProvider({ children }: { children: ReactNode }) {
  const [isGoalsPanelOpen, setGoalsPanelOpen] = useState(false);
  const [shellSectionKey, setShellSectionKey] = useState<string | null>(null);
  const [themeMode, setPanelThemeMode] = useState<ThemeMode>("default");

  const openGoalsPanel = useCallback(() => setGoalsPanelOpen(true), []);
  const closeGoalsPanel = useCallback(() => setGoalsPanelOpen(false), []);
  const toggleGoalsPanel = useCallback(() => setGoalsPanelOpen((v) => !v), []);

  const value = useMemo<GoalsPanelContextValue>(
    () => ({
      isGoalsPanelOpen,
      openGoalsPanel,
      closeGoalsPanel,
      toggleGoalsPanel,
      shellSectionKey,
      setShellSectionKey,
      themeMode,
      setPanelThemeMode
    }),
    [
      isGoalsPanelOpen,
      openGoalsPanel,
      closeGoalsPanel,
      toggleGoalsPanel,
      shellSectionKey,
      themeMode
    ]
  );

  return <GoalsPanelContext.Provider value={value}>{children}</GoalsPanelContext.Provider>;
}

export function useGoalsPanel() {
  const ctx = useContext(GoalsPanelContext);
  if (!ctx) {
    throw new Error("useGoalsPanel must be used within GoalsPanelProvider");
  }
  return ctx;
}
