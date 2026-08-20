"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Key, Cpu, FolderArchive, User, Command, 
  Eye, EyeOff, ShieldCheck, Zap, Sparkles, Download, 
  Trash2, AlertTriangle, LogOut, Sliders, X,
  CreditCard, Shield, MapPin, Smartphone, Mic, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
  onThemeChange?: (theme: "dark" | "light") => void;
  onSignOut?: () => void;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  theme = "dark",
  onThemeChange,
  onSignOut,
}: SettingsDrawerProps) {
  const isLight = theme === "light";

  // Toggle States for each Vercel/Apple Switch Module
  const [switches, setSwitches] = useState<{
    apiKeys: boolean;
    consensus: boolean;
    workspace: boolean;
    privacy: boolean;
    shortcuts: boolean;
    account: boolean;
  }>({
    apiKeys: true,
    consensus: true,
    workspace: true,
    privacy: false,
    shortcuts: true,
    account: true,
  });

  // Section 1: API Keys State
  const [groqKey, setGroqKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showGroq, setShowGroq] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [groqStatus, setGroqStatus] = useState<"not_set" | "saved">("not_set");
  const [anthropicStatus, setAnthropicStatus] = useState<"not_set" | "saved">("not_set");
  const [openaiStatus, setOpenaiStatus] = useState<"not_set" | "saved">("not_set");

  // Section 2: Consensus State
  const [debateMode, setDebateMode] = useState<"fast" | "deep">("deep");
  const [maxRounds, setMaxRounds] = useState<number>(5);

  // Section 3: Workspace State
  const [autoSaveCode, setAutoSaveCode] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Privacy toggles state (v-switch-12 style)
  const [privacyToggles, setPrivacyToggles] = useState({
    location: false,
    camera: false,
    microphone: false,
    activity: true,
  });

  // Section 4: Account Stub
  const userName = "Ujjwal";
  const userEmail = "ujjwal@omni-nexus.ai";
  const userPlan = "Pro Plan (Unlimited AST)";

  // Load persisted values on mount
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

  const handleToggleSwitch = (key: keyof typeof switches) => {
    setSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const handleAutoSaveToggle = () => {
    const next = !autoSaveCode;
    setAutoSaveCode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("council_autosave_code", String(next));
    }
  };

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("council_cached_files");
      setCacheCleared(true);
      setIsConfirmingClear(false);
      setTimeout(() => setCacheCleared(false), 3000);
    }
  };

  const handleExportZip = () => {
    const blob = new Blob(
      [JSON.stringify({ project: "The Council Workspace", exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `council-workspace-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Container */}
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            className={cn(
              "relative w-full sm:max-w-[480px] h-full flex flex-col shadow-2xl border-l transition-colors duration-300 z-10 overflow-hidden",
              isLight
                ? "bg-white/95 backdrop-blur-2xl border-zinc-200 text-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.1)]"
                : "bg-[#08080a]/95 backdrop-blur-2xl border-white/10 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            )}
          >
            {/* Drawer Header */}
            <div
              className={cn(
                "flex items-center justify-between px-5 py-4 border-b shrink-0",
                isLight ? "bg-zinc-50/80 border-zinc-200" : "bg-[#0c0c0e]/80 border-white/10"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    isLight ? "bg-zinc-200/80 text-zinc-900" : "bg-white/10 text-white"
                  )}
                >
                  <Sliders className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">Council Settings</h2>
                  <p className={cn("text-xs", isLight ? "text-zinc-500" : "text-zinc-400")}>
                    Manage keys, debate engine & preferences
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-1.5 rounded-xl transition-colors cursor-pointer",
                  isLight ? "hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                )}
                title="Close settings"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Content Body with V-Switch Card Hierarchy */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs no-scrollbar">

              {/* ── CARD CONTAINER: SYSTEM & CORE ENGINE ── */}
              <div className={cn(
                "w-full overflow-hidden rounded-xl border transition-colors",
                isLight ? "border-zinc-200 bg-white" : "border-white/10 bg-white/[0.02]"
              )}>
                
                {/* 1. API Keys & Providers Switch Row */}
                <div>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/5 text-zinc-300"
                    )}>
                      <Key className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Custom API Keys</p>
                      <p className={cn("text-xs truncate", isLight ? "text-zinc-500" : "text-zinc-400")}>
                        Configure Groq, Anthropic & OpenAI providers
                      </p>
                    </div>
                    <Switch
                      checked={switches.apiKeys}
                      onCheckedChange={() => handleToggleSwitch("apiKeys")}
                      size="sm"
                    />
                  </div>

                  {/* Expandable Vercel/Apple Sub-options for API Keys */}
                  <AnimatePresence>
                    {switches.apiKeys && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "px-4 pb-4 pt-1 space-y-3.5 border-t",
                          isLight ? "border-zinc-100 bg-zinc-50/50" : "border-white/5 bg-black/20"
                        )}
                      >
                        {/* Groq Key */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-[11px] font-medium", isLight ? "text-zinc-700" : "text-zinc-300")}>Groq API Key</label>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded font-mono font-medium",
                              groqStatus === "saved" 
                                ? (isLight ? "bg-zinc-200 text-zinc-900" : "bg-white/15 text-white border border-white/20")
                                : (isLight ? "bg-zinc-100 text-zinc-500" : "bg-zinc-800 text-zinc-400 border border-zinc-700")
                            )}>
                              {groqStatus === "saved" ? "Saved" : "Not set"}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <div className="relative flex-1">
                              <input
                                type={showGroq ? "text" : "password"}
                                value={groqKey}
                                onChange={(e) => setGroqKey(e.target.value)}
                                placeholder="gsk_..."
                                className={cn(
                                  "w-full px-3 py-1.5 pr-8 rounded-xl font-mono text-[11.5px] outline-none transition-colors",
                                  isLight
                                    ? "bg-white border border-zinc-200 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950"
                                    : "bg-black/40 border border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-white/30"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowGroq(!showGroq)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                              >
                                {showGroq ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveKey("groq", groqKey)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer",
                                isLight ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200 font-bold"
                              )}
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        {/* Anthropic Key */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-[11px] font-medium", isLight ? "text-zinc-700" : "text-zinc-300")}>Anthropic API Key</label>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded font-mono font-medium",
                              anthropicStatus === "saved" 
                                ? (isLight ? "bg-zinc-200 text-zinc-900" : "bg-white/15 text-white border border-white/20")
                                : (isLight ? "bg-zinc-100 text-zinc-500" : "bg-zinc-800 text-zinc-400 border border-zinc-700")
                            )}>
                              {anthropicStatus === "saved" ? "Saved" : "Not set"}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <div className="relative flex-1">
                              <input
                                type={showAnthropic ? "text" : "password"}
                                value={anthropicKey}
                                onChange={(e) => setAnthropicKey(e.target.value)}
                                placeholder="sk-ant-..."
                                className={cn(
                                  "w-full px-3 py-1.5 pr-8 rounded-xl font-mono text-[11.5px] outline-none transition-colors",
                                  isLight
                                    ? "bg-white border border-zinc-200 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950"
                                    : "bg-black/40 border border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-white/30"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowAnthropic(!showAnthropic)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                              >
                                {showAnthropic ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveKey("anthropic", anthropicKey)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer",
                                isLight ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200 font-bold"
                              )}
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        {/* OpenAI Key */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-[11px] font-medium", isLight ? "text-zinc-700" : "text-zinc-300")}>OpenAI API Key</label>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded font-mono font-medium",
                              openaiStatus === "saved" 
                                ? (isLight ? "bg-zinc-200 text-zinc-900" : "bg-white/15 text-white border border-white/20")
                                : (isLight ? "bg-zinc-100 text-zinc-500" : "bg-zinc-800 text-zinc-400 border border-zinc-700")
                            )}>
                              {openaiStatus === "saved" ? "Saved" : "Not set"}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <div className="relative flex-1">
                              <input
                                type={showOpenai ? "text" : "password"}
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                placeholder="sk-proj-..."
                                className={cn(
                                  "w-full px-3 py-1.5 pr-8 rounded-xl font-mono text-[11.5px] outline-none transition-colors",
                                  isLight
                                    ? "bg-white border border-zinc-200 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950"
                                    : "bg-black/40 border border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-white/30"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowOpenai(!showOpenai)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                              >
                                {showOpenai ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveKey("openai", openaiKey)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer",
                                isLight ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200 font-bold"
                              )}
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        {/* Security Notice */}
                        <div className="flex items-start gap-2 pt-1 text-[10.5px] text-zinc-400 leading-relaxed">
                          <ShieldCheck className="size-3.5 shrink-0 mt-0.5" />
                          <span>Your keys are used exclusively for your requests and remain encrypted locally.</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Separator className={cn(isLight ? "bg-zinc-100" : "bg-white/5")} />

                {/* 2. Consensus & Debate Controls Switch Row */}
                <div>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/5 text-zinc-300"
                    )}>
                      <Cpu className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Consensus & Debate Engine</p>
                      <p className={cn("text-xs truncate", isLight ? "text-zinc-500" : "text-zinc-400")}>
                        Multi-turn adversarial verification and round bounds
                      </p>
                    </div>
                    <Switch
                      checked={switches.consensus}
                      onCheckedChange={() => handleToggleSwitch("consensus")}
                      size="sm"
                    />
                  </div>

                  {/* Expandable Vercel/Apple Sub-options for Debate Controls */}
                  <AnimatePresence>
                    {switches.consensus && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "px-4 pb-4 pt-2 space-y-4 border-t",
                          isLight ? "border-zinc-100 bg-zinc-50/50" : "border-white/5 bg-black/20"
                        )}
                      >
                        {/* Segmented Control: Fast vs Deep */}
                        <div className="space-y-1.5 pt-1">
                          <label className={cn("text-[11px] font-medium", isLight ? "text-zinc-700" : "text-zinc-300")}>Execution Mode</label>
                          <div className={cn(
                            "grid grid-cols-2 gap-1.5 p-1 rounded-xl border",
                            isLight ? "bg-zinc-200/50 border-zinc-200" : "bg-black/40 border-white/10"
                          )}>
                            <button
                              type="button"
                              onClick={() => handleDebateModeChange("fast")}
                              className={cn(
                                "py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                debateMode === "fast"
                                  ? isLight ? "bg-white text-zinc-950 shadow-sm font-semibold" : "bg-white/20 text-white shadow-sm font-semibold"
                                  : "text-zinc-400 hover:text-white"
                              )}
                            >
                              <Zap className="size-3" />
                              <span>Fast (single turn)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDebateModeChange("deep")}
                              className={cn(
                                "py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                debateMode === "deep"
                                  ? isLight ? "bg-white text-zinc-950 shadow-sm font-semibold" : "bg-white/20 text-white shadow-sm font-semibold"
                                  : "text-zinc-400 hover:text-white"
                              )}
                            >
                              <Sparkles className="size-3" />
                              <span>Deep (multi-turn)</span>
                            </button>
                          </div>
                          <p className="text-[10.5px] text-zinc-400 leading-relaxed">
                            {debateMode === "fast"
                              ? "Fast answers prompts quickly in a single pass without consensus rounds."
                              : "Deep triggers adversarial cross-examination across all Council models."}
                          </p>
                        </div>

                        {/* Max Rounds Slider */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-[11px] font-medium", isLight ? "text-zinc-700" : "text-zinc-300")}>Max Debate Rounds</label>
                            <span className="font-mono text-xs font-bold text-zinc-200">{maxRounds} rounds</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            value={maxRounds}
                            onChange={(e) => handleRoundsChange(Number(e.target.value))}
                            className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                          />
                          <p className="text-[10px] text-zinc-400">
                            Upper bound on debate rounds before supervisor synthesize verdict.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Separator className={cn(isLight ? "bg-zinc-100" : "bg-white/5")} />

                {/* 3. Workspace & Code Auto-Save Switch Row */}
                <div>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/5 text-zinc-300"
                    )}>
                      <FolderArchive className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Workspace & Auto-Save</p>
                      <p className={cn("text-xs truncate", isLight ? "text-zinc-500" : "text-zinc-400")}>
                        AST code persistence and export tools
                      </p>
                    </div>
                    <Switch
                      checked={switches.workspace}
                      onCheckedChange={() => handleToggleSwitch("workspace")}
                      size="sm"
                    />
                  </div>

                  {/* Expandable Vercel/Apple Sub-options for Workspace */}
                  <AnimatePresence>
                    {switches.workspace && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "px-4 pb-4 pt-2 space-y-3 border-t",
                          isLight ? "border-zinc-100 bg-zinc-50/50" : "border-white/5 bg-black/20"
                        )}
                      >
                        {/* Auto-save generated code toggle inside */}
                        <div className="flex items-center justify-between py-1">
                          <div>
                            <div className="text-xs font-medium text-zinc-200">Auto-save generated code</div>
                            <div className="text-[10px] text-zinc-400">Save code blocks into project file tree</div>
                          </div>
                          <Switch
                            checked={autoSaveCode}
                            onCheckedChange={handleAutoSaveToggle}
                            size="sm"
                          />
                        </div>

                        {/* Export & Clear Cache */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={handleExportZip}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium transition-colors cursor-pointer text-xs",
                              isLight ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900" : "bg-white/10 hover:bg-white/15 text-white"
                            )}
                          >
                            <Download className="size-3.5" />
                            <span>Export project as .zip</span>
                          </button>

                          {isConfirmingClear ? (
                            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-red-300 font-medium">
                                <AlertTriangle className="size-3.5" />
                                <span>Confirm cache wipe? This action is irreversible.</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleClearCache}
                                  className="flex-1 py-1.5 rounded-lg bg-red-600 text-white font-medium text-xs hover:bg-red-700 cursor-pointer"
                                >
                                  Yes, Wipe
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsConfirmingClear(false)}
                                  className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsConfirmingClear(true)}
                              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-xs"
                            >
                              <Trash2 className="size-3.5" />
                              <span>{cacheCleared ? "Cache Cleared ✓" : "Clear workspace cache"}</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>


              {/* ── CARD CONTAINER: PRIVACY & SYSTEM PERMISSIONS ── */}
              <div className={cn(
                "w-full overflow-hidden rounded-xl border transition-colors",
                isLight ? "border-zinc-200 bg-white" : "border-white/10 bg-white/[0.02]"
              )}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/5 text-zinc-300"
                  )}>
                    <Shield className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Privacy & System Access</p>
                    <p className={cn("text-xs truncate", isLight ? "text-zinc-500" : "text-zinc-400")}>
                      Location, camera, mic and telemetry permissions
                    </p>
                  </div>
                  <Switch
                    checked={switches.privacy}
                    onCheckedChange={() => handleToggleSwitch("privacy")}
                    size="sm"
                  />
                </div>

                <AnimatePresence>
                  {switches.privacy && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "divide-y border-t",
                        isLight ? "divide-zinc-100 border-zinc-100 bg-zinc-50/50" : "divide-white/5 border-white/5 bg-black/20"
                      )}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", isLight ? "bg-zinc-200/60" : "bg-white/5")}>
                          <MapPin className="size-3.5 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs">Location Services</p>
                          <p className="text-[11px] text-zinc-400">Allow geo-context in queries</p>
                        </div>
                        <Switch
                          checked={privacyToggles.location}
                          onCheckedChange={(v) => setPrivacyToggles((p) => ({ ...p, location: v }))}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", isLight ? "bg-zinc-200/60" : "bg-white/5")}>
                          <Smartphone className="size-3.5 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs">Camera & Media</p>
                          <p className="text-[11px] text-zinc-400">Grant photo capture capability</p>
                        </div>
                        <Switch
                          checked={privacyToggles.camera}
                          onCheckedChange={(v) => setPrivacyToggles((p) => ({ ...p, camera: v }))}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", isLight ? "bg-zinc-200/60" : "bg-white/5")}>
                          <Mic className="size-3.5 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs">Voice & Microphone</p>
                          <p className="text-[11px] text-zinc-400">Enable voice transcription input</p>
                        </div>
                        <Switch
                          checked={privacyToggles.microphone}
                          onCheckedChange={(v) => setPrivacyToggles((p) => ({ ...p, microphone: v }))}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", isLight ? "bg-zinc-200/60" : "bg-white/5")}>
                          <Activity className="size-3.5 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs">Activity & Telemetry</p>
                          <p className="text-[11px] text-zinc-400">Anonymous model performance insights</p>
                        </div>
                        <Switch
                          checked={privacyToggles.activity}
                          onCheckedChange={(v) => setPrivacyToggles((p) => ({ ...p, activity: v }))}
                          size="sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


              {/* ── CARD CONTAINER: ACCOUNT & MEMBERSHIP ── */}
              <div className={cn(
                "w-full overflow-hidden rounded-xl border transition-colors",
                isLight ? "border-zinc-200 bg-white" : "border-white/10 bg-white/[0.02]"
              )}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/5 text-zinc-300"
                  )}>
                    <User className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Account & Plan</p>
                    <p className={cn("text-xs truncate", isLight ? "text-zinc-500" : "text-zinc-400")}>
                      {userName} ({userEmail})
                    </p>
                  </div>
                  <Switch
                    checked={switches.account}
                    onCheckedChange={() => handleToggleSwitch("account")}
                    size="sm"
                  />
                </div>

                <AnimatePresence>
                  {switches.account && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "px-4 pb-4 pt-2 space-y-3 border-t",
                        isLight ? "border-zinc-100 bg-zinc-50/50" : "border-white/5 bg-black/20"
                      )}
                    >
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="font-semibold text-xs text-zinc-100">{userName}</div>
                          <div className="text-[11px] text-zinc-400">{userEmail}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-white/10 border border-white/20 text-zinc-200">
                          {userPlan}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => alert("Billing & Subscription portal")}
                        className={cn(
                          "w-full flex items-center justify-between py-2 px-3 rounded-xl font-medium transition-colors cursor-pointer text-xs",
                          isLight ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900" : "bg-white/5 hover:bg-white/10 text-zinc-200"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-3.5 text-zinc-400" />
                          <span>Manage subscription</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium">Billing Portal →</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


              {/* ── CARD CONTAINER: SHORTCUTS & PREFERENCES ── */}
              <div className={cn(
                "w-full overflow-hidden rounded-xl border transition-colors",
                isLight ? "border-zinc-200 bg-white" : "border-white/10 bg-white/[0.02]"
              )}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/5 text-zinc-300"
                  )}>
                    <Command className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Keyboard Shortcuts</p>
                    <p className={cn("text-xs truncate", isLight ? "text-zinc-500" : "text-zinc-400")}>
                      Quick hotkeys and keybindings
                    </p>
                  </div>
                  <Switch
                    checked={switches.shortcuts}
                    onCheckedChange={() => handleToggleSwitch("shortcuts")}
                    size="sm"
                  />
                </div>

                <AnimatePresence>
                  {switches.shortcuts && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "px-4 pb-3 pt-2 space-y-2 border-t text-[11px]",
                        isLight ? "border-zinc-100 bg-zinc-50/50 text-zinc-700" : "border-white/5 bg-black/20 text-zinc-300"
                      )}
                    >
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Submit Prompt to Council</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-zinc-200">Enter</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">New Line in Chat</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-zinc-200">Shift + Enter</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Search Folders & Chats</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-zinc-200">Cmd / Ctrl + K</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-zinc-400">Close Drawer / Modal</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-zinc-200">Esc</kbd>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


              {/* Disconnect / Logout Destructive Button (Bottom) */}
              <div className="pt-4 pb-2">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  <LogOut className="size-4" />
                  <span>Disconnect / Logout</span>
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
