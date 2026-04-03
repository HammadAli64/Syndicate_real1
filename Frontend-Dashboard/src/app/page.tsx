"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SyndicateAiChallengePanel } from "../components/SyndicateAiChallengePanel";
import {
  getSyndicateAuthToken,
  getSyndicateUserId,
  isSyndicateSessionActive,
  logoutSyndicateSession,
  setSyndicateUserId
} from "@/lib/syndicateAuth";
import { getSyndicateApiBase } from "@/lib/syndicateApiBase";
import { parseApiJson } from "@/lib/parseApiJson";

const API_BASE = getSyndicateApiBase();

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getSyndicateAuthToken();
      if (token && getSyndicateUserId() == null) {
        try {
          const r = await fetch(`${API_BASE}/auth/me/`, {
            headers: { Authorization: `Token ${token}` }
          });
          if (r.ok) {
            try {
              const j = await parseApiJson<{ id?: number }>(r);
              if (typeof j.id === "number") setSyndicateUserId(j.id);
            } catch {
              /* ignore bad HTML/JSON from misconfigured API URL */
            }
          } else if (r.status === 401) {
            logoutSyndicateSession();
            if (!cancelled) {
              setReady(true);
              setAuthed(false);
              router.replace("/syndicate/login?next=/");
            }
            return;
          }
    } catch {
          // network error: continue; panel may use anon keys until refresh
        }
      }
      if (cancelled) return;
      const ok = isSyndicateSessionActive();
      if (ok && getSyndicateUserId() == null) {
        logoutSyndicateSession();
        setAuthed(false);
        setReady(true);
        router.replace("/syndicate/login?next=/");
          return;
        }
      setAuthed(ok);
      setReady(true);
      if (!ok) {
        router.replace("/syndicate/login?next=/");
      }
    })();
      return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready || !authed) {
    return (
      <div className="flex min-h-screen min-w-0 items-center justify-center bg-[#05070f] px-4 text-center text-[15px] text-white/55 sm:text-base">
        <p className="max-w-sm text-balance">{ready && !authed ? "Redirecting…" : "Loading…"}</p>
      </div>
    );
  }

  const dashboardUserId = getSyndicateUserId();

  return (
    <div className="min-h-screen w-full min-w-0 bg-[#05070f] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white">
      <div className="mx-auto w-full min-w-0 max-w-[min(100%,110rem)] py-3 sm:py-4 md:py-5 lg:py-6">
        <SyndicateAiChallengePanel key={dashboardUserId ?? 0} />
      </div>
    </div>
  );
}
