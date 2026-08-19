"use client";

import React from "react";

interface HeroProps {
  videoSrc: string;
}

export const Hero: React.FC<HeroProps> = ({ videoSrc }) => {
  return (
    <section className="relative w-full min-h-screen bg-black overflow-hidden flex items-center justify-center">
      
      {/* Centered humanoid video, behind everything */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={videoSrc}
          className="h-full max-h-[90vh] w-auto object-contain opacity-90"
        />
      </div>

      {/* Dark gradient overlay for text legibility, sits above video, below text */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/20 to-black/70 pointer-events-none" />

      {/* Text, on top of everything */}
      <div className="relative z-20 flex flex-col items-center text-center px-6">
        <h1 className="text-5xl md:text-6xl lg:text-[76px] font-normal tracking-tight text-white leading-[1.08] mb-8">
          Never think alone.<br />
          AI that actually <em className="italic">thinks</em>.
        </h1>
        <p className="text-lg md:text-xl text-neutral-300 max-w-2xl">
          Built for thinkers, not just prompts.
        </p>
      </div>

    </section>
  );
};
