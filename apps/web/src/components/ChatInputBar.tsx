"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, Mic, FileUp, Camera, Image as ImageIcon } from "lucide-react";
import { useTheme } from "next-themes";

export const ChatInputBar: React.FC = () => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const { theme } = useTheme();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const startTextRef = useRef("");

  const isIdle = !isFocused && !text && !isRecording;
  const hasText = text.trim().length > 0;

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          startTextRef.current = text;
        };

        recognitionRef.current.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setText((startTextRef.current ? startTextRef.current + " " : "") + transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setIsSpeechSupported(false);
      }
    }
  }, [text]);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRecording = () => {
    if (!isSpeechSupported) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize logic
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const isLightMode = theme === 'light';
  
  // Dynamic Background and Border based on theme and state
  const getBackgroundColor = () => {
    if (isLightMode) {
      return isFocused || isRecording ? "#f4f4f5" : "#ffffff";
    }
    return isFocused || isRecording ? "#141414" : "#000000";
  };
  
  const getBorderColor = () => {
    if (isLightMode) {
      return isFocused || isRecording ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)";
    }
    return isFocused || isRecording ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)";
  };

  return (
    <div className="relative w-full z-20">
      
      {/* Ambient Glow - Only visible when IDLE */}
      <AnimatePresence>
        {isIdle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute -inset-4 z-[-1] pointer-events-none"
          >
            <motion.div
              className={`w-full h-full rounded-full blur-[40px] ${isLightMode ? 'opacity-15' : 'opacity-20'}`}
              style={{
                background: "radial-gradient(circle, rgba(99,102,241,1) 0%, rgba(168,85,247,1) 50%, rgba(0,0,0,0) 100%)",
              }}
              animate={{
                x: [-15, 15, -15],
                y: [-10, 10, -10],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar Container */}
      <div 
        className={`relative flex items-end w-full rounded-[32px] p-1.5 sm:p-2 ${isLightMode ? 'shadow-lg' : 'shadow-2xl'} z-10`}
        style={{
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: "1px",
          borderStyle: "solid",
          transition: "background-color 0.3s ease-out, border-color 0.3s ease-out",
        }}
      >
        
        {/* Plus Button & Dropdown */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <Plus 
              className="w-5 h-5 transition-transform duration-200" 
              style={{ transform: isDropdownOpen ? "rotate(45deg)" : "rotate(0deg)" }} 
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full left-0 mb-3 w-48 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl py-2 shadow-xl overflow-hidden"
              >
                <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-normal text-zinc-700 dark:text-zinc-300 transition-colors text-left">
                  <FileUp className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Upload file
                </button>
                <button className="w-full flex sm:hidden items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-normal text-zinc-700 dark:text-zinc-300 transition-colors text-left">
                  <Camera className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Take photo
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-normal text-zinc-700 dark:text-zinc-300 transition-colors text-left">
                  <ImageIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Upload image
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text Input / Waveform */}
        <div className="flex-1 relative flex items-center px-2 min-h-[40px]">
          {isRecording ? (
            <div className="flex items-center gap-1.5 h-full py-2 w-full pl-2">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-black dark:bg-white rounded-full"
                  animate={{ height: ["20%", "100%", "20%"] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                  style={{ height: "20%" }}
                />
              ))}
              <span className="ml-3 text-sm font-normal text-zinc-500 dark:text-zinc-400 italic">Listening...</span>
            </div>
          ) : (
            <textarea 
              ref={inputRef}
              value={text}
              onChange={handleInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="What shall we build today?"
              className="w-full max-h-[200px] min-h-[24px] bg-transparent resize-none outline-none py-2.5 text-sm font-normal text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 leading-relaxed scrollbar-hide"
              rows={1}
            />
          )}
        </div>

        {/* Mic Button */}
        <div className="flex-shrink-0 relative flex items-center justify-center w-10 h-10 mr-1">
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/20"
              animate={{ scale: [1, 1.5], opacity: [1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <button 
            onClick={toggleRecording}
            className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-500/10 dark:text-red-400 dark:bg-red-400/10' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'} ${!isSpeechSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={!isSpeechSupported ? "Voice input not supported in this browser" : "Voice input"}
          >
            <Mic className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Send Button */}
        <button 
          disabled={!hasText && !isRecording}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${hasText ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer shadow-lg' : 'bg-black/5 text-zinc-400 dark:bg-white/10 dark:text-zinc-500 cursor-default'}`}
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>

      </div>
    </div>
  );
};

