"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260816_125506_3a597378-ec85-4ebd-bd22-03b45508ac62.mp4";

export const PlanetaryPulseBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden bg-black select-none"
      aria-hidden="true"
    >
      {/* Ambient background glow halo 1 - Violet */}
      <motion.div
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.35, 0.6, 0.35],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          width: "min(95vw, 850px)",
          height: "min(95vw, 850px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />

      {/* Ambient background glow halo 2 - Cyan */}
      <motion.div
        animate={{
          scale: [1.12, 0.95, 1.12],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        style={{
          position: "absolute",
          width: "min(90vw, 780px)",
          height: "min(90vw, 780px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0.06) 50%, transparent 75%)",
          filter: "blur(70px)",
        }}
      />

      {/* Floating video container with smooth organic breathing motion */}
      <motion.div
        animate={{
          y: [-8, 8, -8],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex items-center justify-center"
        style={{
          width: "min(92vw, 860px)",
          height: "min(92vw, 860px)",
        }}
      >
        {/* Iridescent Pulse Loop Video - Crystal Clear & 100% Visible */}
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full rounded-full"
          style={{
            objectFit: "cover",
            filter: "invert(1) hue-rotate(180deg) contrast(1.1) brightness(1.05)",
            opacity: 1,
          }}
        />
      </motion.div>

      {/* Subtle vignette overlay to ensure seamless darkness at viewport boundaries */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 80%, #000000 100%)",
        }}
      />
    </div>
  );
};
