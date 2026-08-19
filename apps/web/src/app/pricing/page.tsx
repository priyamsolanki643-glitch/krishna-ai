"use client";
import React from "react";
import { Check } from "lucide-react";
import { Navbar } from "../../components/Navbar";

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-[#000000] overflow-hidden flex flex-col items-center font-sans">
      <Navbar />

      {/* Background Video Mount */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40 mix-blend-screen"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260816_125506_3a597378-ec85-4ebd-bd22-03b45508ac62.mp4"
      />
      <div className="bg-black/50 backdrop-blur-[2px] absolute inset-0 z-0" />

      {/* Giant Watermark Title */}
      <div className="text-[100px] sm:text-[160px] font-bold text-white/[0.04] select-none pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
        Pricing
      </div>

      <main className="relative z-10 w-full pt-32 pb-20 flex flex-col items-center">
        {/* Center Headline */}
        <h1 className="font-['Instrument_Serif',serif] text-4xl sm:text-5xl font-light text-white mb-12 text-center">
          Simple, transparent pricing.
        </h1>

        {/* 3 Liquid-Glass Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-[92%] mx-auto relative z-10">
          
          {/* Card 1: Starter */}
          <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/15 hover:border-white/30 rounded-[32px] p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all">
            <div>
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Starter</h3>
              <div className="text-4xl font-semibold text-white mt-2">$0</div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">Perfect for exploring our base agents.</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-start">
                  <Check className="text-zinc-300 w-4 h-4 mr-2.5 shrink-0" />
                  <span className="text-xs text-zinc-300">100 basic consensus queries/mo</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-zinc-300 w-4 h-4 mr-2.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Standard reasoning depth</span>
                </div>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-full bg-white text-black font-medium text-xs hover:bg-zinc-200 transition-colors mt-8">
              Choose Plan
            </button>
          </div>

          {/* Card 2: Architect (Center) */}
          <div className="bg-zinc-950/60 backdrop-blur-2xl border border-white/30 hover:border-white/40 rounded-[32px] p-7 flex flex-col justify-between shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all md:-translate-y-3 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black font-semibold text-[10px] tracking-widest px-3 py-1 rounded-full uppercase">
              Most Popular
            </div>
            <div>
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Architect</h3>
              <div className="text-4xl font-semibold text-white mt-2">$19<span className="text-lg text-zinc-400 font-medium">/mo</span></div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">For professional developers building complex cognitive architectures.</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-start">
                  <Check className="text-zinc-300 w-4 h-4 mr-2.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Unlimited consensus queries</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-zinc-300 w-4 h-4 mr-2.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Advanced multi-agent debate</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-zinc-300 w-4 h-4 mr-2.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Priority model access</span>
                </div>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-full bg-white text-black font-medium text-xs hover:bg-zinc-200 transition-colors mt-8">
              Choose Plan
            </button>
          </div>

          {/* Card 3: Enterprise */}
          <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/15 hover:border-white/30 rounded-[32px] p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all">
            <div>
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Enterprise</h3>
              <div className="text-4xl font-semibold text-white mt-2">$49<span className="text-lg text-zinc-400 font-medium">/mo</span></div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">Maximum processing power and dedicated infra for teams.</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-start">
                  <Check className="text-zinc-300 w-4 h-4 mr-2.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Custom agent personality tuning</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-zinc-300 w-4 h-4 mr-2.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Deterministic logic guarantees</span>
                </div>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-full bg-white/10 text-white font-medium text-xs hover:bg-white/20 transition-colors mt-8">
              Contact Sales
            </button>
          </div>

        </div>

        {/* Bottom Billing Toggle */}
        <div className="text-xs text-zinc-400 flex items-center gap-3 mt-12">
          <div className="w-10 h-5 bg-white/20 rounded-full p-[2px] cursor-pointer flex items-center transition-colors hover:bg-white/30">
            <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-5 transition-transform" />
          </div>
          Yearly (Save 20%)
        </div>
      </main>
    </div>
  );
}
