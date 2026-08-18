"use client";

import React, { useEffect, useRef, useState } from "react";

const AGENTS = [
  { id: "architect", label: "Architect", x: 50, y: 22, color: "#6366f1" },
  { id: "critic",    label: "Critic",    x: 18, y: 72, color: "#a855f7" },
  { id: "synth",     label: "Synthesizer", x: 82, y: 72, color: "#38bdf8" },
];

const CONNECTIONS = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 0 },
];

const ACTIVITY_LABELS = [
  "Proposing schema redesign...",
  "Critic: challenge memory limits",
  "Synthesizing final consensus...",
  "Architect: refining context window",
  "Critic: validate reasoning chain",
];

export const MultiAgentCard: React.FC = () => {
  const [activeEdge, setActiveEdge] = useState(0);
  const [activityIdx, setActivityIdx] = useState(0);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const edgeIv = setInterval(() => {
      setActiveEdge((p) => (p + 1) % CONNECTIONS.length);
    }, 1200);
    const labelIv = setInterval(() => {
      setActivityIdx((p) => (p + 1) % ACTIVITY_LABELS.length);
    }, 2000);
    const pulseIv = setInterval(() => {
      setPulse((p) => p + 1);
    }, 2400);
    return () => {
      clearInterval(edgeIv);
      clearInterval(labelIv);
      clearInterval(pulseIv);
    };
  }, []);

  return (
    <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-4 sm:p-5 h-[320px] sm:h-[340px] flex flex-col justify-between backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-zinc-400 text-[10px] font-mono tracking-widest uppercase">Multi-Agent Neural Canvas</span>
        </div>
        <span className="text-[9px] text-zinc-600 font-mono">3 agents active</span>
      </div>

      {/* Activity ticker */}
      <div className="text-[10px] text-indigo-300 font-mono mb-2 h-4 overflow-hidden">
        <div
          key={activityIdx}
          className="animate-pulse"
          style={{ animation: "fadeSlide 0.4s ease" }}
        >
          ↳ {ACTIVITY_LABELS[activityIdx]}
        </div>
      </div>

      {/* SVG Agent Canvas */}
      <div className="flex-1 relative">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Connections with animated laser dash */}
          {CONNECTIONS.map((conn, i) => {
            const from = AGENTS[conn.from];
            const to = AGENTS[conn.to];
            const isActive = i === activeEdge;
            return (
              <g key={i}>
                {/* Base dim line */}
                <line
                  x1={from.x} y1={from.y}
                  x2={to.x}   y2={to.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.8"
                />
                {/* Active animated laser */}
                {isActive && (
                  <line
                    x1={from.x} y1={from.y}
                    x2={to.x}   y2={to.y}
                    stroke={from.color}
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    style={{
                      animation: "flow-dash 0.6s linear infinite",
                      filter: `drop-shadow(0 0 2px ${from.color})`,
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* Agent nodes */}
          {AGENTS.map((agent, i) => (
            <g key={agent.id}>
              {/* Pulse ring */}
              <circle
                cx={agent.x}
                cy={agent.y}
                r={7}
                fill="none"
                stroke={agent.color}
                strokeWidth="0.6"
                opacity="0.4"
                style={{ animation: `pulse-ring ${1.8 + i * 0.4}s cubic-bezier(0.16,1,0.3,1) infinite` }}
              />
              {/* Node circle */}
              <circle
                cx={agent.x}
                cy={agent.y}
                r={5}
                fill={`${agent.color}22`}
                stroke={agent.color}
                strokeWidth="0.8"
              />
              {/* Label */}
              <text
                x={agent.x}
                y={agent.y + 11}
                textAnchor="middle"
                fontSize="4.5"
                fill="rgba(255,255,255,0.7)"
                fontFamily="monospace"
              >
                {agent.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-zinc-600 text-[10px] font-mono">Consensus: {["drafting", "challenging", "merging"][activeEdge]}</span>
        <div className="flex items-center gap-1.5">
          {AGENTS.map((a) => (
            <span
              key={a.id}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: a.color, background: `${a.color}18`, border: `1px solid ${a.color}30` }}
            >
              {a.id.slice(0, 4)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
