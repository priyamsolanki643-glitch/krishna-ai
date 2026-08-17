"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["thinks", "solves", "builds", "proves"];

export const HeroOnboarding: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [phase, setPhase] = useState(0);

  // Sequential cinematic entrance
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 620);
    const t3 = setTimeout(() => setPhase(3), 1100);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  // Word cycler
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const currentWord = WORDS[currentWordIndex];

  const reveal = (show: boolean): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
  });

  return (
    <section
      className="w-full flex items-center justify-center overflow-x-hidden px-5 sm:px-8"
      style={{ minHeight: "100svh" }}
    >
      <div className="w-full max-w-3xl mx-auto text-center">

        {/* Line 1 */}
        <h1
          className="font-bold text-white leading-[1.1] tracking-[-0.04em] m-0 whitespace-nowrap text-3xl sm:text-4xl md:text-6xl"
          style={reveal(phase >= 1)}
        >
          Never think alone.
        </h1>

        {/* Line 2 — with Framer Motion AnimatePresence Morph Word */}
        <h1
          className="font-bold text-white leading-[1.1] tracking-[-0.04em] mt-[0.08em] mb-0 whitespace-nowrap text-3xl sm:text-4xl md:text-6xl"
          style={reveal(phase >= 2)}
        >
          AI that actually{" "}
          <span className="relative inline-block pb-[0.05em]">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentWord}
                initial={{ y: 15, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -15, opacity: 0, filter: "blur(6px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} // Apple Spring Curve
                className="inline-block"
              >
                {currentWord}.
              </motion.span>
            </AnimatePresence>

            {/* Chromatic animated shimmer underline beam */}
            <span
              className="absolute left-0 right-0 bottom-0 rounded-full"
              style={{
                height: "2.5px",
                background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 20%, #ffffff 38%, #d946ef 55%, #f43f5e 75%, #6366f1 100%)",
                backgroundSize: "300% 100%",
                animation: "shimmer-beam 2.2s linear infinite",
                opacity: phase >= 2 ? 1 : 0,
                transform: phase >= 2 ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left center",
                transition: "opacity 0.5s ease 0.4s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s",
              }}
            />
          </span>
        </h1>

        {/* Line 3 — sub-text */}
        <p
          className="mt-5 sm:mt-6 font-normal leading-relaxed tracking-[0.005em] text-sm sm:text-base"
          style={{
            color: "#A1A1AA",
            ...reveal(phase >= 3),
            transitionDelay: "0.05s",
          }}
        >
          Built for thinkers, not just prompts.
        </p>
      </div>
    </section>
  );
};
