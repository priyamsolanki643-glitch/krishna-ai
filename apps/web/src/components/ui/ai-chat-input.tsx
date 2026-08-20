"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "Generate website with The Council",
  "Create a new multi-agent consensus thread",
  "What is the mathematical proof of Bayesian quorum?",
  "Synthesize consensus across Claude, GPT-4o & DeepSeek",
  "Explain quantum entanglement simply",
  "Summarize this architectural specification",
];

interface AIChatInputProps {
  value?: string;
  onChange?: (val: string) => void;
  onSend?: (text: string, options?: { think: boolean; deepSearch: boolean }) => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  onAttachClick?: () => void;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
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
  onAttachClick,
  selectedFiles = [],
  onRemoveFile,
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

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isLight = theme === "light";

  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, inputValue]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
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
      onSend(inputValue, { think: thinkActive, deepSearch: deepSearchActive });
    }
    setInputValue("");
  };

  const containerVariants = {
    collapsed: {
      height: selectedFiles.length > 0 ? 94 : 68,
      boxShadow: isLight 
        ? "0 4px 20px 0 rgba(0,0,0,0.06)" 
        : "0 8px 32px 0 rgba(0,0,0,0.6)",
      transition: { type: "spring" as const, stiffness: 140, damping: 20 },
    },
    expanded: {
      height: selectedFiles.length > 0 ? 156 : 128,
      boxShadow: isLight 
        ? "0 12px 40px 0 rgba(0,0,0,0.12)" 
        : "0 16px 48px 0 rgba(0,0,0,0.85)",
      transition: { type: "spring" as const, stiffness: 140, damping: 20 },
    },
  };

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: "blur(12px)",
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring" as const, stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring" as const, stiffness: 80, damping: 20 },
      },
    },
  };

  const isExpanded = isActive || Boolean(inputValue) || selectedFiles.length > 0;

  return (
    <div className={cn("w-full flex justify-center items-center pointer-events-auto", className)}>
      <motion.div
        ref={wrapperRef}
        className={cn(
          "w-full max-w-3xl border transition-colors duration-300 relative",
          isLight
            ? "bg-white/95 border-zinc-200 text-zinc-950 backdrop-blur-xl"
            : "bg-[#09090b]/95 border-white/15 text-white backdrop-blur-2xl"
        )}
        variants={containerVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "hidden", borderRadius: 32 }}
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full justify-between p-1.5">
          {/* Selected File Previews if attached */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-1">
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
                      className="absolute right-1 size-4 rounded-full flex items-center justify-center hover:bg-white/20 text-zinc-400 hover:text-white"
                    >
                      <X className="size-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-2 px-2 py-1 max-w-3xl w-full">
            <button
              className={cn(
                "p-2.5 sm:p-3 rounded-full transition-colors cursor-pointer shrink-0",
                isLight ? "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950" : "hover:bg-white/10 text-zinc-400 hover:text-white"
              )}
              title="Attach file"
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                if (onAttachClick) onAttachClick();
              }}
            >
              <Paperclip size={19} />
            </button>

            {/* Text Input & Placeholder */}
            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "flex-1 border-0 outline-0 rounded-md py-2 px-1 text-sm sm:text-base bg-transparent w-full font-normal leading-relaxed",
                  isLight ? "text-zinc-950 placeholder:text-zinc-400" : "text-white placeholder:text-zinc-500"
                )}
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-1 py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className={cn(
                        "absolute left-1 top-1/2 -translate-y-1/2 select-none pointer-events-none text-sm sm:text-base truncate",
                        isLight ? "text-zinc-400" : "text-zinc-500"
                      )}
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {PLACEHOLDERS[placeholderIndex]
                        .split("")
                        .map((char, i) => (
                          <motion.span
                            key={i}
                            variants={letterVariants}
                            style={{ display: "inline-block" }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mic voice input */}
            <button
              className={cn(
                "p-2.5 sm:p-3 rounded-full transition-all cursor-pointer shrink-0 active:scale-95",
                isRecording 
                  ? "bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
                  : isLight 
                  ? "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950" 
                  : "hover:bg-white/10 text-zinc-400 hover:text-white"
              )}
              title={isRecording ? "Stop listening" : "Voice input"}
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleRecording) onToggleRecording();
              }}
            >
              <Mic size={19} />
            </button>

            {/* Send button */}
            <button
              className={cn(
                "flex items-center gap-1 p-2.5 sm:p-3 rounded-full font-medium justify-center transition-all cursor-pointer shrink-0 active:scale-95",
                !inputValue.trim() && selectedFiles.length === 0
                  ? isLight
                    ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                    : "bg-white/10 text-zinc-600 cursor-not-allowed"
                  : isLight
                  ? "bg-zinc-950 hover:bg-zinc-800 text-white shadow-md"
                  : "bg-white hover:bg-zinc-200 text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              )}
              title="Send to The Council"
              type="button"
              tabIndex={-1}
              disabled={(!inputValue.trim() && selectedFiles.length === 0) || disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleSend();
              }}
            >
              <Send size={17} />
            </button>
          </div>

          {/* Expanded Controls: Think & Deep Search */}
          <motion.div
            className="w-full flex justify-start px-3 pb-2 items-center text-xs sm:text-sm"
            variants={{
              hidden: {
                opacity: 0,
                y: 12,
                pointerEvents: "none" as const,
                transition: { duration: 0.2 },
              },
              visible: {
                opacity: 1,
                y: 0,
                pointerEvents: "auto" as const,
                transition: { duration: 0.28, delay: 0.05 },
              },
            }}
            initial="hidden"
            animate={isExpanded ? "visible" : "hidden"}
          >
            <div className="flex gap-2.5 items-center">
              {/* Think Toggle */}
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium group cursor-pointer",
                  thinkActive
                    ? isLight
                      ? "bg-blue-600/15 outline outline-blue-600/60 text-blue-900 shadow-sm"
                      : "bg-blue-500/20 outline outline-blue-400/60 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : isLight
                    ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
                title="Toggle Deep Reasoning Think Mode"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThinkActive((a) => !a);
                }}
              >
                <Lightbulb
                  className={cn(
                    "transition-all size-3.5",
                    thinkActive ? "fill-yellow-400 text-yellow-400" : "group-hover:text-yellow-400"
                  )}
                />
                <span>Think</span>
              </button>

              {/* Deep Search Toggle */}
              <motion.button
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium whitespace-nowrap overflow-hidden justify-start cursor-pointer",
                  deepSearchActive
                    ? isLight
                      ? "bg-blue-600/15 outline outline-blue-600/60 text-blue-900 shadow-sm"
                      : "bg-blue-500/20 outline outline-blue-400/60 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : isLight
                    ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
                title="Toggle Deep Search Web Grounding"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeepSearchActive((a) => !a);
                }}
                initial={false}
                animate={{
                  width: deepSearchActive ? 120 : 34,
                  paddingLeft: deepSearchActive ? 10 : 8,
                  paddingRight: deepSearchActive ? 10 : 8,
                }}
              >
                <div className="shrink-0">
                  <Globe size={15} />
                </div>
                <motion.span
                  className="truncate"
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
