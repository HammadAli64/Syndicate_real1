"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, Star } from "lucide-react";
import ChromaGrid, { type ChromaItem } from "@/components/ChromaGrid";
import { CourseVideoPlaylist } from "@/components/programs/CourseVideoPlaylist";
import { StreamPlaylistProgramPanel } from "@/components/programs/StreamPlaylistProgramPanel";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { fetchCoursesList, resolveDjangoMediaUrl, type CourseDto } from "@/lib/courses-api";
import { fetchPortalIdentity } from "@/lib/portal-api";
import { fetchStreamPlaylists, type StreamPlaylistListItem } from "@/lib/streaming-api";

function coursesListErrorMessage(status: number, data: unknown): string {
  if (typeof data === "object" && data && "detail" in data) {
    return String((data as { detail?: string }).detail ?? "Request failed.");
  }
  if (status === 401) return "Sign in to load secure programs and playlists.";
  return `Could not load courses (${status}).`;
}

/** Visual accents for program cards (bottom gradient). */
const PROGRAM_CARD_BACKGROUNDS: readonly string[] = [
  "from-amber-600/85 via-orange-900/50 to-black",
  "from-rose-600/85 via-red-950/55 to-black",
  "from-violet-600/85 via-purple-950/50 to-black",
  "from-emerald-600/80 via-teal-950/50 to-black",
  "from-sky-600/85 via-blue-950/50 to-black",
  "from-fuchsia-600/80 via-pink-950/45 to-black",
];

const COURSE_CARD_THEMES = [
  {
    ring: "from-cyan-400/95 via-sky-400/95 to-cyan-300/95",
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(34,211,238,0.4),0_0_42px_rgba(34,211,238,0.3)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(125,211,252,0.82),0_0_96px_rgba(34,211,238,0.62)]",
    title: "text-cyan-200",
    chip: "border-cyan-300/60 bg-cyan-500/15 text-cyan-100",
    body: "border-cyan-300/45 bg-cyan-950/30",
  },
  {
    ring: "from-lime-400/95 via-emerald-400/95 to-green-300/95",
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(74,222,128,0.4),0_0_42px_rgba(74,222,128,0.28)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(134,239,172,0.82),0_0_96px_rgba(74,222,128,0.6)]",
    title: "text-lime-200",
    chip: "border-lime-300/60 bg-lime-500/15 text-lime-100",
    body: "border-lime-300/45 bg-emerald-950/30",
  },
  {
    ring: "from-fuchsia-400/95 via-violet-400/95 to-purple-300/95",
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(217,70,239,0.4),0_0_42px_rgba(217,70,239,0.28)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(232,121,249,0.82),0_0_96px_rgba(217,70,239,0.6)]",
    title: "text-fuchsia-200",
    chip: "border-fuchsia-300/60 bg-fuchsia-500/15 text-fuchsia-100",
    body: "border-fuchsia-300/45 bg-fuchsia-950/30",
  },
] as const;

