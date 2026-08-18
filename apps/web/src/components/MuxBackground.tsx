"use client";

import React, { useEffect, useRef } from "react";

const HLS_SRC =
  "https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8";

export const MuxBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    let hlsInstance: { destroy: () => void } | null = null;

    // Use .then() (not async/await) for max Next.js compat
    import("hls.js")
      .then(({ default: Hls }) => {
        if (destroyed) return;

        // Try hls.js first (works on Chrome/Firefox/Edge and modern Safari)
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false });
          hlsInstance = hls;
          hls.loadSource(HLS_SRC);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!destroyed) {
              video.muted = true;
              video.play().catch(() => {});
            }
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) console.warn("[MuxBg] HLS error", data.type, data.details);
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // iOS Safari only fallback
          video.src = HLS_SRC;
          video.muted = true;
          video.play().catch(() => {});
        }
      })
      .catch(console.error);

    return () => {
      destroyed = true;
      hlsInstance?.destroy();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
          /* Black liquid glass: desaturate + darken, keep reflective highlights */
          filter: "saturate(0.08) brightness(0.22) contrast(1.5)",
        }}
      />
    </div>
  );
};
