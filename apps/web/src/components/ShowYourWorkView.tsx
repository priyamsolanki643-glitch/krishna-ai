import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, ChevronRight, ShieldAlert, Brain, 
  MessageSquareQuote, AlertCircle, Globe, Check, Loader2, Code, Lightbulb, Search
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
  sources?: {
    title: string;
    url: string;
  }[];
}

export type ShowYourWorkMode = "off" | "status" | "council";

interface ShowYourWorkViewProps {
  mode: ShowYourWorkMode;
  isStreaming?: boolean;
  stageData?: AgentStageData;
  onArgueWithAgent?: (agentName: string, context: string) => void;
}

// A generic Claude-style dropdown row
function ProcessStep({ 
  icon: Icon, 
  title, 
  isWorking = false, 
  children, 
  rightText 
}: { 
  icon: React.ElementType, 
  title: string, 
  isWorking?: boolean, 
  children?: React.ReactNode,
  rightText?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = Boolean(children);

  return (
    <div className="flex flex-col text-[14px]">
      <div 
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`flex items-center gap-3 py-2 px-1 rounded-md transition-colors ${hasChildren ? 'cursor-pointer hover:bg-white/[0.03]' : ''} text-zinc-300`}
      >
        <div className="flex items-center justify-center size-5 text-zinc-400">
          <Icon className={`size-4 ${isWorking ? 'animate-spin text-[#d97757]' : ''}`} />
        </div>
        <span className="font-medium">{title}</span>
        
        {rightText && (
          <span className="ml-auto text-xs text-zinc-500">{rightText}</span>
        )}
        
        {hasChildren && (
          <div className="text-zinc-500 ml-2">
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-9 pr-4 pb-3 pt-1 text-[13px] text-zinc-400">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ShowYourWorkView({
  mode,
  isStreaming,
  stageData,
  onArgueWithAgent
}: ShowYourWorkViewProps) {
  if (mode === "off" || (!stageData && !isStreaming)) return null;

  const data = stageData || {};
  const isFinished = !!data.convergence || !isStreaming;

  return (
    <div className="w-full my-4 select-none font-sans">
      
      {/* ── Mode 1: Lightweight Status View ── */}
      {mode === "status" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300 w-fit"
        >
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11.5px]">
            Working...
          </span>
        </motion.div>
      )}

      {/* ── Mode 2: Claude-style Chain-of-Thought ── */}
      {mode === "council" && (
        <div className="space-y-1">
          {/* 1. Supervisor / Intent Analysis */}
          {data.supervisor && (
            <ProcessStep 
              icon={Lightbulb} 
              title="Understanding the request" 
            />
          )}

          {/* 2. Web Research (if any) */}
          {data.sources && data.sources.length > 0 && (
            <ProcessStep 
              icon={Globe} 
              title="Searched the web" 
              rightText={`${data.sources.length} results`}
            >
              <div className="flex flex-col gap-2 rounded-md bg-[#18181b] border border-white/5 p-2">
                {data.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:bg-white/5 p-1.5 rounded transition-colors text-zinc-300 hover:text-white"
                  >
                    <Search className="size-3 text-zinc-500 shrink-0" />
                    <span className="truncate">{src.title}</span>
                  </a>
                ))}
              </div>
            </ProcessStep>
          )}

          {/* 3. Logic & Draft Generation */}
          {data.leadDraft && (
            <ProcessStep 
              icon={Code} 
              title={data.supervisor?.domain === 'coding' ? "Writing the code" : "Synthesizing logic"}
            >
              <p className="whitespace-pre-wrap">{data.leadDraft.content.slice(0, 150)}...</p>
              <button 
                onClick={() => onArgueWithAgent?.(data.leadDraft!.agent, data.leadDraft!.content)}
                className="mt-2 text-xs text-blue-400 hover:underline cursor-pointer"
              >
                Argue this logic
              </button>
            </ProcessStep>
          )}

          {/* 4. Peer Review / Critique */}
          {data.critique && (
            <ProcessStep 
              icon={ShieldAlert} 
              title="Evaluating and refining"
            >
              <p className="whitespace-pre-wrap">{data.critique.critiqueContent}</p>
              {data.critique.identifiedFlaws && data.critique.identifiedFlaws.length > 0 && (
                <ul className="list-disc pl-4 mt-2 space-y-1 text-zinc-500">
                  {data.critique.identifiedFlaws.map((f, idx) => <li key={idx}>{f}</li>)}
                </ul>
              )}
            </ProcessStep>
          )}

          {/* 5. Working Indicator (Claude Style Star/Loader) */}
          {isStreaming && !isFinished && (
            <div className="flex items-center gap-3 py-2 px-1 text-zinc-300">
               <Loader2 className="size-4 animate-spin text-[#d97757]" />
               <span className="text-[14px] font-medium">Working</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
