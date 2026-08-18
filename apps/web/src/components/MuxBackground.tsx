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

    import("hls.js")
      .then(({ default: Hls }) => {
        if (destroyed) return;

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
        backgroundColor: "#000000",
      }}
    >
      {/* High-contrast metallic chrome monochrome fluid background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          filter: "grayscale(100%) contrast(165%) brightness(95%)",
        }}
      />

      {/* Subtle radial vignette overlay keeping center typography crisp and 100% readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0.8) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
