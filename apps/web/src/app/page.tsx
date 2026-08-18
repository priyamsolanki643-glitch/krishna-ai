"use client";

import React, { useEffect, useRef, useState } from "react";
import { StarBackground } from "../components/StarBackground";
import { HeroOnboarding } from "../components/HeroOnboarding";
import { PaginationDots } from "../components/PaginationDots";
import { CodingIDECard } from "../components/cards/CodingIDECard";
import { VoiceCoreCard } from "../components/cards/VoiceCoreCard";
import { ReasoningCard } from "../components/cards/ReasoningCard";
import { MultiAgentCard } from "../components/cards/MultiAgentCard";
import { BentoGrid } from "../components/BentoGrid";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const snapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track active snap section on mobile via scroll position
  useEffect(() => {
    if (!isMobile) return;
    const container = snapContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const section = Math.round(container.scrollTop / window.innerHeight);
      setActiveSection(Math.max(0, Math.min(2, section)));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  // ─── MOBILE LAYOUT: CSS Snap Scroll ───────────────────────────────────────
  if (isMobile) {
    return (
      <div className="bg-black w-full max-w-full overflow-x-hidden" style={{ height: "100dvh" }}>
        <StarBackground />

        {/* Snap Scroll Container */}
        <div
          ref={snapContainerRef}
          className="snap-container relative z-10"
          style={{ height: "100dvh" }}
        >
          {/* Section 1: Hero */}
          <section className="snap-section flex flex-col items-center justify-center">
            <HeroOnboarding isMobile={true} />
          </section>

          {/* Section 2: Coding IDE + Voice Core */}
          <section className="snap-section flex flex-col items-center justify-center gap-3 px-4 py-6 overflow-y-auto">
            <div className="w-full max-w-sm">
              <CodingIDECard />
            </div>
            <div className="w-full max-w-sm">
              <VoiceCoreCard />
            </div>
          </section>

          {/* Section 3: Reasoning + MultiAgent */}
          <section className="snap-section flex flex-col items-center justify-center gap-3 px-4 py-6">
            <div className="w-full max-w-sm">
              <ReasoningCard />
            </div>
            <div className="w-full max-w-sm">
              <MultiAgentCard />
            </div>
          </section>
        </div>

        {/* Mobile Pagination Dots */}
        <PaginationDots total={3} active={activeSection} />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT: Scroll-Driven ────────────────────────────────────────
  return (
    <div className="bg-black overflow-x-hidden w-full">
      {/* 3D Warp Starfield — scroll velocity linked */}
      <StarBackground />

      {/* Content layers above starfield */}
      <div className="relative z-10">
        {/* Section 1: Hero — sticky while scrolling through 100vh */}
        <section
          className="min-h-screen flex items-center justify-center"
          style={{ minHeight: "100svh" }}
        >
          <HeroOnboarding isMobile={false} />
        </section>

        {/* Section 2: Bento Grid Showcase */}
        <section className="relative">
          <BentoGrid />
        </section>
      </div>
    </div>
  );
}
