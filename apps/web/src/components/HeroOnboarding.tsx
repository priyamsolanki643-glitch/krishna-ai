"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuthModal } from "./AuthModal";

const WORDS = ["thinks", "solves", "builds", "proves"];

export const HeroOnboarding: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 620);
    const t3 = setTimeout(() => setPhase(3), 1100);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  const currentWord = WORDS[currentWordIndex];

  const reveal = (show: boolean): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
  });

  return (
    <div className="flex flex-col items-center justify-center text-center w-full px-5 sm:px-8 select-none z-10 relative">

      {/* Subtle Diffused Backlight */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] bg-zinc-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <h1
        className="font-['Instrument_Serif',serif] font-normal text-white antialiased leading-[1.1] tracking-tight m-0 whitespace-nowrap text-5xl sm:text-7xl lg:text-8xl drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
        style={reveal(phase >= 1)}
      >
        Never think alone.
      </h1>

      <h1
        className="font-['Instrument_Serif',serif] font-normal text-white antialiased leading-[1.1] tracking-tight mt-1 mb-0 text-5xl sm:text-7xl lg:text-8xl flex items-center justify-center gap-2 sm:gap-4 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
        style={reveal(phase >= 2)}
      >
        AI that actually{" "}
        <span className="relative inline-flex flex-col items-center justify-center ml-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentWord}
              initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block italic"
            >
              {currentWord}.
            </motion.span>
          </AnimatePresence>

          {/* Refined Static Shimmer Underline (Doesn't jump or fade on word change) */}
          <div className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full overflow-hidden bg-white/20">
            <motion.div
              className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-80"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            />
          </div>
        </span>
      </h1>

      <p
        className="mt-6 sm:mt-8 font-normal leading-relaxed text-sm sm:text-lg max-w-xl mx-auto drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
        style={{ color: "#A1A1AA", ...reveal(phase >= 3), transitionDelay: "0.05s" }}
      >
        Built for thinkers, not just prompts.
      </p>

      {/* Apple-Grade Glassmorphism Action Buttons */}
      <div 
        className="mt-8 w-full flex flex-col sm:flex-row items-center justify-center gap-3.5"
        style={{ ...reveal(phase >= 3), transitionDelay: "0.1s" }}
      >
        {/* Get Started - Apple Glassmorphism Primary Pill */}
        <Link 
          href="/app"
          className="group relative flex items-center justify-between gap-3 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-[0.98] border border-white/20 hover:border-white/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all cursor-pointer w-full sm:w-auto min-w-[170px]"
        >
          <span className="text-[13px] font-medium text-white tracking-wide ml-1">
            Get Started
          </span>
          <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-sm">
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </div>
        </Link>
        
        {/* Sign Up - Apple Glassmorphism Secondary Pill */}
        <button 
          type="button"
          onClick={() => setIsAuthOpen(true)}
          className="w-full sm:w-auto min-w-[170px] px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/15 hover:border-white/30 backdrop-blur-2xl text-white font-medium text-[13px] tracking-wide transition-all cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] flex items-center justify-center"
        >
          Sign Up
        </button>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};
