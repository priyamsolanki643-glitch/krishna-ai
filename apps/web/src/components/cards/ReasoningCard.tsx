"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REASONING_STEPS = [
  {
    query: "Why did auth latency spike at 03:14 UTC?",
    thought: "Cross-referencing token revocation logs with Redis TTL drift...",
    duration: "2.1s",
    answer: "Redis TTL misconfiguration caused cascade delay in token validation pipeline. Recommended: synchronise clock drift across nodes.",
  },
  {
    query: "Optimize the multi-agent consensus loop?",
    thought: "Analyzing vote convergence patterns across Architect + Critic models...",
    duration: "3.4s",
    answer: "Reduce consensus threshold from 0.85 → 0.78 for 40% faster convergence with <2% quality degradation.",
  },
  {
    query: "Which model handles ambiguous ethical queries best?",
    thought: "Benchmarking reasoning chains across 7 models on edge-case moral dilemmas...",
    duration: "1.8s",
    answer: "Council-7B outperforms on nuanced ethical scenarios with 91.2% alignment to human preference scores.",
  },
];

export const ReasoningCard: React.FC = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<"query" | "thinking" | "answer">("query");

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    let t4: ReturnType<typeof setTimeout>;

    const cycle = () => {
      setPhase("query");
      t1 = setTimeout(() => setPhase("thinking"), 1200);
      t2 = setTimeout(() => setPhase("answer"), 3000);
      t3 = setTimeout(() => {
        setStepIdx((p) => (p + 1) % REASONING_STEPS.length);
        cycle();
      }, 5400);
    };

    t4 = setTimeout(cycle, 400);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const step = REASONING_STEPS[stepIdx];

  return (
    <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-4 sm:p-5 h-[320px] sm:h-[340px] flex flex-col justify-between backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-zinc-400 text-[10px] font-mono tracking-widest uppercase">Reasoning Engine • Deep Think</span>
      </div>

      {/* Query bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`query-${stepIdx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-2"
        >
          <p className="text-white text-xs leading-relaxed">{step.query}</p>
        </motion.div>
      </AnimatePresence>

      {/* Thinking step */}
      <AnimatePresence>
        {(phase === "thinking" || phase === "answer") && (
          <motion.div
            key={`thought-${stepIdx}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 px-1 mb-2">
              <span className="text-indigo-400 text-[10px] mt-0.5">✦</span>
              <div>
                <span className="text-indigo-400 text-[10px] font-mono">Thought for {step.duration}</span>
                <p className="text-zinc-500 text-[10px] leading-relaxed mt-0.5">{step.thought}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer bubble */}
      <AnimatePresence>
        {phase === "answer" && (
          <motion.div
            key={`answer-${stepIdx}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 bg-indigo-950/40 border border-indigo-500/20 rounded-xl px-3 py-2"
          >
            <p className="text-zinc-200 text-[11px] leading-relaxed">{step.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
        <span className="text-zinc-600 text-[10px] font-mono">Council Intelligence Core</span>
        <div className="flex gap-1">
          {REASONING_STEPS.map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{ background: i === stepIdx ? "#6366f1" : "#3f3f46" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
