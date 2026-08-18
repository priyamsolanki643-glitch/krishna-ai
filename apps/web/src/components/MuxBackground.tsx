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
        backgroundColor: "#0B0D10",
      }}
    >
      {/* Matte Slate & Cool Steel Tone Ribbon */}
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
          filter: "hue-rotate(185deg) saturate(35%) brightness(88%) contrast(120%)",
        }}
      />

      {/* Soft radial fade vignette overlay into #0B0D10 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(11, 13, 16, 0.4) 50%, #0B0D10 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
