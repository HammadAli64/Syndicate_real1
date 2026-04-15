"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import ChromaGrid, { type ChromaItem } from "@/components/ChromaGrid";
import { CourseVideoPlaylist } from "@/components/programs/CourseVideoPlaylist";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { fetchCoursesList, resolveDjangoMediaUrl, type CourseDto } from "@/lib/courses-api";
import { fetchPortalIdentity } from "@/lib/portal-api";

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
  const [staff, setStaff] = useState(false);
  const [secureView, setSecureView] = useState<"grid" | "detail">("grid");
  const [detailCourseId, setDetailCourseId] = useState<number | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    void reloadApiCourses();
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
  }, [reloadApiCourses]);

  useEffect(() => {
    if (apiCourses.length === 0) {
      setDetailCourseId(null);
      setSecureView("grid");
    } else if (detailCourseId !== null && !apiCourses.some((c) => c.id === detailCourseId)) {
      setDetailCourseId(null);
      setSecureView("grid");
    }
  }, [apiCourses, detailCourseId]);

  const openProgram = (id: number) => {
    setDetailCourseId(id);
    setSecureView("detail");
  };

  const backToProgramGrid = () => {
    setSecureView("grid");
    setDetailCourseId(null);
  };

  const activeDetailCourse = detailCourseId !== null ? apiCourses.find((c) => c.id === detailCourseId) : undefined;
  const showSecureBlock = staff || apiCourses.length > 0 || coursesError !== null;
  const useApiProgramBrowser = apiCourses.length > 0;
  /** Focused lesson view: hide marketing hero and grid header. */
  const inProgramLessonView = useApiProgramBrowser && secureView === "detail";

  return (
    <>
      {showSecureBlock ? (
        <div className="mb-8 space-y-5">
          {!inProgramLessonView ? (
            <div className="border-b border-[color:var(--gold-neon-border-mid)]/35 pb-3">
              <div className="text-[13px] font-black uppercase tracking-[0.2em] text-[color:var(--gold)]/90">
                Programs
              </div>
              <p className="mt-2 max-w-4xl text-[14px] leading-relaxed text-white/72 sm:text-[15px]">
                {useApiProgramBrowser
                  ? "Choose a program to open full lessons, follow the playlist in order, and continue your progress exactly where you left off after each session."
                  : "When published programs are available from the API, you can open any course, watch lessons, and track your learning flow from one place."}
              </p>
            </div>
          ) : null}
          {coursesError ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{coursesError}</div>
          ) : null}
          {!coursesError && staff && apiCourses.length === 0 ? (
            <p className="text-[12px] text-white/50">No courses returned from the API yet. Create or publish a course in Django admin.</p>
          ) : null}

          {apiCourses.length > 0 && secureView === "detail" ? (
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

          {apiCourses.length > 0 && secureView === "grid" ? (
            <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {apiCourses.map((c, i) => {
                const grad = PROGRAM_CARD_BACKGROUNDS[i % PROGRAM_CARD_BACKGROUNDS.length];
                const coverSrc = resolveDjangoMediaUrl(c.cover_image_url);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openProgram(c.id)}
                    className={cn(
                      "group/card relative flex aspect-[3/4] w-full flex-col overflow-hidden text-left outline-none",
                      "rounded-3xl",
                      "shadow-[0_6px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(250,204,21,0.14),0_0_40px_rgba(250,204,21,0.2)]",
                      "transition-[transform,box-shadow] duration-300 ease-out",
                      "hover:-translate-y-0.5 hover:shadow-[0_14px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(250,204,21,0.28),0_0_64px_rgba(250,204,21,0.38)]",
                      "focus-visible:ring-2 focus-visible:ring-amber-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                      "active:translate-y-0"
                    )}
                  >
                    {/* Rotating conic gradient — visible only in the ~2px ring around the inner panel */}
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[185%] max-w-none -translate-x-1/2 -translate-y-1/2 will-change-transform bg-[conic-gradient(from_0deg_at_50%_50%,#fffdf5,#fde68a,#fbbf24,#f59e0b,#d97706,#fcd34d,#fef08a,#fde047,#fffdf5)] animate-[spin_5.5s_linear_infinite] motion-reduce:animate-none"
                      style={{ animationDuration: `${5.2 + (i % 5) * 0.45}s` }}
                      aria-hidden
                    />
                    <span className="relative z-[1] m-[2px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.28rem] bg-neutral-950 ring-1 ring-black/60">
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
                      <div className="relative z-[3] flex h-full flex-col justify-end p-3.5 pt-16 sm:p-4 sm:pt-20">
                        <div
                          className={cn(
                            "rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3",
                            "border-amber-400/35 bg-black/60 shadow-[0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12),0_0_24px_rgba(250,204,21,0.08)]",
                            "backdrop-blur-md transition duration-300 group-hover/card:border-amber-300/55 group-hover/card:shadow-[0_10px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.16),0_0_32px_rgba(250,204,21,0.14)]"
                          )}
                        >
                          <div
                            className="line-clamp-3 text-left text-[16px] font-extrabold uppercase leading-snug tracking-[0.06em] text-[color:var(--gold)] antialiased [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_2px_14px_rgba(0,0,0,0.75)] sm:text-[17px] sm:tracking-[0.07em]"
                          >
                            {c.title}
                          </div>
                          {c.description ? (
                            <p className="mt-2 line-clamp-3 text-left text-[12px] font-medium leading-relaxed tracking-[0.02em] text-white/[0.92] antialiased [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">
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
          ) : null}

          {apiCourses.length > 0 && secureView === "detail" && detailCourseId !== null ? (
            <CourseVideoPlaylist
              courseId={detailCourseId}
              courseTitle={activeDetailCourse?.title ?? "Program"}
              courseDescription={activeDetailCourse?.description ?? ""}
              autoAdvance
            />
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
