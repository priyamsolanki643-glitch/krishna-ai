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
import { GlobalStore } from "@/lib/store";
import { FileTreeSlidePanel, DEFAULT_PROJECT_FILES, ProjectFile } from "./FileTreeSlidePanel";
import { ShowYourWorkView, ShowYourWorkMode, AgentStageData } from "./ShowYourWorkView";
import { AIChatInput } from "./ui/ai-chat-input";
import { InteractiveStarfield } from "./ui/interactive-starfield";
import { SettingsDrawer, ApiKeyHalfSheet } from "./ui/settings-drawer";
import { AuthModal } from "./AuthModal";
import { ProcessPipelineBox, ProcessStepItem } from "./ui/process-pipeline-box";


interface Message {
  id: string;
  role: "user" | "council" | "fp";
  text: string;
  createdAt: string;
  stageData?: AgentStageData;
  hasDisagreement?: boolean;
  pipelineSteps?: ProcessStepItem[];
}

interface ChatViewProps {
  onOpenSidebar: () => void;
  onOpenVault: () => void;
  isAnonymous?: boolean;
  theme?: "dark" | "light";
  onThemeChange?: (t: "dark" | "light") => void;
}
export function ChatView({ onOpenSidebar, onOpenVault, isAnonymous, theme = "dark", onThemeChange }: ChatViewProps) {
  const isLight = theme === "light";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  
  // Section 1 & 2: Show Your Work Mode
  const [showYourWorkMode, setShowYourWorkMode] = useState<ShowYourWorkMode>("council");

  // Section 5: Team / Model Selector
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);
  const [isAutoTeam, setIsAutoTeam] = useState(true);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(["reasoning", "coding"]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiKeySheetOpen, setIsApiKeySheetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleOpenApiKeys = () => setIsApiKeySheetOpen(true);
    window.addEventListener("open-settings", handleOpenSettings);
    window.addEventListener("open-api-keys", handleOpenApiKeys);
    return () => {
      window.removeEventListener("open-settings", handleOpenSettings);
      window.removeEventListener("open-api-keys", handleOpenApiKeys);
    };
  }, []);

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
    }, 1400);
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

    const handleOpenAddFile = () => {
      setIsFileTreeOpen(true);
    };

    window.addEventListener("new-thread", handleNewThread);
    window.addEventListener("load-thread", handleLoadThread);
    window.addEventListener("open-add-file", handleOpenAddFile);
    const handleOpenFileTree = () => {
      setIsFileTreeOpen(true);
    };
    window.addEventListener("open-file-tree", handleOpenFileTree);
    return () => {
      window.removeEventListener("new-thread", handleNewThread);
      window.removeEventListener("load-thread", handleLoadThread);
      window.removeEventListener("open-add-file", handleOpenAddFile);
      window.removeEventListener("open-file-tree", handleOpenFileTree);
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
  const handleSend = async (customText?: string, sendOptions?: { selectedAgents?: string[]; debateMode?: string; maxRounds?: number }) => {
    const textToSend = customText || input;
    if ((!textToSend.trim() && selectedFiles.length === 0) || isThinking) return;

    // Check Guest 3-message Trial Limit
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("userAuth") === "true";
      if (!isAuth) {
        const guestCount = Number(sessionStorage.getItem("guest_chat_count") || "0");
        if (guestCount >= 3) {
          setAuthModalMessage("You have completed your 3 free guest deliberations. Sign up to unlock unlimited multi-agent consensus.");
          setIsAuthModalOpen(true);
          return;
        }
        sessionStorage.setItem("guest_chat_count", String(guestCount + 1));
      }
    }

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
    setIsThinking(true);
    setIsRoutingPulse(true);

    // Initial placeholder council message to stream stageData and content into
    const councilMsgId = String(Date.now() + 1);
    const initialCouncilMsg: Message = {
      id: councilMsgId,
      role: "council",
      text: "",
      createdAt: new Date().toISOString(),
      hasDisagreement: false,
      stageData: undefined,
      pipelineSteps: [
        { id: "hearing", label: "Hearing you out", iconName: "hearing", status: "active" }
      ]
    };

    setMessages((prev) => [...prev, initialCouncilMsg]);

    try {
      let userGroqKey = "";
      let userOpenaiKey = "";
      let userAnthropicKey = "";
      let debateMode = sendOptions?.debateMode || (isSkipDebateMode ? "fast" : "deep");
      let maxRounds = sendOptions?.maxRounds || (isSkipDebateMode ? 1 : GlobalStore.maxRounds);

      if (typeof window !== "undefined") {
        userGroqKey = GlobalStore.groqKey;
        userOpenaiKey = GlobalStore.openaiKey;
        userAnthropicKey = GlobalStore.anthropicKey;
        if (!sendOptions?.debateMode) {
          debateMode = GlobalStore.debateMode;
        }
      }

      const activeAgents = sendOptions?.selectedAgents || (isAutoTeam ? [] : selectedModelIds);

      // Handle Argue Flow directly via backend argue endpoint
      if (currentArguing) {
        const baseUrl = process.env.NEXT_PUBLIC_COUNCIL_API_URL || "https://the-council-api-1083682147747.us-central1.run.app";
        const argueRes = await fetch(`${baseUrl}/api/chat/argue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(userGroqKey ? { "x-user-groq-key": userGroqKey } : {})
          },
          body: JSON.stringify({
            originalQueryId: (currentArguing as any).queryId || "session-query",
            targetAgent: currentArguing.agent?.toLowerCase().includes("critic") ? "critic" : "lead",
            userArgument: userMessageText
          })
        });

        setIsRoutingPulse(false);

        if (!argueRes.ok) {
          const errData = await argueRes.json().catch(() => ({}));
          throw new Error(errData.error || `Argue pipeline failed (${argueRes.status})`);
        }

        const argueData = await argueRes.json();
        const ruling = argueData.ruling || {};

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === councilMsgId
              ? {
                  ...msg,
                  text: ruling.updatedAnswer || `${ruling.verdict === "argument_accepted" ? "✅ **Argument Accepted**" : "❌ **Original Stance Maintained**"}\n\n${ruling.explanation}`,
                  hasDisagreement: ruling.verdict === "argument_accepted",
                  stageData: {
                    supervisor: {
                      domain: "Supervisor Arbitration",
                      confidence: 0.99,
                      assignedLead: "Supervisor Arbiter",
                      assignedCritic: "Adversarial Reviewer",
                      intent: "Evaluate user counter-argument"
                    },
                    leadDraft: {
                      agent: "Supervisor Adjudicator",
                      content: ruling.explanation
                    },
                    critique: {
                      agent: "Council Arbiter",
                      identifiedFlaws: ruling.verdict === "argument_accepted" ? ["Previous consensus adjusted based on user feedback."] : [],
                      critiqueContent: ruling.explanation,
                      rating: ruling.verdict
                    },
                    convergence: {
                      rounds: 1,
                      consensusScore: 0.99
                    }
                  }
                }
              : msg
          )
        );
        return;
      }

      // Main Live SSE Deliberation Stream
      const baseUrl = process.env.NEXT_PUBLIC_COUNCIL_API_URL || "https://the-council-api-1083682147747.us-central1.run.app";
      const res = await fetch(`${baseUrl}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userGroqKey ? { "x-user-groq-key": userGroqKey } : {})
        },
        body: JSON.stringify({
          query: userMessageText,
          manualAgents: activeAgents,
          debateMode,
          maxRounds
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Council pipeline error (${res.status})`);
      }

      if (!res.body) {
        throw new Error("No response body received from stream.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let currentSupervisor: any = undefined;
      let currentLeadDraft: any = undefined;
      let currentCritique: any = undefined;
      let currentConvergence: any = undefined;
      let currentPipelineSteps: ProcessStepItem[] = [
        { id: "hearing", label: "Hearing you out", iconName: "hearing", status: "active" }
      ];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          if (!block.trim()) continue;
          let eventName = "message";
          let dataStr = "";

          for (const line of block.split("\n")) {
            if (line.startsWith("event: ")) {
              eventName = line.replace("event: ", "").trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.replace("data: ", "").trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (eventName === "error") {
              throw new Error(data.message || data.error || "Deliberation error occurred.");
            }

            if (eventName === "thinking") {
              setIsRoutingPulse(false);
              const stage = data.stage;

              if (stage === "supervisor") {
                currentPipelineSteps = [
                  { id: "hearing", label: "Hearing you out", iconName: "hearing", status: "completed" },
                  { id: "supervisor", label: "Convening the right minds", iconName: "supervisor", status: "active" }
                ];
              } else if (stage === "supervisor_complete" || stage === "manual_agent_selection") {
                const domainName = data.domain || (data.manualAgents ? data.manualAgents[0] : "general");
                const domainLabel = `${domainName.charAt(0).toUpperCase() + domainName.slice(1)} Agent steps up`;
                setRoutingDomain(domainName);
                currentSupervisor = {
                  domain: domainName,
                  confidence: data.confidence || 0.98,
                  assignedLead: data.assignedLead || "openai/gpt-oss-120b",
                  assignedCritic: data.assignedCritic || "meta-llama/llama-3.3-70b-versatile",
                  intent: data.tone_instruction || data.message || `Routing Mode: ${data.routingMode || "auto"}`
                };
                currentPipelineSteps = [
                  { id: "hearing", label: "Hearing you out", iconName: "hearing", status: "completed" },
                  { id: "supervisor", label: "Convening the right minds", iconName: "supervisor", status: "completed" },
                  { id: "domain", label: domainLabel, iconName: "domain", domain: domainName, status: "active" }
                ];
              } else if (stage === "researching" || stage === "research_complete") {
                currentLeadDraft = {
                  agent: `Web Research (${(data.provider || "tavily").toUpperCase()})`,
                  content: data.message || "Grounded live web research conducted."
                };
              } else if (stage === "lead_drafting" || stage === "fast_mode_direct_answer" || stage === "round_start" || stage === "debate_start") {
                currentLeadDraft = {
                  agent: data.data?.model || (data.team_domain ? `Lead (${data.team_domain})` : "Lead Agent (openai/gpt-oss-120b)"),
                  content: data.data?.content || data.message || "Synthesizing deep structured proposal..."
                };
                currentPipelineSteps = currentPipelineSteps.map((s) => ({ ...s, status: "completed" as const }));
                if (!currentPipelineSteps.some((s) => s.id === "lead")) {
                  currentPipelineSteps.push({ id: "lead", label: "Drafting the first take", iconName: "lead", status: "active" });
                } else {
                  currentPipelineSteps = currentPipelineSteps.map((s) => s.id === "lead" ? { ...s, status: "active" as const } : s);
                }
              } else if (stage === "reviewer_critiquing" || stage === "reviewer_reviewing") {
                currentPipelineSteps = currentPipelineSteps.map((s) => ({ ...s, status: "completed" as const }));
                if (!currentPipelineSteps.some((s) => s.id === "reviewer")) {
                  currentPipelineSteps.push({ id: "reviewer", label: "A second opinion weighs in", iconName: "reviewer", status: "active" });
                } else {
                  currentPipelineSteps = currentPipelineSteps.map((s) => s.id === "reviewer" ? { ...s, status: "active" as const } : s);
                }
              } else if (stage === "round_complete" || stage === "critic_revising" || stage === "critic_reviewing") {
                const criticObjection = data.data?.objection || data.data?.issue || data.objection;
                const criticContent = criticObjection 
                  ? `Critique: ${criticObjection}` 
                  : (data.data?.suggested_fix ? `Audited: ${data.data.suggested_fix}` : (data.message || "Audited logical flaws and edge cases."));
                currentCritique = {
                  agent: data.data?.model || "Adversarial Critic (meta-llama/llama-3.3-70b-versatile)",
                  identifiedFlaws: criticObjection ? [criticObjection] : [],
                  critiqueContent: criticContent,
                  rating: data.data?.verdict || "Approved"
                };
                currentPipelineSteps = currentPipelineSteps.map((s) => ({ ...s, status: "completed" as const }));
                if (!currentPipelineSteps.some((s) => s.id === "critic")) {
                  currentPipelineSteps.push({ id: "critic", label: "Stress-testing the answer", iconName: "critic", status: "active" });
                } else {
                  currentPipelineSteps = currentPipelineSteps.map((s) => s.id === "critic" ? { ...s, status: "active" as const } : s);
                }
              } else if (stage === "response_architect" || stage === "compiler_synthesis") {
                currentPipelineSteps = currentPipelineSteps.map((s) => ({ ...s, status: "completed" as const }));
                if (!currentPipelineSteps.some((s) => s.id === "architect")) {
                  currentPipelineSteps.push({ id: "architect", label: "Polishing the response", iconName: "architect", status: "active" });
                } else {
                  currentPipelineSteps = currentPipelineSteps.map((s) => s.id === "architect" ? { ...s, status: "active" as const } : s);
                }
              }

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === councilMsgId
                    ? {
                        ...msg,
                        pipelineSteps: [...currentPipelineSteps],
                        stageData: {
                          supervisor: currentSupervisor,
                          leadDraft: currentLeadDraft,
                          critique: currentCritique,
                          convergence: currentConvergence
                        }
                      }
                    : msg
                )
              );
            } else if (eventName === "message") {
              setIsRoutingPulse(false);
              setIsThinking(false);

              currentConvergence = {
                rounds: data.rounds || 1,
                consensusScore: 0.98
              };

              currentPipelineSteps = currentPipelineSteps.map((s) => ({ ...s, status: "completed" as const }));

              // Sanitize final text: Strip any raw <think> tags or JSON artefacts
              let cleanText = data.content || "";
              cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === councilMsgId
                    ? {
                        ...msg,
                        text: cleanText,
                        hasDisagreement: Boolean(data.critic_flagged),
                        pipelineSteps: [...currentPipelineSteps],
                        stageData: {
                          supervisor: currentSupervisor || {
                            domain: data.domain || "Multi-Agent Deliberation",
                            confidence: 0.98,
                            assignedLead: "openai/gpt-oss-120b",
                            assignedCritic: "meta-llama/llama-3.3-70b-versatile",
                            intent: `Consensus verified (${data.routingMode || "auto"} mode)`
                          },
                          leadDraft: currentLeadDraft || {
                            agent: "Lead Agent (openai/gpt-oss-120b)",
                            content: `Proposal refined across ${data.rounds || 1} round(s).`
                          },
                          critique: currentCritique || {
                            agent: "Adversarial Critic",
                            identifiedFlaws: [],
                            critiqueContent: data.critic_flagged ? "Identified and refined edge cases." : "Verified without critical objections.",
                            rating: data.critic_flagged ? "Critique Applied" : "Approved"
                          },
                          convergence: currentConvergence,
                          sources: data.sources || []
                        }
                      }
                    : msg
                )
              );
            }
          } catch (parseErr: any) {
            console.warn("SSE Event parse error:", parseErr);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to generate council response:", err);
      setIsRoutingPulse(false);
      setIsThinking(false);

      const friendlyError = err.message?.includes("exceeds maximum")
        ? `⚠️ **Input Validation Error**: Query exceeds maximum allowed length of 4,000 characters.`
        : err.message?.includes("Invalid Groq API key")
        ? `⚠️ **API Key Error**: Your custom Groq API key was rejected by the provider. Please update it in Settings.`
        : err.message?.includes("Too Many Requests")
        ? `⚠️ **Rate Limit Exceeded**: Too many requests. Please throttle your prompts.`
        : `**Council Notice**: Connection interrupted: ${err.message || "Network error"}. Please check your connection or retry.`;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === councilMsgId
            ? {
                ...msg,
                text: friendlyError
              }
            : msg
        )
      );
    } finally {
      setIsThinking(false);
      setIsRoutingPulse(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInitial = messages.length === 0 && !isLoadingThread;

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden font-sans transition-colors duration-150 ${
      isLight ? "bg-[#ffffff] text-zinc-950" : "bg-[#000000] text-white"
    }`}>

      {/* Dynamic Twitter/X Interactive Starfield with 600ms Fade-to-Pitch-Black when chat starts */}
      <InteractiveStarfield active={isInitial} particleCount={650} speed={0.35} />

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

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
      />

      <ApiKeyHalfSheet
        isOpen={isApiKeySheetOpen}
        onClose={() => setIsApiKeySheetOpen(false)}
        theme={theme}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="signup"
        customMessage={authModalMessage}
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
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col items-center justify-center -mt-12 select-none text-center px-4 relative overflow-hidden"
              >
                {/* StarBackground handles stars at page level now */}

                <div className="reveal-chat-item relative z-10 flex flex-col items-center justify-center w-full isolate text-center space-y-3 max-w-3xl px-4">
                  <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-['Instrument_Serif',serif] font-normal tracking-tight leading-none mb-2 ${
                    isLight ? "text-zinc-950" : "text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.18)]"
                  }`}>
                    Hi Ujjwal,
                  </h1>
                  
                  <h2 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-['Instrument_Serif',serif] font-normal tracking-tight flex items-center justify-center gap-x-2.5 sm:gap-x-4 whitespace-nowrap ${
                    isLight ? "text-zinc-900" : "text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.18)]"
                  }`}>
                    <span>ready to</span>
                    <span className="relative inline-flex items-center justify-center min-w-[85px] sm:min-w-[115px] md:min-w-[145px] lg:min-w-[165px] h-[44px] sm:h-[58px] md:h-[72px] lg:h-[82px]">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentWord}
                          initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
                          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                          exit={{ y: -20, opacity: 0, filter: "blur(5px)" }}
                          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                          className={`absolute inset-0 flex items-center justify-center font-['Instrument_Serif',serif] font-normal text-4xl sm:text-5xl md:text-6xl lg:text-7xl italic ${
                            isLight ? "text-zinc-950" : "text-white"
                          }`}
                        >
                          {currentWord}
                        </motion.span>
                      </AnimatePresence>
                      
                      <div className={`absolute -bottom-1 left-0 right-0 h-[2px] overflow-hidden rounded-full ${
                        isLight ? "bg-zinc-200" : "bg-white/15"
                      }`}>
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: isLight
                              ? "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.7) 50%, transparent 100%)"
                              : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 50%, transparent 100%)",
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
                transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="py-4 space-y-6"
              >
                {messages.map((m, idx) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id} className="animate-message-reveal flex flex-col space-y-2">
                      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        {isUser ? (
                          editingMessageId === m.id ? (
                            <div className="w-full max-w-2xl bg-[#121215] border border-white/20 p-3.5 rounded-2xl space-y-3 shadow-2xl">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 text-sm outline-none resize-none focus:border-white/30"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 text-xs font-medium">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editText.trim()) {
                                      setEditingMessageId(null);
                                      handleSend(editText.trim());
                                    }
                                  }}
                                  disabled={!editText.trim()}
                                  className="px-4 py-1.5 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,255,255,0.3)] disabled:opacity-50"
                                >
                                  Save & Submit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end group max-w-[85%]">
                              <div className="bg-[#18181b] border border-white/10 text-white px-5 py-3 rounded-[22px] text-[14.5px] leading-relaxed shadow-lg">
                                {m.text}
                              </div>
                              {/* User Actions Toolbar (Edit, Copy) */}
                              <div className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(m.id);
                                    setEditText(m.text.replace(/^\[Argue with .*?\]:\s*/, ""));
                                  }}
                                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                                  title="Edit message"
                                >
                                  <Edit className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(m.text);
                                    setCopiedId(m.id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                                  title="Copy text"
                                >
                                  {copiedId === m.id ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="w-full space-y-2 group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GyroLogo size={18} />
                                <span className="text-xs font-semibold text-white tracking-wider uppercase">
                                  The Council
                                </span>
                              </div>

                              {/* Council Action Toolbar (Retry, Copy) */}
                              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const prevUserMsg = [...messages].reverse().find((msg) => msg.role === "user");
                                    if (prevUserMsg) handleSend(prevUserMsg.text.replace(/^\[Argue with .*?\]:\s*/, ""));
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  title="Regenerate / Retry response"
                                >
                                  <RefreshCw className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(m.text);
                                    setCopiedId(m.id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  title="Copy response"
                                >
                                  {copiedId === m.id ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Claude-Style Collapsible Process & Citations Box */}
                            {m.pipelineSteps && m.pipelineSteps.length > 0 && (
                              <ProcessPipelineBox
                                steps={m.pipelineSteps}
                                stageData={m.stageData}
                                isStreaming={isThinking && idx === messages.length - 1}
                                onArgueWithAgent={(agent, context) => {
                                  setArguingWith({ agent, context });
                                  inputRef.current?.focus();
                                  showToast(`Arguing with ${agent}`);
                                }}
                                theme={theme}
                              />
                            )}

                            {(m.text || (!isThinking || idx !== messages.length - 1)) && (
                              <div className="text-zinc-100 text-[14.5px] leading-relaxed bg-[#0a0a0c]/60 p-4 rounded-2xl border border-white/5">
                                <MarkdownRenderer content={m.text} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

          </AnimatePresence>
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

        {/* Modern Interactive AIChatInput Console */}
        <AIChatInput
          value={input}
          onChange={setInput}
          onSend={(text, options) => {
            handleSend(text, {
              selectedAgents: options?.selectedAgents || selectedModelIds,
              debateMode: options?.debateMode,
            });
          }}
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
          onCameraClick={() => cameraInputRef.current?.click()}
          onPhotosClick={() => photosInputRef.current?.click()}
          onFilesClick={() => fileInputRef.current?.click()}
          selectedFiles={selectedFiles}
          onRemoveFile={removeSelectedFile}
          selectedAgentIds={selectedModelIds}
          onSelectedAgentsChange={(ids) => {
            setSelectedModelIds(ids);
            setIsAutoTeam(false);
          }}
          theme={theme}
          disabled={isThinking}
        />



        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
        <input type="file" accept="image/*,video/*" ref={photosInputRef} onChange={handleFileChange} multiple className="hidden" />
        <input type="file" accept="image/*" ref={cameraInputRef} onChange={handleFileChange} capture="environment" className="hidden" />

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

