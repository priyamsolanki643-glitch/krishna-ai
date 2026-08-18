"use client";

import React, { useRef, useEffect, useState } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4";

export const VoiceCoreCard: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isMobileRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    const handleResize = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop: Mouse scrub video frames
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobileRef.current) return;
    const video = videoRef.current;
    const card = cardRef.current;
    if (!video || !card || !video.duration) return;
    const rect = card.getBoundingClientRect();
    const progress = (e.clientX - rect.left) / rect.width;
    video.currentTime = progress * video.duration;
  };

  return (
    <div
      ref={cardRef}
      className="relative h-[320px] sm:h-[340px] rounded-2xl bg-black border border-white/10 overflow-hidden group shadow-2xl flex flex-col justify-between p-4 sm:p-5 cursor-crosshair"
      onMouseMove={handleMouseMove}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        loop
        autoPlay
        onLoadedData={() => setIsLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

      {/* Top badge */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white text-[10px] font-mono tracking-wide">Neural Voice Core • 24kHz</span>
        </div>
      </div>

      {/* Bottom: visualizer + label */}
      <div className="relative z-10 flex items-end justify-between">
        <div>
          <p className="text-white font-semibold text-sm sm:text-base mb-0.5">Cybernetic Voice</p>
          <p className="text-zinc-400 text-[10px] font-mono">
            {isMobileRef.current ? "Ambient auto-rotation" : "Move cursor to scrub"}
          </p>
        </div>

        {/* 4-Bar Sound Visualizer */}
        <div className="flex items-end gap-0.5 h-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-1 bg-indigo-400 rounded-full origin-bottom sound-bar-${i + 1}`}
              style={{ height: `${[60, 100, 70, 85][i]}%` }}
            />
          ))}
        </div>
      </div>

      {/* Desktop scrub hint overlay (shows on hover) */}
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="text-zinc-500 text-xs font-mono animate-pulse">Loading voice core...</div>
        </div>
      )}
    </div>
  );
};
