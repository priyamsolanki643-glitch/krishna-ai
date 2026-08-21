"use client";

import React from "react";
import { PricingSection } from "@/components/ui/pricing-section";

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col font-sans overflow-x-hidden">
      {/* Dedicated Clean Obsidian Pricing View (No Top Navbar) */}
      <main className="flex-1 w-full flex flex-col items-center justify-center">
        <PricingSection />
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} The Council. All rights reserved. Multi-agent consensus engine.
      </footer>
    </div>
  );
}
