import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, X, Cpu, Sparkles, Shield, Zap, Brain, Layers, RotateCcw, LayoutGrid
} from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  role: string;
  color: string;
  tag: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "reasoning",
    name: "openai/gpt-oss-120b",
    provider: "OpenAI on Groq",
    role: "Lead Reasoning & Logic",
    color: "#6366f1",
    tag: "120B Reasoning"
  },
  {
    id: "coding",
    name: "qwen/qwen3.6-27b",
    provider: "Qwen on Groq",
    role: "Full-Stack & AST Synthesis",
    color: "#10b981",
    tag: "Coding Specialist"
  },
  {
    id: "math",
    name: "openai/gpt-oss-120b",
    provider: "OpenAI on Groq",
    role: "Mathematical Derivations",
    color: "#ec4899",
    tag: "Math Engine"
  },
  {
    id: "research",
    name: "meta-llama/llama-3.3-70b-versatile",
    provider: "Meta on Groq",
    role: "Grounded Web Research",
    color: "#3b82f6",
    tag: "70B Live Retrieval"
  },
  {
    id: "critic",
    name: "meta-llama/llama-3.3-70b-versatile",
    provider: "Meta on Groq",
    role: "Adversarial Critic & Logic Auditor",
    color: "#f59e0b",
    tag: "Adversarial Clash"
  }
];

interface TeamSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoMode: boolean;
  selectedModelIds: string[];
  onSelectAuto: () => void;
  onSelectManualTeam: (modelIds: string[]) => void;
}

export function TeamSelectorModal({
  isOpen,
  onClose,
  isAutoMode,
  selectedModelIds,
  onSelectAuto,
  onSelectManualTeam
}: TeamSelectorModalProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedModelIds);
  const [tempIsAuto, setTempIsAuto] = useState<boolean>(isAutoMode);

  const handleToggleModel = (id: string) => {
    setTempIsAuto(false);
    if (tempSelected.includes(id)) {
      // Keep at least 2 models for Council deliberation or let them toggle
      if (tempSelected.length > 2) {
        setTempSelected(tempSelected.filter(m => m !== id));
      }
    } else {
      setTempSelected([...tempSelected, id]);
    }
  };

  const handleApply = () => {
    if (tempIsAuto) {
      onSelectAuto();
    } else {
      onSelectManualTeam(tempSelected);
    }
    onClose();
  };

  const handleResetToAuto = () => {
    setTempIsAuto(true);
    setTempSelected(["claude-3-7-sonnet", "deepseek-r1"]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-lg bg-[#0d0d10] border border-white/10 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <LayoutGrid className="size-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    Council Composition
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Manual override for multi-agent cognitive routing
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-4 no-scrollbar">
              
              {/* Auto Supervisor Option Card */}
              <div
                onClick={handleResetToAuto}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                  tempIsAuto
                    ? "bg-white/[0.08] border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="size-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="size-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        Auto (Supervisor Decides)
                      </span>
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Default
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Council Supervisor dynamically classifies prompt domain and assembles optimal Lead, Critic, and Synthesizer models automatically.
                    </p>
                  </div>
                </div>
                <div className={`size-5 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-1 ${
                  tempIsAuto ? "bg-white border-white text-black" : "border-white/20"
                }`}>
                  {tempIsAuto && <Check className="size-3 stroke-[3]" />}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-[1px] flex-1 bg-white/5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Or Form Custom Team (Select 2+)
                </span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>

              {/* Models List */}
              <div className="grid grid-cols-1 gap-2.5">
                {AVAILABLE_MODELS.map((model) => {
                  const isSelected = !tempIsAuto && tempSelected.includes(model.id);
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleToggleModel(model.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-white/[0.06] border-white/25 shadow-[0_0_15px_rgba(255,255,255,0.04)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="size-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${model.color}20`,
                            borderColor: `${model.color}40`,
                            borderWidth: 1
                          }}
                        >
                          <Brain className="size-4" style={{ color: model.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                              {model.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({model.provider})
                            </span>
                          </div>
                          <p className="text-[11.5px] text-zinc-400 truncate">
                            {model.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/5 hidden sm:inline-block">
                          {model.tag}
                        </span>
                        <div className={`size-5 rounded-md border flex items-center justify-center ${
                          isSelected ? "bg-white border-white text-black" : "border-white/20"
                        }`}>
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-[#09090b] flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToAuto}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset to Auto</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Apply Composition
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
