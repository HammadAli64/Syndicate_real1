"use client";

import { motion } from "framer-motion";

export type VideoDto = {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
};

const FALLBACK_THUMBS = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486578077620-8a022ddd481f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80",
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type VideoCardProps = {
  video: VideoDto;
  onPlay: (video: VideoDto) => void;
  index?: number;
};

export function VideoCard({ video, onPlay, index = 0 }: VideoCardProps) {
  const fallback = FALLBACK_THUMBS[Math.abs(Number(video.id || 0)) % FALLBACK_THUMBS.length];
  const thumb = video.thumbnail_url?.trim() || fallback;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35) }}
      className={cx(
        "group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-cyan-300/25 bg-black/65 p-4 text-left transition duration-200",
        "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(34,211,238,0.08),transparent_35%,rgba(250,204,21,0.06))] before:content-['']",
        "hover:-translate-y-0.5 hover:border-cyan-200/60 hover:shadow-[0_0_32px_rgba(34,211,238,0.2)]"
      )}
    >
      <button
        type="button"
        onClick={() => onPlay(video)}
        className="relative z-[1] aspect-video w-full overflow-hidden rounded-lg border border-cyan-300/25 bg-black/60 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300/45"
        aria-label={`Play ${video.title}`}
      >
        <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <span className="absolute inset-0 bg-[linear-gradient(transparent_92%,rgba(34,211,238,0.14)_100%)] bg-[length:100%_6px] opacity-40" />
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/55 bg-black/55 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.35)] transition group-hover:scale-105">
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
      {video.description ? (
        <p className="relative z-[1] mt-2 line-clamp-2 flex-1 text-[12px] leading-relaxed text-neutral-300">{video.description}</p>
      ) : (
        <div className="flex-1" />
      )}
    </motion.article>
  );
}
