"use client";

import { useEffect, useState } from "react";
import HlsVideoPlayer from "@/components/streaming/HlsVideoPlayer";
import {
  fetchStreamVideoDetail,
  fetchStreamVideoPlayback,
  type StreamPayload,
  type StreamVideoDetail
} from "@/lib/streaming-api";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  streamVideoId: number;
};

const playerShell =
  "aspect-video max-h-[min(58vh,640px)] w-full overflow-hidden rounded-xl border border-white/10 bg-black/50 sm:max-h-[min(62vh,720px)]";

export function StreamVideoProgramPanel({ streamVideoId }: Props) {
  const [detail, setDetail] = useState<StreamVideoDetail | null>(null);
  const [playback, setPlayback] = useState<StreamPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void (async () => {
      try {
        const [d, p] = await Promise.all([
          fetchStreamVideoDetail(streamVideoId),
          fetchStreamVideoPlayback(streamVideoId)
        ]);
        if (!cancelled) {
          setDetail(d);
          setPlayback(p);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load video.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [streamVideoId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-10 text-center text-sm text-white/60">
        Loading stream…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/35 bg-red-950/20 px-4 py-6 text-[14px] text-red-100/90">{err}</div>
    );
  }

  if (!detail || !playback) {
    return null;
  }

  const hlsUrl = playback.hls_url;
  const priceLabel = Number(detail.price).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const ready = playback.status === "ready" && !!hlsUrl;

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start lg:gap-10">
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          {!ready ? (
            <div className={`flex ${playerShell} flex-col items-center justify-center gap-2 px-4 text-center text-sm text-white/65`}>
              <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100/90">
                {playback.status === "processing" ? "Processing" : playback.status}
              </span>
              <p>
                {playback.status === "processing"
                  ? "This video is still being prepared. Refresh in a moment."
                  : "Playback is not available yet."}
              </p>
            </div>
          ) : (
            <HlsVideoPlayer src={hlsUrl} className={playerShell} />
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[clamp(1.15rem,2.2vw+0.5rem,1.65rem)] font-black leading-tight tracking-tight text-white">
              {detail.title}
            </h2>
            <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100/90">
              Stream
            </span>
          </div>
          <p className="mt-2 text-[13px] font-semibold text-[color:var(--gold)]/90">{priceLabel}</p>
          {(detail.description || "").trim() ? (
            <p className="mt-3 max-w-3xl text-[14px] font-medium leading-[1.65] tracking-[0.01em] text-white/[0.88] antialiased">
              {(detail.description || "").trim()}
            </p>
          ) : null}
        </div>
      </div>

      <aside
        aria-label="Stream info"
        className="flex min-h-0 flex-col rounded-xl border border-white/12 bg-black/40 p-4 lg:sticky lg:top-24"
      >
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Stream</div>
        <p className="mt-3 text-[13px] leading-relaxed text-white/75">
          Secure playback from your catalog. Lesson playlists for multi-video courses stay under{" "}
          <span className="text-white/90">Programs</span> as before.
        </p>
        <dl className="mt-4 space-y-2 text-[12px] text-white/70">
          <div className="flex justify-between gap-2 border-t border-white/10 pt-3">
            <dt className="text-white/50">Status</dt>
            <dd className={cn("font-semibold", ready ? "text-emerald-300/90" : "text-amber-200/90")}>
              {playback.status}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
