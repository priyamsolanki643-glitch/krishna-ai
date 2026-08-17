"use client";

import React, { useState, useEffect, useRef } from "react";

// ─── Quantum Scramble Hook ─────────────────────────────────────────────────────
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";

function useScramble(target: string, active: boolean) {
  const [text, setText] = useState(target);
  const raf = useRef<number>(0);
  const iter = useRef(0);

  useEffect(() => {
    if (!active) { setText(target); return; }
    iter.current = 0;
    cancelAnimationFrame(raf.current);
    const run = () => {
      iter.current += 0.55;
      setText(
        target.split("").map((ch, i) => {
          if (ch === "." || ch === " ") return ch;
          if (i < iter.current) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("")
      );
      if (iter.current < target.length) raf.current = requestAnimationFrame(run);
      else setText(target);
    };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active]);

  return text;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const WORDS = ["thinks.", "solves.", "builds.", "proves."];

// ─── Component ────────────────────────────────────────────────────────────────
export const HeroOnboarding: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const [scrambling, setScrambling] = useState(false);
  const [phase, setPhase] = useState(0);

  const word = WORDS[idx];
  const displayed = useScramble(word, scrambling);

  // Cinematic sequential reveal
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 620);
    const t3 = setTimeout(() => setPhase(3), 1100);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  // Word cycling
  useEffect(() => {
    const iv = setInterval(() => {
      setScrambling(true);
      setTimeout(() => {
        setIdx(p => (p + 1) % WORDS.length);
        setScrambling(false);
      }, 380);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const reveal = (show: boolean): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
  });

  return (
    <section className="w-full min-h-screen flex items-center justify-center overflow-x-hidden px-5 sm:px-8">
      <div className="w-full max-w-3xl mx-auto text-center">

        {/* Line 1 */}
        <h1
          className="font-bold text-white leading-[1.1] tracking-[-0.04em] m-0 whitespace-nowrap text-3xl sm:text-4xl md:text-6xl"
          style={reveal(phase >= 1)}
        >
          Never think alone.
        </h1>

        {/* Line 2 — with morph word */}
        <h1
          className="font-bold text-white leading-[1.1] tracking-[-0.04em] mt-[0.08em] mb-0 whitespace-nowrap text-3xl sm:text-4xl md:text-6xl"
          style={reveal(phase >= 2)}
        >
          AI that actually{" "}
          <span className="relative inline-block pb-[0.05em]">
            {/* Scramble word */}
            <span
              className="font-mono font-bold"
              style={{
                background: "linear-gradient(90deg, #fff 60%, #a1a1aa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                transition: scrambling ? "none" : "opacity 0.15s",
                opacity: scrambling ? 0.45 : 1,
              }}
            >
              {displayed}
            </span>

            {/* Chromatic underline beam */}
            <span
              className="absolute left-0 right-0 bottom-0 rounded-full"
              style={{
                height: "2.5px",
                background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 28%, #d946ef 62%, #f43f5e 100%)",
                opacity: phase >= 2 ? 0.95 : 0,
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
