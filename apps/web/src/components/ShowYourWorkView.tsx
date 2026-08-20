import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, ChevronRight, ShieldAlert, Cpu, Sparkles, Brain, CheckCircle2, 
  MessageSquareQuote, Layers, AlertCircle, ArrowRight, Zap, Target
} from "lucide-react";

export interface AgentStageData {
  supervisor?: {
    domain: string;
    confidence: number;
    assignedLead: string;
    assignedCritic: string;
    intent: string;
  };
  leadDraft?: {
    agent: string;
    content: string;
    timestamp?: string;
  };
  critique?: {
    agent: string;
    identifiedFlaws: string[];
    critiqueContent: string;
    rating: string;
  };
  convergence?: {
    rounds: number;
    consensusScore: number;
    overruledDissent?: {
      agent: string;
      dissentPoint: string;
      reasonOverruled: string;
    };
  };
}

export type ShowYourWorkMode = "off" | "status" | "council";

interface ShowYourWorkViewProps {
  mode: ShowYourWorkMode;
  isStreaming?: boolean;
  stageData?: AgentStageData;
  onArgueWithAgent?: (agentName: string, context: string) => void;
}

export function ShowYourWorkView({
  mode,
  isStreaming,
  stageData,
  onArgueWithAgent
}: ShowYourWorkViewProps) {
  const [isCouncilExpanded, setIsCouncilExpanded] = useState<boolean>(true);
  const [isDissentModalOpen, setIsDissentModalOpen] = useState<boolean>(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("lead");

  if (mode === "off" && !stageData?.convergence?.overruledDissent) {
    return null;
  }

  const defaultStageData: AgentStageData = stageData || {
    supervisor: {
      domain: "Cognitive Architecture & Logic",
      confidence: 0.98,
      assignedLead: "Claude 3.7 Sonnet",
      assignedCritic: "DeepSeek R1",
      intent: "System design & multi-agent synthesis"
    },
    leadDraft: {
      agent: "Claude 3.7 Sonnet",
      content: "Proposed robust architecture separating consensus verification loop from token generation to eliminate monolithic single-pass hallucinations."
    },
    critique: {
      agent: "DeepSeek R1 (Adversarial Critic)",
      identifiedFlaws: [
        "Single-round consensus could deadlock on edge cases without strict confidence delta threshold.",
        "Latency budget exceeds 1.5s if all 3 agents trigger synchronous re-computation."
      ],
      critiqueContent: "Identified edge case in deadlock arbitration. Recommended asynchronous supervisor escalation threshold.",
      rating: "Iterate with Threshold"
    },
    convergence: {
      rounds: 2,
      consensusScore: 0.96,
      overruledDissent: {
        agent: "DeepSeek R1",
        dissentPoint: "Advocated for strict AST syntax verification before synthesis.",
        reasonOverruled: "Overruled by Supervisor: LLM confidence reached 96% and external sandbox verification is handled downstream."
      }
    }
  };

  const data = defaultStageData;

  return (
    <div className="w-full my-3 space-y-2 select-none">
      
      {/* ── Disagreement Trust Signal (Always visible if dissent exists) ── */}
      {data.convergence?.overruledDissent && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">1 agent disagreed during debate</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDissentModalOpen(!isDissentModalOpen)}
            className="text-[11px] underline text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
          >
            {isDissentModalOpen ? "Hide Argument" : "Inspect Overruled Argument"}
          </button>
        </div>
      )}

      {/* Dissent Breakdown Modal / Drawer */}
      <AnimatePresence>
        {isDissentModalOpen && data.convergence?.overruledDissent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-2xl bg-[#13120f] border border-amber-500/30 text-xs space-y-2 overflow-hidden shadow-lg"
          >
            <div className="flex items-center justify-between text-amber-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-3.5" />
                Dissenting Agent: {data.convergence.overruledDissent.agent}
              </span>
              <button
                onClick={() => onArgueWithAgent?.(data.convergence!.overruledDissent!.agent, data.convergence!.overruledDissent!.dissentPoint)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Argue this point
              </button>
            </div>
            <div className="text-zinc-300 space-y-1 pl-2 border-l border-amber-500/30">
              <p><strong className="text-zinc-400">Position Argued:</strong> {data.convergence.overruledDissent.dissentPoint}</p>
              <p><strong className="text-zinc-400">Council Resolution:</strong> {data.convergence.overruledDissent.reasonOverruled}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mode 1: Lightweight Status View ── */}
      {mode === "status" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300 w-fit"
        >
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11.5px]">
            Council Pipeline Active: <span className="text-white font-medium">{data.supervisor?.domain || "Multi-Agent Consensus"}</span> (Round {data.convergence?.rounds || 1})
          </span>
        </motion.div>
      )}

      {/* ── Mode 2: Full Council Chain-of-Thought (Show Your Work) ── */}
      {mode === "council" && (
        <div className="rounded-2xl bg-[#09090b]/90 border border-white/10 overflow-hidden transition-all shadow-xl">
          {/* Header Bar */}
          <div 
            onClick={() => setIsCouncilExpanded(!isCouncilExpanded)}
            className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="size-3 text-purple-400" />
              </div>
              <span className="text-xs font-semibold text-white tracking-tight">
                The Council Debate & Pipeline Audit
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono">
                {data.convergence?.rounds || 2} Rounds • {Math.round((data.convergence?.consensusScore || 0.96) * 100)}% Consensus
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-[11px] text-zinc-500">
                {isCouncilExpanded ? "Collapse" : "Expand"}
              </span>
              {isCouncilExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </div>
          </div>

          {/* Expanded Pipeline Stages */}
          <AnimatePresence>
            {isCouncilExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 space-y-3 border-t border-white/5 text-xs text-zinc-300"
              >
                {/* 1. Supervisor Classification Stage */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <Brain className="size-3.5" />
                      STAGE 1: SUPERVISOR ROUTING
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Confidence {Math.round((data.supervisor?.confidence || 0.98) * 100)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                    <div>
                      <span className="text-zinc-500">Domain:</span> <span className="text-white font-medium">{data.supervisor?.domain}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Lead Model:</span> <span className="text-emerald-400 font-medium">{data.supervisor?.assignedLead}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Adversarial Critic:</span> <span className="text-indigo-400 font-medium">{data.supervisor?.assignedCritic}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Classified Intent:</span> <span className="text-zinc-300 truncate">{data.supervisor?.intent}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Lead Agent Draft Stage */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <Cpu className="size-3.5" />
                      STAGE 2: LEAD AGENT PROPOSAL ({data.leadDraft?.agent})
                    </span>
                    <button
                      type="button"
                      onClick={() => onArgueWithAgent?.(data.leadDraft?.agent || "Lead Agent", data.leadDraft?.content || "")}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Argue with Lead
                    </button>
                  </div>
                  <p className="text-[12px] text-zinc-200 leading-relaxed font-sans bg-black/40 p-2.5 rounded-lg border border-white/5">
                    {data.leadDraft?.content}
                  </p>
                </div>

                {/* 3. Adversarial Reviewer Critique Stage */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <ShieldAlert className="size-3.5" />
                      STAGE 3: ADVERSARIAL CRITIC AUDIT ({data.critique?.agent})
                    </span>
                    <button
                      type="button"
                      onClick={() => onArgueWithAgent?.(data.critique?.agent || "Adversarial Critic", data.critique?.critiqueContent || "")}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Argue with Critic
                    </button>
                  </div>

                  <p className="text-[12px] text-zinc-300 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
                    {data.critique?.critiqueContent}
                  </p>

                  {data.critique?.identifiedFlaws && data.critique.identifiedFlaws.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10.5px] uppercase font-bold text-zinc-500">Identified Vulnerabilities:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11.5px] text-zinc-400">
                        {data.critique.identifiedFlaws.map((flaw, idx) => (
                          <li key={idx}>{flaw}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 4. Convergence & Verification */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    Consensus Reached & Verified in Round {data.convergence?.rounds || 2}
                  </span>
                  <span className="font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Score: {Math.round((data.convergence?.consensusScore || 0.96) * 100)}%
                  </span>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
