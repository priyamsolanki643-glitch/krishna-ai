"use client";

import React, { useState, useEffect } from "react";

const TABS = ["engine.ts", "auth.ts", "middleware.ts"];

const CODE_LINES = [
  { type: "import", content: "import { jwt }   from '@council/crypto'" },
  { type: "import", content: "import { redis } from '@/lib/cache'" },
  { type: "import", content: "import type { RequestContext } from '@council/types'" },
  { type: "blank",  content: "" },
  { type: "keyword", content: "export async function validateToken(" },
  { type: "normal",  content: "  token: string," },
  { type: "normal",  content: "  ctx:   RequestContext" },
  { type: "normal",  content: ") {" },
  { type: "remove",  content: "  const payload = jwt.verify(token)" },
  { type: "add",     content: "  const payload = await jwt.verify(token, SECRET)" },
  { type: "add",     content: "  const revoked = await redis.get(`rv:${payload.jti}`)" },
  { type: "add",     content: "  if (revoked) throw new AuthError('Token revoked')" },
  { type: "blank",   content: "" },
  { type: "normal",  content: "  const user = await db.users" },
  { type: "remove",  content: "    .findById(payload.sub)" },
  { type: "add",     content: "    .findById(payload.sub, { cache: 'swr' })" },
  { type: "blank",   content: "" },
  { type: "remove",  content: "  return payload" },
  { type: "add",     content: "  return { ...payload, user, verified: true }" },
  { type: "normal",  content: "}" },
  { type: "blank",   content: "" },
  { type: "comment", content: "// ✦ 2 agents approved · consensus reached" },
];

const lineColor = (type: string) => {
  switch (type) {
    case "add":     return "#4ade80";
    case "remove":  return "#f87171";
    case "import":  return "#c792ea";
    case "keyword": return "#82aaff";
    case "comment": return "#4b6982";
    default:        return "#d4d4d8";
  }
};

const linePrefix = (type: string) => {
  if (type === "add")    return "+ ";
  if (type === "remove") return "- ";
  return "  ";
};

const lineBg = (type: string) => {
  if (type === "add")    return "rgba(74,222,128,0.07)";
  if (type === "remove") return "rgba(248,113,113,0.07)";
  return "transparent";
};

const lineBorder = (type: string) => {
  if (type === "add")    return "2px solid #4ade80";
  if (type === "remove") return "2px solid #f87171";
  return "2px solid transparent";
};

export const Stage2Coding: React.FC = () => {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    let n = 0;
    const iv = setInterval(() => {
      n++;
      if (n > CODE_LINES.length) {
        clearInterval(iv);
        setTimeout(() => setVisible(0), 1800);
      } else {
        setVisible(n);
      }
    }, 320);
    return () => clearInterval(iv);
  }, [visible === 0 ? 0 : undefined]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-8">
      {/* Label */}
      <p
        className="text-xs font-mono tracking-widest uppercase mb-5"
        style={{ color: "#52525b" }}
      >
        Coding Core &nbsp;·&nbsp; Build Engine Active
      </p>

      {/* Terminal Window */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: "680px",
          background: "rgba(8, 8, 10, 0.93)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(32px)",
          boxShadow:
            "0 50px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Title Bar */}
        <div
          className="flex items-center px-4 py-3 gap-3"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Traffic lights */}
          <div className="flex gap-1.5 flex-shrink-0">
            <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
          </div>

          {/* File tabs */}
          <div className="flex gap-1 overflow-x-auto flex-1">
            {TABS.map((tab, i) => (
              <div
                key={tab}
                className="px-3 py-1 rounded-md text-[11px] font-mono flex-shrink-0 transition-all"
                style={{
                  background:
                    i === 0 ? "rgba(99,102,241,0.18)" : "transparent",
                  color: i === 0 ? "#a5b4fc" : "#52525b",
                  border:
                    i === 0
                      ? "1px solid rgba(99,102,241,0.3)"
                      : "1px solid transparent",
                }}
              >
                {tab}
                {i === 0 && (
                  <span className="ml-1.5 text-[9px] text-indigo-400">●</span>
                )}
              </div>
            ))}
          </div>

          {/* Right side status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#60a5fa" }}
            />
            <span className="text-[10px] font-mono" style={{ color: "#3f3f46" }}>
              16.15%
            </span>
          </div>
        </div>

        {/* Editor area */}
        <div
          className="p-4 font-mono text-[11px] leading-[1.65] overflow-hidden"
          style={{ minHeight: "280px", maxHeight: "340px" }}
        >
          {CODE_LINES.slice(0, visible).map((line, i) => (
            <div
              key={i}
              className="flex items-stretch"
              style={{
                background: lineBg(line.type),
                borderLeft: lineBorder(line.type),
                marginLeft: "-1rem",
                paddingLeft: "1rem",
              }}
            >
              {/* Gutter number */}
              <span
                className="select-none flex-shrink-0 pr-5 text-right"
                style={{ color: "#3f3f46", width: "2.8rem" }}
              >
                {i + 1}
              </span>
              {/* Code content */}
              <span
                className="flex-1 whitespace-pre"
                style={{ color: lineColor(line.type) }}
              >
                {linePrefix(line.type)}
                {line.content}
                {/* Blinking cursor on last visible line */}
                {i === visible - 1 && (
                  <span
                    className="inline-block align-middle ml-px"
                    style={{
                      width: "2px",
                      height: "13px",
                      background: "#6366f1",
                      animation: "blink-cursor 1s step-end infinite",
                      verticalAlign: "middle",
                    }}
                  />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Status Bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            background: "rgba(99,102,241,0.1)",
            borderTop: "1px solid rgba(99,102,241,0.18)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#60a5fa" }}
              />
              <span
                className="text-[10px] font-mono"
                style={{ color: "#60a5fa" }}
              >
                Build Engine &nbsp;·&nbsp; running
              </span>
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: "#3f3f46" }}
            >
              TypeScript 5.4
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: "#3f3f46" }}>
            2 agents watching
          </span>
        </div>
      </div>
    </div>
  );
};
