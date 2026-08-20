"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import { 
  ArrowUp, Mic, Plus, Menu, Globe, Image, ThumbsUp, ThumbsDown, Share2, 
  Copy, Target, Camera, Paperclip, X, ChevronRight, ChevronLeft, Cpu, 
  Edit, RefreshCw, Check, Square, Atom, Zap, Fingerprint, Lock, Shield,
  Sparkles, Brain, LayoutGrid, AlertCircle, MessageSquareQuote, CheckCircle2
} from "lucide-react";
import { GyroLogo } from "./gyro-logo";
import { supabase } from "@/utils/supabase/client";
import { MarkdownRenderer } from "./markdown-renderer";
import { CouncilNavbar } from "./CouncilNavbar";
import { TeamSelectorModal, AVAILABLE_MODELS } from "./TeamSelectorModal";
import { FileTreeSlidePanel, DEFAULT_PROJECT_FILES, ProjectFile } from "./FileTreeSlidePanel";
import { ShowYourWorkView, ShowYourWorkMode, AgentStageData } from "./ShowYourWorkView";
import BottomMenu from "./ui/bottom-menu";


interface Message {
  id: string;
  role: "user" | "council" | "fp";
  text: string;
  createdAt: string;
  stageData?: AgentStageData;
  hasDisagreement?: boolean;
}

