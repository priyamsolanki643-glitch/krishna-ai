import React from "react";
import { motion } from "framer-motion";
import { 
  Menu, FolderGit2, Eye, Layers, Plus
} from "lucide-react";
import { ShowYourWorkMode } from "./ShowYourWorkView";

interface CouncilNavbarProps {
  onOpenSidebar: () => void;
  onOpenFileTree: () => void;
  showYourWorkMode: ShowYourWorkMode;
  onCycleShowYourWork: () => void;
  onOpenTeamSelector: () => void;
  onNewChat: () => void;
  isAutoTeam: boolean;
  selectedModelCount: number;
}

export function CouncilNavbar({
  onOpenSidebar,
  onOpenFileTree,
  showYourWorkMode,
  onCycleShowYourWork,
  onOpenTeamSelector,
  onNewChat,
  isAutoTeam,
  selectedModelCount
}: CouncilNavbarProps) {
  
  const springTransition = {
    type: "spring" as const,
    stiffness: 450,
    damping: 26
  };

  return (
    <div className="fixed top-5 inset-x-0 z-40 flex items-center justify-center pointer-events-none px-4">
      {/* ── Apple True Liquid-Glass Capsule Dock ── */}
      <nav 
        className="pointer-events-auto flex items-center gap-1 sm:gap-2 p-1.5 rounded-full backdrop-blur-2xl backdrop-saturate-[190%] border border-white/20 border-t-white/35 border-b-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.35),inset_0_-1px_1px_0_rgba(0,0,0,0.3)] transition-all duration-300"
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%), rgba(18, 18, 22, 0.52)"
        }}
      >
        
        {/* 1. Hamburger / Sidebar Drawer Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onOpenSidebar}
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white border border-transparent hover:border-white/20 hover:bg-white/[0.12] active:bg-white/[0.18] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-200 cursor-pointer"
          title="Open Council Drawer"
          aria-label="Open Council Drawer"
        >
          <Menu className="w-4 h-4" />
        </motion.button>

        {/* Translucent Divider */}
        <div className="h-4 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent mx-0.5" />

        {/* 2. File Tree / Project Shade Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onOpenFileTree}
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white border border-transparent hover:border-white/20 hover:bg-white/[0.12] active:bg-white/[0.18] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-200 cursor-pointer relative"
          title="Project File Tree & Workspace Shade"
          aria-label="Project File Tree"
        >
          <FolderGit2 className="w-4 h-4" />
        </motion.button>

        {/* 3. Show Your Work (Nested Glass Capsule within Navbar) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onCycleShowYourWork}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer relative ${
            showYourWorkMode === "council"
              ? "bg-purple-500/25 hover:bg-purple-500/35 text-purple-200 border border-purple-400/40 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_0_16px_rgba(168,85,247,0.3)] backdrop-blur-md"
              : showYourWorkMode === "status"
                ? "bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_0_16px_rgba(16,185,129,0.3)] backdrop-blur-md"
                : "text-zinc-300 hover:text-white border border-transparent hover:border-white/20 hover:bg-white/[0.12] active:bg-white/[0.18] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
          }`}
          title={`Show Your Work: ${showYourWorkMode.toUpperCase()}`}
          aria-label="Show Your Work"
        >
          <Eye className="w-4 h-4" />
          {showYourWorkMode !== "off" && (
            <span className={`absolute top-1.5 right-1.5 size-1.5 rounded-full shadow-[0_0_6px_currentColor] ${
              showYourWorkMode === "council" ? "bg-purple-300" : "bg-emerald-300"
            }`} />
          )}
        </motion.button>

        {/* 4. Team / Model Selector (Nested Glass Capsule) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onOpenTeamSelector}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer relative ${
            !isAutoTeam
              ? "bg-blue-500/25 hover:bg-blue-500/35 text-blue-200 border border-blue-400/40 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_0_16px_rgba(59,130,246,0.3)] backdrop-blur-md"
              : "text-zinc-300 hover:text-white border border-transparent hover:border-white/20 hover:bg-white/[0.12] active:bg-white/[0.18] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
          }`}
          title={isAutoTeam ? "Composition: Auto" : `Composition: Manual (${selectedModelCount} Models)`}
          aria-label="Team Model Selector"
        >
          <Layers className="w-4 h-4" />
          {!isAutoTeam && (
            <span className="absolute -top-0.5 -right-0.5 size-3.5 bg-blue-500/90 text-white rounded-full text-[8px] font-bold flex items-center justify-center border border-white/30 shadow-[0_0_8px_rgba(59,130,246,0.5)]">
              {selectedModelCount}
            </span>
          )}
        </motion.button>

        {/* Translucent Divider */}
        <div className="h-4 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent mx-0.5" />

        {/* 5. Quick New Consensus '+' Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onNewChat}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold hover:bg-zinc-100 active:scale-90 transition-all border border-white/60 shadow-[0_4px_16px_rgba(255,255,255,0.35),inset_0_1px_2px_rgba(255,255,255,0.9)] cursor-pointer"
          title="Start New Consensus"
          aria-label="New Consensus"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </motion.button>

      </nav>
    </div>
  );
}


