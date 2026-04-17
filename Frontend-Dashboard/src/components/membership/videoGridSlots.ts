export type VideoVisual = "portrait" | "landscape" | "wide";
export type VideoFrame = "gold" | "ember";

export type VideoGridSlot = {
  cell: string;
  visual: VideoVisual;
  /** Themed border: ember on portrait tiles, gold on landscape / wide (frontend-only layout). */
  frame: VideoFrame;
};

type LayoutEntry = { cell: string; visual: VideoVisual };

/** Repeating bento pattern (~20): mixed portrait, landscape, and wide cells. */
const VIDEO_GRID_LAYOUT: LayoutEntry[] = [
  { cell: "col-span-2 row-span-1 md:col-span-4 md:row-span-1 xl:col-span-6 xl:row-span-1 min-h-0", visual: "wide" },
  { cell: "col-span-1 row-span-2 md:col-span-2 md:row-span-2 xl:col-span-3 xl:row-span-2 min-h-0", visual: "portrait" },
  { cell: "col-span-1 row-span-1 md:col-span-2 md:row-span-1 xl:col-span-3 xl:row-span-1 min-h-0", visual: "landscape" },
  { cell: "col-span-1 row-span-2 md:col-span-2 md:row-span-2 xl:col-span-3 xl:row-span-2 min-h-0", visual: "portrait" },
  { cell: "col-span-1 row-span-1 md:col-span-2 md:row-span-1 xl:col-span-3 xl:row-span-1 min-h-0", visual: "landscape" },
  { cell: "col-span-2 row-span-1 md:col-span-6 md:row-span-1 xl:col-span-8 xl:row-span-1 min-h-0", visual: "wide" },
  { cell: "col-span-1 row-span-1 md:col-span-2 md:row-span-1 xl:col-span-4 xl:row-span-1 min-h-0", visual: "landscape" },
  { cell: "col-span-1 row-span-2 md:col-span-2 md:row-span-2 xl:col-span-4 xl:row-span-2 min-h-0", visual: "portrait" },
  { cell: "col-span-1 row-span-1 md:col-span-2 md:row-span-1 xl:col-span-4 xl:row-span-1 min-h-0", visual: "landscape" },
  { cell: "col-span-2 row-span-1 md:col-span-4 md:row-span-1 xl:col-span-6 xl:row-span-1 min-h-0", visual: "wide" },
  { cell: "col-span-1 row-span-2 md:col-span-2 md:row-span-2 xl:col-span-2 xl:row-span-2 min-h-0", visual: "portrait" },
  { cell: "col-span-1 row-span-1 md:col-span-2 md:row-span-1 xl:col-span-4 xl:row-span-1 min-h-0", visual: "landscape" },
  { cell: "col-span-1 row-span-2 md:col-span-2 md:row-span-2 xl:col-span-3 xl:row-span-2 min-h-0", visual: "portrait" },
  { cell: "col-span-1 row-span-1 md:col-span-2 md:row-span-1 xl:col-span-5 xl:row-span-1 min-h-0", visual: "landscape" },
  { cell: "col-span-2 row-span-1 md:col-span-6 md:row-span-1 xl:col-span-7 xl:row-span-1 min-h-0", visual: "wide" },
  { cell: "col-span-1 row-span-1 md:col-span-3 md:row-span-1 xl:col-span-4 xl:row-span-1 min-h-0", visual: "landscape" },
  { cell: "col-span-1 row-span-2 md:col-span-3 md:row-span-2 xl:col-span-5 xl:row-span-2 min-h-0", visual: "portrait" },
  { cell: "col-span-1 row-span-1 md:col-span-2 md:row-span-1 xl:col-span-3 xl:row-span-1 min-h-0", visual: "landscape" },
  { cell: "col-span-2 row-span-1 md:col-span-4 md:row-span-1 xl:col-span-6 xl:row-span-1 min-h-0", visual: "wide" },
  { cell: "col-span-1 row-span-2 md:col-span-2 md:row-span-2 xl:col-span-3 xl:row-span-2 min-h-0", visual: "portrait" },
  { cell: "col-span-1 row-span-1 md:col-span-4 md:row-span-1 xl:col-span-6 xl:row-span-1 min-h-0", visual: "landscape" }
];

function frameForVisual(visual: VideoVisual): VideoFrame {
  return visual === "portrait" ? "ember" : "gold";
}

/** Optional hints from StreamVideo API (`player_layout`, dimensions). */
export type VideoLayoutHints = {
  player_layout?: string;
  source_width?: number | null;
  source_height?: number | null;
};

function resolveVisual(base: VideoVisual, hints?: VideoLayoutHints): VideoVisual {
  if (!hints) return base;
  const pl = hints.player_layout;
  if (pl === "portrait") return "portrait";
  if (pl === "landscape") return "landscape";
  if (pl === "auto" && hints.source_width && hints.source_height) {
    const h = hints.source_height;
    if (h > 0) {
      const r = hints.source_width / h;
      if (r < 0.85) return "portrait";
      if (r > 2) return "wide";
      return "landscape";
    }
  }
  return base;
}

export function getVideoGridSlot(index: number, hints?: VideoLayoutHints): VideoGridSlot {
  const { cell, visual: baseVisual } = VIDEO_GRID_LAYOUT[index % VIDEO_GRID_LAYOUT.length];
  const visual = resolveVisual(baseVisual, hints);
  return { cell, visual, frame: frameForVisual(visual) };
}
