"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { FloatingGoalsButton } from "./FloatingGoalsButton";

/**
 * Floating Goals control on `/` only. The panel itself mounts inside the main content column in `page.tsx`
 * so it sits below the navbar and spans the main area (not the sidebar).
 */
export function GoalsGlobalChrome() {
  const pathname = usePathname();
  const { closeGoalsPanel } = useGoalsPanel();

  useEffect(() => {
    if (pathname !== "/") closeGoalsPanel();
  }, [pathname, closeGoalsPanel]);

  if (pathname !== "/") return null;

  return <FloatingGoalsButton />;
}
