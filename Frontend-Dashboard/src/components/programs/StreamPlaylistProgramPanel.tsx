"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, Star } from "lucide-react";
import HlsVideoPlayer from "@/components/streaming/HlsVideoPlayer";
import {
  fetchStreamPlaylistDetail,
  fetchStreamVideoPlayback,
  type StreamPayload,
  type StreamPlaylistDetail,
  type StreamVideoListItem
} from "@/lib/streaming-api";
import { resolveDjangoMediaUrl } from "@/lib/courses-api";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  playlistId: number;
};

const playerShell = "overflow-hidden rounded-xl border border-white/10 bg-black/50";

function parsePlaylistNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

export function StreamPlaylistProgramPanel({ playlistId }: Props) {
  const [playlist, setPlaylist] = useState<StreamPlaylistDetail | null>(null);
  const [playback, setPlayback] = useState<StreamPayload | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlaylist = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const p = await fetchStreamPlaylistDetail(playlistId);
      setPlaylist(p);
      setActiveIdx(0);
    } catch (e) {
      setPlaylist(null);
      setErr(e instanceof Error ? e.message : "Failed to load playlist.");
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    void loadPlaylist();
  }, [loadPlaylist]);

  const items = useMemo(() => {
    if (!playlist?.items?.length) return [];
    return [...playlist.items].sort((a, b) => a.order - b.order || a.id - b.id);
  }, [playlist]);

  const activeVideo: StreamVideoListItem | null = items[activeIdx]?.stream_video ?? null;

  useEffect(() => {
    if (!activeVideo?.id) {
      setPlayback(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchStreamVideoPlayback(activeVideo.id);
        if (!cancelled) setPlayback(p);
      } catch {
        if (!cancelled) setPlayback(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeVideo?.id]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-10 text-center text-sm text-white/60">
        Loading playlist…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/35 bg-red-950/20 px-4 py-6 text-[14px] text-red-100/90">{err}</div>
    );
  }

  if (!playlist || items.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-black/35 px-4 py-8 text-center text-[14px] text-white/65">
        This playlist has no videos yet. Add Stream videos in Django admin.
      </div>
    );
  }

  if (playlist.is_coming_soon) {
    return (
      <div className="rounded-xl border border-amber-400/35 bg-amber-950/20 px-4 py-10 text-center text-[14px] text-amber-100/90">
        <div className="mx-auto mb-2 inline-flex rounded-full border border-amber-300/55 bg-amber-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">
          Coming soon
        </div>
        <p>This playlist is marked as coming soon. Please check back later.</p>
      </div>
    );
  }

  const hlsUrl = playback?.hls_url ?? null;
  const ready = playback?.status === "ready" && !!hlsUrl;
  const playlistPrice = parsePlaylistNumber(playlist.price);
  const playlistRating = Math.max(0, Math.min(5, parsePlaylistNumber(playlist.rating)));

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-start lg:gap-10">
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          {!ready ? (
            <div
              className={`flex aspect-video max-h-[min(58vh,640px)] w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-white/65 sm:max-h-[min(62vh,720px)] ${playerShell}`}
            >
              <span className="rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100/90">
                {playback?.status === "processing" ? "Processing" : playback?.status ?? "…"}
              </span>
              <p>
                {playback?.status === "processing"
                  ? "This episode is still being prepared."
                  : "Choose another episode or refresh when the video is ready."}
              </p>
            </div>
          ) : (
            <HlsVideoPlayer
              key={hlsUrl}
              src={hlsUrl}
              className={playerShell}
              playerLayout={activeVideo.player_layout ?? "auto"}
              sourceWidth={activeVideo.source_width ?? null}
              sourceHeight={activeVideo.source_height ?? null}
            />
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[clamp(1.15rem,2.2vw+0.5rem,1.65rem)] font-black leading-tight tracking-tight text-[#f5c814]">
              {activeVideo?.title ?? "Episode"}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/45 bg-black/45 px-2.5 py-1 text-[11px] font-bold text-amber-100">
              <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
              {playlistRating.toFixed(1)}
            </span>
            <span className="rounded-full border border-emerald-300/45 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-black text-emerald-200">
              {`£${playlistPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          {(activeVideo?.description || "").trim() ? (
            <div className="mt-3 max-w-4xl rounded-xl border border-white/12 bg-black/35 px-4 py-3">
              <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#f5c814]">Description</div>
              <p className="font-sans whitespace-pre-line text-left text-[15px] font-normal leading-7 tracking-normal text-white/92 antialiased">
                {(activeVideo?.description || "").trim()}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <aside
        aria-label="Playlist"
        className="flex min-h-0 flex-col rounded-xl border border-white/12 bg-black/40 p-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]"
      >
        <div className="border-b border-white/10 px-1 pb-3">
          <div className="text-[13px] font-bold text-[#f5c814]">{playlist.title}</div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/45 bg-black/45 px-2 py-0.5 font-bold text-amber-100">
              <Star className="h-3 w-3 fill-current text-amber-300" />
              {playlistRating.toFixed(1)}
            </span>
            <span className="rounded-full border border-emerald-300/45 bg-emerald-500/12 px-2 py-0.5 font-sans font-extrabold tracking-normal text-emerald-200">
              {`£${playlistPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>
        <ul className="mt-3 flex max-h-[min(52vh,560px)] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
          {items.map((row, i) => {
            const v = row.stream_video;
            const on = i === activeIdx;
            const thumbSrc = resolveDjangoMediaUrl(v.thumbnail_url);
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "flex w-full gap-3.5 rounded-xl border p-3 text-left transition",
                    on ? "border-violet-300/70 bg-violet-500/10 shadow-[0_0_0_1px_rgba(196,181,253,0.2)]" : "border-transparent bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]"
                  )}
                >
                  <div className="relative h-16 w-[6.4rem] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-violet-800/90 via-neutral-900 to-black">
                    {thumbSrc ? (
                      <img src={thumbSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                    ) : null}
                    <span className="pointer-events-none absolute inset-y-0 left-0 z-[2] flex w-7 items-center justify-center bg-gradient-to-r from-black/70 via-black/35 to-transparent">
                      <span className="text-[32px] font-black leading-none text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
                        {i + 1}
                      </span>
                    </span>
                    <span className="absolute inset-0 z-[1] flex items-center justify-center">
                      <Play className={cn("h-6 w-6 stroke-[1.75]", on ? "text-white" : "text-white/55")} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <div
                      className={cn(
                        "font-sans text-[14px] font-semibold leading-[1.35] tracking-normal antialiased",
                        on ? "text-white" : "text-white/85"
                      )}
                    >
                      {v.title}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
