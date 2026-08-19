"use client";
import React from "react";
import { BrainCircuit, ShieldCheck, Zap } from "lucide-react";
import { Navbar } from "../../components/Navbar";

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen bg-[#000000] overflow-hidden flex flex-col items-center font-sans">
      <Navbar />

      {/* Atmospheric Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0" />
      
      {/* Giant Watermark Title */}
      <div className="text-[100px] sm:text-[160px] font-bold text-white/[0.03] select-none pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
        Architecture
      </div>

      <main className="relative z-10 w-full pt-32 pb-20 flex flex-col items-center">
        <h1 className="font-['Instrument_Serif',serif] text-4xl sm:text-5xl font-light text-white mb-4 text-center">
          Cognitive Architecture
        </h1>
        <p className="text-sm text-zinc-400 mb-16 max-w-lg text-center leading-relaxed">
          Not just a single LLM wrapper. A team of specialized agents debating to find the objective truth.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-[92%] mx-auto">
          
          <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/10 hover:border-white/20 rounded-[32px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-3">Multi-Agent Debate</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Queries are routed through a supervisor, debated by a critic, and finalized by an architect to eliminate hallucinations.
            </p>
          </div>

          <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/10 hover:border-white/20 rounded-[32px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all md:-translate-y-2">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-3">Self-Correction</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The reviewer agent actively tries to break the primary agent's solution. Only verified, robust answers survive the pipeline.
            </p>
          </div>

          <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/10 hover:border-white/20 rounded-[32px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-3">Zero Latency UI</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Built on Next.js, Framer Motion, and Tailwind CSS. The entire application feels like a native macOS workspace.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
