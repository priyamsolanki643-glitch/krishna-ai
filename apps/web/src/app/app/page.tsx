"use client";

import React, { useState, useRef } from "react";
import { Sidebar } from "../../components/sidebar";
import { ChatView } from "../../components/chat-view";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

export default function AppWorkspacePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const touchStartX = useRef<number>(0);

  // Swipe Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    // Swipe Right -> Open Sidebar
    if (deltaX > 50 && touchStartX.current < 120) {
      setIsSidebarOpen(true);
    }
    // Swipe Left -> Close Sidebar
    else if (deltaX < -50) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex h-screen w-full bg-[#000000] text-white font-sans overflow-hidden relative"
    >
      {/* ── Top-Left Floating Hamburger Button (Smooth Slide with Sidebar) ── */}
      <motion.button
        type="button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        animate={{ 
          x: isSidebarOpen ? 268 : 0 
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="fixed top-5 left-5 z-50 w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white border border-white/20 border-t-white/35 backdrop-blur-2xl backdrop-saturate-[190%] shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.35)] cursor-pointer active:scale-90 transition-colors"
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%), rgba(18, 18, 22, 0.65)"
        }}
        title={isSidebarOpen ? "Close Council Drawer" : "Open Council Drawer"}
        aria-label="Toggle Council Drawer"
      >
        <Menu className="w-4 h-4" />
      </motion.button>

      {/* Dynamic Session History Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenVault={() => setIsVaultOpen(true)}
        onSignOut={() => router.push("/")}
      />

      {/* Lethal FP-Style Chat Surface with Council Morph Greeting */}
      <main 
        onClick={() => {
          if (isSidebarOpen) setIsSidebarOpen(false);
        }}
        className="flex-1 flex flex-col h-full min-w-0 bg-[#000000] relative overflow-hidden"
      >
        <ChatView
          onOpenSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenVault={() => setIsVaultOpen(true)}
        />
      </main>
    </div>
  );
}


