"use client";

import React, { useState, useEffect, useRef } from "react";

// ─── Quantum Scramble Hook ────────────────────────────────────────────────────
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
      if (iter.current < target.length) {
        raf.current = requestAnimationFrame(run);
      } else {
        setText(target);
      }
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

  // Sequential cinematic reveal
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 680);
    const t3 = setTimeout(() => setPhase(3), 1180);
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

  const lineStyle = (show: boolean): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)",
  });

  return (
    <section className="w-full min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-2xl text-left">

        {/* ── Line 1: H1 Bold White ── */}
        <h1
          className="text-[clamp(2.6rem,8.5vw,4.8rem)] font-bold text-white leading-[1.08] tracking-[-0.04em] mb-0"
          style={lineStyle(phase >= 1)}
        >
          Never think alone.
        </h1>

        {/* ── Line 2: H1 Same Size + Morph Word ── */}
        <h1
          className="text-[clamp(2.6rem,8.5vw,4.8rem)] font-bold text-white leading-[1.08] tracking-[-0.04em] mt-1"
          style={lineStyle(phase >= 2)}
        >
          Intelligence that actually{" "}
          <span className="relative inline-block">
            {/* Morph word */}
            <span
              className="font-mono font-bold bg-gradient-to-r from-white via-white to-zinc-300 bg-clip-text text-transparent"
              style={{
                transition: scrambling ? "none" : "opacity 0.2s",
                opacity: scrambling ? 0.5 : 1,
              }}
            >
              {displayed}
            </span>

            {/* Signature underline beam */}
            <span
              className="absolute left-0 right-0 rounded-full"
              style={{
                bottom: "-3px",
                height: "2px",
                background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 30%, #d946ef 65%, #f43f5e 100%)",
                opacity: phase >= 2 ? 0.9 : 0,
                transform: phase >= 2 ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
                transition: "opacity 0.6s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)",
                transitionDelay: "0.3s",
              }}
            />
          </span>
        </h1>

        {/* ── Line 3: Sub-text Muted Zinc ── */}
        <p
          className="mt-5 text-[clamp(0.82rem,2.4vw,1rem)] font-normal leading-relaxed tracking-[0.008em]"
          style={{
            color: "#A1A1AA",
            ...lineStyle(phase >= 3),
            transitionDelay: "0.05s",
          }}
        >
          Built for thinkers, not just prompts.
        </p>
      </div>
    </section>
  );
};
