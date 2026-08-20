"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  X, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  FileJson, 
  ExternalLink,
  Code2,
  Terminal,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileNode } from "./file-tree";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileNode | null;
  theme?: "dark" | "light";
}

export function FileViewerModal({
  isOpen,
  onClose,
  file,
  theme = "dark",
}: FileViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const isLight = theme === "light";

  if (!file) return null;

  const handleCopy = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = file.content ? file.content.split("\n") : [];

  const getHeaderIcon = () => {
    if (file.fileType === "code") {
      return <FileCode className={cn("size-4", isLight ? "text-blue-600" : "text-blue-400")} />;
    }
    if (file.fileType === "report") {
      return <Layers className={cn("size-4", isLight ? "text-emerald-600" : "text-emerald-400")} />;
    }
    if (file.fileType === "json") {
      return <FileJson className={cn("size-4", isLight ? "text-amber-600" : "text-amber-400")} />;
    }
    return <FileText className={cn("size-4", isLight ? "text-zinc-500" : "text-zinc-400")} />;
  };

  // Simple clean markdown parser for specs and council reports
  const renderMarkdown = (content: string) => {
    const rawLines = content.split("\n");
    return (
      <div className="space-y-3 font-sans leading-relaxed text-[13.5px]">
        {rawLines.map((line, idx) => {
          const trimmed = line.trim();

          // Title H1
          if (trimmed.startsWith("# ")) {
            return (
              <h1 key={idx} className={cn("text-xl font-bold tracking-tight pb-2 border-b", isLight ? "text-zinc-950 border-zinc-200" : "text-white border-white/10")}>
                {trimmed.replace("# ", "")}
              </h1>
            );
          }

          // H2
          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={idx} className={cn("text-base font-semibold tracking-tight mt-4 pt-2", isLight ? "text-zinc-900" : "text-zinc-100")}>
                {trimmed.replace("## ", "")}
              </h2>
            );
          }

          // H3
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={idx} className={cn("text-sm font-semibold tracking-tight text-zinc-400 uppercase", isLight ? "text-zinc-700" : "text-zinc-300")}>
                {trimmed.replace("### ", "")}
              </h3>
            );
          }

          // Blockquote
          if (trimmed.startsWith("> ")) {
            return (
              <blockquote key={idx} className={cn("pl-4 py-1 border-l-2 italic rounded-r-md text-xs", isLight ? "border-zinc-400 bg-zinc-100 text-zinc-800" : "border-white/30 bg-white/5 text-zinc-300")}>
                {trimmed.replace("> ", "")}
              </blockquote>
            );
          }

          // Checkbox list item
          if (trimmed.startsWith("- [x] ") || trimmed.startsWith("- [ ] ")) {
            const isChecked = trimmed.startsWith("- [x] ");
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className={cn("size-3.5 rounded flex items-center justify-center text-[10px]", isChecked ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "border border-zinc-600")}>
                  {isChecked ? "✓" : ""}
                </span>
                <span className={cn(isChecked ? "line-through opacity-70" : "", isLight ? "text-zinc-800" : "text-zinc-300")}>
                  {trimmed.replace(/- \[[ x]\] /, "")}
                </span>
              </div>
            );
          }

          // Unordered list
          if (trimmed.startsWith("- ")) {
            return (
              <li key={idx} className={cn("ml-4 list-disc text-xs", isLight ? "text-zinc-700" : "text-zinc-300")}>
                {trimmed.replace("- ", "")}
              </li>
            );
          }

          // Divider
          if (trimmed === "---") {
            return <hr key={idx} className={cn("my-4 border-t", isLight ? "border-zinc-200" : "border-white/10")} />;
          }

          // Table row approximation
          if (trimmed.startsWith("|")) {
            return (
              <div key={idx} className={cn("font-mono text-[11.5px] py-0.5 px-2 rounded", isLight ? "bg-zinc-100 text-zinc-800" : "bg-white/5 text-zinc-300")}>
                {trimmed}
              </div>
            );
          }

          // Paragraph / Text line
          if (!trimmed) return <div key={idx} className="h-1" />;

          return (
            <p key={idx} className={cn("text-xs leading-relaxed", isLight ? "text-zinc-700" : "text-zinc-300")}>
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 pointer-events-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300 z-10",
              isLight
                ? "bg-white border border-zinc-200 text-zinc-950"
                : "bg-[#050505] border border-white/15 text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
            )}
          >
            {/* Modal Header */}
            <div
              className={cn(
                "flex items-center justify-between px-4 py-3 border-b shrink-0",
                isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#09090b] border-white/10"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getHeaderIcon()}
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono text-xs font-semibold">{file.name}</span>
                  {file.language && (
                    <span
                      className={cn(
                        "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded",
                        isLight ? "bg-zinc-200 text-zinc-800" : "bg-white/10 text-zinc-300"
                      )}
                    >
                      {file.language}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions: Copy & Close */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    copied
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isLight
                      ? "hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950"
                      : "hover:bg-white/10 text-zinc-300 hover:text-white"
                  )}
                  title="Copy content"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    isLight ? "hover:bg-zinc-200 text-zinc-500 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                  )}
                  title="Close viewer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-xs">
              {file.fileType === "code" ? (
                /* Code Viewer with Line Numbers */
                <div className="flex rounded-xl overflow-hidden border border-white/5 bg-[#0a0a0c] p-3 leading-relaxed">
                  {/* Line numbers */}
                  <div className="select-none pr-4 text-right border-r border-white/10 text-zinc-600 font-mono text-[11px]">
                    {lines.map((_, i) => (
                      <div key={i} className="h-5">{i + 1}</div>
                    ))}
                  </div>

                  {/* Code Body */}
                  <div className="pl-4 overflow-x-auto text-zinc-200 font-mono text-[12px] leading-5 whitespace-pre">
                    {lines.map((line, i) => (
                      <div key={i} className="h-5">
                        {line || " "}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Markdown / Report Viewer */
                <div
                  className={cn(
                    "p-5 rounded-xl border",
                    isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-[#0a0a0c] border-white/5"
                  )}
                >
                  {renderMarkdown(file.content || "")}
                </div>
              )}
            </div>

            {/* Modal Footer Info */}
            <div
              className={cn(
                "flex items-center justify-between px-4 py-2 border-t text-[11px] font-mono opacity-60",
                isLight ? "border-zinc-200 text-zinc-600" : "border-white/10 text-zinc-400"
              )}
            >
              <span>{lines.length} lines • {file.fileType?.toUpperCase()}</span>
              <span>The Council Multi-Format Inspector</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
