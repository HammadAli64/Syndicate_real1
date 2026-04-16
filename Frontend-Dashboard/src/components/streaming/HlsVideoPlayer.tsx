"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { getAuthorizationHeader } from "@/lib/portal-api";

type Props = {
  src: string;
  className?: string;
  /**
   * Send portal JWT or DRF token on every HLS request (required for /api/streaming/videos/hls/...).
   * Native Safari HLS cannot set this header; use a Chromium-based browser for protected streams.
   */
  requireAuthHeaders?: boolean;
  onMetadata?: (size: { width: number; height: number }) => void;
};

/**
 * HLS playback with auth headers on segment requests.
 *
 * **Limits:** Browser video cannot reliably block downloads, screen capture, or force a black recording.
 * Mitigations here are UX friction + watermarking. For studio-grade restrictions use a DRM provider
 * (Widevine / FairPlay) with encrypted DASH or HLS and a license service.
 */
export default function HlsVideoPlayer({
  src,
  className,
  requireAuthHeaders = true,
  onMetadata
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    const emitMetadata = () => {
      const width = Number(video.videoWidth || 0);
      const height = Number(video.videoHeight || 0);
      if (width > 0 && height > 0) onMetadata?.({ width, height });
    };
    video.addEventListener("loadedmetadata", emitMetadata);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      if (requireAuthHeaders) {
        hls.config.xhrSetup = (xhr) => {
          const auth = getAuthorizationHeader();
          if (auth) xhr.setRequestHeader("Authorization", auth);
        };
      }
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => {
        video.removeEventListener("loadedmetadata", emitMetadata);
        hls.destroy();
      };
    }

    // No MSE: fall back to native HLS (cannot attach Authorization — protected URLs will fail).
    video.src = src;
    return () => {
      video.removeEventListener("loadedmetadata", emitMetadata);
    };
  }, [src, requireAuthHeaders, onMetadata]);

  return (
    <div className={cn("relative isolate", className)}>
      <video
        ref={videoRef}
        className="relative z-0 h-full w-full bg-black object-contain"
        controls
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
