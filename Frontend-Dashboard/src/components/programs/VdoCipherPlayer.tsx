"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    VdoPlayer?: new (el: HTMLElement, opts: Record<string, unknown>) => { destroy?: () => void };
  }
}

type Props = {
  otp: string;
  playbackInfo: string;
  /** Extra classes on the outer wrapper (e.g. max width). */
  className?: string;
  /** `hero` = full width of column (program detail). `compact` = capped width. */
  variant?: "compact" | "hero";
};

/**
 * VdoCipher iframe player (v2). OTP is single-use / short TTL — parent must refetch when switching videos.
 *
 * Right-click items such as “About VdoCipher Player” come from VdoCipher’s player inside the iframe
 * (cross-origin). This app cannot remove that menu; use VdoCipher dashboard / support for branding options.
 *
 * @see https://www.vdocipher.com/docs/player/v2/config-player/
 */
export function VdoCipherPlayer({ otp, playbackInfo, className, variant = "compact" }: Props) {
  const uid = useId().replace(/:/g, "");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!otp || !playbackInfo) {
      setErr("Missing playback token");
      return;
    }
    setErr(null);
  }, [otp, playbackInfo]);

  if (err) {
    return <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-red-500/30 bg-black/50 text-sm text-red-200">{err}</div>;
  }

  const src = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`;

  const wrap =
    variant === "hero"
      ? `w-full max-w-5xl ${className ?? ""}`.trim()
      : `mx-auto w-full max-w-xl ${className ?? ""}`.trim();

  /** Hero layout: standard 16:9 with a generous vertical cap so the frame reads as a main player. */
  const frameBox =
    variant === "hero"
      ? "relative aspect-video w-full max-h-[min(58vh,640px)] overflow-hidden sm:max-h-[min(62vh,720px)]"
      : "relative aspect-video w-full overflow-hidden";

  return (
    <div className={wrap}>
      <div
        className={`${frameBox} rounded-xl border border-[color:var(--gold-neon-border-mid)] bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)]`}
      >
        <iframe
          ref={iframeRef}
          title={`vdocipher-${uid}`}
          src={src}
          className="absolute inset-0 h-full w-full rounded-xl border-0"
          allow="encrypted-media; autoplay; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
