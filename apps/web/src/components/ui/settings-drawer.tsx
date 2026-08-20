"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Cpu, 
  Sliders, 
  FolderArchive, 
  Download, 
  Trash2, 
  User, 
  CreditCard, 
  Command, 
  LogOut, 
  Check, 
  AlertTriangle, 
  ChevronDown,
  Sparkles,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase/client";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
  onThemeChange?: (t: "dark" | "light") => void;
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

  // Section 2: Consensus Controls
  const [debateMode, setDebateMode] = useState<"fast" | "deep">("deep");
  const [maxRounds, setMaxRounds] = useState<number>(5);

  // Section 3: Workspace & Export
  const [autoSaveCode, setAutoSaveCode] = useState<boolean>(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);

  // Section 4: Account Info
  const [userName, setUserName] = useState<string>("Ujjwal");
  const [userEmail, setUserEmail] = useState<string>("user@council.ai");
  const [userPlan, setUserPlan] = useState<string>("Pro Plan");

  // Collapsible sections state (default all expanded)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    apiKeys: true,
    consensus: true,
    workspace: true,
    account: true,
    shortcuts: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Load persisted settings on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGroq = localStorage.getItem("council_key_groq");
      const savedAnthropic = localStorage.getItem("council_key_anthropic");
      const savedOpenai = localStorage.getItem("council_key_openai");
      if (savedGroq) { setGroqStatus("saved"); setGroqKey(savedGroq); }
      if (savedAnthropic) { setAnthropicStatus("saved"); setAnthropicKey(savedAnthropic); }
      if (savedOpenai) { setOpenaiStatus("saved"); setOpenaiKey(savedOpenai); }

      const savedMode = localStorage.getItem("council_debate_mode") as "fast" | "deep" | null;
      if (savedMode) setDebateMode(savedMode);

      const savedRounds = localStorage.getItem("council_max_rounds");
      if (savedRounds) setMaxRounds(Number(savedRounds));

      const savedAutoSave = localStorage.getItem("council_autosave_code");
      if (savedAutoSave !== null) setAutoSaveCode(savedAutoSave === "true");
    }

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Ujjwal";
        setUserName(name);
        setUserEmail(session.user.email || "user@council.ai");
      }
    };
    loadUser();
  }, []);

  // Save API Key handlers
  const handleSaveKey = (provider: "groq" | "anthropic" | "openai", key: string) => {
    if (typeof window !== "undefined") {
      if (key.trim()) {
        localStorage.setItem(`council_key_${provider}`, key);
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
                    "p-1.5 rounded-xl",
                    isLight ? "bg-zinc-200/80 text-zinc-900" : "bg-white/10 text-white"
                  )}
                >
                  <Sliders className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight">Council Settings</h2>
                  <p className={cn("text-[11px]", isLight ? "text-zinc-500" : "text-zinc-400")}>
                    Configure keys, debate quorum & preferences
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

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-xs no-scrollbar">
              
              {/* ── SECTION 1: API KEYS & MODEL PROVIDERS ── */}
              <div className={cn("rounded-2xl p-4 border transition-colors", isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-white/5 border-white/10")}>
                <button
                  type="button"
                  onClick={() => toggleSection("apiKeys")}
                  className="w-full flex items-center justify-between font-semibold text-xs tracking-wider uppercase pb-2 mb-3 border-b border-white/5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Key className="size-3.5 text-purple-400" />
                    <span>1. API Keys & Model Providers</span>
                  </div>
                  <ChevronDown className={cn("size-3.5 transition-transform duration-200 text-zinc-400", openSections.apiKeys && "rotate-180")} />
                </button>

                {openSections.apiKeys && (
                  <div className="space-y-3.5 pt-1">
                    {/* Groq API Key */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-zinc-300">Groq API Key</label>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded font-mono font-medium",
                            groqStatus === "saved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          )}
                        >
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
                            isLight
                              ? "bg-zinc-950 text-white hover:bg-zinc-800"
                              : "bg-white text-black hover:bg-zinc-200 font-bold"
                          )}
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Anthropic API Key */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-zinc-300">Anthropic API Key</label>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded font-mono font-medium",
                            anthropicStatus === "saved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          )}
                        >
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
                            isLight
                              ? "bg-zinc-950 text-white hover:bg-zinc-800"
                              : "bg-white text-black hover:bg-zinc-200 font-bold"
                          )}
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* OpenAI API Key */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-zinc-300">OpenAI API Key</label>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded font-mono font-medium",
                            openaiStatus === "saved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          )}
                        >
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
                            isLight
                              ? "bg-zinc-950 text-white hover:bg-zinc-800"
                              : "bg-white text-black hover:bg-zinc-200 font-bold"
                          )}
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-start gap-2 pt-1 text-[10.5px] text-zinc-400 leading-relaxed">
                      <ShieldCheck className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Your key is used only for your own requests and never leaves your account.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 2: CONSENSUS & DEBATE CONTROLS ── */}
              <div className={cn("rounded-2xl p-4 border transition-colors", isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-white/5 border-white/10")}>
                <button
                  type="button"
                  onClick={() => toggleSection("consensus")}
                  className="w-full flex items-center justify-between font-semibold text-xs tracking-wider uppercase pb-2 mb-3 border-b border-white/5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="size-3.5 text-blue-400" />
                    <span>2. Consensus & Debate Controls</span>
                  </div>
                  <ChevronDown className={cn("size-3.5 transition-transform duration-200 text-zinc-400", openSections.consensus && "rotate-180")} />
                </button>

                {openSections.consensus && (
                  <div className="space-y-4 pt-1">
                    {/* Fast vs Deep Segmented Control */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-zinc-300">Execution Mode</label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                        <button
                          type="button"
                          onClick={() => handleDebateModeChange("fast")}
                          className={cn(
                            "py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5",
                            debateMode === "fast"
                              ? isLight ? "bg-white text-zinc-950 shadow-sm" : "bg-white/20 text-white shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          )}
                        >
                          <Zap className="size-3 text-amber-400" />
                          <span>Fast (single turn)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDebateModeChange("deep")}
                          className={cn(
                            "py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5",
                            debateMode === "deep"
                              ? isLight ? "bg-white text-zinc-950 shadow-sm" : "bg-white/20 text-white shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          )}
                        >
                          <Sparkles className="size-3 text-purple-400" />
                          <span>Deep (multi-turn)</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        {debateMode === "fast"
                          ? "Fast skips the review/critique loop for quicker, simpler single-turn answers."
                          : "Deep runs adversarial cross-critique and supervisor synthesis across all models."}
                      </p>
                    </div>

                    {/* Max Rounds Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-zinc-300">Max Rounds</label>
                        <span className="font-mono text-xs font-bold text-purple-400">{maxRounds} rounds</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={maxRounds}
                        onChange={(e) => handleRoundsChange(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                      />
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Maximum debate iterations between challenger models before consensus verdict.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 3: WORKSPACE & EXPORT ── */}
              <div className={cn("rounded-2xl p-4 border transition-colors", isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-white/5 border-white/10")}>
                <button
                  type="button"
                  onClick={() => toggleSection("workspace")}
                  className="w-full flex items-center justify-between font-semibold text-xs tracking-wider uppercase pb-2 mb-3 border-b border-white/5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FolderArchive className="size-3.5 text-emerald-400" />
                    <span>3. Workspace & Export</span>
                  </div>
                  <ChevronDown className={cn("size-3.5 transition-transform duration-200 text-zinc-400", openSections.workspace && "rotate-180")} />
                </button>

                {openSections.workspace && (
                  <div className="space-y-3 pt-1">
                    {/* Auto-save toggle */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-xs font-medium text-zinc-200">Auto-save generated code</div>
                        <div className="text-[10px] text-zinc-400">Persist AST code blocks directly to project tree</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoSaveToggle}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                          autoSaveCode ? "bg-emerald-500" : "bg-zinc-700"
                        )}
                      >
                        <span
                          className={cn(
                            "size-3.5 rounded-full bg-white absolute top-0.5 transition-transform",
                            autoSaveCode ? "left-5.5" : "left-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Actions: Export Zip & Clear Cache */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleExportZip}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium transition-colors cursor-pointer",
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
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                          <span>{cacheCleared ? "Cache Cleared ✓" : "Clear workspace cache"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 4: ACCOUNT & PLAN ── */}
              <div className={cn("rounded-2xl p-4 border transition-colors", isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-white/5 border-white/10")}>
                <button
                  type="button"
                  onClick={() => toggleSection("account")}
                  className="w-full flex items-center justify-between font-semibold text-xs tracking-wider uppercase pb-2 mb-3 border-b border-white/5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 text-amber-400" />
                    <span>4. Account & Plan</span>
                  </div>
                  <ChevronDown className={cn("size-3.5 transition-transform duration-200 text-zinc-400", openSections.account && "rotate-180")} />
                </button>

                {openSections.account && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-zinc-100">{userName}</div>
                        <div className="text-[11px] text-zinc-400">{userEmail}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/40 text-purple-300">
                        {userPlan}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert("Billing & Subscription portal")}
                      className={cn(
                        "w-full flex items-center justify-between py-2 px-3 rounded-xl font-medium transition-colors cursor-pointer",
                        isLight ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900" : "bg-white/5 hover:bg-white/10 text-zinc-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-3.5 text-zinc-400" />
                        <span>Manage subscription</span>
                      </div>
                      <span className="text-[10px] text-purple-400 font-medium">Billing Portal →</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ── SECTION 5: SHORTCUTS & PREFERENCES ── */}
              <div className={cn("rounded-2xl p-4 border transition-colors", isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-white/5 border-white/10")}>
                <button
                  type="button"
                  onClick={() => toggleSection("shortcuts")}
                  className="w-full flex items-center justify-between font-semibold text-xs tracking-wider uppercase pb-2 mb-3 border-b border-white/5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Command className="size-3.5 text-cyan-400" />
                    <span>5. Shortcuts & Preferences</span>
                  </div>
                  <ChevronDown className={cn("size-3.5 transition-transform duration-200 text-zinc-400", openSections.shortcuts && "rotate-180")} />
                </button>

                {openSections.shortcuts && (
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1.5 text-[11px]">
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
                    </div>
                  </div>
                )}
              </div>

              {/* Disconnect / Logout Destructive Button (Bottom, with generous spacing) */}
              <div className="pt-6 pb-2">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-lg"
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
