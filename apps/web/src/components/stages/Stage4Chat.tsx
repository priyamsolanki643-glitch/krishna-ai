"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AgentKey = "arch" | "crit" | "sync";

const AGENTS: Record<AgentKey, { color: string; label: string; name: string }> = {
  arch: { color: "#6366f1", label: "A", name: "Architect" },
  crit: { color: "#a855f7", label: "C", name: "Critic" },
  sync: { color: "#38bdf8", label: "S", name: "Synthesizer" },
};

interface Message {
  role: "user" | AgentKey;
  content: string;
  thought?: string;
}

const CONVERSATIONS: Message[][] = [
  [
    { role: "user", content: "Why did auth latency spike at 03:14 UTC?" },
    {
      role: "arch",
      thought: "2.1s",
      content:
        "Redis TTL misconfiguration on replica node — clock drifted +847ms.",
    },
    {
      role: "crit",
      thought: "1.4s",
      content:
        "Add: token refresh rate also 3× normal at that timestamp — not just TTL alone.",
    },
    {
      role: "sync",
      thought: "0.9s",
      content:
        "Consensus ✓ — NTP drift + refresh storm. Patch: sync clocks + exponential backoff.",
    },
  ],
  [
    {
      role: "user",
      content: "Which model handles ambiguous ethical queries best?",
    },
    {
      role: "arch",
      thought: "3.4s",
      content:
        "Council-7B: 91.2% alignment on moral dilemmas vs 74.1% single-model baseline.",
    },
    {
      role: "crit",
      thought: "2.1s",
      content:
        "Caveat: n=412 only. Edge-cases in medical triage show variance > acceptable threshold.",
    },
    {
      role: "sync",
      thought: "1.2s",
      content:
        "Consensus ✓ — Council-7B primary. Human review fallback for triage class queries.",
    },
  ],
  [
    { role: "user", content: "Optimise the multi-agent consensus loop." },
    {
      role: "arch",
      thought: "1.8s",
      content:
        "Reduce threshold 0.85 → 0.78: 40% faster convergence with < 2% quality drop.",
    },
    {
      role: "crit",
      thought: "1.3s",
      content:
        "Risk: adversarial inputs could exploit lower threshold. Add adversarial probe layer.",
    },
    {
      role: "sync",
      thought: "0.7s",
      content:
        "Consensus ✓ — threshold 0.78 + adversarial probe. Deploy to staging first.",
    },
  ],
];

export const Stage4Chat: React.FC = () => {
  const [convIdx, setConvIdx] = useState(0);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    let n = 0;
    const msgs = CONVERSATIONS[convIdx];
    const iv = setInterval(() => {
      n++;
      if (n > msgs.length) {
        clearInterval(iv);
        setTimeout(() => {
          setConvIdx((p) => (p + 1) % CONVERSATIONS.length);
          setVisible(0);
        }, 2200);
      } else {
        setVisible(n);
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [convIdx]);

  const messages = CONVERSATIONS[convIdx].slice(0, visible);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-8">
      {/* Label */}
      <p
        className="text-xs font-mono tracking-widest uppercase mb-5"
        style={{ color: "#52525b" }}
      >
        Multi-Agent Reasoning &nbsp;·&nbsp; Live Session
      </p>

      {/* Chat Window */}
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: "520px",
          height: "430px",
          background: "rgba(8,8,10,0.93)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(32px)",
          boxShadow:
            "0 50px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white text-sm font-semibold tracking-tight">
              The Council
            </span>
          </div>
          <div className="flex gap-1.5">
            {(Object.entries(AGENTS) as [AgentKey, typeof AGENTS[AgentKey]][]).map(
              ([key, ag]) => (
                <div
                  key={key}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono"
                  style={{
                    color: ag.color,
                    background: `${ag.color}15`,
                    border: `1px solid ${ag.color}30`,
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: ag.color }}
                  />
                  {ag.name}
                </div>
              )
            )}
          </div>
        </div>

        {/* ── Messages ────────────────────────────────────────── */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden flex flex-col justify-end">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const agent = isUser
                ? null
                : AGENTS[msg.role as AgentKey];

              return (
                <motion.div
                  key={`${convIdx}-${i}`}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                >
                  {isUser ? (
                    /* User message — right aligned */
                    <div className="flex justify-end">
                      <div
                        className="max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed"
                        style={{
                          background: "rgba(99,102,241,0.2)",
                          border: "1px solid rgba(99,102,241,0.28)",
                          color: "#e0e0ff",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Agent message — left aligned */
                    <div className="flex items-start gap-2.5">
                      {/* Avatar */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                        style={{
                          background: `${agent!.color}18`,
                          border: `1px solid ${agent!.color}50`,
                          color: agent!.color,
                        }}
                      >
                        {agent!.label}
                      </div>

                      <div className="flex-1">
                        {/* Thought annotation */}
                        {msg.thought && (
                          <p
                            className="text-[9px] font-mono mb-1"
                            style={{ color: "#4b6982" }}
                          >
                            ✦ Thought for {msg.thought}
                          </p>
                        )}
                        {/* Bubble */}
                        <div
                          className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "#d4d4d8",
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── Input bar ───────────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="flex-1 px-3.5 py-2 rounded-xl text-xs font-mono"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#3f3f46",
            }}
          >
            Ask the Council...
          </div>
          <button
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold transition-all hover:scale-95"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#fff",
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};
