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
    stiffness: 400,
    damping: 25
  };

  return (
    <div className="fixed top-5 inset-x-0 z-40 flex items-center justify-center pointer-events-none px-4">
      {/* ── Apple Liquid-Glass Capsule Dock ── */}
      <nav className="pointer-events-auto flex items-center gap-1 sm:gap-2 p-1.5 rounded-full bg-zinc-950/60 hover:bg-zinc-950/75 border border-white/15 hover:border-white/25 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300">
        
        {/* 1. Hamburger / Sidebar Drawer Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onOpenSidebar}
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
          title="Open Council Drawer"
          aria-label="Open Council Drawer"
        >
          <Menu className="w-4 h-4" />
        </motion.button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* 2. File Tree / Project Shade Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onOpenFileTree}
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer relative"
          title="Project File Tree & Workspace Shade"
          aria-label="Project File Tree"
        >
          <FolderGit2 className="w-4 h-4" />
        </motion.button>

        {/* 3. Show Your Work (2-Stage CoT Toggle) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onCycleShowYourWork}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
            showYourWorkMode === "council"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : showYourWorkMode === "status"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title={`Show Your Work: ${showYourWorkMode.toUpperCase()}`}
          aria-label="Show Your Work"
        >
          <Eye className="w-4 h-4" />
          {showYourWorkMode !== "off" && (
            <span className={`absolute top-1.5 right-1.5 size-1.5 rounded-full ${
              showYourWorkMode === "council" ? "bg-purple-400" : "bg-emerald-400"
            }`} />
          )}
        </motion.button>

        {/* 4. Team / Model Selector */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onOpenTeamSelector}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
            !isAutoTeam
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title={isAutoTeam ? "Composition: Auto" : `Composition: Manual (${selectedModelCount} Models)`}
          aria-label="Team Model Selector"
        >
          <Layers className="w-4 h-4" />
          {!isAutoTeam && (
            <span className="absolute -top-0.5 -right-0.5 size-3.5 bg-blue-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center border border-black">
              {selectedModelCount}
            </span>
          )}
        </motion.button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* 5. Quick New Consensus '+' Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          transition={springTransition}
          onClick={onNewChat}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold hover:bg-zinc-200 active:scale-90 transition-all shadow-sm cursor-pointer"
          title="Start New Consensus"
          aria-label="New Consensus"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </motion.button>

      </nav>
    </div>
  );
}

