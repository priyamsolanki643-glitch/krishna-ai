"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, Search, Bell, User, Sun, Moon, 
  PenSquare, Mic, Camera, SlidersHorizontal, Sparkles, LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Main Navigation Config
const MAIN_NAV = [
  { icon: Plus, name: "home" as const },
  { icon: Search, name: "search" as const },
  { icon: Bell, name: "notifications" as const },
  { icon: User, name: "profile" as const },
  { icon: Sun, name: "theme" as const },
];

const HOME_ITEMS = [
  { icon: PenSquare, text: "Note" },
  { icon: Mic, text: "Voice" },
  { icon: Camera, text: "Screenshot" },
];

const SEARCH_OPTIONS = [
  { icon: SlidersHorizontal, text: "Filter" },
  { icon: Sparkles, text: "Trending" },
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
  onNewChat?: () => void;
  onOpenFiles?: () => void;
  onOpenTeam?: () => void;
  className?: string;
}

export default function TopNavMenu({ 
  theme = "dark", 
  onThemeChange, 
  onNewChat, 
  onOpenFiles, 
  onOpenTeam, 
  className 
}: TopNavMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"default" | "home" | "search" | "notifications" | "profile" | "theme">("default");
  const isLight = theme === "light";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setView("default");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sharedHover = isLight
    ? "group transition-all duration-150 px-3 py-2 text-[14px] text-zinc-600 w-full text-left rounded-[12px] hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
    : "group transition-all duration-150 px-3 py-2 text-[14px] text-zinc-400 w-full text-left rounded-[12px] hover:bg-white/10 hover:text-white cursor-pointer";

  const content = useMemo(() => {
    switch (view) {
      case "default":
        return null;

      case "home":
        return (
          <div className="space-y-1 min-w-[210px] p-1.5">
            {HOME_ITEMS.map(({ icon: Icon, text }) => (
              <button
                key={text}
                onClick={() => {
                  if (onNewChat) onNewChat();
                  setView("default");
                }}
                className={`${sharedHover} flex items-center gap-3`}
              >
                <Icon className={`w-4 h-4 ${isLight ? "text-zinc-500 group-hover:text-zinc-950" : "text-zinc-400 group-hover:text-white"} transition-colors`} />
                <span className="transition-colors">{text}</span>
              </button>
            ))}
          </div>
        );

      case "search":
        return (
          <div className="space-y-2 min-w-[280px] p-2">
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? "text-zinc-400" : "text-zinc-400"}`} />
              <input
                type="text"
                placeholder="Search council..."
                autoFocus
                className={`w-full pl-9 pr-3 py-1.5 text-[13.5px] rounded-[12px] focus:outline-none focus:ring-1 ${
                  isLight 
                    ? "text-zinc-900 bg-zinc-100/90 border border-zinc-200 focus:ring-zinc-950/20 placeholder:text-zinc-400"
                    : "text-white bg-white/5 border border-white/10 focus:ring-white/30 placeholder:text-zinc-500"
                }`}
              />
            </div>
            <div className="flex gap-1.5">
              {SEARCH_OPTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  className={`${sharedHover} flex-1 flex items-center justify-center gap-1.5 ${isLight ? "bg-zinc-100 hover:bg-zinc-200/80" : "bg-white/5 hover:bg-white/10"}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isLight ? "text-zinc-500 group-hover:text-zinc-950" : "text-zinc-400 group-hover:text-white"} transition-colors`} />
                  <span className="text-xs transition-colors">{text}</span>
                </button>
              ))}
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
  }, [view, theme, isLight, onNewChat, onThemeChange, sharedHover]);

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
            onClick={() => setView(view === name ? "default" : name)}
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
