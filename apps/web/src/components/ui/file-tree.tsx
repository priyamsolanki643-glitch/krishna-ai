"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  ChevronRight, 
  Search, 
  Plus, 
  FolderPlus,
  File,
  Code2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  fileType?: "code" | "markdown" | "report" | "json";
  language?: string;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export const INITIAL_PROJECT_TREE: FileNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",
    children: [
      {
        id: "src-core",
        name: "core",
        type: "folder",
        children: [
          {
            id: "src-core-swarm",
            name: "swarm.ts",
            type: "file",
            fileType: "code",
            language: "typescript",
            content: `// The Council: Multi-Agent Consensus Swarm Orchestrator
import { EventEmitter } from "events";

export interface AgentDecision {
  modelId: string;
  verdict: "ACCEPT" | "REJECT" | "DEBATE";
  confidenceScore: number; // 0.0 - 1.0
  reasoningTrajectory: string[];
  latencyMs: number;
}

export interface ConsensusResult {
  unanimous: boolean;
  finalVerdict: string;
  divergenceIndex: number;
  participatingAgents: number;
  timestamp: string;
}

export class CouncilSwarmEngine extends EventEmitter {
  private activeModels: string[] = ["claude-3-5-sonnet", "gpt-4o", "gemini-1-5-pro", "deepseek-r1"];
  private debateThreshold = 0.85;

  constructor(customAgents?: string[]) {
    super();
    if (customAgents?.length) this.activeModels = customAgents;
  }

  async arbitrate(prompt: string, contextSnapshot: Record<string, unknown>): Promise<ConsensusResult> {
    this.emit("status", "DISPATCHING_COUNCIL_AGENTS");

    const evaluations = await Promise.all(
      this.activeModels.map(model => this.queryModelStream(model, prompt, contextSnapshot))
    );

    const averageConfidence = evaluations.reduce((acc, curr) => acc + curr.confidenceScore, 0) / evaluations.length;
    const isUnanimous = evaluations.every(e => e.verdict === evaluations[0].verdict);

    return {
      unanimous: isUnanimous,
      finalVerdict: isUnanimous ? evaluations[0].verdict : "REQUIRE_ARBITRATION",
      divergenceIndex: 1.0 - averageConfidence,
      participatingAgents: evaluations.length,
      timestamp: new Date().toISOString(),
    };
  }

  private async queryModelStream(model: string, prompt: string, context: Record<string, unknown>): Promise<AgentDecision> {
    const start = performance.now();
    // Simulate high-throughput zero-latency streaming execution
    return {
      modelId: model,
      verdict: "ACCEPT",
      confidenceScore: 0.94,
      reasoningTrajectory: [
        "Analyzed AST structure",
        "Validated runtime invariants",
        "Passed cryptographic peer verification"
      ],
      latencyMs: Math.round(performance.now() - start),
    };
  }
}`
          }
        ]
      },
      {
        id: "src-arbitration",
        name: "arbitration",
        type: "folder",
        children: [
          {
            id: "src-arbitration-engine",
            name: "engine.ts",
            type: "file",
            fileType: "code",
            language: "typescript",
            content: `// The Council: Real-time Conflict Resolution & Arbitration Engine
export interface DiscrepancyNode {
  agentA: string;
  agentB: string;
  contestedSegment: string;
  confidenceDelta: number;
}

export class ArbitrationEngine {
  public resolveDivergence(discrepancies: DiscrepancyNode[]): { resolution: string; confidence: number } {
    if (discrepancies.length === 0) {
      return { resolution: "NO_CONFLICT", confidence: 1.0 };
    }

    // Weighted Bayesian Consensus Resolution
    const rankedTokens = discrepancies.map(d => ({
      winner: d.confidenceDelta > 0 ? d.agentA : d.agentB,
      weight: Math.abs(d.confidenceDelta),
    }));

    return {
      resolution: "SYNTHESIZED_PEER_CONSENSUS",
      confidence: 0.972,
    };
  }
}`
          }
        ]
      }
    ]
  },
  {
    id: "docs",
    name: "docs",
    type: "folder",
    children: [
      {
        id: "docs-architecture-plan",
        name: "architecture-plan.md",
        type: "file",
        fileType: "markdown",
        language: "markdown",
        content: `# The Council: Multi-Agent Consensus Architecture

## 1. System Overview
The Council is an autonomous orchestration layer designed for verifiable AI consensus across heterogenous frontier LLMs (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, DeepSeek-R1).

### Core Pillars
- **Zero Hallucination Quorum**: Any mission-critical AST modification or execution requires at least a 3/4 consensus.
- **Microsecond Streaming Divergence**: Tokens are cross-streamed in real-time. If semantic divergence exceeds 15%, the supervisor interrupts and initiates recursive debate.
- **Cryptographic Auditability**: Every prompt and agent critique is sealed in the local Vault.

## 2. Invariant Checklist
- [x] Full TypeScript Type Safety & React 19 compliance
- [x] Zero-color Obsidian/Apple minimal glass UI
- [x] Multi-Format live Code and Markdown Inspector
`
      }
    ]
  },
  {
    id: "reports",
    name: "reports",
    type: "folder",
    children: [
      {
        id: "reports-council-verdict",
        name: "council-verdict.md",
        type: "file",
        fileType: "report",
        language: "markdown",
        content: `# Consensus Deliberation Report #0492

**Status:** UNANIMOUS CONSENSUS APPROVED  
**Session ID:** \`cncl_99a8x02\`  
**Timestamp:** 2026-08-20T18:05:00Z  

---

### Agent Votes & Confidence
| Model | Verdict | Confidence | Latency |
| :--- | :---: | :---: | :---: |
| **Claude 3.5 Sonnet** | ✅ ACCEPT | 98.4% | 142ms |
| **GPT-4o** | ✅ ACCEPT | 96.1% | 189ms |
| **Gemini 1.5 Pro** | ✅ ACCEPT | 97.8% | 165ms |
| **DeepSeek-R1** | ✅ ACCEPT | 99.2% | 310ms |

### Supervisor Verdict
> *"All 4 frontier models verified the proposed architectural modification with zero syntactic anomalies and 97.88% aggregate confidence. Execution granted."*
`
      }
    ]
  }
];

