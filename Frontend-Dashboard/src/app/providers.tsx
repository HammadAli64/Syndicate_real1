"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActivityTimelineProvider } from "@/contexts/ActivityTimelineContext";
import { GoalsPanelProvider } from "@/contexts/GoalsPanelContext";
import { GoalsGlobalChrome } from "@/components/ui/GoalsGlobalChrome";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActivityTimelineProvider>
        <GoalsPanelProvider>
          {children}
          <GoalsGlobalChrome />
        </GoalsPanelProvider>
      </ActivityTimelineProvider>
    </AuthProvider>
  );
}
