"use client";

import React, { useEffect, useRef, useState } from "react";
import { ThreeBackground } from "../components/ThreeBackground";
import { HeroOnboarding } from "../components/HeroOnboarding";
import { Stage2Coding } from "../components/stages/Stage2Coding";
import { Stage3Voice } from "../components/stages/Stage3Voice";
import { Stage4Chat } from "../components/stages/Stage4Chat";
import { PaginationDots } from "../components/PaginationDots";

const TOTAL_SECTIONS = 4;

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const snapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track active snap section for pagination dots (mobile)
  useEffect(() => {
    if (!isMobile) return;
    const el = snapRef.current;
    if (!el) return;
    const onScroll = () => {
      const s = Math.round(el.scrollTop / window.innerHeight);
      setActiveSection(Math.max(0, Math.min(TOTAL_SECTIONS - 1, s)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  // ── MOBILE ───────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          overflow: "hidden",
        }}
      >
        {/* 3D Starfield */}
        <ThreeBackground isMobile={true} totalSections={TOTAL_SECTIONS} />

        {/* Snap scroll container */}
        <div
          ref={snapRef}
          className="snap-container"
          style={{ position: "relative", zIndex: 10, height: "100dvh" }}
        >
          {/* Stage 1 — Hero */}
          <section className="snap-section flex flex-col items-center justify-center">
            <HeroOnboarding isMobile={true} />
          </section>

          {/* Stage 2 — Coding */}
          <section className="snap-section flex flex-col items-center justify-center overflow-hidden">
            <Stage2Coding />
          </section>

          {/* Stage 3 — Cybernetic Voice */}
          <section className="snap-section overflow-hidden">
            <Stage3Voice />
          </section>

          {/* Stage 4 — Multi-Agent Chat */}
          <section className="snap-section flex flex-col items-center justify-center overflow-hidden">
            <Stage4Chat />
          </section>
        </div>

        {/* Pagination dots */}
        <PaginationDots total={TOTAL_SECTIONS} active={activeSection} />
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────────────────
  // 4 × 100vh = 400vh total — Three.js camera flies through as you scroll
  return (
    <div style={{ background: "#000", minHeight: `${TOTAL_SECTIONS * 100}vh` }}>
      {/* Fixed 3D tunnel — scroll drives camera Z */}
      <ThreeBackground isMobile={false} totalSections={TOTAL_SECTIONS} />

      {/* Content sections — stacked, each full-screen */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {/* Stage 1 — Hero */}
        <section
          style={{ height: "100vh" }}
          className="flex flex-col items-center justify-center"
        >
          <HeroOnboarding isMobile={false} />
        </section>

        {/* Stage 2 — Coding Terminal */}
        <section
          style={{ height: "100vh" }}
          className="flex flex-col items-center justify-center"
        >
          <Stage2Coding />
        </section>

        {/* Stage 3 — Cybernetic Voice (full-bleed, no padding) */}
        <section style={{ height: "100vh", position: "relative" }}>
          <Stage3Voice />
        </section>

        {/* Stage 4 — Multi-Agent Chat */}
        <section
          style={{ height: "100vh" }}
          className="flex flex-col items-center justify-center"
        >
          <Stage4Chat />
        </section>
      </div>
    </div>
  );
}
