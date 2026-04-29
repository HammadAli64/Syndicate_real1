"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const WARM_ROUTES = ["/", "/dashboard?section=settings", "/programs", "/what-you-get", "/our-methods"] as const;
const SESSION_KEY = "syn:route-warmup-v1";

export default function RouteWarmup() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") return;

    const warm = () => {
      for (const route of WARM_ROUTES) {
        router.prefetch(route);
        void fetch(route, { credentials: "same-origin", cache: "no-store" }).catch(() => {
          // Best-effort warmup only; ignore failures.
        });
      }
      window.sessionStorage.setItem(SESSION_KEY, "1");
    };

    const idle = window.requestIdleCallback?.(() => warm(), { timeout: 2000 });
    const timer = idle ? null : window.setTimeout(warm, 700);

    return () => {
      if (typeof idle === "number" && window.cancelIdleCallback) window.cancelIdleCallback(idle);
      if (typeof timer === "number") window.clearTimeout(timer);
    };
  }, [router]);

  return null;
}

