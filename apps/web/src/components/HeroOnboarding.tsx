"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ShieldCheck, ChevronRight, Terminal, Cpu } from "lucide-react";

interface WordItem {
  text: string;
  color: string;
  gradient: string;
  underlineGrad: string;
  glow: string;
}

const MORPH_WORDS: WordItem[] = [
  {
    text: "build.",
    color: "#f59e0b",
    gradient: "from-amber-400 via-amber-300 to-yellow-200",
    underlineGrad: "from-amber-500 via-yellow-400 to-amber-600",
    glow: "rgba(245, 158, 11, 0.45)",
  },
  {
    text: "solve.",
    color: "#38bdf8",
    gradient: "from-sky-400 via-cyan-300 to-blue-300",
    underlineGrad: "from-sky-500 via-cyan-400 to-blue-600",
    glow: "rgba(56, 189, 248, 0.45)",
  },
  {
    text: "create.",
    color: "#c084fc",
    gradient: "from-purple-400 via-fuchsia-300 to-pink-300",
    underlineGrad: "from-purple-500 via-fuchsia-400 to-pink-600",
    glow: "rgba(192, 132, 252, 0.45)",
  },
  {
    text: "prove.",
    color: "#34d399",
    gradient: "from-emerald-400 via-teal-300 to-green-300",
    underlineGrad: "from-emerald-500 via-teal-400 to-emerald-600",
    glow: "rgba(52, 211, 153, 0.45)",
  },
];

export const HeroOnboarding: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % MORPH_WORDS.length);
        setIsTransitioning(false);
      }, 350); // half transition duration
    }, 2800); // cycle duration

    return () => clearInterval(interval);
  }, []);

  const currentWord = MORPH_WORDS[index];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center text-center px-4 py-8 relative z-20 select-none">
      {/* 1. Top Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl mb-6 shadow-[0_0_20px_rgba(255,255,255,0.02)] transition-all duration-300 hover:border-white/[0.18]">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span className="text-xs sm:text-sm font-medium tracking-wide text-slate-300">
          Built for thinkers, not just prompts.
        </span>
      </div>

      {/* 2. Main Hero Headline with Cinematic 3D Morphing Word */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.18] sm:leading-[1.15] mb-5">
        A better mind <br />
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2">
          <span>for everything you</span>
          <span className="relative inline-block overflow-hidden py-1 px-1">
            <span
              className={`inline-block font-extrabold bg-gradient-to-r ${currentWord.gradient} bg-clip-text text-transparent transition-all duration-500 ease-out transform ${
                isTransitioning
                  ? "opacity-0 -translate-y-6 scale-95 blur-sm"
                  : "opacity-100 translate-y-0 scale-100 blur-0"
              }`}
              style={{
                textShadow: `0 0 35px ${currentWord.glow}`,
              }}
            >
              {currentWord.text}
            </span>

            {/* Gradient underline beam that moves and glows */}
            <span
              className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r transition-all duration-500"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${currentWord.color} 50%, transparent 100%)`,
                boxShadow: `0 0 12px ${currentWord.glow}`,
                opacity: isTransitioning ? 0 : 0.9,
                transform: isTransitioning ? "scaleX(0.4)" : "scaleX(1)",
              }}
            />
          </span>
        </span>
      </h1>

      {/* 3. Punchy Sub-headline */}
      <p className="text-base sm:text-lg text-slate-400 max-w-md font-normal leading-relaxed mb-8 sm:mb-10">
        AI that doesn’t just answer.{" "}
        <span className="text-slate-200 font-medium">It actually thinks.</span>
      </p>

      {/* 4. Action Buttons (Mobile-first Thumb-friendly) */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none">
        <button className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-slate-100 text-black font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98] cursor-pointer">
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] text-slate-300 hover:text-white font-medium text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 backdrop-blur-md active:scale-[0.98] cursor-pointer">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>Explore Council</span>
        </button>
      </div>

      {/* 5. Minimal Footer Safety Indicator */}
      <div className="mt-12 flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 font-mono tracking-wider uppercase">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Adversarial Cognitive Architecture • 7 Models Ready</span>
      </div>
    </div>
  );
};
