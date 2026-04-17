"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { VideoCard, type VideoDto } from "./VideoCard";
import { getVideoGridSlot } from "./videoGridSlots";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayMs(ymd: string): number {
  return new Date(`${ymd}T00:00:00`).getTime();
}

function endOfDayMs(ymd: string): number {
  return new Date(`${ymd}T23:59:59.999`).getTime();
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-[rgba(250,204,21,0.28)] bg-black/55 px-3 py-2.5 text-[12px] font-semibold text-white/90 outline-none transition " +
  "focus:border-[rgba(250,204,21,0.55)] focus:shadow-[0_0_20px_rgba(250,204,21,0.12)] " +
  "[color-scheme:dark]";

type MembershipVideoGalleryProps = {
  videos: VideoDto[];
  loading: boolean;
  error: string | null;
  videoNext?: string | null;
  onLoadMore?: () => void;
  onPlay: (video: VideoDto) => void;
};

export function MembershipVideoGallery({
  videos,
  loading,
  error,
  videoNext = null,
  onLoadMore,
  onPlay
}: MembershipVideoGalleryProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rangeMode, setRangeMode] = useState<"all" | "7d" | "30d" | "custom">("all");

  useEffect(() => {
    if (!dateFrom && !dateTo) setRangeMode("all");
  }, [dateFrom, dateTo]);

  const filteredVideos = useMemo(() => {
    if (!dateFrom && !dateTo) return videos;
    return videos.filter((v) => {
      const t = new Date(v.created_at).getTime();
      if (Number.isNaN(t)) return true;
      if (dateFrom && t < startOfDayMs(dateFrom)) return false;
      if (dateTo && t > endOfDayMs(dateTo)) return false;
      return true;
    });
  }, [videos, dateFrom, dateTo]);

  const setPreset = (mode: "all" | "7d" | "30d") => {
    setRangeMode(mode);
    if (mode === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const days = mode === "7d" ? 7 : 30;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateFrom(toYyyyMmDd(start));
    setDateTo(toYyyyMmDd(end));
  };

  const filterActive = Boolean(dateFrom || dateTo);
  const showFilteredEmpty = !loading && videos.length > 0 && filteredVideos.length === 0;

  return (
    <div className="space-y-[clamp(1rem,2.5vw+0.35rem,1.35rem)]">
      {error ? (
        <div className="rounded-xl border border-red-500/35 bg-red-950/25 p-[var(--fluid-card-p)] text-[clamp(0.72rem,0.45vw+0.55rem,0.85rem)] text-red-200/90">
          <p>{error}</p>
          {error.includes("Sign in") || error.includes("signed-in") ? (
            <Link
              href="/login"
              className="mt-3 inline-flex rounded-lg border border-[rgba(250,204,21,0.45)] bg-black/40 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--gold-neon)] transition hover:border-[rgba(250,204,21,0.65)]"
            >
              Log in
            </Link>
          ) : null}
        </div>
      ) : null}

      <div
        className={cx(
          "relative overflow-hidden rounded-2xl border border-[rgba(250,204,21,0.22)]",
          "bg-gradient-to-br from-black/85 via-black/70 to-[rgba(250,204,21,0.07)]",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(250,204,21,0.12)]"
        )}
      >
        <div
          className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-[rgba(250,204,21,0.06)] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-[rgba(220,38,38,0.05)] blur-3xl"
          aria-hidden
        />

        <div className="relative border-b border-white/[0.08] bg-black/35 px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--gold-neon)]/90">
                Video archive
              </p>
              <h3 className="mt-1 text-[clamp(1rem,2vw,1.2rem)] font-black italic tracking-tight text-white/95">
                Briefings & field drops
              </h3>
              <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-white/45">
                Mixed landscape reels and portrait verticals. Narrow by publish date (filters the videos already loaded below).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">Quick</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "all" as const, label: "All time" },
                    { id: "7d" as const, label: "7d" },
                    { id: "30d" as const, label: "30d" }
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={cx(
                      "rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition",
                      rangeMode === p.id
                        ? "border-[rgba(250,204,21,0.45)] bg-[rgba(250,204,21,0.1)] text-[color:var(--gold-neon)]"
                        : "border-white/12 bg-black/40 text-white/55 hover:border-white/22 hover:text-white/75"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                From
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setRangeMode("custom");
                  setDateFrom(e.target.value);
                }}
                className={inputClass}
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setRangeMode("custom");
                  setDateTo(e.target.value);
                }}
                className={inputClass}
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
              <button
                type="button"
                onClick={() => {
                  setRangeMode("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="rounded-lg border border-white/14 bg-black/45 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/60 transition hover:border-white/25 hover:text-white/85"
              >
                Clear range
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">Layout key</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.08)] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[color:var(--gold-neon)]">
              <span className="h-2 w-3 rounded-sm bg-[rgba(250,204,21,0.5)]" aria-hidden />
              Landscape / wide
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(248,113,113,0.4)] bg-[rgba(127,29,29,0.2)] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-red-200/90">
              <span className="h-3 w-2 rounded-sm bg-[rgba(248,113,113,0.45)]" aria-hidden />
              Portrait 9:16
            </span>
            {filterActive ? (
              <span className="text-[10px] text-white/45">
                Showing <span className="font-bold text-white/75">{filteredVideos.length}</span> of {videos.length}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative p-4 md:p-6">
          {loading && !videos.length ? (
            <VideoGridSkeleton />
          ) : showFilteredEmpty ? (
            <div className="rounded-xl border border-white/10 bg-black/35 px-6 py-14 text-center">
              <p className="text-[13px] font-semibold text-white/75">No videos in this date range.</p>
              <p className="mt-2 text-[12px] text-white/45">Widen the range or clear filters to see everything loaded.</p>
              <button
                type="button"
                onClick={() => {
                  setRangeMode("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="mt-6 rounded-lg border border-[rgba(250,204,21,0.45)] bg-black/50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--gold-neon)] transition hover:border-[rgba(250,204,21,0.65)]"
              >
                Reset filters
              </button>
            </div>
          ) : !videos.length && !loading ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-6 py-14 text-center text-[13px] text-white/50">
              No videos yet. When briefings are published, they appear in this grid.
            </div>
          ) : (
            <div
              className={cx(
                "grid grid-flow-dense auto-rows-auto grid-cols-2 gap-[clamp(0.75rem,2vw+0.25rem,1.25rem)]",
                "md:grid-cols-6 xl:grid-cols-12"
              )}
            >
              {filteredVideos.map((v, i) => {
                const slot = getVideoGridSlot(i, v);
                return (
                  <div key={v.id} className={slot.cell}>
                    <VideoCard
                      video={v}
                      onPlay={onPlay}
                      index={i}
                      visual={slot.visual}
                      frame={slot.frame}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {videoNext && onLoadMore ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            className="cut-frame-sm cyber-frame gold-stroke premium-gold-border rounded-lg bg-black/40 px-6 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[color:var(--gold-neon)]/88 transition hover:border-[rgba(255,215,0,0.55)]"
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}

function VideoGridSkeleton() {
  return (
    <div
      className={cx(
        "grid grid-flow-dense auto-rows-auto grid-cols-2 gap-[clamp(0.75rem,2vw+0.25rem,1.25rem)]",
        "md:grid-cols-6 xl:grid-cols-12"
      )}
    >
      {Array.from({ length: 8 }).map((_, i) => {
        const slot = getVideoGridSlot(i, undefined);
        return (
          <div key={i} className={slot.cell}>
            <div
              className={cx(
                "h-full min-h-[200px] animate-pulse rounded-xl border border-[rgba(250,204,21,0.15)] bg-gradient-to-br from-white/[0.06] to-transparent",
                slot.visual === "portrait" && "min-h-[280px]"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