const PLAYLIST_CARD_THEMES = [
  {
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(196,181,253,0.4),0_0_44px_rgba(139,92,246,0.32)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(196,181,253,0.85),0_0_100px_rgba(139,92,246,0.65)]",
    ring: "from-violet-300/95 via-purple-400/95 to-fuchsia-300/95",
    title: "text-white",
    panel: "border-violet-300/45 bg-violet-950/30",
    mediaBorder: "border-fuchsia-300/35",
    categoryChip: "border-fuchsia-300/35 bg-fuchsia-500/18 text-fuchsia-200",
    starColor: "text-fuchsia-300",
    infoPanel: "border-fuchsia-300/35 bg-fuchsia-950/28",
    priceColor: "text-fuchsia-300",
    priceGlow: "[text-shadow:0_0_16px_rgba(232,121,249,0.5)]",
    dominantBorder: "border-fuchsia-300/75",
  },
  {
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(103,232,249,0.4),0_0_44px_rgba(34,211,238,0.32)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(125,211,252,0.85),0_0_100px_rgba(34,211,238,0.65)]",
    ring: "from-cyan-300/95 via-sky-400/95 to-blue-300/95",
    title: "text-white",
    panel: "border-cyan-300/45 bg-cyan-950/30",
    mediaBorder: "border-cyan-300/35",
    categoryChip: "border-cyan-300/35 bg-cyan-500/18 text-cyan-200",
    starColor: "text-cyan-300",
    infoPanel: "border-cyan-300/35 bg-cyan-950/28",
    priceColor: "text-cyan-300",
    priceGlow: "[text-shadow:0_0_16px_rgba(34,211,238,0.5)]",
    dominantBorder: "border-cyan-300/75",
  },
  {
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(110,231,183,0.4),0_0_44px_rgba(52,211,153,0.32)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(110,231,183,0.85),0_0_100px_rgba(16,185,129,0.65)]",
    ring: "from-emerald-300/95 via-teal-400/95 to-lime-300/95",
    title: "text-white",
    panel: "border-emerald-300/45 bg-emerald-950/30",
    mediaBorder: "border-emerald-300/35",
    categoryChip: "border-emerald-300/35 bg-emerald-500/18 text-emerald-200",
    starColor: "text-emerald-300",
    infoPanel: "border-emerald-300/35 bg-emerald-950/28",
    priceColor: "text-emerald-300",
    priceGlow: "[text-shadow:0_0_16px_rgba(52,211,153,0.5)]",
    dominantBorder: "border-emerald-300/75",
  },
  {
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(251,191,36,0.4),0_0_44px_rgba(245,158,11,0.32)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(252,211,77,0.85),0_0_100px_rgba(245,158,11,0.65)]",
    ring: "from-amber-300/95 via-yellow-400/95 to-orange-300/95",
    title: "text-white",
    panel: "border-amber-300/45 bg-amber-950/30",
    mediaBorder: "border-amber-300/35",
    categoryChip: "border-amber-300/35 bg-amber-500/18 text-amber-200",
    starColor: "text-amber-300",
    infoPanel: "border-amber-300/35 bg-amber-950/28",
    priceColor: "text-amber-300",
    priceGlow: "[text-shadow:0_0_16px_rgba(245,158,11,0.5)]",
    dominantBorder: "border-amber-300/75",
  },
] as const;

type PlaylistCategory = "all" | "business_model" | "business_psychology";

const DEFAULT_PLAYLIST_CATEGORY: PlaylistCategory = "all";

const PLAYLIST_CATEGORY_LABELS: Record<Exclude<PlaylistCategory, "all">, string> = {
  business_model: "Business Model",
  business_psychology: "Business Psychology",
};

