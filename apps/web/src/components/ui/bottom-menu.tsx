"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, Folder, FolderTree, User, Settings, Sun, Moon, 
  FolderPlus, MessageSquarePlus, Swords,
  SlidersHorizontal, Sparkles, LogOut,
  ArrowDownAZ, Clock, Search, ChevronRight,
  Code2, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import TreeNodeTooltip, { demoData, TreeNode } from "./tree-node-tooltip";
import { FileViewerModal } from "./file-viewer-modal";
import { FileNode } from "./file-tree";
import { SettingsDrawer } from "./settings-drawer";
import { supabase } from "@/utils/supabase/client";

// Main Navigation Config: 5 Pro Modules
// Left 1: Home/Plus (+), Left 2: Folders Search, Center 3: File Tree (FolderTree), Right 2: Theme (Sun/Moon), Right 1: Settings
const MAIN_NAV = [
  { icon: Plus, name: "home" as const, label: "Actions" },
  { icon: Folder, name: "folders" as const, label: "Search Folders" },
  { icon: FolderTree, name: "tree" as const, label: "File Tree Explorer" },
  { icon: Sun, name: "theme" as const, label: "Theme" },
  { icon: Settings, name: "settings" as const, label: "Settings" },
];

const THEME_OPTIONS = [
  { key: "dark" as const, icon: Moon, text: "Dark" },
  { key: "light" as const, icon: Sun, text: "Light" },
];

interface TopNavMenuProps {
  theme?: "dark" | "light";
  onThemeChange?: (t: "dark" | "light") => void;
  isInitialGreeting?: boolean;
  onNewChat?: () => void;
  onAddFolder?: () => void;
  onArgueModel?: () => void;
  onOpenSidebar?: () => void;
  onOpenFiles?: () => void;
  onOpenTeam?: () => void;
  className?: string;
}

