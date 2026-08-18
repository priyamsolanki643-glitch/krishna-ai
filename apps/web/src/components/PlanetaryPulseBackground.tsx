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
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          width: "min(90vw, 750px)",
          height: "min(90vw, 750px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(168, 85, 247, 0.08) 45%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Ambient background glow halo 2 - Cyan */}
      <motion.div
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        style={{
          position: "absolute",
          width: "min(85vw, 680px)",
          height: "min(85vw, 680px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 75%)",
          filter: "blur(70px)",
        }}
      />

      {/* Floating video container with smooth organic breathing motion */}
      <motion.div
        animate={{
          y: [-6, 6, -6],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex items-center justify-center"
        style={{
          width: "clamp(340px, 75vw, 860px)",
          height: "clamp(340px, 75vw, 860px)",
        }}
      >
        {/* Iridescent Pulse Loop Video with Radial Gradient Mask */}
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          style={{
            maskImage: "radial-gradient(circle at center, black 45%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(circle at center, black 45%, transparent 75%)",
            mixBlendMode: "screen",
            opacity: 0.95,
            filter: "contrast(1.08) brightness(1.05)",
          }}
        />
      </motion.div>

      {/* Subtle vignette layer to ensure perfect seamless darkness at boundaries */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 80%, #000000 100%)",
        }}
      />
    </div>
  );
};
