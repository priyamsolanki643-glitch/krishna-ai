"use client";

import React, { useEffect, useRef } from "react";

export const HumanoidBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevX = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;

      if (prevX.current === null) {
        prevX.current = e.clientX;
        return;
      }

      const delta = e.clientX - prevX.current;
      prevX.current = e.clientX;

      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        if (!video.duration) return;
        let targetTime = video.currentTime + (delta / window.innerWidth) * 0.8 * video.duration;
        targetTime = Math.max(0, Math.min(video.duration, targetTime));
        video.currentTime = targetTime;
      });
    };

    const checkMobilePlayback = () => {
      if (window.innerWidth < 1024) {
        video.autoplay = true;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    checkMobilePlayback();
    
    if (window.innerWidth >= 1024) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    window.addEventListener("resize", checkMobilePlayback);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", checkMobilePlayback);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none w-full h-full bg-black flex justify-center items-center">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4"
        className="w-full h-full object-contain object-center opacity-85"
        style={{
          // Premium way to blend a video without alpha channel: Masking the edges!
          // This keeps the original colors 100% intact, but fades the hard edges of the video into the black background.
          WebkitMaskImage: "radial-gradient(circle at center, black 40%, transparent 85%)",
          maskImage: "radial-gradient(circle at center, black 40%, transparent 85%)",
        }}
      />
      {/* Subtle overlay so text remains readable over the un-filtered humanoid */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
    </div>
  );
};