function parsePrice(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function parseRating(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

function roundedStarCount(rating: number): number {
  return Math.max(0, Math.min(5, Math.round(rating)));
}

type Course = {
  id: string;
  title: string;
  subtitle: string;
  statusText: string;
  progress: number;
  accent?: "gold" | "ice";
  imageSrc?: string;
  meta?: string;
  detail?: string;
};

type Props = {
  /** Hero slideshow (e.g. InstructorSlideshow) rendered above the grid */
  instructorHero: ReactNode;
  chromaItems: ChromaItem[];
  selectedCourseId: string | null;
  onSelectCourse: (id: string) => void;
  sidebarOccupiesGrid: boolean;
  isNarrowViewport: boolean;
  isGoalsPanelOpen: boolean;
  selectedCourseWithProgress: (Course & { progress: number }) | null;
  activeCoursePanel: ReactNode | null;
};

export function ProgramsCourseSection({
  instructorHero,
  chromaItems,
  selectedCourseId,
  onSelectCourse,
  sidebarOccupiesGrid,
  isNarrowViewport,
  isGoalsPanelOpen,
  selectedCourseWithProgress,
  activeCoursePanel,
}: Props) {
  const [apiCourses, setApiCourses] = useState<CourseDto[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [streamPlaylists, setStreamPlaylists] = useState<StreamPlaylistListItem[]>([]);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [staff, setStaff] = useState(false);
  const [secureView, setSecureView] = useState<"grid" | "detail">("grid");
  const [detailCourseId, setDetailCourseId] = useState<number | null>(null);
  const [detailPlaylistId, setDetailPlaylistId] = useState<number | null>(null);
  const [playlistCategoryFilter, setPlaylistCategoryFilter] = useState<PlaylistCategory>(DEFAULT_PLAYLIST_CATEGORY);
  const [playlistTitleQuery, setPlaylistTitleQuery] = useState("");

  const reloadApiCourses = useCallback(async () => {
    const res = await fetchCoursesList();
    if (res.ok && Array.isArray(res.data)) {
      setApiCourses(res.data as CourseDto[]);
      setCoursesError(null);
      return;
    }
    setApiCourses([]);
    setCoursesError(coursesListErrorMessage(res.status, res.data));
  }, []);

  const reloadStreamPlaylists = useCallback(async () => {
    try {
      const list = await fetchStreamPlaylists();
      setStreamPlaylists(Array.isArray(list) ? list : []);
      setPlaylistsError(null);
    } catch {
      setStreamPlaylists([]);
      setPlaylistsError("Could not load secure playlists right now.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void reloadApiCourses();
    void reloadStreamPlaylists();
    void fetchPortalIdentity()
      .then((u) => {
        if (!cancelled) setStaff(!!u?.is_staff);
      })
      .catch(() => {
        if (!cancelled) setStaff(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadApiCourses, reloadStreamPlaylists]);

  useEffect(() => {
    if (apiCourses.length === 0) {
      setDetailCourseId(null);
    } else if (detailCourseId !== null && !apiCourses.some((c) => c.id === detailCourseId)) {
      setDetailCourseId(null);
    }
  }, [apiCourses, detailCourseId]);

  useEffect(() => {
    if (streamPlaylists.length === 0) {
      setDetailPlaylistId(null);
    } else if (detailPlaylistId !== null && !streamPlaylists.some((p) => p.id === detailPlaylistId)) {
      setDetailPlaylistId(null);
    }
  }, [streamPlaylists, detailPlaylistId]);

  useEffect(() => {
    if (apiCourses.length === 0 && streamPlaylists.length === 0) {
      setSecureView("grid");
    } else if (detailCourseId === null && detailPlaylistId === null) {
      setSecureView("grid");
    }
  }, [apiCourses.length, streamPlaylists.length, detailCourseId, detailPlaylistId]);

  const openProgram = (id: number) => {
    setDetailPlaylistId(null);
    setDetailCourseId(id);
    setSecureView("detail");
  };

  const openStreamPlaylist = (id: number) => {
    setDetailCourseId(null);
    setDetailPlaylistId(id);
    setSecureView("detail");
  };

  const backToProgramGrid = () => {
    setSecureView("grid");
    setDetailCourseId(null);
    setDetailPlaylistId(null);
  };

  const activeDetailCourse = detailCourseId !== null ? apiCourses.find((c) => c.id === detailCourseId) : undefined;
  const hasCatalogItems = apiCourses.length > 0 || streamPlaylists.length > 0;
  const hasSecureErrors = coursesError !== null || playlistsError !== null;
  const showSecureBlock = staff || hasCatalogItems || hasSecureErrors || chromaItems.length === 0;
  const useApiProgramBrowser = hasCatalogItems || staff || hasSecureErrors || chromaItems.length === 0;
  /** Focused lesson view: hide marketing hero and grid header. */
  const inProgramLessonView = useApiProgramBrowser && secureView === "detail";
  const inPlaylistDetail = detailPlaylistId !== null;
  const inCourseDetail = detailCourseId !== null;
  const normalizedPlaylistTitleQuery = playlistTitleQuery.trim().toLowerCase();
  const searchablePlaylists = useMemo(
    () =>
      streamPlaylists.filter((playlist) =>
        normalizedPlaylistTitleQuery.length === 0 ? true : playlist.title.toLowerCase().includes(normalizedPlaylistTitleQuery)
      ),
    [streamPlaylists, normalizedPlaylistTitleQuery]
  );
  const businessModelPlaylists = useMemo(
    () => searchablePlaylists.filter((playlist) => playlist.category === "business_model"),
    [searchablePlaylists]
  );
  const businessPsychologyPlaylists = useMemo(
    () => searchablePlaylists.filter((playlist) => playlist.category !== "business_model"),
    [searchablePlaylists]
  );
  const visibleBusinessModelPlaylists = playlistCategoryFilter === "business_psychology" ? [] : businessModelPlaylists;
  const visibleBusinessPsychologyPlaylists = playlistCategoryFilter === "business_model" ? [] : businessPsychologyPlaylists;
  const visibleStreamPlaylistCount = visibleBusinessModelPlaylists.length + visibleBusinessPsychologyPlaylists.length;
  const showBothPlaylistColumns = visibleBusinessPsychologyPlaylists.length > 0 && visibleBusinessModelPlaylists.length > 0;
  const interleavedMobilePlaylistRows = useMemo(() => {
    if (!showBothPlaylistColumns) return [];
    const maxLen = Math.max(visibleBusinessPsychologyPlaylists.length, visibleBusinessModelPlaylists.length);
    return Array.from({ length: maxLen }, (_, idx) => ({
      psychology: visibleBusinessPsychologyPlaylists[idx] ?? null,
      model: visibleBusinessModelPlaylists[idx] ?? null,
      idx,
    }));
  }, [showBothPlaylistColumns, visibleBusinessPsychologyPlaylists, visibleBusinessModelPlaylists]);

  const renderStreamPlaylistCard = (pl: StreamPlaylistListItem, j: number) => {
    const i = j;
    const grad = PROGRAM_CARD_BACKGROUNDS[i % PROGRAM_CARD_BACKGROUNDS.length];
    const coverSrc = resolveDjangoMediaUrl(pl.cover_image_url);
    const comingSoon = !!pl.is_coming_soon;
    const theme = PLAYLIST_CARD_THEMES[j % PLAYLIST_CARD_THEMES.length];
    const rating = parseRating(pl.rating);
    const price = parsePrice(pl.price);
    return (
      <button
        key={`playlist-${pl.id}`}
        type="button"
        onClick={() => {
          if (!comingSoon) openStreamPlaylist(pl.id);
        }}
        className={cn(
          "group/card relative flex aspect-[3/5] w-full flex-col overflow-hidden text-left outline-none sm:aspect-[4/5]",
          "rounded-3xl border-2",
          theme.dominantBorder,
          theme.glow,
          "transition-[transform,box-shadow] duration-300 ease-out",
          comingSoon
            ? "opacity-95 cursor-not-allowed"
            : cn("hover:-translate-y-0.5", theme.hoverGlow),
          "focus-visible:ring-2 focus-visible:ring-violet-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "active:translate-y-0"
        )}
        aria-disabled={comingSoon}
      >
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[185%] max-w-none -translate-x-1/2 -translate-y-1/2 will-change-transform animate-[spin_5.5s_linear_infinite] motion-reduce:animate-none bg-gradient-to-r transition duration-300 group-hover/card:opacity-100 group-hover/card:saturate-150",
            theme.ring
          )}
          style={{ animationDuration: `${5.3 + (j % 5) * 0.42}s` }}
          aria-hidden
        />
        <span className="relative z-[1] m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-[#04060d] ring-1 ring-black/70">
          <span className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[1.28rem]" aria-hidden>
            <span className="absolute -left-[40%] top-0 h-full w-[45%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 mix-blend-overlay transition-[transform,opacity] duration-700 ease-out group-hover/card:translate-x-[280%] group-hover/card:opacity-100" />
          </span>
          <span
            className="pointer-events-none absolute inset-0 z-[2] rounded-[1.28rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.12)]"
            aria-hidden
          />
          <div className="relative z-[3] flex h-full min-h-0 flex-col gap-2 p-3 sm:p-3.5">
            <div className={cn("relative min-h-[9.6rem] overflow-hidden rounded-2xl border-2 sm:min-h-[14.2rem] sm:flex-1", theme.mediaBorder)}>
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt=""
                  loading={j < 2 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={j < 1 ? "high" : undefined}
                  className="h-full w-full object-cover object-center [image-rendering:high-quality] [backface-visibility:hidden]"
                />
              ) : (
                <div className={cn("h-full w-full bg-gradient-to-t opacity-95", grad)} />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45" />
            </div>
            <div className="absolute right-3 top-3 z-[4] flex flex-col items-end gap-1 sm:right-3.5 sm:top-3.5">
              <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-neutral-900 shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                {pl.video_count} videos
              </span>
            </div>
            {comingSoon ? (
              <>
                <span className="pointer-events-none absolute inset-0 z-[3] bg-black/35" />
                <span className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center px-5 text-center">
                  <span className="rounded-2xl border border-amber-300/65 bg-black/70 px-5 py-3 text-[20px] font-black uppercase tracking-[0.18em] text-[#f5c814] shadow-[0_0_26px_rgba(245,200,20,0.35)] sm:text-[24px]">
                    Coming Soon
                  </span>
                </span>
              </>
            ) : null}
            <div
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border-2 px-2.5 py-2.5 sm:px-3.5 sm:py-3.5",
                theme.infoPanel,
                "bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.12)]",
                "backdrop-blur-md transition duration-300 group-hover/card:brightness-125 group-hover/card:saturate-125"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "line-clamp-2 text-left text-[11px] font-extrabold uppercase leading-snug tracking-[0.05em] antialiased [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_2px_14px_rgba(0,0,0,0.75)] sm:text-[17px] sm:tracking-[0.07em]",
                    theme.title
                  )}
                >
                  {pl.title}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
                <span className="inline-flex min-w-0 items-center gap-0.5 overflow-hidden rounded-full border border-amber-300/45 bg-[#130d03]/92 px-2 py-0.5 font-sans text-[11px] font-bold tracking-[0.01em] text-amber-50 shadow-[0_0_14px_rgba(245,158,11,0.28)] [text-shadow:none] sm:px-3 sm:py-1 sm:text-[13px]">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={`${pl.id}-star-${idx}`}
                      className={cn(
                        "h-2.5 w-2.5 sm:h-3 sm:w-3",
                        idx < roundedStarCount(rating) ? "fill-amber-300 text-amber-300" : "fill-transparent text-amber-100/35"
                      )}
                    />
                  ))}
                  <span className="ml-1 tabular-nums text-amber-50/95">{rating.toFixed(1)}</span>
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-emerald-300/50 bg-[#03140d]/95 px-2.5 py-0.5 font-sans text-[13px] font-black tracking-tight text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.28)] sm:px-3.5 sm:py-1 sm:text-[17px]",
                    theme.priceColor,
                    theme.priceGlow
                  )}
                >
                  {`£${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
          </div>
        </span>
      </button>
    );
  };

  return (
    <>
      {showSecureBlock ? (
        <div className="mb-8 space-y-5">
          {!inProgramLessonView ? (
            <div className="border-b border-[color:var(--gold-neon-border-mid)]/35 pb-4 text-left">
              <div className="text-[18px] font-black uppercase tracking-[0.16em] text-[color:var(--gold)]/95 [text-shadow:0_0_12px_rgba(250,204,21,0.2)] sm:text-[24px]">
                Programs
              </div>
              <p className="mt-2 max-w-4xl text-[17px] leading-relaxed text-white/82 sm:text-[24px] sm:leading-[1.35]">
                {useApiProgramBrowser
                  ? "Open a playlist, or a course for lesson playlists and progress."
                  : "When published programs are available from the API, you can open any course, watch lessons, and track your learning flow from one place."}
              </p>
            </div>
          ) : null}
          {coursesError ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{coursesError}</div>
          ) : null}
          {playlistsError ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{playlistsError}</div>
          ) : null}
          {!coursesError && staff && apiCourses.length === 0 && streamPlaylists.length === 0 ? (
            <p className="text-[12px] text-white/50">
              No programs yet. Add a Stream playlist (Video streaming → Stream playlists) and/or a course. Uncheck “Show in
              programs” on legacy courses to hide them from this grid.
            </p>
          ) : null}
          {!hasSecureErrors && !staff && apiCourses.length === 0 && streamPlaylists.length === 0 ? (
            <p className="text-[12px] text-white/55">
              No published programs are available for this account yet. Ask admin to publish a stream playlist or enable
              “Show in programs” on a course.
            </p>
          ) : null}

          {hasCatalogItems && secureView === "detail" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={backToProgramGrid}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white/80 transition hover:border-[color:var(--gold-neon-border-mid)] hover:text-[color:var(--gold)]"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Programs
              </button>
            </div>
          ) : null}

          {hasCatalogItems && secureView === "grid" ? (
            <div className="space-y-6">
              {streamPlaylists.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPlaylistCategoryFilter("business_psychology")}
                      className={cn(
                        "rounded-full border px-4 py-2 text-[12px] font-black uppercase tracking-[0.16em] transition sm:px-5 sm:py-2.5 sm:text-[13px]",
                        playlistCategoryFilter === "business_psychology"
                          ? "border-fuchsia-200 bg-[linear-gradient(135deg,rgba(90,16,72,0.98),rgba(42,8,36,0.97))] text-fuchsia-50 shadow-[0_0_26px_rgba(217,70,239,0.9)]"
                          : "border-fuchsia-400/45 bg-[linear-gradient(135deg,rgba(56,12,47,0.9),rgba(24,6,20,0.9))] text-fuchsia-100/95 shadow-[0_0_14px_rgba(217,70,239,0.45)] hover:border-fuchsia-200/80 hover:bg-[linear-gradient(135deg,rgba(84,18,68,0.95),rgba(34,8,29,0.95))] hover:text-fuchsia-50 hover:shadow-[0_0_24px_rgba(217,70,239,0.72)]"
                      )}
                    >
                      Business Psychology
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaylistCategoryFilter("business_model")}
                      className={cn(
                        "rounded-full border px-4 py-2 text-[12px] font-black uppercase tracking-[0.16em] transition sm:px-5 sm:py-2.5 sm:text-[13px]",
                        playlistCategoryFilter === "business_model"
                          ? "border-cyan-200 bg-[linear-gradient(135deg,rgba(8,70,82,0.98),rgba(5,34,40,0.97))] text-cyan-50 shadow-[0_0_26px_rgba(34,211,238,0.9)]"
                          : "border-cyan-400/45 bg-[linear-gradient(135deg,rgba(8,44,52,0.9),rgba(4,22,26,0.9))] text-cyan-100/95 shadow-[0_0_14px_rgba(34,211,238,0.45)] hover:border-cyan-200/80 hover:bg-[linear-gradient(135deg,rgba(11,66,78,0.95),rgba(5,30,36,0.95))] hover:text-cyan-50 hover:shadow-[0_0_24px_rgba(34,211,238,0.72)]"
                      )}
                    >
                      Business Model
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaylistCategoryFilter("all")}
                      className={cn(
                        "rounded-full border px-4 py-2 text-[12px] font-black uppercase tracking-[0.16em] transition sm:px-5 sm:py-2.5 sm:text-[13px]",
                        playlistCategoryFilter === "all"
                          ? "border-amber-200 bg-[linear-gradient(135deg,rgba(112,70,8,0.98),rgba(54,34,4,0.97))] text-amber-50 shadow-[0_0_26px_rgba(251,191,36,0.92)]"
                          : "border-amber-400/45 bg-[linear-gradient(135deg,rgba(70,44,7,0.9),rgba(34,22,3,0.9))] text-amber-100/95 hover:border-amber-200/80 hover:bg-[linear-gradient(135deg,rgba(102,64,8,0.95),rgba(46,30,3,0.95))] hover:text-amber-50"
                      )}
                    >
                      All
                    </button>
                  </div>
                  <div className="relative max-w-[440px] md:max-w-[620px] lg:max-w-[860px]">
                    <div
                      className="pointer-events-none absolute -inset-1 rounded-2xl bg-amber-400/12 blur-sm"
                      aria-hidden
                    />
                    <div className="relative rounded-xl bg-amber-300/70 p-[1px] shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                      <input
                        type="text"
                        value={playlistTitleQuery}
                        onChange={(e) => setPlaylistTitleQuery(e.target.value)}
                        placeholder="Search playlist by title..."
                        className="w-full rounded-[11px] border-0 bg-black/75 px-3 py-2 text-[13px] text-white outline-none transition placeholder:text-white/45 focus:ring-2 focus:ring-amber-300/25 lg:px-4 lg:py-3 lg:text-[14px]"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
              {visibleStreamPlaylistCount === 0 && streamPlaylists.length > 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[13px] text-white/70">
                  No playlists found in this category yet.
                </div>
              ) : null}
              {visibleBusinessPsychologyPlaylists.length > 0 || visibleBusinessModelPlaylists.length > 0 ? (
                <div className="mx-auto max-w-[1700px]">
                  {showBothPlaylistColumns ? (
                    <div className="space-y-3 xl:hidden">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex min-h-[2.8rem] items-center justify-center text-center font-mono text-[13px] font-extrabold uppercase leading-tight tracking-[0.18em] text-fuchsia-100 [text-shadow:0_0_10px_rgba(232,121,249,0.7),0_0_24px_rgba(232,121,249,0.8)] sm:min-h-[3rem] sm:text-[14px]">
                          {PLAYLIST_CATEGORY_LABELS.business_psychology}
                        </div>
                        <div className="flex min-h-[2.8rem] items-center justify-center text-center font-mono text-[13px] font-extrabold uppercase leading-tight tracking-[0.18em] text-cyan-100 [text-shadow:0_0_10px_rgba(103,232,249,0.7),0_0_24px_rgba(103,232,249,0.8)] sm:min-h-[3rem] sm:text-[14px]">
                          {PLAYLIST_CATEGORY_LABELS.business_model}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {interleavedMobilePlaylistRows.map((row) => (
                          <div key={`mobile-row-${row.idx}`} className="relative">
                            {row.psychology && row.model ? (
                              <>
                                <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[4] w-3 -translate-x-1/2 bg-gradient-to-b from-transparent via-[color:var(--gold)]/22 to-transparent blur-[1px]" />
                                <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[5] w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-[color:var(--gold)] to-transparent shadow-[0_0_16px_rgba(245,200,20,0.95),0_0_38px_rgba(245,200,20,0.75)]" />
                              </>
                            ) : null}
                            <div className="grid grid-cols-2 gap-4">
                              <div>{row.psychology ? renderStreamPlaylistCard(row.psychology, row.idx * 2) : null}</div>
                              <div>{row.model ? renderStreamPlaylistCard(row.model, row.idx * 2 + 1) : null}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-8",
                      showBothPlaylistColumns
                        ? "hidden xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-stretch"
                        : "xl:grid-cols-1"
                    )}
                  >
                    {visibleBusinessPsychologyPlaylists.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-center font-mono text-[15px] font-extrabold uppercase tracking-[0.2em] text-fuchsia-100 [text-shadow:0_0_10px_rgba(232,121,249,0.7),0_0_26px_rgba(232,121,249,0.82)] sm:text-[17px]">
                          {PLAYLIST_CATEGORY_LABELS.business_psychology}
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-300/90 to-transparent shadow-[0_0_14px_rgba(232,121,249,0.55)]" />
                        <div
                          className={cn(
                            "grid gap-4 sm:gap-5 md:gap-6",
                            showBothPlaylistColumns ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                          )}
                        >
                          {visibleBusinessPsychologyPlaylists.map((pl, j) => renderStreamPlaylistCard(pl, j))}
                        </div>
                      </div>
                    ) : null}

                    {showBothPlaylistColumns ? (
                      <div className="relative h-5 w-full xl:h-auto xl:w-4" aria-hidden>
                        <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#f5c814] to-transparent shadow-[0_0_14px_rgba(245,200,20,0.9),0_0_34px_rgba(245,200,20,0.65)] xl:hidden" />
                        <div className="absolute left-1/2 top-0 hidden h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f5c814] to-transparent shadow-[0_0_16px_rgba(245,200,20,0.95),0_0_40px_rgba(245,200,20,0.7)] xl:block" />
                      </div>
                    ) : null}

                    {visibleBusinessModelPlaylists.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-center font-mono text-[15px] font-extrabold uppercase tracking-[0.2em] text-cyan-100 [text-shadow:0_0_10px_rgba(103,232,249,0.7),0_0_26px_rgba(103,232,249,0.82)] sm:text-[17px]">
                          {PLAYLIST_CATEGORY_LABELS.business_model}
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_14px_rgba(103,232,249,0.55)]" />
                        <div
                          className={cn(
                            "grid gap-4 sm:gap-5 md:gap-6",
                            showBothPlaylistColumns ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                          )}
                        >
                          {visibleBusinessModelPlaylists.map((pl, j) =>
                            renderStreamPlaylistCard(pl, j + visibleBusinessPsychologyPlaylists.length)
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {apiCourses.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-[12px] font-black uppercase tracking-[0.18em] text-cyan-100/80">Courses</div>
                  <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {apiCourses.map((c, i) => {
                const grad = PROGRAM_CARD_BACKGROUNDS[(streamPlaylists.length + i) % PROGRAM_CARD_BACKGROUNDS.length];
                const coverSrc = resolveDjangoMediaUrl(c.cover_image_url);
                const theme = COURSE_CARD_THEMES[i % COURSE_CARD_THEMES.length];
                return (
                  <button
                    key={`course-${c.id}`}
                    type="button"
                    onClick={() => openProgram(c.id)}
                    className={cn(
                      "group/card relative flex aspect-[4/5] w-full flex-col overflow-hidden text-left outline-none",
                      "rounded-3xl",
                      theme.glow,
                      "transition-[transform,box-shadow] duration-300 ease-out",
                      "hover:-translate-y-0.5",
                      theme.hoverGlow,
                      "focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                      "active:translate-y-0"
                    )}
                  >
                    {/* Rotating conic gradient — visible only in the ~2px ring around the inner panel */}
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[185%] max-w-none -translate-x-1/2 -translate-y-1/2 will-change-transform animate-[spin_5.5s_linear_infinite] motion-reduce:animate-none",
                        `bg-gradient-to-r ${theme.ring}`
                      )}
                      style={{ animationDuration: `${5.2 + ((streamPlaylists.length + i) % 5) * 0.45}s` }}
                      aria-hidden
                    />
                    <span className="relative z-[1] m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-neutral-950 ring-1 ring-black/60">
                      {/* Specular sweep on hover */}
                      <span
                        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[1.28rem]"
                        aria-hidden
                      >
                        <span className="absolute -left-[40%] top-0 h-full w-[45%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 mix-blend-overlay transition-[transform,opacity] duration-700 ease-out group-hover/card:translate-x-[280%] group-hover/card:opacity-100" />
                      </span>
                      {/* Inner rim light */}
                      <span
                        className="pointer-events-none absolute inset-0 z-[2] rounded-[1.28rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.12)]"
                        aria-hidden
                      />
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt=""
                          loading={i < 4 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={i < 2 ? "high" : undefined}
                          className="absolute inset-0 z-0 h-full w-full object-cover object-center [image-rendering:high-quality] [backface-visibility:hidden]"
                        />
                      ) : (
                        <div className={cn("absolute inset-0 z-0 bg-gradient-to-t opacity-95", grad)} />
                      )}
                      {coverSrc ? (
                        <>
                          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/35 via-transparent to-transparent to-[45%]" />
                          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black from-0% via-black/85 via-[32%] to-transparent to-[62%]" />
                        </>
                      ) : (
                        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_50%)]" />
                      )}
                      <div className="relative z-[3] flex h-full flex-col justify-end p-3 pt-10 sm:p-3.5 sm:pt-12">
                        <div
                          className={cn(
                            "rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3",
                            theme.body,
                            "shadow-[0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]",
                            "backdrop-blur-md transition duration-300 group-hover/card:brightness-125 group-hover/card:saturate-125"
                          )}
                        >
                          <div
                            className={cn(
                              "line-clamp-3 text-left text-[16px] font-extrabold uppercase leading-snug tracking-[0.06em] antialiased [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_2px_14px_rgba(0,0,0,0.75)] sm:text-[17px] sm:tracking-[0.07em]",
                              theme.title
                            )}
                          >
                            {c.title}
                          </div>
                          <div
                            className={cn(
                              "mt-1.5 inline-flex w-fit rounded-full border px-2 py-0.5 text-left text-[10px] font-bold uppercase tracking-[0.14em]",
                              theme.chip
                            )}
                          >
                            Course · playlist
                          </div>
                          {c.description ? (
                            <p className="mt-1.5 line-clamp-4 font-sans text-left text-[13px] font-medium leading-5 tracking-normal text-white/95 antialiased [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                              {c.description.replace(/\s+/g, " ").trim()}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </span>
                  </button>
                );
              })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {inCourseDetail && detailCourseId !== null ? (
            <CourseVideoPlaylist
              courseId={detailCourseId}
              courseTitle={activeDetailCourse?.title ?? "Program"}
              courseDescription={activeDetailCourse?.description ?? ""}
              autoAdvance
            />
          ) : null}
          {inPlaylistDetail && detailPlaylistId !== null ? (
            <StreamPlaylistProgramPanel playlistId={detailPlaylistId} />
          ) : null}
        </div>
      ) : null}

      {useApiProgramBrowser ? null : (
        <>
          <div className="mb-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-[14px] font-extrabold uppercase tracking-[0.22em] text-white/65">Courses</div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/40">Hover / Select</div>
            </div>
          </div>
          <div className="pr-1" data-cards-wrap>
            <div
              className={cn(
                "relative",
                sidebarOccupiesGrid ? "min-h-[min(52vh,560px)] sm:min-h-[min(58vh,640px)]" : "min-h-[min(56vh,620px)] sm:min-h-[min(64vh,720px)]"
              )}
            >
              <ChromaGrid
                items={chromaItems}
                selectedId={selectedCourseId}
                onSelect={onSelectCourse}
                columns={sidebarOccupiesGrid ? (isNarrowViewport ? 2 : 3) : 4}
                radius={sidebarOccupiesGrid ? (isNarrowViewport ? 280 : 380) : 440}
                damping={0.45}
                fadeOut={0.6}
                ease="power3.out"
                interactionDisabled={isGoalsPanelOpen}
                className={cn(sidebarOccupiesGrid ? "py-2" : "py-4")}
              />
            </div>

            {selectedCourseWithProgress ? <div className="mt-6">{activeCoursePanel}</div> : null}
          </div>
        </>
      )}
    </>
  );
}
