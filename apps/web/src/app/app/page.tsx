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
      {/* ── Top-Left Pure Minimalist 3 Lines (When Sidebar Closed) ── */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSidebarOpen(true);
          }}
          className="fixed top-6 left-6 z-40 text-zinc-400 hover:text-white active:scale-90 transition-transform cursor-pointer p-0 bg-transparent border-0 outline-none shadow-none flex items-center justify-center"
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


