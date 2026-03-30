import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Challenges | Syndicate",
  description: "Daily challenges from your ingested mindsets"
};

export default function ChallengesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060606] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
