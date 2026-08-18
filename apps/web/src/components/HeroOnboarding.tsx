"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["thinks", "solves", "builds", "proves"];

export const HeroOnboarding: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 400);
    const t3 = setTimeout(() => setPhase(3), 750);
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
    transform: show ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
  });

  const headingStyle: React.CSSProperties = {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: "clamp(2.2rem, 7.5vw, 5.5rem)",
    letterSpacing: "-0.02em",
    lineHeight: 1.08,
    color: "#ffffff",
    margin: 0,
    background: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.92) 60%, rgba(255,255,255,0.75) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full px-5 sm:px-8 select-none">

      {/* Line 1 */}
      <h1 style={{ ...headingStyle, ...reveal(phase >= 1) }}>
        Never think alone.
      </h1>

      {/* Line 2 */}
      <h1
        style={{
          ...headingStyle,
          marginTop: "0.1em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.2em",
          flexWrap: "wrap" as const,
          ...reveal(phase >= 2),
        }}
      >
        <span>AI that actually</span>{" "}
        <span className="relative inline-block">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentWord}
              initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
              style={{ fontStyle: "italic" }}
            >
              {currentWord}.
            </motion.span>
          </AnimatePresence>

          {/* Shimmer underline */}
          <span
            className="absolute left-0 right-0 bottom-0 rounded-full"
            style={{
              height: "2px",
              background:
                "linear-gradient(90deg, #a855f7 0%, #38bdf8 35%, #ffffff 52%, #a855f7 75%, #38bdf8 100%)",
              backgroundSize: "250% 100%",
              animation: "shimmer-beam 2.4s linear infinite",
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left center",
              transition: "opacity 0.5s ease 0.4s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s",
              boxShadow: "0 0 12px rgba(168,85,247,0.5), 0 0 4px rgba(56,189,248,0.3)",
            }}
          />
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className="mt-4 sm:mt-6 leading-relaxed max-w-xl mx-auto"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: "clamp(0.8rem, 1.6vw, 1rem)",
          letterSpacing: "0.06em",
          color: "rgba(255,255,255,0.55)",
          ...reveal(phase >= 3),
        }}
      >
        Built for thinkers, not just prompts.
      </p>
    </div>
  );
};
