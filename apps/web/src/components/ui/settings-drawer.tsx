"use client";

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Key, ShieldCheck, Eye, EyeOff, Check, Sparkles, ExternalLink, Trash2 } from "lucide-react";
import { GlobalStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ApiKeyHalfSheetProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
}

export const ApiKeyHalfSheet: React.FC<ApiKeyHalfSheetProps> = ({
  isOpen,
  onClose,
  theme = "dark",
}) => {
  const isLight = theme === "light";
  const [groqKey, setGroqKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showGroq, setShowGroq] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [savedBadge, setSavedBadge] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGroqKey(GlobalStore.groqKey);
      setAnthropicKey(GlobalStore.anthropicKey);
      setOpenaiKey(GlobalStore.openaiKey);
      setSavedBadge(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    GlobalStore.groqKey = groqKey.trim();
    GlobalStore.anthropicKey = anthropicKey.trim();
    GlobalStore.openaiKey = openaiKey.trim();
    setSavedBadge("Keys loaded securely into active memory");
    setTimeout(() => {
      setSavedBadge(null);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    GlobalStore.groqKey = "";
    GlobalStore.anthropicKey = "";
    GlobalStore.openaiKey = "";
    setGroqKey("");
    setAnthropicKey("");
    setOpenaiKey("");
    setSavedBadge("Active keys cleared");
    setTimeout(() => setSavedBadge(null), 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Half Screen Slide-Up Drawer */}
          <div className="fixed inset-0 z-[121] flex flex-col justify-end pointer-events-none">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={cn(
                "w-full max-h-[85vh] sm:max-h-[75vh] border-t rounded-t-[32px] p-6 sm:p-8 pointer-events-auto relative overflow-y-auto no-scrollbar shadow-[0_-25px_60px_rgba(0,0,0,0.9)] max-w-3xl mx-auto flex flex-col",
                isLight 
                  ? "bg-white border-zinc-200 text-zinc-950 shadow-2xl" 
                  : "bg-[#09090b] border-white/15 text-white"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Top Handle */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 shrink-0" />

              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
                    <Key className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-['Instrument_Serif',serif] font-normal tracking-tight">
                      Custom API Keys (BYOK)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Zero-persistence memory store. Keys are never saved to disk or database.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Status Badge */}
              <AnimatePresence>
                {savedBadge && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2"
                  >
                    <Check className="size-4 shrink-0" />
                    <span>{savedBadge}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Key Form Fields */}
              <div className="space-y-4 flex-1">
                {/* Groq Key (Primary) */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Groq API Key</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                        Primary Quorum
                      </span>
                    </div>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>Get key</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showGroq ? "text" : "password"}
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
                    >
                      {showGroq ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Optional Anthropic Key */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">Anthropic API Key (Optional)</span>
                    <span className="text-[10px] font-mono text-zinc-500">Claude Claude 3.7</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showAnthropic ? "text" : "password"}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropic(!showAnthropic)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
                    >
                      {showAnthropic ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Optional OpenAI Key */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">OpenAI API Key (Optional)</span>
                    <span className="text-[10px] font-mono text-zinc-500">GPT-4o / Reasoning</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showOpenai ? "text" : "password"}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenai(!showOpenai)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
                    >
                      {showOpenai ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Clear Keys</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-full bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-xs transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    Save to Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export * from "./council-settings-drawer";
export { CouncilSettingsDrawer as SettingsDrawer } from "./council-settings-drawer";

