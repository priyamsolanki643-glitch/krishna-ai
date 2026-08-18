"use client";

import React, { useState, useEffect, useRef } from "react";

const CODE_SEQUENCE = [
  { type: "normal", content: "export async function validateToken(" },
  { type: "normal", content: "  token: string, ctx: RequestContext" },
  { type: "normal", content: ") {" },
  { type: "remove", content: "- const payload = jwt.verify(token);" },
  { type: "add",    content: "+ const payload = await jwt.verify(token, SECRET);" },
  { type: "add",    content: "+ const revoked = await redis.get(`rv:${token}`);" },
  { type: "add",    content: "+ if (revoked) throw new AuthError('revoked');" },
  { type: "normal", content: "  const user = await db.users" },
  { type: "remove", content: "-   .findById(payload.sub);" },
  { type: "add",    content: "+   .findById(payload.sub, { cache: true });" },
  { type: "normal", content: "  return { ...payload, user };" },
  { type: "normal", content: "}" },
];

const BADGES = [
  { label: "Audit auth middleware", status: "running" },
  { label: "Token rotation", status: "done" },
  { label: "Rate limiter patch", status: "pending" },
];

export const CodingIDECard: React.FC = () => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [cursorLine, setCursorLine] = useState(0);

  useEffect(() => {
    let line = 0;
    const iv = setInterval(() => {
      line++;
      if (line > CODE_SEQUENCE.length) {
        // Reset with delay
        setTimeout(() => { setVisibleLines(0); line = 0; }, 1200);
      } else {
        setVisibleLines(line);
        setCursorLine(line);
      }
    }, 420);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-4 sm:p-5 h-[320px] sm:h-[340px] font-mono text-xs overflow-hidden flex flex-col justify-between backdrop-blur-xl shadow-2xl">
      {/* Window Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-zinc-500 text-[10px] font-mono">projects/core/engine.ts</span>
        </div>
        <span className="text-zinc-600 text-[10px] font-mono">[running] 16.15%</span>
      </div>

      {/* Pipeline Badges */}
      <div className="flex flex-col gap-1 mb-3">
        {BADGES.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono truncate"
              style={{
                color: b.status === "running" ? "#60a5fa"
                  : b.status === "done" ? "#4ade80" : "#71717a",
              }}
            >
              │ {b.label}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0"
              style={{
                color: b.status === "running" ? "#60a5fa"
                  : b.status === "done" ? "#4ade80" : "#52525b",
                borderColor: b.status === "running" ? "rgba(96,165,250,0.3)"
                  : b.status === "done" ? "rgba(74,222,128,0.3)" : "rgba(82,82,91,0.3)",
                background: b.status === "running" ? "rgba(96,165,250,0.08)"
                  : b.status === "done" ? "rgba(74,222,128,0.08)" : "transparent",
              }}
            >
              {b.status === "running" && <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
              {b.status}
            </span>
          </div>
        ))}
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-0.5">
          {CODE_SEQUENCE.slice(0, visibleLines).map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-zinc-700 w-4 flex-shrink-0 text-right">{i + 1}</span>
              <span
                className={`${
                  line.type === "add"
                    ? "text-green-400 bg-green-950/40"
                    : line.type === "remove"
                    ? "text-red-400 bg-red-950/40"
                    : "text-zinc-300"
                } flex-1 rounded px-1`}
              >
                {line.content}
                {i === cursorLine - 1 && (
                  <span className="cursor-blink inline-block w-[5px] h-[12px] bg-indigo-400 ml-0.5 align-middle" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
        <span className="text-zinc-600 text-[10px] font-mono">Build Engine</span>
        <button className="text-[10px] text-zinc-400 hover:text-white transition-colors font-mono">
          Explore →
        </button>
      </div>
    </div>
  );
};
