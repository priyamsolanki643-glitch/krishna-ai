import React from "react";
import { motion } from "framer-motion";
import { 
  Menu, FolderTree, Workflow, LayoutGrid, Plus, Eye, Sparkles, Brain, Check
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
    <header className="absolute top-0 inset-x-0 h-14 z-30 flex items-center justify-between px-3 sm:px-6 pointer-events-none">
      
      {/* ── Left: Slim Icon-Only Bar ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        
        {/* 0. Hamburger / Sidebar Drawer Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={springTransition}
          onClick={onOpenSidebar}
          className="size-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
          title="Open Council Drawer"
          aria-label="Open Council Drawer"
        >
          <Menu className="size-4" />
        </motion.button>

        <div className="w-[1px] h-4 bg-white/10 my-auto" />

        {/* 1. File Tree / Folders Icon (Top-Down Slide Panel) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={springTransition}
          onClick={onOpenFileTree}
          className="size-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer relative"
          title="Project File Tree & Artifacts"
          aria-label="Project File Tree"
        >
          <FolderTree className="size-4" />
        </motion.button>

        {/* 2. Show Your Work Toggle Icon (2-Tap Escalation) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={springTransition}
          onClick={onCycleShowYourWork}
          className={`size-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
            showYourWorkMode === "council" 
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
              : showYourWorkMode === "status"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/15"
          }`}
          title={`Show Your Work: ${showYourWorkMode.toUpperCase()} (Click to toggle)`}
          aria-label="Show Your Work"
        >
          <Workflow className="size-4" />
          {/* Status Dot */}
          {showYourWorkMode !== "off" && (
            <span className={`absolute top-1 right-1 size-1.5 rounded-full ${
              showYourWorkMode === "council" ? "bg-purple-400" : "bg-emerald-400"
            }`} />
          )}
        </motion.button>

        {/* 3. Team / Model Selector Icon (Stacked Grid Layout) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={springTransition}
          onClick={onOpenTeamSelector}
          className={`size-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
            !isAutoTeam
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.35)]"
              : "text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/15"
          }`}
          title={isAutoTeam ? "Council Composition: Auto" : `Council Composition: Manual (${selectedModelCount} Models)`}
          aria-label="Council Model Selector"
        >
          <LayoutGrid className="size-4" />
          {!isAutoTeam && (
            <span className="absolute -top-1 -right-1 size-4 bg-blue-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-black">
              {selectedModelCount}
            </span>
          )}
        </motion.button>

        {/* 4. "+" New Chat Icon (One-Thumb Reach) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={springTransition}
          onClick={onNewChat}
          className="size-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
          title="Start New Consensus Chat"
          aria-label="New Chat"
        >
          <Plus className="size-4" />
        </motion.button>

      </div>

      {/* ── Right Space: Intentionally Clean & Minimal ── */}
      <div className="pointer-events-auto" />

    </header>
  );
}
