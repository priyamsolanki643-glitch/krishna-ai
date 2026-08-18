"use client";

import React, { useRef, useEffect, useState } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4";

// Animated waveform bars
const BARS = [
  { h: "35%", delay: "0s" },
  { h: "65%", delay: "0.1s" },
  { h: "90%", delay: "0.05s" },
  { h: "55%", delay: "0.2s" },
  { h: "80%", delay: "0.15s" },
  { h: "45%", delay: "0.08s" },
  { h: "100%", delay: "0.25s" },
  { h: "70%", delay: "0.12s" },
  { h: "50%", delay: "0.18s" },
  { h: "85%", delay: "0.03s" },
  { h: "40%", delay: "0.22s" },
  { h: "75%", delay: "0.07s" },
];

export const Stage3Voice: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    const onResize = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Desktop: mouse X scrubs video frames
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobileRef.current) return;
    const video = videoRef.current;
    const el = containerRef.current;
    if (!video || !el || !video.duration) return;
    const rect = el.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    video.currentTime = p * video.duration;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-end overflow-hidden cursor-crosshair"
      onMouseMove={onMouseMove}
    >
      {/* ── Full-bleed video ─────────────────────────────────── */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        loop
        autoPlay
        onLoadedData={() => setIsLoaded(true)}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", opacity: isLoaded ? 0.55 : 0 }}
      />

      {/* Fallback shimmer while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0a0a0c 0%, #0f0f18 50%, #0a0a0c 100%)",
          }}
        />
      )}

      {/* ── Depth vignette overlays ──────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 30%, transparent 65%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      {/* ── Top badge ───────────────────────────────────────── */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#4ade80" }}
          />
          <span
            className="text-[11px] font-mono tracking-widest uppercase"
            style={{ color: "#a1a1aa" }}
          >
            Neural Voice Core &nbsp;·&nbsp; 24 kHz
          </span>
        </div>
      </div>

      {/* ── Center: Cybernetic ring ─────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: "220px",
              height: "220px",
              border: "1px solid rgba(99,102,241,0.25)",
              animation: "pulse-ring 3s cubic-bezier(0.16,1,0.3,1) infinite",
            }}
          />
          {/* Mid ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: "160px",
              height: "160px",
              border: "1px solid rgba(168,85,247,0.35)",
              animation: "pulse-ring 2.4s cubic-bezier(0.16,1,0.3,1) infinite 0.4s",
            }}
          />
          {/* Inner bright ring */}
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: "90px",
              height: "90px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="text-[10px] font-mono text-center leading-tight"
              style={{ color: "#6366f1" }}
            >
              LIVE
              <br />
              CORE
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom: waveform + copy ─────────────────────────── */}
      <div className="relative z-20 w-full px-6 pb-10 sm:pb-14 flex flex-col items-center gap-5">
        {/* Audio waveform visualizer */}
        <div className="flex items-end gap-[3px]" style={{ height: "48px" }}>
          {BARS.map((bar, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "3px",
                height: bar.h,
                background: `linear-gradient(to top, #6366f1, #a855f7)`,
                animation: `sound-bar ${0.7 + i * 0.08}s ease-in-out infinite alternate`,
                animationDelay: bar.delay,
                transformOrigin: "bottom",
              }}
            />
          ))}
        </div>

        {/* Text */}
        <div className="text-center">
          <h2
            className="font-bold tracking-tight leading-tight text-white text-2xl sm:text-4xl md:text-5xl"
          >
            Cybernetic Voice
          </h2>
          <p
            className="mt-2 text-sm sm:text-base font-mono"
            style={{ color: "#71717a" }}
          >
            {"Move cursor to scrub neural frames"}
          </p>
        </div>
      </div>
    </div>
  );
};
