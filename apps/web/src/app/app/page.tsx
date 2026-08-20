"use client";

import React, { useState } from "react";
import { Sidebar } from "../../components/sidebar";
import { ChatView } from "../../components/chat-view";
import { useRouter } from "next/navigation";

export default function AppWorkspacePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#000000] text-white font-sans overflow-hidden">
      {/* Dynamic Session History Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenVault={() => setIsVaultOpen(true)}
        onSignOut={() => router.push("/")}
      />

      {/* Lethal FP-Style Chat Surface with Council Morph Greeting */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#000000] relative overflow-hidden">
        <ChatView
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenVault={() => setIsVaultOpen(true)}
        />
      </main>
    </div>
  );
}

