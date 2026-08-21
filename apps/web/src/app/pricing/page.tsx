"use client";

import React from "react";
import { Navbar } from "../../components/Navbar";
import { PricingSection } from "@/components/ui/pricing-section";

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col font-sans overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Pricing Section */}
      <main className="flex-1 w-full pt-16">
        <PricingSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} The Council. All rights reserved. Raw compute, multi-agent consensus.
      </footer>
    </div>
  );
}
