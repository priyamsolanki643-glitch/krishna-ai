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
  ExternalLink,
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

const ClaudePonderingIcon = ({ isPondering }: { isPondering?: boolean }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#d97757" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("size-4 shrink-0", isPondering && "animate-spin")}
    style={{ animationDuration: "4s" }}
  >
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
  </svg>
);

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
      // Auto-collapse when finished to match Claude clean layout
      setIsOpen(false);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!steps || steps.length === 0) return null;

  const renderStepIcon = (iconName: string, domain?: string) => {
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

  const sources = stageData?.sources || [];

  return (
    <div className="mb-3.5 flex flex-col font-sans select-none">
      
      {/* ── Claude-Style Header Trigger Row ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 py-1 px-1.5 rounded-lg text-[13.5px] transition-colors cursor-pointer w-fit group text-left",
          isLight ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-white/[0.05] text-zinc-300"
        )}
      >
        <ClaudePonderingIcon isPondering={isStreaming} />
        
        <span className={cn(
          "font-normal tracking-tight",
          isStreaming ? "text-[#d97757] font-medium" : (isLight ? "text-zinc-700" : "text-zinc-300")
        )}>
          {isStreaming 
            ? "Pondering..." 
            : `Thought for ${Math.max(1, seconds || steps.length)} seconds`}
        </span>

        <div className="text-zinc-500 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5">
          {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </div>
      </button>

      {/* ── Collapsible Body (Claude-Grade Obsidian Layout) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden mt-1.5"
          >
            <div className={cn(
              "p-3.5 rounded-2xl border flex flex-col gap-3 max-w-xl shadow-lg backdrop-blur-xl",
              isLight 
                ? "bg-zinc-50 border-zinc-200 shadow-sm text-zinc-800" 
                : "bg-[#0e0e11]/90 border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
            )}>
              
              {/* 1. Real-time Pipeline Step Progression */}
              <div className="flex flex-col gap-2">
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
                        "flex items-center gap-2.5 text-xs transition-colors py-0.5",
                        isActive ? (isLight ? "text-zinc-950 font-semibold" : "text-white font-medium") : "text-zinc-400"
                      )}
                    >
                      {/* Step Indicator */}
                      <div className="size-4 flex items-center justify-center shrink-0">
                        {isCompleted ? (
                          <div className="size-3.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                            <Check className="size-2.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d97757] opacity-75" />
                            <span className="relative inline-flex rounded-full size-2 bg-[#d97757]" />
                          </div>
                        )}
                      </div>

                      {/* Step Icon */}
                      <div className={cn("shrink-0", isActive ? "text-[#d97757]" : "text-zinc-500")}>
                        {renderStepIcon(step.iconName, step.domain)}
                      </div>

                      {/* Step Title */}
                      <span className={cn(
                        "truncate",
                        isActive ? (isLight ? "text-zinc-950" : "text-white") : "text-zinc-400"
                      )}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* 2. Claude-Style Web Search Citations Card (if any) */}
              {sources.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Globe className="size-3.5 text-zinc-400" />
                      <span className="font-medium text-zinc-300">Web Research Results</span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">{sources.length} sources</span>
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-xl bg-black/50 border border-white/10 p-2.5">
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
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer text-xs"
                        >
                          <span className="text-zinc-300 group-hover:text-white truncate max-w-[75%] font-normal">
                            {src.title || src.url}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 shrink-0 ml-2">
                            {hostname}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Critic Audit & Argue Action (Nested Cleanly Inside) */}
              {stageData?.critique && stageData.critique.critiqueContent && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="size-3.5 text-emerald-400 shrink-0" />
                    <span className="text-zinc-400 truncate text-[11.5px]">
                      {stageData.critique.agent}: {stageData.critique.rating}
                    </span>
                  </div>

                  {onArgueWithAgent && (
                    <button
                      type="button"
                      onClick={() => onArgueWithAgent(stageData.critique!.agent, stageData.critique!.critiqueContent)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      <MessageSquareQuote className="size-3 text-amber-400" />
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
