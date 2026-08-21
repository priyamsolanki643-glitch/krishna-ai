"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { 
  Paperclip, 
  Mic, 
  ArrowUp, 
  Camera, 
  Image, 
  FileText, 
  X, 
  Globe, 
  Bot, 
  Brain, 
  Code2, 
  Calculator, 
  Search, 
  Sparkles, 
  Compass, 
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";


export interface AgentModelOption {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const COUNCIL_AGENTS: AgentModelOption[] = [
  {
    id: "reasoning-agent",
    name: "Reasoning agent",
    category: "Deep logical deduction & chain-of-thought",
    icon: Brain,
    color: "text-zinc-300",
  },
  {
    id: "coding-agent",
    name: "Coding agent",
    category: "AST synthesis & full-stack architecture",
    icon: Code2,
    color: "text-zinc-300",
  },
  {
    id: "math-agent",
    name: "Mathematics agent",
    category: "Formal theorems, discrete math & proofs",
    icon: Calculator,
    color: "text-zinc-300",
  },
  {
    id: "research-agent",
    name: "Research & Knowledge agent",
    category: "Real-time citations & academic papers",
    icon: Search,
    color: "text-zinc-300",
  },
  {
    id: "creative-agent",
    name: "Creative & Language agent",
    category: "Rhetoric, high-impact prose & translation",
    icon: Sparkles,
    color: "text-zinc-300",
  },
  {
    id: "planning-agent",
    name: "Planning & Strategy agent",
    category: "Roadmap planning & risk decomposition",
    icon: Compass,
    color: "text-zinc-300",
  },
];


interface AIChatInputProps {
  value?: string;
  onChange?: (val: string) => void;
  onSend?: (text: string, options?: { selectedAgents?: string[]; deepSearch?: boolean; debateMode?: "fast" | "deep" }) => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  onCameraClick?: () => void;
  onPhotosClick?: () => void;
  onFilesClick?: () => void;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
  selectedAgentIds?: string[];
  onSelectedAgentsChange?: (ids: string[]) => void;
  theme?: "dark" | "light";
  disabled?: boolean;
  className?: string;
}

export const AIChatInput: React.FC<AIChatInputProps> = ({
  value: externalValue,
  onChange: externalOnChange,
  onSend,
  isRecording = false,
  onToggleRecording,
  onCameraClick,
  onPhotosClick,
  onFilesClick,
  selectedFiles = [],
  onRemoveFile,
  selectedAgentIds: externalSelectedAgents,
  onSelectedAgentsChange,
  theme = "dark",
  disabled = false,
  className,
}) => {
  const [internalValue, setInternalValue] = useState("");
  const inputValue = externalValue !== undefined ? externalValue : internalValue;

  const setInputValue = (val: string) => {
    if (externalOnChange) {
      externalOnChange(val);
    } else {
      setInternalValue(val);
    }
  };

  const [isActive, setIsActive] = useState(false);
  const [isPinMenuOpen, setIsPinMenuOpen] = useState(false);
  const [isModelsMenuOpen, setIsModelsMenuOpen] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);

  // Selected Agents State (defaults to Reasoning & Coding if none provided)
  const [internalSelectedAgents, setInternalSelectedAgents] = useState<string[]>([
    "reasoning-agent",
    "coding-agent",
  ]);

  const activeAgents = externalSelectedAgents !== undefined ? externalSelectedAgents : internalSelectedAgents;

