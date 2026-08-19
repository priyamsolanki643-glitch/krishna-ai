"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Globe, MessageSquare, Settings, User, Plus, Send, Zap, 
  ChevronRight, ChevronDown, Folder, CreditCard, Moon, Sun, 
  LogOut, Trash2 
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInputBar } from "../../components/ChatInputBar";
import { useTheme } from "next-themes";

const MORPH_WORDS = ["build", "solve", "debate", "decide", "create", "ship"];

export default function AppWorkspacePage() {
  const userName = "Ujjwal";
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { theme, setTheme } = useTheme();

  // Sidebar Folders State
  const [isClientWorkOpen, setIsClientWorkOpen] = useState(true);
  
  // Profile Menu State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % MORPH_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentWord = MORPH_WORDS[currentWordIndex];

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black text-black dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar - Borderless tonal shift */}
      <aside className="w-[260px] hidden md:flex flex-shrink-0 bg-zinc-50 dark:bg-[#0a0a0a] flex-col transition-colors duration-300">
        
        {/* Header - No bottom border */}
        <div className="h-14 flex items-center px-5">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity">
            <Globe className="w-5 h-5 text-black dark:text-white" />
            <span>The Council</span>
          </Link>
        </div>

        {/* New Thread Action - Pill shaped */}
        <div className="px-4 py-2">
          <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            New Consensus
          </button>
        </div>

        {/* Sidebar Navigation & Folders */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-hide">
          
          {/* Custom Folder */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1 group">
              <button 
                onClick={() => setIsClientWorkOpen(!isClientWorkOpen)}
                className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500 font-semibold hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                {isClientWorkOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Client Work
              </button>
              <button className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-black dark:hover:text-white transition-all">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <AnimatePresence>
              {isClientWorkOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-0.5 overflow-hidden"
                >
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-sm text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
                    <MessageSquare className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    <span className="truncate">Q4 Launch Strategy</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent/Ungrouped Sessions */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-2">Recent</div>
            <div className="space-y-0.5">
              <button className="w-full flex items-center gap-3 px-3 py-2 bg-black/5 dark:bg-white/10 rounded-xl text-sm font-medium text-black dark:text-white transition-colors">
                <MessageSquare className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span className="truncate">System Architecture</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-sm text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
                <MessageSquare className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <span className="truncate">Auth Flow Redesign</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Profile Dropdown */}
        <div className="relative p-3" ref={profileMenuRef}>
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-[#141414] border border-black/5 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50"
              >
                <div className="px-4 py-3 bg-zinc-50 dark:bg-white/5">
                  <div className="text-sm font-medium text-black dark:text-white truncate">{userName}</div>
                  <div className="text-xs text-zinc-500">Pro Tier</div>
                </div>
                
                <div className="py-1">
                  <Link href="/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-sm text-zinc-700 dark:text-zinc-300 transition-colors">
                    <Settings className="w-4 h-4 text-zinc-400" /> Settings
                  </Link>
                  <Link href="/pricing" className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-sm text-zinc-700 dark:text-zinc-300 transition-colors">
                    <CreditCard className="w-4 h-4 text-zinc-400" /> Pricing
                  </Link>
                  <Link href="/features" className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-sm text-zinc-700 dark:text-zinc-300 transition-colors">
                    <Zap className="w-4 h-4 text-zinc-400" /> Features
                  </Link>
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-400" /> : <Moon className="w-4 h-4 text-zinc-400" />} 
                      Toggle theme
                    </div>
                  </button>
                </div>
                
                <div className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                
                <div className="py-1">
                  <Link href="/login" className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-sm text-zinc-700 dark:text-zinc-300 transition-colors">
                    <LogOut className="w-4 h-4 text-zinc-400" /> Log out
                  </Link>
                  <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm text-red-600 dark:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center gap-3 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-900 border border-black/5 dark:border-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate text-black dark:text-zinc-200">{userName}</div>
              <div className="text-xs font-normal text-zinc-500 truncate">Pro Tier</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Workspace - Borderless & solid bg */}
      <main className="flex-1 flex flex-col bg-white dark:bg-black relative h-full min-w-0 transition-colors duration-300">
        
        {/* Topbar - Space separated, no line */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="text-sm font-medium text-black dark:text-zinc-200 flex items-center gap-2 truncate">
            System Architecture
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5">
              <Zap className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-semibold mt-0.5 whitespace-nowrap">3 Agents Active</span>
            </div>
          </div>
        </header>

        {/* Chat/Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          
          {/* Welcome/Empty State with Morph Greeting */}
          <div className="m-auto max-w-2xl text-center space-y-2 px-4">
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-['Instrument_Serif',serif] font-normal text-black dark:text-white tracking-tight leading-none mb-4">
              Hi {userName},
            </h1>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Instrument_Serif',serif] font-normal text-black dark:text-white tracking-tight flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2">
              ready to 
              <span className="relative inline-flex items-center justify-center min-w-[90px] sm:min-w-[110px] md:min-w-[130px] h-[32px] sm:h-[40px] md:h-[48px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentWord}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center font-['Instrument_Serif',serif] font-normal text-black dark:text-white text-3xl sm:text-4xl md:text-5xl"
                  >
                    {currentWord}
                  </motion.span>
                </AnimatePresence>
                
                {/* Static Animated Shimmer Underline */}
                <div className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-black/10 dark:bg-white/10 overflow-hidden rounded-full">
                  <motion.div
                    className="absolute inset-0 hidden dark:block"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-0 block dark:hidden"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  />
                </div>
              </span>
              something today?
            </h2>
          </div>

        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto flex-shrink-0">
          <ChatInputBar />
          <div className="text-center mt-3 text-xs font-normal text-zinc-500">
            The Council can make mistakes. Verify important information.
          </div>
        </div>

      </main>
    </div>
  );
}
