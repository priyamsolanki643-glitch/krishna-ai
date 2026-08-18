"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4";

// 4-bar SVG audio visualizer
const WaveformBars = () => {
  const bars = [
    { baseH: 4,  delay: "0s",    dur: "0.9s" },
    { baseH: 10, delay: "0.15s", dur: "0.7s" },
    { baseH: 7,  delay: "0.05s", dur: "1.1s" },
    { baseH: 12, delay: "0.25s", dur: "0.8s" },
  ];

  return (
    <svg
      width="24"
      height="16"
      viewBox="0 0 24 16"
      fill="none"
      className="inline-flex items-end gap-[3px]"
    >
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={i * 6}
          y={16 - bar.baseH}
          width="3"
          height={bar.baseH}
          rx="1.5"
          fill="#a78bfa"
          style={{
            transformOrigin: `${i * 6 + 1.5}px 16px`,
            animation: `waveBar ${bar.dur} ease-in-out infinite alternate`,
            animationDelay: bar.delay,
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          0%   { transform: scaleY(0.3); opacity: 0.5; }
          100% { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>
    </svg>
  );
};

export const Stage3Voice: React.FC = () => {
  const cardRef  = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isDesktop = useRef(false);

  useEffect(() => {
    isDesktop.current = window.innerWidth >= 1024;
    const onResize = () => { isDesktop.current = window.innerWidth >= 1024; };
    window.addEventListener("resize", onResize);

    const video = videoRef.current;
    if (!video) return;

    if (!isDesktop.current) {
      // Mobile: continuous ambient autoplay
      video.autoplay = true;
      video.loop = true;
      video.play().catch(() => {});
    }

    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Desktop: card-level mouse scrubbing
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop.current) return;
    const video = videoRef.current;
    const card  = cardRef.current;
    if (!video || !card || !video.duration) return;
    const rect = card.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = progress * video.duration;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-8">
      {/* Stage label */}
      <p
        className="text-xs font-mono tracking-widest uppercase mb-5"
        style={{ color: "#52525b" }}
      >
        Voice Intelligence &nbsp;·&nbsp; Neural Core
      </p>

      {/* ── Card ─────────────────────────────────────────────── */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={onMouseMove}
        className="group relative rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-5 cursor-crosshair"
        style={{ width: "100%", maxWidth: "420px", height: "360px" }}
      >
        {/* ── Video ────────────────────────────────────────── */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <video
            ref={videoRef}
            src={VIDEO_URL}
            muted
            playsInline
            preload="auto"
            loop
            autoPlay
            onLoadedData={() => setIsLoaded(true)}
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-700 group-hover:scale-110"
            style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 0.5s ease" }}
          />
        </div>

        {/* Loading shimmer */}
        {!isLoaded && (
          <div
            className="absolute inset-0 z-0"
            style={{
              background: "linear-gradient(135deg, #0a0a0c 0%, #10101a 50%, #0a0a0c 100%)",
            }}
          />
        )}

        {/* ── Gradient vignette overlay ─────────────────────── */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.90) 0%, transparent 45%, rgba(0,0,0,0.30) 100%)",
          }}
        />

        {/* ── Top badge ─────────────────────────────────────── */}
        <div className="relative z-20 flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(24,24,27,0.80)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {/* Pulsing violet dot */}
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "#a78bfa" }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ background: "#7c3aed" }}
              />
            </span>
            <span
              className="text-[11px] font-mono"
              style={{ color: "#d4d4d8" }}
            >
              Neural Voice Core &nbsp;•&nbsp; 24kHz
            </span>
          </div>

          {/* Desktop scrub hint */}
          <span
            className="text-[10px] font-mono hidden lg:block"
            style={{ color: "#52525b" }}
          >
            ← move to scrub →
          </span>
        </div>

        {/* ── Bottom action bar ─────────────────────────────── */}
        <div className="relative z-20 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white tracking-tight mb-0.5">
              Voice Intelligence
            </p>
            <p className="text-xs" style={{ color: "#71717a" }}>
              Real-time bidirectional speech synthesis
            </p>
          </div>

          {/* Waveform + CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <WaveformBars />
            <button
              className="text-xs font-mono transition-colors hover:text-white"
              style={{ color: "#a1a1aa" }}
            >
              Explore →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