  const toggleAgent = (id: string) => {
    let next: string[];
    if (activeAgents.includes(id)) {
      next = activeAgents.filter((a) => a !== id);
    } else {
      next = [...activeAgents, id];
    }
    if (onSelectedAgentsChange) {
      onSelectedAgentsChange(next);
    } else {
      setInternalSelectedAgents(next);
    }
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendLongPressTimer = useRef<any>(null);
  const isLight = theme === "light";

  // Close menus & input on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsPinMenuOpen(false);
        setIsModelsMenuOpen(false);
        if (!inputValue && selectedFiles.length === 0) setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue, selectedFiles.length]);

  const handleActivate = () => {
    setIsActive(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || disabled) return;
    if (onSend) {
      onSend(inputValue, { selectedAgents: activeAgents, deepSearch: deepSearchActive });
    }
    setInputValue("");
    setIsPinMenuOpen(false);
    setIsModelsMenuOpen(false);
  };

  const isExpanded = isActive || Boolean(inputValue) || selectedFiles.length > 0;

  // Spring animation for smooth shape transformation: Capsule -> Rounded Rectangle
  const containerVariants = {
    collapsed: {
      height: selectedFiles.length > 0 ? 94 : 64,
      borderRadius: 36,
      boxShadow: isLight
        ? "0 4px 20px 0 rgba(0,0,0,0.06)"
        : "0 0 22px 0 rgba(255,255,255,0.25), 0 8px 30px 0 rgba(0,0,0,0.9), inset 0 1px 0 0 rgba(255,255,255,0.3)",
      transition: { type: "spring" as const, stiffness: 350, damping: 28 },
    },
    expanded: {
      height: selectedFiles.length > 0 ? 164 : 132,
      borderRadius: 24,
      boxShadow: isLight
        ? "0 12px 40px 0 rgba(0,0,0,0.12)"
        : "0 0 28px 0 rgba(255,255,255,0.3), 0 16px 50px 0 rgba(0,0,0,0.95), inset 0 1px 0 0 rgba(255,255,255,0.35)",
      transition: { type: "spring" as const, stiffness: 350, damping: 28 },
    },
  };

  return (
    <div className={cn("w-full flex justify-center items-center pointer-events-auto relative", className)}>
      <motion.div
        ref={wrapperRef}
        className={cn(
          "w-full max-w-3xl border transition-all duration-150 relative",
          isLight
            ? "bg-white border-zinc-300 text-zinc-950 shadow-md"
            : "bg-[#000000] border-white/60 text-white backdrop-blur-2xl"
        )}

        variants={containerVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "visible" }}
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full justify-between p-2">
          {/* Selected Files Chips */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-2 pt-0.5 pb-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs pr-6",
                    isLight ? "bg-zinc-100 text-zinc-800" : "bg-white/10 text-zinc-200"
                  )}
                >
                  <Paperclip className="size-3 text-zinc-400" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  {onRemoveFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(idx);
                      }}
                      className="absolute right-1 size-4 rounded-full flex items-center justify-center hover:bg-white/20 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="size-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Top Input Row */}
          <div className="flex items-center gap-2 px-1 py-0.5 w-full relative">
            
            {/* Pin / Paperclip Button with Upward Dropdown */}
            <div className="relative shrink-0 flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPinMenuOpen(!isPinMenuOpen);
                  setIsModelsMenuOpen(false);
                }}
                className={cn(
                  "p-2.5 sm:p-3 rounded-full transition-all cursor-pointer",
                  isPinMenuOpen
                    ? isLight ? "bg-zinc-200 text-zinc-950" : "bg-white/20 text-white"
                    : isLight ? "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                )}
                title="Attach media or documents"
              >
                <Paperclip size={19} className={cn("transition-transform duration-100", isPinMenuOpen && "rotate-45")} />
              </button>

              {/* Pin Upward Dropdown: Camera, Photos, Files */}
              <AnimatePresence>
                {isPinMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.94 }}
                    transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "bottom left" }}
                    className={cn(
                      "absolute bottom-full left-0 mb-3 rounded-2xl p-1.5 flex flex-col min-w-[160px] z-50 shadow-2xl border backdrop-blur-2xl",
                      isLight
                        ? "bg-white/95 border-zinc-200 text-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
                        : "bg-[#0c0c0e]/95 border-white/15 text-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPinMenuOpen(false);
                        if (onCameraClick) onCameraClick();
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-[13px] text-left cursor-pointer font-medium",
                        isLight ? "hover:bg-zinc-100 text-zinc-800 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                      )}
                    >
                      <Camera className={cn("size-4", isLight ? "text-zinc-600" : "text-zinc-400")} />
                      <span>Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPinMenuOpen(false);
                        if (onPhotosClick) onPhotosClick();
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-[13px] text-left cursor-pointer font-medium",
                        isLight ? "hover:bg-zinc-100 text-zinc-800 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                      )}
                    >
                      <Image className={cn("size-4", isLight ? "text-zinc-600" : "text-zinc-400")} />
                      <span>Photos</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPinMenuOpen(false);
                        if (onFilesClick) onFilesClick();
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-[13px] text-left cursor-pointer font-medium",
                        isLight ? "hover:bg-zinc-100 text-zinc-800 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                      )}
                    >
                      <FileText className={cn("size-4", isLight ? "text-zinc-600" : "text-zinc-400")} />
                      <span>Files</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clean Text Input or FP-Style Live Audio Wave Listening Bar */}
            <div className="relative flex-1 min-w-0 flex items-center">

              {isRecording ? (
                <div className="flex items-center gap-2.5 px-2 py-1 text-xs sm:text-sm text-red-400 font-medium tracking-wide">
                  <div className="flex items-center gap-[3px] h-3.5">
                    <motion.span
                      className="w-[3px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      animate={{ height: ["4px", "16px", "4px"] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                    />
                    <motion.span
                      className="w-[3px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      animate={{ height: ["14px", "4px", "14px"] }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut", delay: 0.1 }}
                    />
                    <motion.span
                      className="w-[3px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      animate={{ height: ["6px", "18px", "6px"] }}
                      transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                    />
                    <motion.span
                      className="w-[3px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      animate={{ height: ["11px", "5px", "11px"] }}
                      transition={{ repeat: Infinity, duration: 0.65, ease: "easeInOut", delay: 0.02 }}
                    />
                  </div>
                  <span className="animate-pulse font-mono tracking-wider text-xs uppercase text-red-300">
                    Listening...
                  </span>
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "flex-1 border-0 outline-0 rounded-md py-2 px-1 text-sm sm:text-base bg-transparent w-full font-normal leading-relaxed",
                    isLight ? "text-zinc-950" : "text-white"
                  )}
                  style={{ position: "relative", zIndex: 1 }}
                  onFocus={handleActivate}
                />
              )}
            </div>


            {/* Mic Button */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleRecording) onToggleRecording();
              }}
              className={cn(
                "relative p-2.5 sm:p-3 rounded-full transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center",
                isRecording
                  ? "bg-red-500/20 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.7)] border border-red-500/50"
                  : isLight
                  ? "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950"
                  : "hover:bg-white/10 text-zinc-400 hover:text-white"
              )}
              title={isRecording ? "Stop voice input" : "Voice input"}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full border border-red-500/60 animate-ping opacity-75 pointer-events-none" />
              )}
              <Mic size={19} className="relative z-10" />
            </button>



            {/* Send Button: Clean Arrow Icon with Long-press Fast Mode */}
            <button
              type="button"
              tabIndex={-1}
              disabled={(!inputValue.trim() && selectedFiles.length === 0) || disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleSend();
              }}
              onMouseDown={() => {
                sendLongPressTimer.current = setTimeout(() => {
                  if ((inputValue.trim() || selectedFiles.length > 0) && !disabled) {
                    if (onSend) {
                      onSend(inputValue, { selectedAgents: activeAgents, deepSearch: deepSearchActive, debateMode: "fast" });
                    }
                    setInputValue("");
                    setIsPinMenuOpen(false);
                    setIsModelsMenuOpen(false);
                  }
                }, 600);
              }}
              onMouseUp={() => {
                if (sendLongPressTimer.current) clearTimeout(sendLongPressTimer.current);
              }}
              onMouseLeave={() => {
                if (sendLongPressTimer.current) clearTimeout(sendLongPressTimer.current);
              }}
              onTouchStart={() => {
                sendLongPressTimer.current = setTimeout(() => {
                  if ((inputValue.trim() || selectedFiles.length > 0) && !disabled) {
                    if (onSend) {
                      onSend(inputValue, { selectedAgents: activeAgents, deepSearch: deepSearchActive, debateMode: "fast" });
                    }
                    setInputValue("");
                    setIsPinMenuOpen(false);
                    setIsModelsMenuOpen(false);
                  }
                }, 600);
              }}
              onTouchEnd={() => {
                if (sendLongPressTimer.current) clearTimeout(sendLongPressTimer.current);
              }}
              className={cn(
                "flex items-center justify-center p-2.5 sm:p-3 rounded-full transition-all cursor-pointer shrink-0 active:scale-95",
                !inputValue.trim() && selectedFiles.length === 0
                  ? isLight
                    ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                    : "bg-white/10 text-zinc-600 cursor-not-allowed"
                  : isLight
                  ? "bg-zinc-950 hover:bg-zinc-800 text-white shadow-md hover:scale-105"
                  : "bg-white hover:bg-zinc-200 text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105"
              )}
              title="Send to Council (Hold for Fast Mode)"
            >
              <ArrowUp size={18} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Expanded Bottom Controls: Models Dropdown & Deep Search */}
          <motion.div
            className="w-full flex justify-start px-2 pb-1.5 items-center text-xs relative"
            variants={{
              hidden: {
                opacity: 0,
                y: 10,
                pointerEvents: "none" as const,
                transition: { duration: 0.1 },
              },
              visible: {
                opacity: 1,
                y: 0,
                pointerEvents: "auto" as const,
                transition: { duration: 0.12, delay: 0.02 },
              },
            }}
            initial="hidden"
            animate={isExpanded ? "visible" : "hidden"}
          >
            <div className="flex gap-2.5 items-center">
              
              {/* Models / Agents Button with Upward Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModelsMenuOpen(!isModelsMenuOpen);
                    setIsPinMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium cursor-pointer bg-black",
                    isModelsMenuOpen
                      ? isLight
                        ? "border border-zinc-950 text-zinc-950 shadow-sm bg-white font-semibold"
                        : "border border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.45)] bg-black font-semibold"
                      : isLight
                      ? "border border-transparent text-zinc-600 hover:text-zinc-950 bg-transparent"
                      : "border border-transparent text-zinc-400 hover:text-white bg-black/50"
                  )}

                  title="Configure Council Model Agents Team"
                >
                  <span className="tracking-tight">Models</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                      isLight ? "bg-zinc-200 text-zinc-950" : "bg-white/15 text-white"
                    )}
                  >
                    {activeAgents.length}
                  </span>
                  <ChevronUp className={cn("size-3.5 transition-transform duration-100", isModelsMenuOpen && "rotate-180")} />
                </button>

                {/* Models Upward Dropdown: Compact v-switch-12 Card Structure */}
                <AnimatePresence>
                  {isModelsMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.08, ease: "easeOut" }}
                      style={{ transformOrigin: "bottom left" }}
                      className={cn(
                        "absolute bottom-full left-0 mb-2.5 w-full min-w-[270px] sm:min-w-[295px] max-w-[315px] overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl z-50",
                        isLight
                          ? "bg-white/95 border-zinc-200 text-zinc-950 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                          : "bg-[#09090b]/95 border-white/10 text-white shadow-[0_16px_40px_rgba(0,0,0,0.95)]"
                      )}
                    >
                      {/* v-switch-12 Compact Header */}
                      <div className={cn(
                        "border-b px-3.5 py-2 flex items-center justify-between",
                        isLight ? "border-zinc-200 bg-zinc-50/50" : "border-white/10 bg-white/[0.02]"
                      )}>
                        <div>
                          <p className="font-semibold text-xs text-white">Council Models</p>
                          <p className={cn("text-[10px]", isLight ? "text-zinc-500" : "text-zinc-400")}>
                            Active quorum agents
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeAgents.length === COUNCIL_AGENTS.length) {
                              if (onSelectedAgentsChange) onSelectedAgentsChange(["reasoning-agent", "coding-agent"]);
                              else setInternalSelectedAgents(["reasoning-agent", "coding-agent"]);
                            } else {
                              const all = COUNCIL_AGENTS.map((a) => a.id);
                              if (onSelectedAgentsChange) onSelectedAgentsChange(all);
                              else setInternalSelectedAgents(all);
                            }
                          }}
                          className={cn(
                            "text-[10px] font-medium underline cursor-pointer",
                            isLight ? "text-zinc-600 hover:text-zinc-950" : "text-zinc-400 hover:text-white"
                          )}
                        >
                          {activeAgents.length === COUNCIL_AGENTS.length ? "Reset" : "Select all"}
                        </button>
                      </div>

                      {/* v-switch-12 Compact Divide-y Items List */}
                      <div className={cn("divide-y max-h-[250px] overflow-y-auto no-scrollbar", isLight ? "divide-zinc-200" : "divide-white/10")}>
                        {COUNCIL_AGENTS.map(({ id, name, category, icon: Icon }, i) => {
                          const isChecked = activeAgents.includes(id);

                          return (
                            <div key={id}>
                              <div className="flex items-center gap-2.5 px-3.5 py-2">
                                <div className={cn(
                                  "flex size-6 shrink-0 items-center justify-center rounded-md",
                                  isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/5 text-zinc-300"
                                )}>
                                  <Icon
                                    aria-hidden="true"
                                    className="size-3.5"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs truncate">{name}</p>
                                  <p className={cn("text-[9.5px] truncate", isLight ? "text-zinc-500" : "text-zinc-400")}>
                                    {category}
                                  </p>
                                </div>
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={() => toggleAgent(id)}
                                  size="sm"
                                />
                              </div>
                              {i === 2 && <Separator className={cn(isLight ? "bg-zinc-200" : "bg-white/10")} />}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Deep Search / Web Search Toggle - Pitch Black with Crisp White Border Glow */}
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeepSearchActive((a) => !a);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium whitespace-nowrap overflow-hidden justify-start cursor-pointer bg-black",
                  deepSearchActive
                    ? isLight
                      ? "border border-zinc-950 text-zinc-950 shadow-sm bg-white"
                      : "border border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.45)] bg-black"
                    : isLight
                    ? "border border-transparent text-zinc-600 hover:text-zinc-950 bg-transparent"
                    : "border border-transparent text-zinc-400 hover:text-white bg-black/50"
                )}
                title="Toggle Deep Web Search"
                initial={false}
                animate={{
                  width: deepSearchActive ? 116 : 32,
                  paddingLeft: deepSearchActive ? 9 : 7,
                  paddingRight: deepSearchActive ? 9 : 7,
                }}
              >
                <div className="shrink-0">
                  <Globe size={14} className={deepSearchActive ? "text-white" : "text-zinc-400"} />
                </div>
                <motion.span
                  className="truncate text-xs font-medium"
                  initial={false}
                  animate={{
                    opacity: deepSearchActive ? 1 : 0,
                  }}
                >
                  Deep Search
                </motion.span>
              </motion.button>


            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
