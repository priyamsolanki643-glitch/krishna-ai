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
  // Always open while streaming; collapsible after stream completes
  const [isOpen, setIsOpen] = useState(isStreaming);

  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
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
    <div className="mb-3 flex flex-col font-sans select-none">
      
      {/* When completed, provide a clean minimal toggle */}
      {!isStreaming && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 py-1 px-2.5 rounded-lg text-xs transition-colors cursor-pointer w-fit mb-1 border",
            isLight
              ? "bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100"
              : "bg-black text-white/80 border-white/20 hover:border-white/40 hover:text-white"
          )}
        >
          <div className="size-1.5 rounded-full bg-white" />
          <span className="font-mono text-[11.5px]">Process Pipeline ({steps.length} steps)</span>
          {isOpen ? <ChevronDown className="size-3 text-white/60" /> : <ChevronRight className="size-3 text-white/60" />}
        </button>
      )}

      {/* Pitch Black Box with Crisp White Border and Zero Glow */}
      <AnimatePresence>
        {(isOpen || isStreaming) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className={cn(
              "p-3.5 rounded-xl border flex flex-col gap-3 max-w-xl",
              isLight
                ? "bg-white border-zinc-300 text-black shadow-none"
                : "bg-black border-white/20 text-white shadow-none"
            )}>
              
              {/* Pipeline Steps in Clean White Layout */}
              <div className="flex flex-col gap-2">
                {steps.map((step) => {
                  const isActive = step.status === "active" && isStreaming;
                  const isCompleted = step.status === "completed" || !isStreaming;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "flex items-center gap-2.5 text-xs transition-colors py-0.5",
                        isActive
                          ? (isLight ? "text-black font-semibold" : "text-white font-medium")
                          : (isLight ? "text-zinc-500 font-normal" : "text-white/60 font-normal")
                      )}
                    >
                      {/* Step Indicator */}
                      <div className="size-4 flex items-center justify-center shrink-0">
                        {isCompleted ? (
                          <div className={cn(
                            "size-3.5 rounded-full flex items-center justify-center border",
                            isLight
                              ? "bg-zinc-100 border-zinc-400 text-black"
                              : "bg-white/10 border-white/30 text-white"
                          )}>
                            <Check className="size-2.5 stroke-[2]" />
                          </div>
                        ) : (
                          <div className="relative flex size-2.5 items-center justify-center">
                            <span className="animate-ping absolute inline-flex size-2.5 rounded-full bg-white opacity-70" />
                            <span className="relative inline-flex rounded-full size-1.5 bg-white" />
                          </div>
                        )}
                      </div>

                      {/* Icon */}
                      <div className={cn("shrink-0", isActive ? "text-white" : "text-white/50")}>
                        {renderStepIcon(step.iconName, step.domain)}
                      </div>

                      {/* Label */}
                      <span className={cn(
                        "truncate tracking-tight",
                        isActive ? "text-white font-medium" : "text-white/60"
                      )}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Web Citations inside pitch black card */}
              {sources.length > 0 && (
                <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <Globe className="size-3.5 text-white/80" strokeWidth={1.5} />
                      <span className="font-medium text-white">Live Web Sources</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/50">{sources.length} sources</span>
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-lg border border-white/15 bg-black p-2">
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
                          className="flex items-center justify-between p-1 rounded hover:bg-white/5 transition-colors group cursor-pointer text-xs"
                        >
                          <span className="text-white/80 group-hover:text-white truncate max-w-[75%] font-normal">
                            {src.title || src.url}
                          </span>
                          <span className="text-[10px] font-mono text-white/50 group-hover:text-white/80 shrink-0 ml-2">
                            {hostname}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Critic Audit & Argue action */}
              {stageData?.critique && stageData.critique.critiqueContent && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="size-3.5 text-white/80 shrink-0" strokeWidth={1.5} />
                    <span className="text-white/70 truncate text-[11.5px]">
                      {stageData.critique.agent}: <span className="text-white font-medium">{stageData.critique.rating}</span>
                    </span>
                  </div>

                  {onArgueWithAgent && (
                    <button
                      type="button"
                      onClick={() => onArgueWithAgent(stageData.critique!.agent, stageData.critique!.critiqueContent)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      <MessageSquareQuote className="size-3 text-white" strokeWidth={1.5} />
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
