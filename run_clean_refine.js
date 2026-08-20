const fs = require('fs');
const path = require('path');

const componentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fp_chat_components.json'), 'utf8'));
let chatViewCode = componentsData.find(d => d.file.includes('chat-view.tsx')).content;

// 1. Add Framer Motion imports
chatViewCode = chatViewCode.replace('import React, {', 'import { motion, AnimatePresence } from "framer-motion";\nimport React, {');

// 2. Add MORPH_WORDS & state
const morphStateCode = `
  const MORPH_WORDS = ["build", "solve", "debate", "decide", "create", "ship"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % MORPH_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const currentWord = MORPH_WORDS[currentWordIndex];
`;
chatViewCode = chatViewCode.replace('const [copiedId, setCopiedId] = useState<string | null>(null);', 'const [copiedId, setCopiedId] = useState<string | null>(null);\n' + morphStateCode);

// 3. Replace the entire JSX render block for the message area with AnimatePresence & optical center container
const oldStreamArea = `{/* ── Message stream area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-16">
        <div className="max-w-[720px] mx-auto px-4 md:px-8 min-h-full flex flex-col">
          
          {isLoadingThread ? (
            /* Skeleton Loading State for old thread */
            <div className="py-6 space-y-6 animate-message-reveal">
              {/* Skeleton: user message right-aligned */}
              <div className="flex justify-end">
                <div className="max-w-[65%] space-y-2">
                  <div className="skeleton-line h-[18px] w-[220px] ml-auto" />
                  <div className="skeleton-line h-[18px] w-[160px] ml-auto" />
                </div>
              </div>
              {/* Skeleton: AI message left-aligned */}
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-2.5">
                  <div className="skeleton-line h-[16px] w-[300px]" />
                  <div className="skeleton-line h-[16px] w-[260px]" />
                  <div className="skeleton-line h-[16px] w-[340px]" />
                  <div className="skeleton-line h-[16px] w-[200px]" />
                </div>
              </div>
              {/* Skeleton: another user message */}
              <div className="flex justify-end">
                <div className="max-w-[65%] space-y-2">
                  <div className="skeleton-line h-[18px] w-[180px] ml-auto" />
                </div>
              </div>
              {/* Skeleton: another AI response */}
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-2.5">
                  <div className="skeleton-line h-[16px] w-[280px]" />
                  <div className="skeleton-line h-[16px] w-[320px]" />
                  <div className="skeleton-line h-[16px] w-[240px]" />
                </div>
              </div>
            </div>
          ) : isInitial ? (
            /* Minimalist Empty State */
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
              <div 
                className="reveal-chat-item relative flex flex-col items-center justify-center w-full isolate"
                style={{ animationDelay: "50ms" }}
              >
                <h2 className="text-[28px] md:text-[36px] font-medium tracking-tight text-white text-center font-sans leading-tight relative z-10 pb-0.5">
                  {greeting.text}
                </h2>
                <h2 
                  className={\`text-[28px] md:text-[36px] font-medium tracking-tight text-center font-sans leading-tight text-[#ffffff] relative z-10 pb-2 \${greeting.animateAccent ? 'shimmer-text-white' : ''}\`} 
                  style={{ textShadow: "0 0 15px rgba(255,255,255,0.3)" }}
                >
                  {greeting.accent}
                </h2>
              </div>
            </div>
          ) : (`;

const newStreamArea = `{/* ── Message stream area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-16 flex flex-col">
        <div className="max-w-[720px] mx-auto px-4 md:px-8 flex-1 flex flex-col w-full">
          
          <AnimatePresence mode="wait">
          {isLoadingThread ? (
            /* Skeleton Loading State for old thread */
            <motion.div 
              key="thread-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 space-y-6 animate-message-reveal"
            >
              {/* Skeleton: user message right-aligned */}
              <div className="flex justify-end">
                <div className="max-w-[65%] space-y-2">
                  <div className="skeleton-line h-[18px] w-[220px] ml-auto" />
                  <div className="skeleton-line h-[18px] w-[160px] ml-auto" />
                </div>
              </div>
              {/* Skeleton: AI message left-aligned */}
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-2.5">
                  <div className="skeleton-line h-[16px] w-[300px]" />
                  <div className="skeleton-line h-[16px] w-[260px]" />
                  <div className="skeleton-line h-[16px] w-[340px]" />
                  <div className="skeleton-line h-[16px] w-[200px]" />
                </div>
              </div>
              {/* Skeleton: another user message */}
              <div className="flex justify-end">
                <div className="max-w-[65%] space-y-2">
                  <div className="skeleton-line h-[18px] w-[180px] ml-auto" />
                </div>
              </div>
              {/* Skeleton: another AI response */}
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-2.5">
                  <div className="skeleton-line h-[16px] w-[280px]" />
                  <div className="skeleton-line h-[16px] w-[320px]" />
                  <div className="skeleton-line h-[16px] w-[240px]" />
                </div>
              </div>
            </motion.div>
          ) : isInitial ? (
            /* Optical Center Container & Council Kinetic Morph Headline */
            <motion.div
              key="empty-greeting"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, y: -20, filter: "blur(6px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col items-center justify-center -mt-12 select-none text-center px-4"
            >
              <div 
                className="reveal-chat-item relative flex flex-col items-center justify-center w-full isolate text-center space-y-2 max-w-2xl px-4"
                style={{ animationDelay: "50ms" }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-['Instrument_Serif',serif] font-normal text-white tracking-tight leading-none mb-2 drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
                  Hi Ujjwal,
                </h1>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Instrument_Serif',serif] font-normal text-white tracking-tight flex flex-wrap items-center justify-center gap-x-3 gap-y-1 drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
                  <span>ready to</span>
                  <span className="relative inline-flex items-center justify-center min-w-[90px] sm:min-w-[110px] md:min-w-[130px] h-[36px] sm:h-[44px] md:h-[52px]">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={currentWord}
                        initial={{ y: 16, opacity: 0, filter: "blur(4px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        exit={{ y: -16, opacity: 0, filter: "blur(4px)" }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 flex items-center justify-center font-['Instrument_Serif',serif] font-normal text-white text-3xl sm:text-4xl md:text-5xl italic"
                      >
                        {currentWord}
                      </motion.span>
                    </AnimatePresence>
                    
                    {/* Animated Shimmer Underline */}
                    <div className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-white/10 overflow-hidden rounded-full">
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)",
                          backgroundSize: "200% 100%",
                        }}
                        animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      />
                    </div>
                  </span>
                  <span>something today?</span>
                </h2>
              </div>
            </motion.div>
          ) : (`;

