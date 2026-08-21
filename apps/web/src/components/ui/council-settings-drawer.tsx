"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Cpu, 
  Key, 
  FolderArchive, 
  User, 
  Sliders, 
  X, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Download, 
  Trash2, 
  AlertTriangle, 
  LogOut, 
  CreditCard,
  Check,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export type SettingsTab = "general" | "credentials" | "workspace" | "profile";

interface CouncilSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
  onThemeChange?: (theme: "dark" | "light") => void;
  onSignOut?: () => void;
  defaultTab?: SettingsTab;
}

const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "General & Engine", icon: Cpu },
  { id: "credentials", label: "Credentials & LLMs", icon: Key },
  { id: "workspace", label: "Workspace & Sync", icon: FolderArchive },
  { id: "profile", label: "Profile & Plan", icon: User },
];

export function CouncilSettingsDrawer({
  isOpen,
  onClose,
  theme = "dark",
  onThemeChange,
  onSignOut,
  defaultTab = "general",
}: CouncilSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);
  const isLight = theme === "light";
  const router = useRouter();

  // Tab 1: Deliberation Protocol State
  const [debateMode, setDebateMode] = useState<"fast" | "deep">("deep");
  const [maxRounds, setMaxRounds] = useState<number>(3);

  // Tab 2: Credentials State
  const [groqKey, setGroqKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showGroq, setShowGroq] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [groqStatus, setGroqStatus] = useState<"not_set" | "saved">("not_set");
  const [anthropicStatus, setAnthropicStatus] = useState<"not_set" | "saved">("not_set");
  const [openaiStatus, setOpenaiStatus] = useState<"not_set" | "saved">("not_set");
  const [savedBadge, setSavedBadge] = useState<string | null>(null);

  // Tab 3: Workspace State
  const [autoSaveCode, setAutoSaveCode] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Tab 4: Profile Details
  const userName = "Ujjwal";
  const userEmail = "ujjwal@omni-nexus.ai";
  const userPlan = "Pro Enterprise (Full Quorum)";

  // Load localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const g = localStorage.getItem("council_key_groq");
      const a = localStorage.getItem("council_key_anthropic");
      const o = localStorage.getItem("council_key_openai");
      if (g) { setGroqKey(g); setGroqStatus("saved"); }
      if (a) { setAnthropicKey(a); setAnthropicStatus("saved"); }
      if (o) { setOpenaiKey(o); setOpenaiStatus("saved"); }

      const mode = localStorage.getItem("council_debate_mode");
      if (mode === "fast" || mode === "deep") setDebateMode(mode);

      const rounds = localStorage.getItem("council_max_rounds");
      if (rounds) setMaxRounds(Number(rounds));

      const autoSave = localStorage.getItem("council_autosave_code");
      if (autoSave !== null) setAutoSaveCode(autoSave === "true");
    }
  }, []);

  const handleSaveKey = (provider: "groq" | "anthropic" | "openai", val: string) => {
    if (typeof window !== "undefined") {
      if (val.trim()) {
        localStorage.setItem(`council_key_${provider}`, val.trim());
        if (provider === "groq") setGroqStatus("saved");
        if (provider === "anthropic") setAnthropicStatus("saved");
        if (provider === "openai") setOpenaiStatus("saved");
      } else {
        localStorage.removeItem(`council_key_${provider}`);
        if (provider === "groq") setGroqStatus("not_set");
        if (provider === "anthropic") setAnthropicStatus("not_set");
        if (provider === "openai") setOpenaiStatus("not_set");
      }
      setSavedBadge(provider);
      setTimeout(() => setSavedBadge(null), 2000);
    }
  };

  const handleDebateModeChange = (mode: "fast" | "deep") => {
    setDebateMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("council_debate_mode", mode);
    }
  };

  const handleRoundsChange = (val: number) => {
    setMaxRounds(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("council_max_rounds", String(val));
    }
  };

  const handleAutoSaveToggle = (val: boolean) => {
    setAutoSaveCode(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("council_autosave_code", String(val));
    }
  };

  const handleClearCache = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_COUNCIL_API_URL || "https://the-council-api-1083682147747.us-central1.run.app";
      await fetch(`${baseUrl}/api/project/proj-default/cache`, { method: "DELETE" }).catch(() => {});
      if (typeof window !== "undefined") {
        localStorage.removeItem("council_cached_files");
      }
      setCacheCleared(true);
      setIsConfirmingClear(false);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (err) {
      console.error("Failed to clear cache:", err);
      setIsConfirmingClear(false);
    }
  };

  const handleExportZip = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_COUNCIL_API_URL || "https://the-council-api-1083682147747.us-central1.run.app";
      const res = await fetch(`${baseUrl}/api/project/proj-default/export`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `council-workspace-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to export zip:", err);
      alert(`Export failed: ${err.message || "Network error"}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-auto select-none font-sans">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />

          {/* Linear / Raycast Obsidian Drawer Container */}
          <motion.div
            initial={{ x: "100%", opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className={cn(
              "relative w-full sm:max-w-[540px] h-full flex flex-col shadow-2xl border-l transition-colors duration-300 z-10 overflow-hidden",
              isLight
                ? "bg-white/95 backdrop-blur-2xl border-zinc-200 text-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.12)]"
                : "bg-zinc-950/95 backdrop-blur-2xl border-white/10 text-white shadow-[0_0_80px_rgba(0,0,0,0.95)]"
            )}
          >
            {/* Header with Title and Close Trigger */}
            <div
              className={cn(
                "flex items-center justify-between px-6 py-4.5 border-b shrink-0",
                isLight ? "bg-zinc-50/80 border-zinc-200" : "bg-[#09090b]/80 border-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                    isLight 
                      ? "bg-zinc-100 border-zinc-200 text-zinc-900" 
                      : "bg-white/5 border-white/10 text-zinc-200"
                  )}
                >
                  <Sliders className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">System Settings</h2>
                  <p className={cn("text-xs font-mono", isLight ? "text-zinc-500" : "text-zinc-400")}>
                    Deliberation protocol, models & workspace
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-2 rounded-xl transition-colors cursor-pointer border",
                  isLight 
                    ? "hover:bg-zinc-200 border-zinc-200 text-zinc-600 hover:text-zinc-950" 
                    : "hover:bg-white/10 border-white/5 text-zinc-400 hover:text-white"
                )}
                title="Close settings (Esc)"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Linear-Style Segmented Top Tab Switcher */}
            <div className={cn(
              "p-3 border-b shrink-0",
              isLight ? "bg-zinc-100/60 border-zinc-200" : "bg-black/30 border-white/10"
            )}>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        "relative flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer gap-1",
                        isActive
                          ? isLight
                            ? "bg-white text-zinc-950 shadow-sm font-semibold"
                            : "bg-white/15 text-white shadow-sm font-semibold border border-white/15"
                          : isLight
                          ? "text-zinc-500 hover:text-zinc-900"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span className="truncate max-w-full tracking-tight">{label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content Body with Smooth Spring Transitions */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs no-scrollbar space-y-6">
              <AnimatePresence mode="wait">
                
                {/* ── TAB 1: GENERAL & ENGINE ── */}
                {activeTab === "general" && (
                  <motion.div
                    key="tab-general"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Deliberation Protocol</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Configure runtime synthesis depth and multi-agent debate verification rounds.
                      </p>
                    </div>

                    {/* Consensus Rigor Segmented Control */}
                    <div className={cn(
                      "rounded-xl p-4 border space-y-3",
                      isLight ? "bg-white border-zinc-200" : "bg-white/[0.02] border-white/10"
                    )}>
                      <label className="text-xs font-medium text-zinc-300 block">Consensus Rigor</label>
                      
                      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
                        <button
                          type="button"
                          onClick={() => handleDebateModeChange("fast")}
                          className={cn(
                            "py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2",
                            debateMode === "fast"
                              ? isLight ? "bg-white text-zinc-950 shadow-sm font-semibold" : "bg-white/20 text-white shadow-sm font-semibold"
                              : "text-zinc-400 hover:text-white"
                          )}
                        >
                          <Zap className="size-3.5" />
                          <span>Rapid Synthesis</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDebateModeChange("deep")}
                          className={cn(
                            "py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2",
                            debateMode === "deep"
                              ? isLight ? "bg-white text-zinc-950 shadow-sm font-semibold" : "bg-white/20 text-white shadow-sm font-semibold"
                              : "text-zinc-400 hover:text-white"
                          )}
                        >
                          <Sparkles className="size-3.5" />
                          <span>Multi-Agent Adversarial</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {debateMode === "fast"
                          ? "Single-lead low latency pass bypassing adversarial cross-audits. Recommended for exploratory queries."
                          : "Full multi-turn adversarial deliberation loop with critic scrutiny and convergence adjudication."}
                      </p>
                    </div>

                    {/* Discrete Step Slider: Max Debate Rounds (1 - 5) */}
                    <div className={cn(
                      "rounded-xl p-4 border space-y-3.5",
                      isLight ? "bg-white border-zinc-200" : "bg-white/[0.02] border-white/10"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-medium text-zinc-300">Max Deliberation Rounds</label>
                          <p className="text-[10.5px] text-zinc-500">Upper bound before supervisor verdict convergence</p>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white">
                          {maxRounds} {maxRounds === 1 ? "round" : "rounds"}
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={maxRounds}
                          onChange={(e) => handleRoundsChange(Number(e.target.value))}
                          className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
                          <span>1 (Rapid)</span>
                          <span>2</span>
                          <span>3 (Balanced)</span>
                          <span>4</span>
                          <span>5 (Exhaustive)</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 2: CREDENTIALS & LLMS ── */}
                {activeTab === "credentials" && (
                  <motion.div
                    key="tab-credentials"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-5"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Model Provider Access</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Direct API keys used for client-side model orchestration. Keys never leave your device.
                      </p>
                    </div>

                    <div className={cn(
                      "rounded-xl border divide-y overflow-hidden",
                      isLight ? "border-zinc-200 divide-zinc-200 bg-white" : "border-white/10 divide-white/10 bg-white/[0.02]"
                    )}>
                      {/* Groq Key */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-zinc-200">Groq API Key</span>
                            <span className="text-[10px] text-zinc-500 font-mono">(Llama 3.3, DeepSeek R1)</span>
                          </div>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-mono font-medium border",
                            groqStatus === "saved"
                              ? "bg-white/10 text-white border-white/20"
                              : "bg-zinc-900 text-zinc-500 border-zinc-800"
                          )}>
                            {groqStatus === "saved" ? "Saved ✓" : "Not configured"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showGroq ? "text" : "password"}
                              value={groqKey}
                              onChange={(e) => setGroqKey(e.target.value)}
                              placeholder="gsk_..."
                              className={cn(
                                "w-full px-3 py-1.5 pr-8 rounded-lg font-mono text-[11.5px] outline-none transition-colors",
                                isLight
                                  ? "bg-zinc-100 border border-zinc-300 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950"
                                  : "bg-black/50 border border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-white/30"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowGroq(!showGroq)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              {showGroq ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveKey("groq", groqKey)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                          >
                            {savedBadge === "groq" ? "Saved ✓" : "Save"}
                          </button>
                        </div>
                      </div>

                      {/* Anthropic Key */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-zinc-200">Anthropic API Key</span>
                            <span className="text-[10px] text-zinc-500 font-mono">(Claude 3.7 Sonnet)</span>
                          </div>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-mono font-medium border",
                            anthropicStatus === "saved"
                              ? "bg-white/10 text-white border-white/20"
                              : "bg-zinc-900 text-zinc-500 border-zinc-800"
                          )}>
                            {anthropicStatus === "saved" ? "Saved ✓" : "Not configured"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showAnthropic ? "text" : "password"}
                              value={anthropicKey}
                              onChange={(e) => setAnthropicKey(e.target.value)}
                              placeholder="sk-ant-..."
                              className={cn(
                                "w-full px-3 py-1.5 pr-8 rounded-lg font-mono text-[11.5px] outline-none transition-colors",
                                isLight
                                  ? "bg-zinc-100 border border-zinc-300 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950"
                                  : "bg-black/50 border border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-white/30"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowAnthropic(!showAnthropic)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              {showAnthropic ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveKey("anthropic", anthropicKey)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                          >
                            {savedBadge === "anthropic" ? "Saved ✓" : "Save"}
                          </button>
                        </div>
                      </div>

                      {/* OpenAI Key */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-zinc-200">OpenAI API Key</span>
                            <span className="text-[10px] text-zinc-500 font-mono">(GPT-4o, o3-mini)</span>
                          </div>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-mono font-medium border",
                            openaiStatus === "saved"
                              ? "bg-white/10 text-white border-white/20"
                              : "bg-zinc-900 text-zinc-500 border-zinc-800"
                          )}>
                            {openaiStatus === "saved" ? "Saved ✓" : "Not configured"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showOpenai ? "text" : "password"}
                              value={openaiKey}
                              onChange={(e) => setOpenaiKey(e.target.value)}
                              placeholder="sk-proj-..."
                              className={cn(
                                "w-full px-3 py-1.5 pr-8 rounded-lg font-mono text-[11.5px] outline-none transition-colors",
                                isLight
                                  ? "bg-zinc-100 border border-zinc-300 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950"
                                  : "bg-black/50 border border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-white/30"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowOpenai(!showOpenai)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              {showOpenai ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveKey("openai", openaiKey)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                          >
                            {savedBadge === "openai" ? "Saved ✓" : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-[10.5px] text-zinc-400 leading-relaxed px-1">
                      <ShieldCheck className="size-3.5 shrink-0 mt-0.5 text-zinc-400" />
                      <span>Security guarantee: Keys are stored exclusively in client localStorage and injected into downstream headers per request.</span>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 3: WORKSPACE & SYNC ── */}
                {activeTab === "workspace" && (
                  <motion.div
                    key="tab-workspace"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-5"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">AST Workspace Engine</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Manage code artifact persistence, snapshot packaging, and local cache.
                      </p>
                    </div>

                    <div className={cn(
                      "rounded-xl border divide-y overflow-hidden",
                      isLight ? "border-zinc-200 divide-zinc-200 bg-white" : "border-white/10 divide-white/10 bg-white/[0.02]"
                    )}>
                      {/* AST Auto-persistence Toggle (Only genuine boolean) */}
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-xs text-zinc-200">AST Auto-Persistence</p>
                          <p className="text-[10.5px] text-zinc-400">Automatically sync generated code blocks into file tree</p>
                        </div>
                        <Switch
                          checked={autoSaveCode}
                          onCheckedChange={handleAutoSaveToggle}
                          size="sm"
                        />
                      </div>

                      {/* Export Snapshot Action */}
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-xs text-zinc-200">Export Workspace Snapshot</p>
                          <p className="text-[10.5px] text-zinc-400">Download complete workspace JSON archive</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleExportZip}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 transition-colors cursor-pointer"
                        >
                          <Download className="size-3.5" />
                          <span>Export .json</span>
                        </button>
                      </div>

                      {/* Cache Purge Action */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-xs text-zinc-200">Purge Workspace Cache</p>
                            <p className="text-[10.5px] text-zinc-400">Clear cached token vectors and transient states</p>
                          </div>
                          {!isConfirmingClear && (
                            <button
                              type="button"
                              onClick={() => setIsConfirmingClear(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                              <span>{cacheCleared ? "Cleared ✓" : "Purge"}</span>
                            </button>
                          )}
                        </div>

                        {isConfirmingClear && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-red-300 font-medium">
                              <AlertTriangle className="size-3.5" />
                              <span>Confirm cache purge? All active threads will be reset.</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleClearCache}
                                className="flex-1 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors cursor-pointer"
                              >
                                Confirm Purge
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsConfirmingClear(false)}
                                className="flex-1 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 4: PROFILE & PLAN ── */}
                {activeTab === "profile" && (
                  <motion.div
                    key="tab-profile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-5"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Account & Keyboard Shortcuts</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Session credentials, active license tier, and hotkey reference.
                      </p>
                    </div>

                    {/* Account Plan Details */}
                    <div className={cn(
                      "rounded-xl p-4 border space-y-3.5",
                      isLight ? "bg-white border-zinc-200" : "bg-white/[0.02] border-white/10"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-zinc-100">{userName}</div>
                          <div className="text-[11px] text-zinc-400">{userEmail}</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-white/10 border border-white/20 text-white">
                          {userPlan}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => { onClose(); router.push("/pricing"); }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-3.5 text-zinc-400" />
                          <span>Manage Subscription</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium">Billing Portal →</span>
                      </button>
                    </div>

                    {/* Monochromatic Keybinding References */}
                    <div className={cn(
                      "rounded-xl p-4 border space-y-2.5",
                      isLight ? "bg-white border-zinc-200" : "bg-white/[0.02] border-white/10"
                    )}>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">Keyboard Shortcuts</label>

                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">Submit Prompt to Council</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px] text-zinc-200">Enter</kbd>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">New Line in Chat</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px] text-zinc-200">Shift + Enter</kbd>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">Search Folders & Chats</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px] text-zinc-200">Cmd / Ctrl + K</kbd>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-zinc-400">Close Drawer / Modal</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px] text-zinc-200">Esc</kbd>
                        </div>
                      </div>
                    </div>

                    {/* Disconnect / Sign Out Action */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onSignOut}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-all cursor-pointer active:scale-95"
                      >
                        <LogOut className="size-4" />
                        <span>Disconnect / Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
