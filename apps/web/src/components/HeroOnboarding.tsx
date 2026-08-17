"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Quantum Scramble Hook ────────────────────────────────────────────────────
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";

function useQuantumScramble(target: string, trigger: boolean) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>(0);
  const iter = useRef(0);

  useEffect(() => {
    if (!trigger) return;
    iter.current = 0;
    cancelAnimationFrame(raf.current);

    const animate = () => {
      iter.current += 0.6;
      setDisplay(
        target
          .split("")
          .map((char, i) => {
            if (char === ".") return char;
            if (i < iter.current) return char;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join("")
      );
      if (iter.current < target.length) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, trigger]);

  return display;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const WORDS = ["build.", "solve.", "create.", "prove."];

// ─── Component ────────────────────────────────────────────────────────────────
export const HeroOnboarding: React.FC = () => {
  const [wordIdx, setWordIdx] = useState(0);
  const [scrambling, setScrambling] = useState(false);

  // Cinematic phased reveal states
  const [phase, setPhase] = useState(0);

  const word = WORDS[wordIdx];
  const scrambled = useQuantumScramble(word, scrambling || phase < 2);

  // Sequential cinematic line reveal
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1300);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  // Word cycle with scramble
  useEffect(() => {
    const iv = setInterval(() => {
      setScrambling(true);
      setTimeout(() => {
        setWordIdx((p) => (p + 1) % WORDS.length);
        setScrambling(false);
      }, 380);
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden select-none px-5">

      {/* ── Ambient cognitive bloom ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 52%, rgba(255,255,255,0.030) 0%, rgba(255,255,255,0.008) 55%, transparent 100%)",
        }}
      />

      {/* ── Text block ── */}
      <div className="relative z-10 w-full max-w-3xl mx-auto text-center flex flex-col items-center gap-0">

        {/* LINE 1 — Main Headline */}
        <h1
          className="transition-all duration-700 ease-out"
          style={{
            fontFamily: "'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 9vw, 5rem)",
            lineHeight: 1.07,
            letterSpacing: "-0.04em",
            color: "#ffffff",
            marginBottom: "clamp(18px, 3vw, 28px)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0px)" : "translateY(28px)",
          }}
        >
          Built for thinkers,<br />
          <span style={{ color: "#e4e4e7" }}>not just prompts.</span>
        </h1>

        {/* LINE 2 — Morphing intelligence line */}
        <p
          className="transition-all duration-700 ease-out"
          style={{
            fontFamily: "'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif",
            fontWeight: 500,
            fontSize: "clamp(1.15rem, 4vw, 1.85rem)",
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
            color: "#9ca3af",
            marginBottom: "clamp(16px, 2.5vw, 24px)",
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0px)" : "translateY(22px)",
          }}
        >
          A better mind for everything you{" "}
          <span className="relative inline-block">
            {/* Scramble word */}
            <span
              style={{
                fontWeight: 700,
                color: "#ffffff",
                fontFamily: "monospace",
                letterSpacing: "0.01em",
                transition: scrambling ? "none" : "opacity 0.2s",
              }}
            >
              {scrambled}
            </span>

            {/* x.ai-style spectrum underline */}
            <span
              className="absolute left-0 right-0 bottom-0 rounded-full transition-all duration-500"
              style={{
                height: "2px",
                background:
                  "linear-gradient(90deg, #6366f1 0%, #8b5cf6 35%, #d946ef 65%, #f43f5e 100%)",
                opacity: phase >= 2 ? 0.85 : 0,
                transform: phase >= 2 ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
              }}
            />
          </span>
        </p>

        {/* LINE 3 — Final punch */}
        <p
          className="transition-all duration-700 ease-out"
          style={{
            fontFamily: "'SF Pro Text', 'Inter', system-ui, -apple-system, sans-serif",
            fontWeight: 400,
            fontSize: "clamp(0.85rem, 2.8vw, 1.05rem)",
            lineHeight: 1.7,
            letterSpacing: "0.005em",
            color: "#52525b",
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? "translateY(0px)" : "translateY(16px)",
          }}
        >
          AI that doesn&apos;t just answer.&nbsp;
          <span style={{ color: "#71717a" }}>It actually thinks.</span>
        </p>
      </div>
    </section>
  );
};
