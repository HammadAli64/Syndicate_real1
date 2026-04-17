"use client";

import { motion } from "framer-motion";

export type VideoDto = {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  player_layout?: string;
  source_width?: number | null;
  source_height?: number | null;
};

const FALLBACK_THUMBS = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486578077620-8a022ddd481f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80"
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function aspectLabel(visual: "portrait" | "landscape" | "wide"): string {
  if (visual === "portrait") return "9:16";
  if (visual === "wide") return "21:9";
  return "16:9";
}

function formatPublished(iso: string): string {
  if (!iso?.trim()) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "";
  }
}

type VideoFrame = "gold" | "ember";

type VideoCardProps = {
  video: VideoDto;
  onPlay: (video: VideoDto) => void;
  index?: number;
  visual?: "portrait" | "landscape" | "wide";
  frame?: VideoFrame;
};

const frameShell: Record<VideoFrame, { article: string; thumbIdle: string; ring: string; cut: string }> = {
  gold: {
    article:
      "border-[rgba(197,179,88,0.28)] hover:border-[rgba(250,204,21,0.55)] hover:shadow-[0_0_36px_rgba(250,204,21,0.16)]",
    thumbIdle: "border-white/12 group-hover:border-[rgba(250,204,21,0.48)]",
    ring: "focus-visible:ring-[rgba(250,204,21,0.4)]",
    cut: "before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:shadow-[inset_0_0_0_1px_rgba(250,204,21,0.12)]"
  },
  ember: {
    article:
      "border-[rgba(185,28,28,0.42)] hover:border-[rgba(248,113,113,0.58)] hover:shadow-[0_0_32px_rgba(220,38,38,0.22)]",
    thumbIdle: "border-[rgba(127,29,29,0.5)] group-hover:border-[rgba(248,113,113,0.55)]",
    ring: "focus-visible:ring-[rgba(248,113,113,0.45)]",
    cut: "before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:shadow-[inset_0_0_0_1px_rgba(248,113,113,0.14)]"
  }
};

export function VideoCard({ video, onPlay, index = 0, visual = "landscape", frame = "gold" }: VideoCardProps) {
  const fallback = FALLBACK_THUMBS[Math.abs(Number(video.id || 0)) % FALLBACK_THUMBS.length];
  const thumb = video.thumbnail_url?.trim() || fallback;
  const shell = frameShell[frame];
  const corner =
    frame === "ember"
      ? "border-[rgba(248,113,113,0.78)] shadow-[0_0_12px_rgba(220,38,38,0.2)]"
      : "border-[rgba(250,204,21,0.82)] shadow-[0_0_14px_rgba(250,204,21,0.18)]";
  const aspectClass =
    visual === "portrait"
      ? "aspect-[9/16] max-h-[min(52vh,420px)] w-full max-w-[min(100%,280px)] mx-auto"
      : visual === "wide"
        ? "aspect-[21/9] w-full min-h-[120px]"
        : "aspect-video w-full";
  const published = formatPublished(video.created_at);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35) }}
      className={cx(
        "group relative flex h-full min-h-0 flex-col rounded-xl border bg-black/45 p-[clamp(0.65rem,1.2vw+0.35rem,1rem)] text-left transition duration-200",
        "hover:-translate-y-0.5",
        shell.article,
        shell.cut
      )}
    >
      <span
        className={cx(
          "pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 rounded-tl-md border-l-2 border-t-2",
          corner
        )}
        aria-hidden
      />
      <span
        className={cx(
          "pointer-events-none absolute right-3 top-3 z-10 h-4 w-4 rounded-tr-md border-r-2 border-t-2",
          corner
        )}
        aria-hidden
      />
      <span
        className={cx(
          "pointer-events-none absolute bottom-3 left-3 z-10 h-4 w-4 rounded-bl-md border-b-2 border-l-2",
          corner
        )}
        aria-hidden
      />
      <span
        className={cx(
          "pointer-events-none absolute bottom-3 right-3 z-10 h-4 w-4 rounded-br-md border-b-2 border-r-2",
          corner
        )}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => onPlay(video)}
        className={cx(
          "relative z-[1] shrink-0 overflow-hidden rounded-lg bg-black/60 text-left outline-none transition",
          aspectClass,
          shell.thumbIdle,
          "focus-visible:ring-2",
          shell.ring
        )}
        aria-label={`Play ${video.title}`}
      >
        <span
          className={cx(
            "absolute left-2 top-2 z-[1] rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em]",
            frame === "ember"
              ? "border-[rgba(248,113,113,0.45)] bg-[rgba(0,0,0,0.72)] text-red-100/95"
              : "border-[rgba(250,204,21,0.4)] bg-[rgba(0,0,0,0.72)] text-[color:var(--gold-neon)]"
          )}
        >
          {aspectLabel(visual)}
        </span>
        <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <span className="absolute inset-0 bg-[linear-gradient(transparent_92%,rgba(34,211,238,0.12)_100%)] bg-[length:100%_6px] opacity-35" />
        <span
          className={cx(
            "absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-black/55 transition group-hover:scale-105",
            frame === "ember"
              ? "border-[rgba(248,113,113,0.5)] text-red-200/95 shadow-[0_0_22px_rgba(220,38,38,0.35)]"
              : "border-[rgba(250,204,21,0.45)] text-[color:var(--gold-neon)] shadow-[0_0_24px_rgba(250,204,21,0.25)]"
          )}
        >
          <svg className="ml-0.5 h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7L8 5Z" />
          </svg>
        </span>
        <span
          className={cx(
            "absolute bottom-2 right-2 rounded border px-2 py-0.5 text-[10px] font-bold uppercase",
            video.status === "ready"
              ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-100"
              : "border-amber-300/40 bg-amber-500/20 text-amber-100"
          )}
        >
          {video.status}
        </span>
      </button>

      <h3 className="relative z-[1] mt-4 line-clamp-2 text-[15px] font-bold leading-snug text-neutral-50">{video.title}</h3>
      {published ? (
        <p className="relative z-[1] mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">{published}</p>
      ) : null}
      {video.description ? (
        <p className="relative z-[1] mt-2 line-clamp-2 flex-1 text-[12px] leading-relaxed text-neutral-300">{video.description}</p>
      ) : (
        <div className="flex-1" />
      )}
    </motion.article>
  );
}
