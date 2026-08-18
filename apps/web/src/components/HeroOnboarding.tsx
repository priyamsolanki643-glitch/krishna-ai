"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["thinks", "solves", "builds", "proves"];

export const HeroOnboarding: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 680);
    const t3 = setTimeout(() => setPhase(3), 1200);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const currentWord = WORDS[currentWordIndex];

  const slide = (show: boolean, delay = 0): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  });

  return (
    <div
      className="flex flex-col items-center justify-center text-center w-full select-none"
      style={{ padding: "0 clamp(1.25rem, 5vw, 4rem)" }}
    >
      {/* Line 1 — light weight, ultra-tight tracking */}
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 300,
          fontSize: "clamp(2rem, 7vw, 5.5rem)",
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "#ffffff",
          margin: 0,
          ...slide(phase >= 1),
        }}
      >
        Never think alone.
      </h1>

      {/* Line 2 — "AI that actually" light + morph word heavy */}
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 300,
          fontSize: "clamp(2rem, 7vw, 5.5rem)",
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "#ffffff",
          margin: "0.15em 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.22em",
          flexWrap: "wrap" as const,
          ...slide(phase >= 2, 0.06),
        }}
      >
        <span style={{ fontWeight: 300, color: "#d4d4d8" }}>AI that actually</span>

        {/* Morph word — maximum weight contrast */}
        <span className="relative inline-block">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentWord}
              initial={{ y: 16, opacity: 0, filter: "blur(6px)" }}
              animate={{ y: 0,  opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -16,  opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "inline-block",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.05em",
              }}
            >
              {currentWord}.
            </motion.span>
          </AnimatePresence>

          {/* Shimmer underline */}
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "-2px",
              height: "2px",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, #a855f7 0%, #38bdf8 35%, #ffffff 52%, #a855f7 75%, #38bdf8 100%)",
              backgroundSize: "250% 100%",
              animation: "shimmer-beam 2.4s linear infinite",
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left center",
              transition:
                "opacity 0.5s ease 0.5s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s",
              boxShadow:
                "0 0 14px rgba(168,85,247,0.5), 0 0 5px rgba(56,189,248,0.3)",
            }}
          />
        </span>
      </h1>

      {/* Subtitle — ultra-light, wide tracking, muted */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: "clamp(0.8rem, 1.6vw, 1.05rem)",
          letterSpacing: "0.08em",
          lineHeight: 1.7,
          color: "#71717a",
          marginTop: "clamp(1.2rem, 3vw, 2rem)",
          maxWidth: "38ch",
          ...slide(phase >= 3, 0.1),
        }}
      >
        Built for thinkers, not just prompts.
      </p>
    </div>
  );
};
