"use client";

import React, { useEffect, useRef } from "react";

const HLS_SRC =
  "https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8";

export const MuxBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hlsInstance: import("hls.js").default | null = null;

    const init = async () => {
      // Safari native HLS
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = HLS_SRC;
        video.muted = true;
        video.play().catch(() => {});
        return;
      }
      // All other browsers via hls.js
      const Hls = (await import("hls.js")).default;
      if (!Hls.isSupported()) return;
      hlsInstance = new Hls({ enableWorker: false });
      hlsInstance.loadSource(HLS_SRC);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = true;
        video.play().catch(() => {});
      });
    };

    init();
    return () => { hlsInstance?.destroy(); };
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
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
};
