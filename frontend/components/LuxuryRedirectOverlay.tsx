"use client";

import { useEffect } from "react";

const FALLBACK_URL = "https://the-syndicate.com/";

type LuxuryRedirectOverlayProps = {
  active: boolean;
  href?: string;
};

export default function LuxuryRedirectOverlay({
  active,
  href = FALLBACK_URL,
}: LuxuryRedirectOverlayProps) {
  useEffect(() => {
    if (!active) return;
    const target = href?.trim() || FALLBACK_URL;
    const timer = window.setTimeout(() => {
      window.location.href = target;
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [active, href]);

  if (!active) return null;

  return (
    <div className="luxury-redirect" role="status" aria-live="polite">
      <div className="luxury-redirect__veil" />
      <div className="luxury-redirect__glow luxury-redirect__glow--outer" />
      <div className="luxury-redirect__glow luxury-redirect__glow--inner" />
      <div className="luxury-redirect__ring luxury-redirect__ring--a" />
      <div className="luxury-redirect__ring luxury-redirect__ring--b" />
      <div className="luxury-redirect__core">
        <p className="luxury-redirect__eyebrow">The Syndicate</p>
        <p className="luxury-redirect__title">Securing your access</p>
        <div className="luxury-redirect__bar">
          <span className="luxury-redirect__bar-fill" />
        </div>
        <p className="luxury-redirect__hint">You are being escorted to the inner circle</p>
      </div>
    </div>
  );
}
