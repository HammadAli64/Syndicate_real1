import { portalFetch } from "@/lib/portal-api";

export type StreamVideoPlayerLayout = "auto" | "landscape" | "portrait";

export type StreamVideoListItem = {
  id: number;
  title: string;
  description: string;
  price: string;
  thumbnail_url: string | null;
  status: string;
  /** Omitted on older API responses; treat as `"auto"`. */
  player_layout?: StreamVideoPlayerLayout;
  source_width?: number | null;
  source_height?: number | null;
  created_at: string;
};

export type StreamVideoDetail = StreamVideoListItem & {
  hls_path: string;
};

export type StreamPayload = {
  id: number;
  status: string;
  hls_url: string | null;
};

export type StreamPlaylistListItem = {
  id: number;
  title: string;
  slug: string;
  category: "business_model" | "business_psychology";
  description: string;
  price: string;
  rating: string;
  cover_image_url: string | null;
  video_count: number;
  is_published: boolean;
  is_coming_soon: boolean;
  created_at: string;
};

export type StreamPlaylistItemRow = {
  id: number;
  order: number;
  stream_video: StreamVideoListItem;
};

export type StreamPlaylistDetail = StreamPlaylistListItem & {
  items: StreamPlaylistItemRow[];
};

function errMessage(status: number, data: unknown, fallback: string): string {
  if (typeof data === "object" && data && "detail" in data) {
    return String((data as { detail?: string }).detail ?? fallback);
  }
  return fallback || `Request failed (${status}).`;
}

export async function fetchStreamVideosList(): Promise<StreamVideoListItem[]> {
  const res = await portalFetch<StreamVideoListItem[]>("/api/streaming/videos/");
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return [];
    throw new Error(errMessage(res.status, res.data, "Could not load stream catalog."));
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchStreamVideoDetail(id: number): Promise<StreamVideoDetail> {
  const res = await portalFetch<StreamVideoDetail>(`/api/streaming/videos/${id}/`);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to watch this video." : "Could not load video."
      )
    );
  }
  return res.data as StreamVideoDetail;
}

export async function fetchStreamPlaylists(): Promise<StreamPlaylistListItem[]> {
  const res = await portalFetch<StreamPlaylistListItem[]>("/api/streaming/playlists/");
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return [];
    throw new Error(errMessage(res.status, res.data, "Could not load playlists."));
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchStreamPlaylistDetail(id: number): Promise<StreamPlaylistDetail> {
  const res = await portalFetch<StreamPlaylistDetail>(`/api/streaming/playlists/${id}/`);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to open this playlist." : "Could not load playlist."
      )
    );
  }
  return res.data as StreamPlaylistDetail;
}

export async function fetchStreamVideoPlayback(id: number): Promise<StreamPayload> {
  const res = await portalFetch<StreamPayload>(`/api/streaming/videos/stream/${id}/`);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in for playback." : "Could not load playback info."
      )
    );
  }
  return res.data as StreamPayload;
}
