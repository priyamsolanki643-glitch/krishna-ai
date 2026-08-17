"use client";

import React, { useState, useEffect } from "react";

const ROTATING_WORDS = ["build.", "solve.", "create.", "prove."];

export const HeroOnboarding: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setFade(false);
      }, 300);
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 select-none">
      {/* 1. Main Headline (Large Bold Pure White) */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.035em] text-white leading-[1.12] mb-6 sm:mb-8">
        Built for thinkers, <br />
        <span className="text-[#f1f5f9]">not just prompts.</span>
      </h1>

      {/* 2. Middle Line (A better mind for everything you [morphing word]) */}
      <div className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#cbd5e1] leading-relaxed mb-5 sm:mb-6">
        <span className="inline-flex items-center justify-center gap-x-2 sm:gap-x-2.5 flex-wrap">
          <span>A better mind for everything you</span>
          <span className="relative inline-block pb-1.5 font-bold text-white">
            <span
              className={`inline-block transition-all duration-300 ease-out ${
                fade
                  ? "opacity-0 translate-y-2 blur-[2px]"
                  : "opacity-100 translate-y-0 blur-0"
              }`}
            >
              {ROTATING_WORDS[index]}
            </span>

            {/* Signature x.ai style subtle chromatic spectrum underline bar */}
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] via-[#ec4899] to-[#f59e0b] opacity-90" />
          </span>
        </span>
      </div>

      {/* 3. Bottom Line (Punchy Sub-headline) */}
      <p className="text-sm sm:text-base md:text-lg text-[#8a8d98] font-normal tracking-normal max-w-2xl leading-relaxed">
        AI that doesn’t just answer. It actually thinks.
      </p>
    </section>
  );
};
