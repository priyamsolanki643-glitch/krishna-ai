"use client";

import React, { useState, useEffect } from "react";
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
  Globe, 
  Bot, 
  MessageSquareQuote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentStageData } from "../ShowYourWorkView";

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
  stageData?: AgentStageData;
  onArgueWithAgent?: (agent: string, context: string) => void;
  theme?: "dark" | "light";
}

export const ProcessPipelineBox: React.FC<ProcessPipelineBoxProps> = ({
  steps,
  isStreaming,
  stageData,
  onArgueWithAgent,
  theme = "dark"
}) => {
  const isLight = theme === "light";
  const [isOpen, setIsOpen] = useState(isStreaming);
  const [seconds, setSeconds] = useState(0);

  // Timer tracking while streaming
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      setIsOpen(true);
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      // Auto-collapse when finished to keep the chat view immaculate
      setIsOpen(false);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!steps || steps.length === 0) return null;

  const renderStepIcon = (iconName: string, domain?: string) => {
    const iconProps = { className: "size-3.5 shrink-0", strokeWidth: 1.5 };
    switch (iconName) {
      case "hearing":
        return <Radio {...iconProps} />;
      case "supervisor":
        return <Gavel {...iconProps} />;
      case "domain": {
        const d = (domain || "").toLowerCase();
        if (d.includes("code") || d.includes("coding")) return <Code2 {...iconProps} />;
        if (d.includes("math")) return <Calculator {...iconProps} />;
        if (d.includes("research")) return <Compass {...iconProps} />;
        if (d.includes("creative")) return <Sparkles {...iconProps} />;
        if (d.includes("reasoning") || d.includes("reason")) return <Brain {...iconProps} />;
        if (d.includes("plan")) return <Compass {...iconProps} />;
        return <Bot {...iconProps} />;
      }
      case "lead":
        return <Pencil {...iconProps} />;
      case "reviewer":
        return <Layers {...iconProps} />;
      case "critic":
        return <Shield {...iconProps} />;
      case "architect":
        return <Sparkles {...iconProps} />;
      default:
        return <Cpu {...iconProps} />;
    }
  };

  const sources = stageData?.sources || [];

  return (
    <div className="mb-3.5 flex flex-col font-sans select-none">
      
      {/* ── Header Trigger Row (App-Accent Glassmorphic Button) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-xl text-[13px] transition-all cursor-pointer w-fit group text-left",
          isLight 
            ? "hover:bg-black/[0.04] text-zinc-700" 
            : "hover:bg-white/[0.06] text-zinc-300 border border-transparent hover:border-white/10"
        )}
      >
        {isStreaming ? (
          <div className="relative flex size-3 items-center justify-center shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60" />
            <span className="relative inline-flex rounded-full size-1.5 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          </div>
        ) : (
          <Sparkles className="size-3.5 text-purple-400 shrink-0" strokeWidth={1.5} />
        )}
        
        <span className={cn(
          "tracking-tight",
          isStreaming 
            ? "text-purple-300 font-medium" 
            : (isLight ? "text-zinc-600 group-hover:text-zinc-900" : "text-zinc-400 group-hover:text-zinc-200")
        )}>
          {isStreaming 
            ? "Pondering..." 
            : `Thought for ${Math.max(1, seconds || steps.length)} seconds`}
        </span>

        <div className="text-zinc-500 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5">
          {isOpen ? <ChevronDown className="size-3.5" strokeWidth={1.5} /> : <ChevronRight className="size-3.5" strokeWidth={1.5} />}
        </div>
      </button>

      {/* ── Collapsible Body (Signature App Glassmorphism) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mt-2"
          >
            <div className={cn(
              "p-4 rounded-2xl border flex flex-col gap-3.5 max-w-xl transition-all",
              isLight 
                ? "bg-black/[0.02] border-black/10 text-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl" 
                : "bg-white/[0.04] border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            )}>
              
              {/* 1. Real-time Pipeline Step Progression with Breathing Room */}
              <div className="flex flex-col gap-2.5">
                {steps.map((step) => {
                  const isActive = step.status === "active" && isStreaming;
                  const isCompleted = step.status === "completed" || !isStreaming;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "flex items-center gap-3 text-xs transition-colors py-1",
                        isActive 
                          ? (isLight ? "text-zinc-950 font-semibold" : "text-white font-medium") 
                          : (isLight ? "text-zinc-400 font-normal" : "text-white/45 font-normal")
                      )}
                    >
                      {/* Status Indicator */}
                      <div className="size-4 flex items-center justify-center shrink-0">
                        {isCompleted ? (
                          <div className={cn(
                            "size-3.5 rounded-full flex items-center justify-center border",
                            isLight
                              ? "bg-purple-500/10 border-purple-500/20 text-purple-600"
                              : "bg-white/[0.06] border-white/15 text-purple-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                          )}>
                            <Check className="size-2.5 stroke-[1.75]" />
                          </div>
                        ) : (
                          <div className="relative flex size-3 items-center justify-center">
                            <span className="animate-ping absolute inline-flex size-2.5 rounded-full bg-purple-400 opacity-60" />
                            <span className="relative inline-flex rounded-full size-1.5 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                          </div>
                        )}
                      </div>

                      {/* Step Line Icon */}
                      <div className={cn(
                        "shrink-0 transition-colors", 
                        isActive 
                          ? "text-purple-400" 
                          : (isLight ? "text-zinc-400" : "text-white/35")
                      )}>
                        {renderStepIcon(step.iconName, step.domain)}
                      </div>

                      {/* Step Title */}
                      <span className={cn(
                        "truncate tracking-tight",
                        isActive 
                          ? (isLight ? "text-zinc-950" : "text-white") 
                          : (isLight ? "text-zinc-500" : "text-white/50")
                      )}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* 2. Glassmorphic Web Search Citations Card (if any) */}
              {sources.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Globe className="size-3.5 text-purple-400" strokeWidth={1.5} />
                      <span className="font-medium text-zinc-300">Live Web Citations</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{sources.length} sources</span>
                  </div>

                  <div className={cn(
                    "flex flex-col gap-1.5 rounded-xl border p-2 backdrop-blur-md",
                    isLight 
                      ? "bg-black/[0.02] border-black/5" 
                      : "bg-white/[0.02] border-white/5"
                  )}>
                    {sources.map((src, i) => {
                      let hostname = "";
                      try {
                        hostname = new URL(src.url).hostname;
                      } catch {
                        hostname = src.url;
                      }

                      return (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "flex items-center justify-between p-1.5 rounded-lg transition-colors group cursor-pointer text-xs",
                            isLight ? "hover:bg-black/[0.04]" : "hover:bg-white/[0.04]"
                          )}
                        >
                          <span className="text-zinc-300 group-hover:text-white truncate max-w-[75%] font-normal">
                            {src.title || src.url}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 group-hover:text-purple-300 shrink-0 ml-2">
                            {hostname}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Critic Audit & Argue Action (Glassmorphic Inline Footer) */}
              {stageData?.critique && stageData.critique.critiqueContent && (
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="size-3.5 text-purple-400 shrink-0" strokeWidth={1.5} />
                    <span className="text-zinc-400 truncate text-[11.5px]">
                      {stageData.critique.agent}: <span className="text-zinc-300">{stageData.critique.rating}</span>
                    </span>
                  </div>

                  {onArgueWithAgent && (
                    <button
                      type="button"
                      onClick={() => onArgueWithAgent(stageData.critique!.agent, stageData.critique!.critiqueContent)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      <MessageSquareQuote className="size-3 text-purple-400" strokeWidth={1.5} />
                      <span>Argue</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
