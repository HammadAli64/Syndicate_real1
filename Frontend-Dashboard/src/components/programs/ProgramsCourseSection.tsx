"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import ChromaGrid, { type ChromaItem } from "@/components/ChromaGrid";
import { CourseVideoPlaylist } from "@/components/programs/CourseVideoPlaylist";
import { StaffVideoUploadPanel } from "@/components/programs/StaffVideoUploadPanel";
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
  /** Focused lesson view: hide marketing hero, staff tools, and grid header. */
  const inProgramLessonView = useApiProgramBrowser && secureView === "detail";

  return (
    <>
      {!inProgramLessonView ? <div className="mb-5">{instructorHero}</div> : null}
      {!inProgramLessonView && staff ? <StaffVideoUploadPanel isStaff={staff} onCourseCreated={reloadApiCourses} /> : null}

      {showSecureBlock ? (
        <div className="mb-8 space-y-5">
          {!inProgramLessonView ? (
            <div className="border-b border-[color:var(--gold-neon-border-mid)]/35 pb-2">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--gold)]/80">Programs · secure video</div>
              <p className="mt-1 text-[12px] text-white/55">
                {useApiProgramBrowser
                  ? "Choose a program to open lessons and DRM playback."
                  : "DRM playback via VdoCipher when courses are available from the API."}
              </p>
            </div>
          ) : null}
          {coursesError ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{coursesError}</div>
          ) : null}
          {!coursesError && staff && apiCourses.length === 0 ? (
            <p className="text-[12px] text-white/50">No courses returned from the API yet. Create one above or publish an existing course in Django admin.</p>
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {apiCourses.map((c, i) => {
                const grad = PROGRAM_CARD_BACKGROUNDS[i % PROGRAM_CARD_BACKGROUNDS.length];
                const coverSrc = resolveDjangoMediaUrl(c.cover_image_url);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openProgram(c.id)}
                    className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/12 bg-neutral-950 text-left shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition hover:border-[color:var(--gold-neon-border-mid)]/60 hover:shadow-[0_16px_48px_rgba(250,204,21,0.08)]"
                  >
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt=""
                        loading={i < 4 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={i < 2 ? "high" : undefined}
                        className="absolute inset-0 h-full w-full object-cover object-center [image-rendering:high-quality] [backface-visibility:hidden]"
                      />
                    ) : (
                      <div className={cn("absolute inset-0 bg-gradient-to-t opacity-95", grad)} />
                    )}
                    {coverSrc ? (
                      <>
                        {/* Top: light veil so the image stays visible and sharp */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent to-[45%]" />
                        {/* Bottom: strong scrim only where text sits — no multiply blend on the photo */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black from-0% via-black/85 via-[32%] to-transparent to-[62%]" />
                      </>
                    ) : (
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_50%)]" />
                    )}
                    <div className="relative z-[1] flex h-full flex-col justify-end p-4 pt-20">
                      <div className="rounded-lg border border-[color:var(--gold-neon-border-mid)]/25 bg-black/55 px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-[8px]">
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
