"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";

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
    <section className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center px-4 py-12 sm:py-16 select-none">
      {/* 1. Sleek Announcement Pill (Exact x.ai style) */}
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#111215] border border-[#22242a] mb-8 sm:mb-10 cursor-pointer transition-all duration-200 hover:border-[#383a42] hover:bg-[#16181d] group">
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">
          V3.2
        </span>
        <span className="text-xs sm:text-sm text-[#9ca3af] font-medium tracking-normal group-hover:text-white transition-colors">
          Built for thinkers, not just prompts.
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[#6b7280] group-hover:text-white transition-colors" />
      </div>

      {/* 2. Main High-End Headline (Solid White, Perfect Letter Tracking) */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.035em] text-white leading-[1.08] mb-6">
        A better mind <br />
        <span className="inline-flex items-center justify-center gap-x-2 sm:gap-x-3.5 flex-wrap">
          <span>for everything you</span>
          <span className="relative inline-block pb-2">
            {/* Pure crisp white typography - No childish colors */}
            <span
              className={`inline-block font-bold text-white transition-all duration-300 ease-out ${
                fade
                  ? "opacity-0 translate-y-3 blur-[2px]"
                  : "opacity-100 translate-y-0 blur-0"
              }`}
            >
              {ROTATING_WORDS[index]}
            </span>

            {/* Signature x.ai style subtle chromatic spectrum underline bar */}
            <span className="absolute bottom-1 left-0 right-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] via-[#ec4899] to-[#f59e0b] opacity-90" />
          </span>
        </span>
      </h1>

      {/* 3. Sub-headline (Single elegant line, crisp muted gray) */}
      <p className="text-sm sm:text-base md:text-lg text-[#8a8d98] font-normal tracking-normal max-w-2xl leading-relaxed mb-9 sm:mb-11">
        AI that doesn’t just answer. It actually thinks.
      </p>

      {/* 4. Action Buttons (Exact x.ai Pill Format) */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
        <button className="w-full sm:w-auto px-7 py-3 rounded-full bg-white hover:bg-[#ededed] text-black font-semibold text-sm tracking-tight flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-white/5">
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
        </button>

        <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-transparent hover:bg-[#14161a] border border-[#272a30] hover:border-[#3f434c] text-white font-medium text-sm tracking-tight flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer">
          <span>Explore Architecture</span>
        </button>
      </div>
    </section>
  );
};
