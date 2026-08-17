"use client";

import React, { useState, useEffect } from "react";

const WORDS = ["thinks.", "solves.", "builds.", "proves."];

export const HeroOnboarding: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [phase, setPhase] = useState(0);

  // Sequential cinematic entrance
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 620);
    const t3 = setTimeout(() => setPhase(3), 1100);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  // Smooth kinetic word cycler
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % WORDS.length);
        setIsTransitioning(false);
      }, 350); // half-cycle for exit transition
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const reveal = (show: boolean): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
  });

  const activeWord = WORDS[currentIdx];

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

        {/* Line 2 — with God-Level 3D Kinetic Stagger Flip Morph */}
        <h1
          className="font-bold text-white leading-[1.1] tracking-[-0.04em] mt-[0.08em] mb-0 whitespace-nowrap text-3xl sm:text-4xl md:text-6xl"
          style={reveal(phase >= 2)}
        >
          AI that actually{" "}
          <span className="relative inline-block pb-[0.05em] select-none" style={{ perspective: "800px" }}>
            {/* Split Character 3D Staggered Roll */}
            <span className="inline-flex font-bold tracking-tight text-white">
              {activeWord.split("").map((char, i) => (
                <span
                  key={`${currentIdx}-${i}`}
                  className="inline-block transform-gpu transition-all duration-400 ease-out"
                  style={{
                    display: "inline-block",
                    opacity: isTransitioning ? 0 : 1,
                    transform: isTransitioning
                      ? "translateY(-14px) rotateX(-75deg) scale(0.9)"
                      : "translateY(0px) rotateX(0deg) scale(1)",
                    filter: isTransitioning ? "blur(4px)" : "blur(0px)",
                    transitionDelay: `${i * 35}ms`,
                    transitionTimingFunction: isTransitioning
                      ? "cubic-bezier(0.4, 0, 1, 1)"
                      : "cubic-bezier(0.16, 1.4, 0.3, 1)",
                  }}
                >
                  {char}
                </span>
              ))}
            </span>

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