export default function TopNavMenu({ 
  theme = "dark", 
  onThemeChange, 
  isInitialGreeting = true,
  onNewChat, 
  onAddFolder,
  onArgueModel,
  onOpenSidebar,
  onOpenFiles, 
  onOpenTeam, 
  className 
}: TopNavMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"default" | "home" | "folders" | "tree" | "theme">("default");
  const [isFilterSubmenuOpen, setIsFilterSubmenuOpen] = useState(false);
  const [searchFolderQuery, setSearchFolderQuery] = useState("");
  const [activeViewerFile, setActiveViewerFile] = useState<FileNode | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isLight = theme === "light";

  const sharedHover = isLight
    ? "px-3 py-2 text-[13.5px] w-full text-left rounded-[12px] transition-colors hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 flex items-center justify-between cursor-pointer"
    : "px-3 py-2 text-[13.5px] w-full text-left rounded-[12px] transition-colors hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer";



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setView("default");
        setIsFilterSubmenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSortSelect = (sort: "alpha" | "recent") => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sidebar-filter", { detail: { sort } })
      );
    }
    if (onOpenSidebar) onOpenSidebar();
    setView("default");
    setIsFilterSubmenuOpen(false);
  };

  const handleSearchFolders = (query: string) => {
    setSearchFolderQuery(query);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sidebar-filter", { detail: { query } })
      );
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenSidebar) onOpenSidebar();
    setView("default");
    setIsFilterSubmenuOpen(false);
  };

  const handleTreeNodeSelect = (node: TreeNode) => {
    if (node.type === "file") {
      // Map to FileNode for interactive modal viewing
      const fileNode: FileNode = {
        id: node.id,
        name: node.name,
        type: "file",
        fileType: "code",
        language: node.name.endsWith(".ts") || node.name.endsWith(".tsx") ? "typescript" : "javascript",
        content: `// ${node.name} - ${node.tooltip || "Component Source"}\nimport React from 'react';\n\nexport const ${node.name.replace(/\.[^/.]+$/, "")} = () => {\n  return (\n    <div className="p-4 rounded-xl border">\n      <h2 className="text-lg font-bold">${node.name}</h2>\n      <p className="text-sm text-zinc-400">${node.tooltip || "Verified Council AST node."}</p>\n    </div>\n  );\n};\n`,
      };
      setActiveViewerFile(fileNode);
      setIsFileViewerOpen(true);
      setView("default");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const content = useMemo(() => {
    switch (view) {
      case "home":
        return (
          <div className="space-y-1 min-w-[220px] p-1.5">
            {!isInitialGreeting && (
              <button 
                type="button" 
                onClick={() => { onNewChat?.(); setView("default"); }} 
                className={sharedHover}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquarePlus className={cn("w-4 h-4", isLight ? "text-zinc-600" : "text-zinc-400")} />
                  <span>New chat</span>
                </div>
              </button>
            )}

            <button 
              type="button" 
              onClick={() => { onAddFolder?.(); setView("default"); }} 
              className={sharedHover}
            >
              <div className="flex items-center gap-2.5">
                <FolderPlus className={cn("w-4 h-4", isLight ? "text-zinc-600" : "text-zinc-400")} />
                <span>Add new folder</span>
              </div>
            </button>

            {!isInitialGreeting && (
              <button 
                type="button" 
                onClick={() => { onArgueModel?.(); setView("default"); }} 
                className={sharedHover}
              >
                <div className="flex items-center gap-2.5">
                  <Swords className={cn("w-4 h-4", isLight ? "text-zinc-600" : "text-zinc-400")} />
                  <span>Argue the model</span>
                </div>
              </button>
            )}
          </div>
        );

      case "folders":
        return (
          <div className="space-y-2 min-w-[280px] p-2 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchFolderQuery}
                onChange={(e) => setSearchFolderQuery(e.target.value)}
                placeholder="Search folders & projects..."
                className={`w-full rounded-[12px] px-3 py-2 pl-9 text-xs transition-colors outline-none ${
                  isLight 
                    ? "bg-zinc-100 text-zinc-950 placeholder:text-zinc-400 border border-zinc-200 focus:border-zinc-400" 
                    : "bg-white/5 text-white placeholder:text-zinc-500 border border-white/10 focus:border-white/20"
                }`}
                autoFocus
              />
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? "text-zinc-400" : "text-zinc-500"}`} />
            </form>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterSubmenuOpen(!isFilterSubmenuOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs rounded-[10px] transition-colors cursor-pointer",
                  isLight 
                    ? "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200" 
                    : "hover:bg-white/5 text-zinc-300 hover:text-white border border-white/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className={cn("w-3.5 h-3.5", isLight ? "text-zinc-600" : "text-zinc-400")} />
                  <span>Sort & Filters</span>
                </div>
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isFilterSubmenuOpen && "rotate-90")} />
              </button>

              <AnimatePresence>
                {isFilterSubmenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "mt-1.5 rounded-[14px] p-1.5 space-y-1 border shadow-xl backdrop-blur-2xl z-30",
                      isLight ? "bg-white/95 border-zinc-200 shadow-zinc-300/40" : "bg-[#101012]/95 border-white/15 shadow-black/80"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSortSelect("alpha")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors cursor-pointer text-left ${
                        isLight ? "hover:bg-zinc-200/70 text-zinc-700 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <ArrowDownAZ className={cn("w-4 h-4", isLight ? "text-zinc-600" : "text-zinc-400")} />
                      <span>Alphabetical</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSortSelect("recent")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors cursor-pointer text-left ${
                        isLight ? "hover:bg-zinc-200/70 text-zinc-700 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <Clock className={cn("w-4 h-4", isLight ? "text-zinc-600" : "text-zinc-400")} />
                      <span>Recently Used</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      case "tree":
        return (
          <div className="space-y-2 min-w-[280px] max-w-[320px] p-2.5">
            <div className="flex items-center justify-between px-1 pb-2 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <FolderTree className={cn("w-4 h-4", isLight ? "text-zinc-700" : "text-zinc-300")} />
                <span className="font-semibold tracking-tight">Project File Tree</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isLight ? "bg-zinc-100 text-zinc-600" : "bg-white/10 text-zinc-400"}`}>
                AST V2
              </span>
            </div>

            <div className="py-1 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {demoData.map((node) => (
                <TreeNodeTooltip 
                  key={node.id} 
                  node={node} 
                  onSelect={handleTreeNodeSelect}
                  isLight={isLight}
                />
              ))}
            </div>
          </div>
        );

      case "theme":
        return (
          <div className="flex items-center justify-between gap-1.5 min-w-[220px] p-1.5">
            {THEME_OPTIONS.map(({ key, icon: Icon, text }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (onThemeChange) onThemeChange(key);
                  setView("default");
                }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                  theme === key
                    ? (isLight 
                        ? "bg-zinc-950 text-white shadow-md font-semibold" 
                        : "bg-white text-zinc-950 font-bold shadow-md")
                    : (isLight 
                        ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950" 
                        : "text-zinc-400 hover:bg-white/10 hover:text-white")
                }`}
              >
                <Icon className="w-4 h-4 transition-colors" />
                <span>{text}</span>
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  }, [view, theme, isLight, isInitialGreeting, onNewChat, onAddFolder, onArgueModel, onThemeChange, sharedHover, isFilterSubmenuOpen, searchFolderQuery]);


  return (
    <>
      <div
        ref={containerRef}
        className={cn("relative flex flex-col items-center", className)}
      >
        <div className={`flex items-center gap-1 rounded-[18px] p-1 transition-all duration-300 z-20 ${
          isLight 
            ? "bg-white/85 backdrop-blur-2xl border border-zinc-300 shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]"
            : "bg-zinc-950/80 backdrop-blur-2xl border border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.3)]"
        }`}>
          {MAIN_NAV.map(({ icon: DefaultIcon, name, label }) => {
            const Icon = name === "theme" ? (isLight ? Sun : Moon) : DefaultIcon;

            return (
              <button
                key={name}
                type="button"
                className={`p-2.5 sm:p-3 rounded-[14px] transition-all cursor-pointer ${
                  (view === name || (name === "settings" && isSettingsOpen))
                    ? (isLight ? "bg-zinc-950 text-white shadow-sm" : "bg-white/20 text-white shadow-sm")
                    : (isLight ? "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-white/10")
                }`}
                onClick={() => {
                  if (name === "settings") {
                    setIsSettingsOpen(true);
                    setView("default");
                  } else {
                    setView(view === name ? "default" : name);
                    if (view !== name) setIsFilterSubmenuOpen(false);
                  }
                }}
                title={label}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-90" />
              </button>
            );
          })}

        </div>

        <AnimatePresence mode="wait">
          {view !== "default" && (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: -10, scaleY: 0.92, scaleX: 0.96, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scaleY: 1, scaleX: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scaleY: 0.92, scaleX: 0.96, filter: "blur(8px)" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "top center" }}
              className="absolute top-[56px] sm:top-[60px] z-50 overflow-hidden"
            >
              <div className={`rounded-[18px] transition-colors duration-300 ${
                isLight
                  ? "bg-white/95 backdrop-blur-2xl border border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)]"
                  : "bg-zinc-950/95 backdrop-blur-2xl border border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.2)]"
              }`}>
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <FileViewerModal
        isOpen={isFileViewerOpen}
        onClose={() => setIsFileViewerOpen(false)}
        file={activeViewerFile}
        theme={theme}
      />

      {/* Glassmorphic Settings Slide-Over Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={onThemeChange}
        onSignOut={handleSignOut}
      />
    </>
  );
}

export { TopNavMenu as BottomMenu };
