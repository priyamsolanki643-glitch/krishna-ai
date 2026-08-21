"use client";

import React, { useState, useRef } from "react";
import { Sidebar } from "../../components/sidebar";
import { ChatView } from "../../components/chat-view";
import { SpaceStarBackground } from "../../components/ui/space-star-background";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

export default function AppWorkspacePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const touchStartX = useRef<number>(0);

  const isLight = theme === "light";

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
      className={`flex h-screen w-full font-sans overflow-hidden relative transition-colors duration-300 ${
        isLight ? "bg-[#ffffff] text-zinc-950" : "bg-[#000000] text-white"
      }`}
    >
      {/* ── Top-Left Pure Minimalist 3 Lines (When Sidebar Closed) ── */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSidebarOpen(true);
          }}
          className={`fixed top-6 left-6 z-40 active:scale-90 transition-transform cursor-pointer p-0 bg-transparent border-0 outline-none shadow-none flex items-center justify-center ${
            isLight ? "text-zinc-600 hover:text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
          title="Open Sidebar"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Dynamic Session History Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        theme={theme}
        onOpenVault={() => setIsVaultOpen(true)}
        onSignOut={() => router.push("/")}
      />

      {/* Lethal FP-Style Chat Surface with Council Morph Greeting */}
      <main 
        onClick={() => {
          if (isSidebarOpen) setIsSidebarOpen(false);
        }}
        className={`flex-1 flex flex-col h-full min-w-0 relative overflow-hidden transition-colors duration-300 ${
          isLight ? "bg-[#ffffff]" : "bg-transparent"
        }`}
      >
        {!isLight && <SpaceStarBackground />}
        
        <ChatView
          theme={theme}
          onThemeChange={setTheme}
          onOpenSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenVault={() => setIsVaultOpen(true)}
        />
      </main>
    </div>
  );
}



