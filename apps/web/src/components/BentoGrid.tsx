"use client";

import React from "react";
import { CodingIDECard } from "./cards/CodingIDECard";
import { VoiceCoreCard } from "./cards/VoiceCoreCard";
import { ReasoningCard } from "./cards/ReasoningCard";
import { MultiAgentCard } from "./cards/MultiAgentCard";

export const BentoGrid: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-8 sm:mb-12">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase">Core Capabilities</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      {/* Desktop 2x2 Grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        <CodingIDECard />
        <VoiceCoreCard />
        <ReasoningCard />
        <MultiAgentCard />
      </div>

      {/* Mobile: stacked (shown inside snap sections from page.tsx) */}
      <div className="md:hidden flex flex-col gap-4">
        <CodingIDECard />
        <VoiceCoreCard />
        <ReasoningCard />
        <MultiAgentCard />
      </div>
    </div>
  );
};
