"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Radio, 
  Gavel, 
  Code2, 
  Calculator, 
  Compass, 
  Sparkles, 
  Brain, 
  Cpu, 
  Pencil, 
  Layers, 
  Shield,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProcessStepItem {
  id: string;
  label: string;
  iconName: "hearing" | "supervisor" | "domain" | "lead" | "reviewer" | "critic" | "architect";
  domain?: string;
  status: "active" | "completed";
}

interface ProcessPipelineBoxProps {
  steps: ProcessStepItem[];
  isStreaming: boolean;
  theme?: "dark" | "light";
}

export const ProcessPipelineBox: React.FC<ProcessPipelineBoxProps> = ({
  steps,
  isStreaming,
  theme = "dark"
}) => {
  const isLight = theme === "light";
  // Collapsed by default when complete, expanded by default while streaming
  const [isOpen, setIsOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  const renderIcon = (iconName: string, domain?: string) => {
    switch (iconName) {
      case "hearing":
        return <Radio className="size-3.5" />;
      case "supervisor":
        return <Gavel className="size-3.5" />;
      case "domain": {
        const d = (domain || "").toLowerCase();
        if (d.includes("code") || d.includes("coding")) return <Code2 className="size-3.5" />;
        if (d.includes("math")) return <Calculator className="size-3.5" />;
        if (d.includes("research")) return <Compass className="size-3.5" />;
        if (d.includes("creative")) return <Sparkles className="size-3.5" />;
        if (d.includes("reasoning")) return <Brain className="size-3.5" />;
        if (d.includes("plan")) return <Compass className="size-3.5" />;
        return <Bot className="size-3.5" />;
      }
      case "lead":
        return <Pencil className="size-3.5" />;
      case "reviewer":
        return <Layers className="size-3.5" />;
      case "critic":
        return <Shield className="size-3.5" />;
      case "architect":
        return <Sparkles className="size-3.5" />;
      default:
        return <Cpu className="size-3.5" />;
    }
  };

  // If streaming is finished, render the collapsed "View process" toggle
  if (!isStreaming) {
    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border",
            isLight
              ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700"
              : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-400 hover:text-white"
          )}
        >
          <div className="size-1.5 rounded-full bg-emerald-400" />
          <span>View process ({steps.length} steps)</span>
          {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden mt-2"
            >
              <div className={cn(
                "p-3 rounded-2xl border flex flex-col gap-2 max-w-md",
                isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#09090b]/80 border-white/10"
              )}>
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2.5 text-xs text-zinc-400">
                    <div className="size-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="size-2.5 stroke-[2.5]" />
                    </div>
                    <div className="text-zinc-500 shrink-0">
                      {renderIcon(step.iconName, step.domain)}
                    </div>
                    <span className="text-zinc-300 font-medium">{step.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Active Live Streaming State: Expanded list showing real step progression
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mb-3 p-3.5 rounded-2xl border flex flex-col gap-2.5 max-w-md transition-all shadow-lg backdrop-blur-md",
        isLight
          ? "bg-white/90 border-zinc-200 shadow-sm"
          : "bg-[#09090b]/90 border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      )}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-0.5 flex items-center gap-1.5">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
        </span>
        <span>Deliberation Pipeline</span>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {steps.map((step) => {
            const isActive = step.status === "active";
            const isCompleted = step.status === "completed";

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-2.5 text-xs transition-colors py-0.5",
                  isActive ? "text-white font-semibold" : "text-zinc-500"
                )}
              >
                {/* Status Indicator */}
                <div className="size-4 flex items-center justify-center shrink-0">
                  {isCompleted ? (
                    <div className="size-3.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <Check className="size-2.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-white" />
                    </div>
                  )}
                </div>

                {/* Step Icon */}
                <div className={cn("shrink-0", isActive ? "text-white" : "text-zinc-500")}>
                  {renderIcon(step.iconName, step.domain)}
                </div>

                {/* Step Label */}
                <span className={cn(
                  "truncate",
                  isActive ? (isLight ? "text-zinc-900 font-semibold" : "text-white font-medium") : "text-zinc-500"
                )}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