chatViewCode = chatViewCode.replace(oldStreamArea, newStreamArea);

// Add motion.div to the active messages list
chatViewCode = chatViewCode.replace('/* Messages list (bubbleless, flat style) */\n            <div className="py-4 space-y-4">', '/* Messages list (bubbleless, flat style) */\n            <motion.div key="active-messages" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="py-4 space-y-4">');

// Replace closing tag of messages list to close motion.div and AnimatePresence
const oldClosingOfMessages = '                    </div>\n                  </div>\n                );\n              })}\n\n              {/* Thinking / Streaming Indicator */}';
const newClosingOfMessages = '                    </div>\n                  </div>\n                );\n              })}\n            </motion.div>\n          )}\n          </AnimatePresence>\n\n          {/* Thinking / Streaming Indicator */}';

chatViewCode = chatViewCode.replace(oldClosingOfMessages, newClosingOfMessages);

// Remove duplicate closing tags before the input container
chatViewCode = chatViewCode.replace('            </div>\n          )}\n\n        </div>\n      </div>\n\n      {/* ── Input Box', '        </div>\n      </div>\n\n      {/* ── Input Box');

// 4. Update the bottom floating input bar container elevation
const oldBottomInputWrapper = `<div 
        className="shrink-0 px-4 md:px-8 pt-2 bg-[#000000] relative z-10"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div 
          className="reveal-chat-item max-w-[720px] w-full mx-auto"
          style={{ animationDelay: "550ms" }}
        >`;

const newBottomInputWrapper = `<div className="relative z-20 pt-2 mb-8 sm:mb-10 max-w-3xl mx-auto w-full px-4 shrink-0">
        <div 
          className="reveal-chat-item w-full mx-auto"
          style={{ animationDelay: "550ms" }}
        >`;

chatViewCode = chatViewCode.replace(oldBottomInputWrapper, newBottomInputWrapper);

// 5. Update Attachment popover menu with AnimatePresence
const oldAttachPopover = `{/* Attachment Menu Popover */}
              {isAttachMenuOpen && (
                <div className="absolute bottom-full left-0 mb-4 bg-[#1a1b1e] rounded-[24px] p-2 flex flex-col shadow-2xl min-w-[160px] animate-scale-in origin-bottom-left z-50 overflow-hidden max-h-[50vh] overflow-y-auto">
                  <div className="flex flex-col gap-1 animate-fade-in">
                    <button 
                      onClick={() => { cameraInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#d4d4d8] hover:text-white transition-colors text-[14px] text-left cursor-pointer"
                    >
                      <Camera className="size-[18px]" />
                      <span>Camera</span>
                    </button>
                    <button 
                      onClick={() => { photosInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#d4d4d8] hover:text-white transition-colors text-[14px] text-left cursor-pointer"
                    >
                      <Image className="size-[18px]" />
                      <span>Photos</span>
                    </button>
                    <button 
                      onClick={() => { fileInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#d4d4d8] hover:text-white transition-colors text-[14px] text-left cursor-pointer"
                    >
                      <Paperclip className="size-[18px]" />
                      <span>Files</span>
                    </button>
                  </div>
                </div>
              )}`;

const newAttachPopover = `{/* Attachment Menu Popover */}
              <AnimatePresence>
                {isAttachMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute bottom-full left-0 mb-3 bg-[#18181b] border border-white/15 rounded-[22px] p-1.5 flex flex-col shadow-[0_15px_40px_rgba(0,0,0,0.9)] min-w-[150px] z-50 overflow-hidden"
                  >
                    <button 
                      onClick={() => { cameraInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-[#d4d4d8] hover:text-white transition-colors text-[13.5px] text-left cursor-pointer"
                    >
                      <Camera className="size-[17px] text-zinc-400" />
                      <span>Camera</span>
                    </button>
                    <button 
                      onClick={() => { photosInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-[#d4d4d8] hover:text-white transition-colors text-[13.5px] text-left cursor-pointer"
                    >
                      <Image className="size-[17px] text-zinc-400" />
                      <span>Photos</span>
                    </button>
                    <button 
                      onClick={() => { fileInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-[#d4d4d8] hover:text-white transition-colors text-[13.5px] text-left cursor-pointer"
                    >
                      <Paperclip className="size-[17px] text-zinc-400" />
                      <span>Files</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>}`;

chatViewCode = chatViewCode.replace(oldAttachPopover, newAttachPopover);

// 6. Subtext update
chatViewCode = chatViewCode.replace('Lumensky helps you execute faster, but always double-check the details.', 'The Council can make mistakes. Verify important information.');

fs.writeFileSync(path.join(__dirname, 'apps', 'web', 'src', 'components', 'chat-view.tsx'), chatViewCode, 'utf8');
console.log('Done chat-view refine');