interface FileTreeProps {
  tree?: FileNode[];
  activeFileId?: string | null;
  onSelectFile: (file: FileNode) => void;
  onAddFolder?: () => void;
  onAddFile?: () => void;
  theme?: "dark" | "light";
  className?: string;
}

export function FileTree({
  tree = INITIAL_PROJECT_TREE,
  activeFileId,
  onSelectFile,
  onAddFolder,
  onAddFile,
  theme = "dark",
  className,
}: FileTreeProps) {
  const [nodes, setNodes] = useState<FileNode[]>(tree);
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(new Set(["src", "src-core", "docs", "reports"]));
  const [filterQuery, setFilterQuery] = useState("");
  const isLight = theme === "light";

  const toggleFolder = (id: string) => {
    setOpenFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFileIcon = (file: FileNode) => {
    if (file.fileType === "code") {
      return <FileCode className={cn("size-3.5", isLight ? "text-blue-600" : "text-blue-400")} />;
    }
    if (file.fileType === "report") {
      return <FileText className={cn("size-3.5", isLight ? "text-emerald-600" : "text-emerald-400")} />;
    }
    if (file.fileType === "json") {
      return <FileJson className={cn("size-3.5", isLight ? "text-amber-600" : "text-amber-400")} />;
    }
    return <FileText className={cn("size-3.5", isLight ? "text-zinc-500" : "text-zinc-400")} />;
  };

  const renderNode = (node: FileNode, depth = 0): React.ReactNode => {
    if (filterQuery && node.type === "file") {
      if (!node.name.toLowerCase().includes(filterQuery.toLowerCase())) {
        return null;
      }
    }

    if (node.type === "folder") {
      const isOpen = openFolderIds.has(node.id) || Boolean(filterQuery);
      const visibleChildren = node.children || [];

      return (
        <div key={node.id} className="select-none">
          <button
            type="button"
            onClick={() => toggleFolder(node.id)}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            className={cn(
              "w-full flex items-center gap-2 py-1.5 pr-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left",
              isLight
                ? "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <ChevronRight
              className={cn(
                "size-3 transition-transform duration-200 shrink-0",
                isOpen && "rotate-90",
                isLight ? "text-zinc-400" : "text-zinc-500"
              )}
            />
            {isOpen ? (
              <FolderOpen className={cn("size-3.5 shrink-0", isLight ? "text-amber-600" : "text-amber-400")} />
            ) : (
              <Folder className={cn("size-3.5 shrink-0", isLight ? "text-amber-600/80" : "text-amber-400/80")} />
            )}
            <span className="truncate">{node.name}</span>
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="overflow-hidden"
              >
                {visibleChildren.map((child) => renderNode(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // File Node
    const isActive = activeFileId === node.id;

    return (
      <button
        key={node.id}
        type="button"
        onClick={() => onSelectFile(node)}
        style={{ paddingLeft: `${depth * 14 + 22}px` }}
        className={cn(
          "w-full flex items-center justify-between py-1.5 pr-2.5 rounded-lg text-xs transition-all cursor-pointer text-left group",
          isActive
            ? isLight
              ? "bg-zinc-900 text-white font-medium shadow-sm"
              : "bg-white/15 text-white font-medium shadow-sm"
            : isLight
            ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            : "text-zinc-400 hover:bg-white/5 hover:text-white"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {getFileIcon(node)}
          <span className="truncate">{node.name}</span>
        </div>

        {node.language && (
          <span
            className={cn(
              "text-[9px] uppercase px-1 py-0.5 rounded font-mono tracking-wider opacity-60 group-hover:opacity-100 transition-opacity",
              isLight ? "bg-zinc-200 text-zinc-800" : "bg-white/10 text-zinc-300"
            )}
          >
            {node.language}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-[320px] rounded-2xl p-2.5 transition-colors duration-300",
        isLight
          ? "bg-white/95 border border-zinc-200 text-zinc-900 shadow-xl"
          : "bg-[#050505]/95 border border-white/10 text-white shadow-2xl backdrop-blur-xl",
        className
      )}
    >
      {/* Header with Search & Quick Actions */}
      <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-white/10">
        <div className="relative flex-1">
          <Search className={cn("size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2", isLight ? "text-zinc-400" : "text-zinc-500")} />
          <input
            type="text"
            placeholder="Filter files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className={cn(
              "w-full pl-8 pr-2 py-1 text-xs rounded-lg outline-none transition-colors",
              isLight
                ? "bg-zinc-100 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:ring-1 focus:ring-zinc-950/20"
                : "bg-white/5 text-white placeholder:text-zinc-500 focus:bg-white/10 focus:ring-1 focus:ring-white/20"
            )}
          />
        </div>

        {onAddFolder && (
          <button
            type="button"
            onClick={onAddFolder}
            title="Create Folder"
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              isLight ? "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-400 hover:text-white"
            )}
          >
            <FolderPlus className="size-3.5" />
          </button>
        )}

        {onAddFile && (
          <button
            type="button"
            onClick={onAddFile}
            title="Create File"
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              isLight ? "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-400 hover:text-white"
            )}
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>

      {/* Tree Node Explorer */}
      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-0.5 pr-0.5 no-scrollbar">
        {nodes.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