interface ChatViewProps {
  onOpenSidebar: () => void;
  onOpenVault: () => void;
  isAnonymous?: boolean;
}
export function ChatView({ onOpenSidebar, onOpenVault, isAnonymous }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Section 1 & 2: Show Your Work Mode
  const [showYourWorkMode, setShowYourWorkMode] = useState<ShowYourWorkMode>("council");

  // Section 5: Team / Model Selector
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);
  const [isAutoTeam, setIsAutoTeam] = useState(true);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(["claude-3-7-sonnet", "deepseek-r1"]);

  // Section 6: File Tree Slide Panel
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(false);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(DEFAULT_PROJECT_FILES);

  // Section 7: Routing Visualization & Send Overrides
  const [isRoutingPulse, setIsRoutingPulse] = useState(false);
  const [routingDomain, setRoutingDomain] = useState<string | null>(null);
  const [isSkipDebateMode, setIsSkipDebateMode] = useState(false);
  const [isLongPressMenuOpen, setIsLongPressMenuOpen] = useState(false);
  const sendButtonPressTimer = useRef<any>(null);

  // Section 8: Arguing with Agent state
  const [arguingWith, setArguingWith] = useState<{ agent: string; context: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Kinetic Morph Greeting words
  const MORPH_WORDS = ["build", "solve", "debate", "decide", "create", "ship"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % MORPH_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const currentWord = MORPH_WORDS[currentWordIndex];

  const cycleShowYourWork = () => {
    setShowYourWorkMode((prev) => {
      if (prev === "off") return "status";
      if (prev === "status") return "council";
      return "off";
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const placeholders = [
    "Challenge a core assumption in my thesis...",
    "Formulate an adversarial consensus on my system architecture...",
    "Audit this code for edge cases and race conditions...",
    "Debate the optimal trade-off between speed and reasoning depth..."
  ];

  useEffect(() => {
    if (isInputFocused || input.length > 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isInputFocused, input.length]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isRoutingPulse]);

  // Section 3: Extensible Voice Command Map
  const VOICE_COMMANDS = [
    {
      phrases: ["start new consensus", "new chat", "create new chat", "start over", "reset chat"],
      action: () => {
        handleNewThread();
        showToast("Started new Council consensus");
      }
    },
    {
      phrases: ["show my projects", "open projects", "show projects", "open files", "file tree"],
      action: () => {
        setIsFileTreeOpen(true);
        showToast("Opened Project Workspace");
      }
    },
    {
      phrases: ["show your work", "show the debate", "toggle debate", "show work"],
      action: () => {
        cycleShowYourWork();
        showToast("Show Your Work toggled");
      }
    },
    {
      phrases: ["custom team", "select models", "change models", "open models"],
      action: () => {
        setIsTeamSelectorOpen(true);
        showToast("Opened Council Composition");
      }
    }
  ];

  const handleVoiceCommand = (transcript: string): boolean => {
    const clean = transcript.toLowerCase().trim();
    for (const cmd of VOICE_COMMANDS) {
      for (const phrase of cmd.phrases) {
        if (clean.includes(phrase) || phrase.includes(clean)) {
          cmd.action();
          return true;
        }
      }
    }
    return false;
  };

  const handleNewThread = () => {
    setMessages([]);
    setInput("");
    setIsThinking(false);
    setIsLoadingThread(false);
    setThreadId(null);
    setArguingWith(null);
    setIsSkipDebateMode(false);
  };

  useEffect(() => {
    const handleLoadThread = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const tId = customEvent.detail?.threadId;
      if (!tId) return;
      
      setThreadId(tId);
      setMessages([]);
      setInput("");
      setIsThinking(false);
      setIsLoadingThread(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/api/v1/threads/${tId}/messages`, {
          headers: { "Authorization": `Bearer ${session?.access_token}` }
        });
        const data = await res.json();
        
        if (data?.data && Array.isArray(data.data)) {
          setMessages(data.data.map((m: any) => ({
            id: m.id,
            role: m.role === "assistant" || m.role === "fp" ? "council" : m.role,
            text: m.content,
            createdAt: m.created_at || m.createdAt
          })));
        }
      } catch (err) {
        console.error("Failed to load thread messages", err);
      } finally {
        setIsLoadingThread(false);
      }
    };

    window.addEventListener("new-thread", handleNewThread);
    window.addEventListener("load-thread", handleLoadThread);
    return () => {
      window.removeEventListener("new-thread", handleNewThread);
      window.removeEventListener("load-thread", handleLoadThread);
    };
  }, []);

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...filesArray]);

    filesArray.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreviews((prev) => [...prev, ""]);
      }
    });
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const matchedCommand = handleVoiceCommand(transcript);
          if (!matchedCommand) {
            setInput((prev) => (prev ? prev + " " + transcript : transcript));
          }
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    }
  };
  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if ((!textToSend.trim() && selectedFiles.length === 0) || isThinking) return;

    const domains = ["System Logic & Architecture", "Adversarial Code Audit", "Mathematics & Proofs", "Strategic Synthesis"];
    const matchedDomain = domains[Math.floor(Math.random() * domains.length)];
    setRoutingDomain(matchedDomain);
    setIsRoutingPulse(true);

    const userMessageText = textToSend.trim();
    const currentArguing = arguingWith;

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      text: currentArguing ? `[Argue with ${currentArguing.agent}]: ${userMessageText}` : userMessageText,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedFiles([]);
    setFilePreviews([]);
    setArguingWith(null);

    setTimeout(async () => {
      setIsRoutingPulse(false);
      setIsThinking(true);

      setTimeout(() => {
        const councilMsg: Message = {
          id: String(Date.now() + 1),
          role: "council",
          text: currentArguing 
            ? `The Council has audited your counter-argument against **${currentArguing.agent}**.\n\n### Council Adjudication\nYour point regarding *"${currentArguing.context.slice(0, 80)}..."* has been incorporated into the consensus matrix. The adversarial critique has been updated.`
            : `### Consensus Resolution\n\nThe Council has synthesized a verified, hallucination-resistant response for your query.\n\n` +
              `\`\`\`typescript\n// Verified Council Consensus Engine\nexport function executeConsensus() {\n  return { verified: true, rounds: ${isSkipDebateMode ? 1 : 2}, score: 0.98 };\n}\n\`\`\`\n\n` +
              `1. **Architectural Separation**: Separated deliberation loop from token generation.\n2. **Adversarial Assurance**: Cross-checked edge cases with DeepSeek R1.\n3. **Final Verdict**: Converged with zero unresolved contradictions.`,
          createdAt: new Date().toISOString(),
          hasDisagreement: !isSkipDebateMode,
          stageData: {
            supervisor: {
              domain: matchedDomain,
              confidence: 0.98,
              assignedLead: isAutoTeam ? "Claude 3.7 Sonnet" : (AVAILABLE_MODELS.find(m => m.id === selectedModelIds[0])?.name || "Lead Model"),
              assignedCritic: isAutoTeam ? "DeepSeek R1" : (AVAILABLE_MODELS.find(m => m.id === selectedModelIds[1])?.name || "Critic Model"),
              intent: isSkipDebateMode ? "Fast single-lead response" : "Full adversarial deliberation loop"
            },
            leadDraft: {
              agent: isAutoTeam ? "Claude 3.7 Sonnet" : "Custom Lead",
              content: "Initial draft proposing structural verification to eliminate single-pass monolithic failure modes."
            },
            critique: {
              agent: isAutoTeam ? "DeepSeek R1 (Adversarial Critic)" : "Custom Critic",
              identifiedFlaws: isSkipDebateMode ? [] : [
                "Potential latency overhead if asynchronous worker threads are not decoupled.",
                "Edge condition in fallback token distribution."
              ],
              critiqueContent: isSkipDebateMode ? "Debate skipped per quick answer override." : "Audited draft. Edge conditions resolved via secondary convergence pass.",
              rating: "Converged"
            },
            convergence: {
              rounds: isSkipDebateMode ? 1 : 2,
              consensusScore: 0.98,
              overruledDissent: isSkipDebateMode ? undefined : {
                agent: "DeepSeek R1",
                dissentPoint: "Advocated for AST syntax re-validation.",
                reasonOverruled: "Overruled: Syntax verified by parser in sub-millisecond layer."
              }
            }
          }
        };

        setMessages((prev) => [...prev, councilMsg]);
        setIsThinking(false);
      }, 1200);

    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInitial = messages.length === 0 && !isLoadingThread;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] relative overflow-hidden font-sans">

      {/* ── Top Floating Minimal Menu Dock with Downward Expanding Submenus ── */}
      <div className="fixed top-4 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto">
          <BottomMenu
            onNewChat={handleNewThread}
            onOpenFiles={() => setIsFileTreeOpen(true)}
            onOpenTeam={() => setIsTeamSelectorOpen(true)}
          />
        </div>
      </div>


      <TeamSelectorModal


        isOpen={isTeamSelectorOpen}
        onClose={() => setIsTeamSelectorOpen(false)}
        isAutoMode={isAutoTeam}
        selectedModelIds={selectedModelIds}
        onSelectAuto={() => {
          setIsAutoTeam(true);
          showToast("Council set to Auto (Supervisor decides)");
        }}
        onSelectManualTeam={(ids) => {
          setIsAutoTeam(false);
          setSelectedModelIds(ids);
          showToast(`Manual Council active: ${ids.length} models selected`);
        }}
      />

      {/* Section 6: File Tree Top-Down Shade & Code Viewer */}
      <FileTreeSlidePanel
        isOpen={isFileTreeOpen}
        onClose={() => setIsFileTreeOpen(false)}
        files={projectFiles}
        onAddFile={(newFile) => {
          setProjectFiles((prev) => [newFile, ...prev]);
          showToast(`Saved ${newFile.name} to workspace`);
        }}
      />

      {/* Floating Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#1c1c20] border border-white/20 text-white text-xs font-medium shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2"
          >
            <Sparkles className="size-3.5 text-purple-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Message Stream & Canvas Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-24 pb-12 flex flex-col">
        <div className="max-w-[760px] mx-auto px-4 md:px-8 flex-1 flex flex-col w-full">
          
          <AnimatePresence mode="wait">
            {isLoadingThread ? (
              <motion.div key="skeleton-thread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 space-y-4">
                <div className="skeleton-line h-12 w-3/4 rounded-2xl" />
                <div className="skeleton-line h-20 w-full rounded-2xl" />
              </motion.div>
            ) : isInitial ? (
              /* Center Canvas Greeting */
              <motion.div
                key="empty-greeting"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, y: -20, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col items-center justify-center -mt-12 select-none text-center px-4"
              >
                <div className="reveal-chat-item relative flex flex-col items-center justify-center w-full isolate text-center space-y-3 max-w-3xl px-4">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-['Instrument_Serif',serif] font-normal text-white tracking-tight leading-none mb-2 drop-shadow-[0_4px_30px_rgba(255,255,255,0.18)]">
                    Hi Ujjwal,
                  </h1>
                  
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-['Instrument_Serif',serif] font-normal text-white tracking-tight flex items-center justify-center gap-x-2.5 sm:gap-x-4 drop-shadow-[0_4px_30px_rgba(255,255,255,0.18)] whitespace-nowrap">
                    <span>ready to</span>
                    <span className="relative inline-flex items-center justify-center min-w-[85px] sm:min-w-[115px] md:min-w-[145px] lg:min-w-[165px] h-[44px] sm:h-[58px] md:h-[72px] lg:h-[82px]">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentWord}
                          initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
                          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                          exit={{ y: -20, opacity: 0, filter: "blur(5px)" }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 flex items-center justify-center font-['Instrument_Serif',serif] font-normal text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl italic"
                        >
                          {currentWord}
                        </motion.span>
                      </AnimatePresence>
                      
                      <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-white/15 overflow-hidden rounded-full">
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 50%, transparent 100%)",
                            backgroundSize: "200% 100%",
                          }}
                          animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                        />
                      </div>
                    </span>
                    <span>today?</span>
                  </h2>
                </div>

              </motion.div>
            ) : (
              /* Active Message Stream */
              <motion.div
                key="active-messages"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="py-4 space-y-6"
              >
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id} className="animate-message-reveal flex flex-col space-y-2">
                      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        {isUser ? (
                          <div className="bg-[#18181b] border border-white/10 text-white px-5 py-3 rounded-[22px] max-w-[85%] text-[14.5px] leading-relaxed shadow-lg">
                            {m.text}
                          </div>
                        ) : (
                          <div className="w-full space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GyroLogo size={18} />
                                <span className="text-xs font-semibold text-white tracking-wider uppercase">
                                  The Council
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(m.text);
                                  setCopiedId(m.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                              >
                                {copiedId === m.id ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                              </button>
                            </div>

                            {/* Show Your Work View & Replay */}
                            <ShowYourWorkView
                              mode={showYourWorkMode}
                              stageData={m.stageData}
                              onArgueWithAgent={(agent, context) => {
                                setArguingWith({ agent, context });
                                inputRef.current?.focus();
                                showToast(`Arguing with ${agent}`);
                              }}
                            />

                            <div className="text-zinc-100 text-[14.5px] leading-relaxed bg-[#0a0a0c]/60 p-4 rounded-2xl border border-white/5">
                              <MarkdownRenderer content={m.text} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section 7: Routing Visualization Pulse */}
          {isRoutingPulse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="my-4 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Brain className="size-4 text-purple-400 animate-spin" />
                <span className="text-xs text-purple-300 font-medium">
                  Supervisor Routing Pulse: <span className="text-white font-bold">{routingDomain}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-purple-400 animate-ping" />
                <span className="text-[10px] uppercase font-bold text-purple-400">Classifying</span>
              </div>
            </motion.div>
          )}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="py-4 flex items-center gap-3 animate-message-reveal">
              <GyroLogo size={20} />
              <span className="text-xs font-mono text-zinc-400 tracking-wider uppercase animate-pulse">
                Council Deliberating & Auditing...
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Section 7 & 8: Floating Input Bar Container */}
      <div className="relative z-20 pt-2 mb-8 sm:mb-10 max-w-3xl mx-auto w-full px-4 shrink-0">
        
        {/* Arguing with Agent Banner */}
        <AnimatePresence>
          {arguingWith && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquareQuote className="size-4 text-amber-400 shrink-0" />
                <span className="font-semibold truncate">Arguing with {arguingWith.agent}</span>
                <span className="text-[11px] text-zinc-400 truncate hidden sm:inline">
                  — &quot;{arguingWith.context.slice(0, 45)}...&quot;
                </span>
              </div>
              <button
                type="button"
                onClick={() => setArguingWith(null)}
                className="size-6 rounded-full hover:bg-amber-500/20 flex items-center justify-center text-amber-400"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Council Active Badge */}
        {!isAutoTeam && (
          <div className="mb-2 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-center justify-between w-fit">
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="size-3 text-blue-400" />
              Manual Council: {selectedModelIds.length} models active
            </span>
            <button
              onClick={() => setIsAutoTeam(true)}
              className="text-[10px] underline ml-2 text-zinc-400 hover:text-white"
            >
              Reset to Auto
            </button>
          </div>
        )}

        {/* Floating Capsule Input Console */}
        <div className="relative flex items-center gap-2 bg-[#09090b] rounded-[32px] px-3 py-2 border border-white/20 hover:border-white/30 transition-colors shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          
          {/* Plus / Attach Button */}
          <div className="relative shrink-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
              className={`size-10 rounded-full grid place-items-center transition-all duration-200 cursor-pointer active:scale-90 ${
                isAttachMenuOpen ? "bg-white/15 text-white" : "hover:bg-white/5 text-zinc-400 hover:text-white"
              }`}
              title="Attach media or files"
            >
              <Plus className={`size-5 transition-transform duration-200 ${isAttachMenuOpen ? "rotate-45" : ""}`} />
            </button>

            {/* Popover Menu */}
            <AnimatePresence>
              {isAttachMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute bottom-full left-0 mb-3 bg-[#141416] border border-white/15 rounded-[22px] p-1.5 flex flex-col shadow-[0_15px_40px_rgba(0,0,0,0.9)] min-w-[150px] z-50 overflow-hidden"
                >
                  <button 
                    onClick={() => { cameraInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-[13px] text-left cursor-pointer"
                  >
                    <Camera className="size-4 text-zinc-400" />
                    <span>Camera</span>
                  </button>
                  <button 
                    onClick={() => { photosInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-[13px] text-left cursor-pointer"
                  >
                    <Image className="size-4 text-zinc-400" />
                    <span>Photos</span>
                  </button>
                  <button 
                    onClick={() => { fileInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-[13px] text-left cursor-pointer"
                  >
                    <Paperclip className="size-4 text-zinc-400" />
                    <span>Files</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text Input Area */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 pb-1">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 text-xs text-zinc-300 pr-7">
                    <Paperclip className="size-3" />
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex-1 flex flex-col justify-center min-w-0 min-h-[26px]">
              {!(isInputFocused || input.length > 0) && (
                <div className="absolute inset-y-0 left-1 right-2 flex items-center pointer-events-none overflow-hidden h-full">
                  <span className="text-zinc-500 text-[14.5px] sm:text-[15.5px] truncate w-full">
                    {placeholders[placeholderIndex]}
                  </span>
                </div>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="w-full bg-transparent outline-none resize-none text-[15.5px] py-1 px-1 no-scrollbar text-white leading-relaxed"
                style={{ maxHeight: 120 }}
              />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
            <input type="file" accept="image/*,video/*" ref={photosInputRef} onChange={handleFileChange} multiple className="hidden" />
            <input type="file" accept="image/*" ref={cameraInputRef} onChange={handleFileChange} capture="environment" className="hidden" />
          </div>

          {/* Right Actions: Mic & Send */}
          <div className="shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleRecording}
              className={`size-10 rounded-full grid place-items-center cursor-pointer transition-all duration-300 active:scale-90 relative ${
                isRecording ? "bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
              title={isRecording ? "Stop listening" : "Speak voice command or prompt"}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full border border-red-500/50 animate-ping opacity-75" />
              )}
              <Mic className="size-5 relative z-10" />
            </button>

            <div className="relative">
              <button
                type="button"
                onMouseDown={() => {
                  sendButtonPressTimer.current = setTimeout(() => {
                    setIsLongPressMenuOpen(true);
                  }, 500);
                }}
                onMouseUp={() => clearTimeout(sendButtonPressTimer.current)}
                onTouchStart={() => {
                  sendButtonPressTimer.current = setTimeout(() => {
                    setIsLongPressMenuOpen(true);
                  }, 500);
                }}
                onTouchEnd={() => clearTimeout(sendButtonPressTimer.current)}
                onClick={() => {
                  if (!isLongPressMenuOpen) handleSend();
                }}
                disabled={!input.trim() && selectedFiles.length === 0}
                className={`size-10 rounded-full grid place-items-center transition-all cursor-pointer ${
                  !input.trim() && selectedFiles.length === 0
                    ? "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
                    : "bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] font-bold"
                }`}
                title="Send to The Council (Long press for Quick Answer override)"
              >
                <ArrowUp className="size-5 stroke-[2.5]" />
              </button>

              <AnimatePresence>
                {isLongPressMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-3 bg-[#18181b] border border-white/15 rounded-2xl p-2 shadow-2xl min-w-[200px] z-50 text-xs text-white space-y-1"
                  >
                    <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1">Routing Override</div>
                    <button
                      onClick={() => {
                        setIsSkipDebateMode(true);
                        setIsLongPressMenuOpen(false);
                        handleSend();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2"
                    >
                      <Zap className="size-3.5 text-yellow-400" />
                      <span>⚡ Quick Answer (Skip Debate)</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsSkipDebateMode(false);
                        setIsLongPressMenuOpen(false);
                        handleSend();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2"
                    >
                      <Shield className="size-3.5 text-purple-400" />
                      <span>🛡 Full Consensus (Deep Debate)</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Section 7: Subtext */}
        <div className="mt-3 text-center">
          <span className="font-sans text-[11px] text-zinc-500">
            The Council debates hard, but still double-check anything important.
          </span>
        </div>

      </div>

    </div>
  );
}
