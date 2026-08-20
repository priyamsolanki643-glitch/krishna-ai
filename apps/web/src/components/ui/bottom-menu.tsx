"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, Folder, Bell, User, Sun, Moon, 
  FolderPlus, MessageSquarePlus, Swords,
  SlidersHorizontal, Sparkles, LogOut,
  ArrowDownAZ, Clock, Search, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Main Navigation Config
const MAIN_NAV = [
  { icon: Plus, name: "home" as const },
  { icon: Folder, name: "folders" as const },
  { icon: Bell, name: "notifications" as const },
  { icon: User, name: "profile" as const },
  { icon: Sun, name: "theme" as const },
];

const NOTIFICATION_TYPES = ["Messages", "System Alerts", "Council Insights"];

const PROFILE_LINKS = ["My Account", "Settings", "Subscription / Billing"];

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
  const [view, setView] = useState<"default" | "home" | "folders" | "notifications" | "profile" | "theme">("default");
  const [isFilterSubmenuOpen, setIsFilterSubmenuOpen] = useState(false);
  const [searchFolderQuery, setSearchFolderQuery] = useState("");
  const isLight = theme === "light";

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

  const sharedHover = isLight
    ? "group transition-all duration-150 px-3 py-2.5 text-[13.5px] text-zinc-600 w-full text-left rounded-[12px] hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer flex items-center gap-3"
    : "group transition-all duration-150 px-3 py-2.5 text-[13.5px] text-zinc-400 w-full text-left rounded-[12px] hover:bg-white/10 hover:text-white cursor-pointer flex items-center gap-3";

  const content = useMemo(() => {
    switch (view) {
      case "default":
        return null;

      case "home":
        // Condition: On Greeting screen -> only 1 option "Add new folder"
        // On Active Chat screen -> 3 options "New chat", "Add new folder", "Argue the model"
        return (
          <div className="space-y-1 min-w-[210px] p-1.5">
            {!isInitialGreeting && (
              <button
                type="button"
                onClick={() => {
                  if (onNewChat) onNewChat();
                  setView("default");
                }}
                className={sharedHover}
              >
                <MessageSquarePlus className={`w-4 h-4 ${isLight ? "text-zinc-500 group-hover:text-zinc-950" : "text-zinc-400 group-hover:text-white"} transition-colors`} />
                <span className="font-medium transition-colors">New chat</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onAddFolder) onAddFolder();
                else if (onOpenFiles) onOpenFiles();
                setView("default");
              }}
              className={sharedHover}
            >
              <FolderPlus className={`w-4 h-4 ${isLight ? "text-zinc-500 group-hover:text-zinc-950" : "text-zinc-400 group-hover:text-white"} transition-colors`} />
              <span className="font-medium transition-colors">Add new folder</span>
            </button>

            {!isInitialGreeting && (
              <button
                type="button"
                onClick={() => {
                  if (onArgueModel) onArgueModel();
                  setView("default");
                }}
                className={sharedHover}
              >
                <Swords className={`w-4 h-4 ${isLight ? "text-amber-600 group-hover:text-amber-700" : "text-amber-400 group-hover:text-amber-300"} transition-colors`} />
                <span className="font-medium transition-colors">Argue the model</span>
              </button>
            )}
          </div>
        );

      case "folders":
        return (
          <div className="space-y-2 min-w-[290px] p-2">
            {/* Search Folders Form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Folder className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? "text-zinc-400" : "text-zinc-500"}`} />
              <input
                type="text"
                placeholder="Search folders..."
                autoFocus
                value={searchFolderQuery}
                onChange={(e) => handleSearchFolders(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-[13.5px] rounded-[12px] focus:outline-none focus:ring-1 ${
                  isLight 
                    ? "text-zinc-900 bg-zinc-100/90 border border-zinc-200 focus:ring-zinc-950/20 placeholder:text-zinc-400"
                    : "text-white bg-white/5 border border-white/10 focus:ring-white/30 placeholder:text-zinc-500"
                }`}
              />
            </form>

            {/* Quick Action Pills */}
            <div className="flex flex-col gap-1">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFilterSubmenuOpen(!isFilterSubmenuOpen)}
                  className={`flex-1 flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-medium transition-all cursor-pointer ${
                    isFilterSubmenuOpen
                      ? (isLight ? "bg-zinc-200 text-zinc-950" : "bg-white/15 text-white")
                      : (isLight ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-950" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white")
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filter & Sort</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isFilterSubmenuOpen ? "rotate-90" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSortSelect("recent");
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[12px] text-xs font-medium transition-all cursor-pointer ${
                    isLight ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-950" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trending</span>
                </button>
              </div>

              {/* Filter Submenu Options: Alphabetical vs Last Active */}
              <AnimatePresence>
                {isFilterSubmenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`overflow-hidden rounded-[12px] p-1 space-y-0.5 mt-1 border ${
                      isLight ? "bg-zinc-50 border-zinc-200/80" : "bg-zinc-900/90 border-white/10"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSortSelect("alpha")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors cursor-pointer text-left ${
                        isLight ? "hover:bg-zinc-200/70 text-zinc-700 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <ArrowDownAZ className="w-4 h-4 text-purple-400" />
                      <div className="flex flex-col">
                        <span>Alphabetical (A - Z)</span>
                        <span className={`text-[10px] ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>Arrange projects alphabetically</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSortSelect("recent")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors cursor-pointer text-left ${
                        isLight ? "hover:bg-zinc-200/70 text-zinc-700 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <Clock className="w-4 h-4 text-blue-400" />
                      <div className="flex flex-col">
                        <span>Last Active / Recent</span>
                        <span className={`text-[10px] ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>Arrange by latest modified</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-1 min-w-[220px] p-1.5">
            {NOTIFICATION_TYPES.map((t) => (
              <button key={t} className={sharedHover}>
                <span className="transition-colors">{t}</span>
              </button>
            ))}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-1 min-w-[230px] p-1.5">
            {PROFILE_LINKS.map((t) => (
              <button key={t} className={sharedHover}>
                <span className="transition-colors">{t}</span>
              </button>
            ))}
            <div className={`border-t my-1 ${isLight ? "border-zinc-200" : "border-white/10"}`} />
            <button className={`px-3 py-2 text-[14px] w-full text-left rounded-[12px] transition-colors flex items-center gap-2 ${
              isLight ? "text-red-600 hover:bg-red-50 hover:text-red-700" : "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            }`}>
              <LogOut className="w-4 h-4" />
              Logout
            </button>
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
                        ? "bg-zinc-950 text-white shadow-md" 
                        : "bg-white text-zinc-950 font-bold shadow-md")
                    : (isLight 
                        ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950" 
                        : "text-zinc-400 hover:bg-white/10 hover:text-white")
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${theme === key ? (isLight ? "text-white" : "text-zinc-950") : (isLight ? "text-zinc-500" : "text-zinc-400")}`} />
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
    <div
      ref={containerRef}
      className={cn("relative flex flex-col items-center", className)}
    >
      {/* Top Floating Toolbar */}
      <div className={`flex items-center gap-1 rounded-[18px] p-1 transition-colors duration-300 z-20 ${
        isLight 
          ? "bg-white/85 backdrop-blur-2xl border border-zinc-200 shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]"
          : "bg-zinc-950/80 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)]"
      }`}>
        {MAIN_NAV.map(({ icon: Icon, name }) => (
          <button
            key={name}
            type="button"
            className={`p-2.5 sm:p-3 rounded-[14px] transition-all cursor-pointer ${
              view === name 
                ? (isLight ? "bg-zinc-950 text-white shadow-sm" : "bg-white/20 text-white shadow-sm")
                : (isLight ? "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-white/10")
            }`}
            onClick={() => {
              setView(view === name ? "default" : name);
              if (view !== name) setIsFilterSubmenuOpen(false);
            }}
            title={name.toUpperCase()}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-90" />
          </button>
        ))}
      </div>

      {/* Animated Submenu Opening DOWNWARDS (Neeche ki taraf) */}
      <AnimatePresence mode="wait">
        {view !== "default" && (
          <motion.div
            key={view}
            initial={{
              opacity: 0,
              y: -10,
              scaleY: 0.92,
              scaleX: 0.96,
              filter: "blur(6px)"
            }}
            animate={{
              opacity: 1,
              y: 0,
              scaleY: 1,
              scaleX: 1,
              filter: "blur(0px)"
            }}
            exit={{
              opacity: 0,
              y: -8,
              scaleY: 0.92,
              scaleX: 0.96,
              filter: "blur(8px)"
            }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              transformOrigin: "top center",
            }}
            className="absolute top-[56px] sm:top-[60px] z-50 overflow-hidden"
          >
            <div className={`rounded-[18px] transition-colors duration-300 ${
              isLight
                ? "bg-white/95 backdrop-blur-2xl border border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)]"
                : "bg-zinc-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.15)]"
            }`}>
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { TopNavMenu as BottomMenu };
