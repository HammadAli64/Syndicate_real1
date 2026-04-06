"use client";

import { cn } from "@/components/dashboard/dashboardPrimitives";

const PROGRAM_PROMO_EMBED_SRC =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PROGRAM_PROMO_EMBED_URL?.trim()) ||
  "https://www.youtube-nocookie.com/embed/ScMzIvxBSi4";

type ProgramPromoEmbedProps = {
  title: string;
  className?: string;
  /** Tailwind max-width on the outer wrapper, e.g. "max-w-3xl" */
  maxWidthClass?: string;
};

/**
 * 16:9 responsive iframe (declared 560×315, stretched via absolute fill) for program promos.
 */
export function ProgramPromoEmbed({ title, className, maxWidthClass }: ProgramPromoEmbedProps) {
  return (
    <div className={cn("w-full", maxWidthClass, className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <iframe
          src={PROGRAM_PROMO_EMBED_SRC}
          title={title}
          width={560}
          height={315}
          className="absolute left-0 top-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
