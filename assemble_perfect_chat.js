const fs = require('fs');
const path = require('path');

const originalFile = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fp_chat_components.json'), 'utf8'))
  .find(d => d.file.includes('chat-view.tsx')).content;

// Parse the parts of originalFile
// 1. Header & imports
let code = originalFile.replace('import React, {', 'import { motion, AnimatePresence } from "framer-motion";\nimport React, {');

// 2. Add MORPH state
const morphState = `
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
code = code.replace('const [copiedId, setCopiedId] = useState<string | null>(null);', 'const [copiedId, setCopiedId] = useState<string | null>(null);\n' + morphState);

// 3. Extract the message area parts
const streamStartMarker = '{/* ── Message stream area ── */}';
const inputStartMarker = '{/* ── Input Box (Trajectory Forge copy) ── */}';

const beforeStream = code.slice(0, code.indexOf(streamStartMarker));
const streamSection = code.slice(code.indexOf(streamStartMarker), code.indexOf(inputStartMarker));
const afterInput = code.slice(code.indexOf(inputStartMarker));

// In streamSection, replace the conditional rendering:
// Replace isLoadingThread ? ( ... ) : isInitial ? ( ... ) : ( ... ) with AnimatePresence & motion.divs
const oldEmptyState = `          ) : isInitial ? (
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

const newEmptyState = `          ) : isInitial ? (
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

let refinedStream = streamSection.replace(oldEmptyState, newEmptyState);
refinedStream = refinedStream.replace('<div className="max-w-[720px] mx-auto px-4 md:px-8 min-h-full flex flex-col">', '<div className="max-w-[720px] mx-auto px-4 md:px-8 flex-1 flex flex-col w-full">\n          <AnimatePresence mode="wait">');
refinedStream = refinedStream.replace('<div className="py-6 space-y-6 animate-message-reveal">', '<motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 space-y-6 animate-message-reveal">');
refinedStream = refinedStream.replace('            </div>\n          ) : isInitial ? (', '            </motion.div>\n          ) : isInitial ? (');
refinedStream = refinedStream.replace('<div className="py-4 space-y-4">', '<motion.div key="messages" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="py-4 space-y-4">');

// Replace the closing of the message stream before Thinking indicator
const oldCloseOfMessages = '                    </div>\n                  </div>\n                );\n              })}\n            </div>\n          )}';
const newCloseOfMessages = '                    </div>\n                  </div>\n                );\n              })}\n            </motion.div>\n          )}\n          </AnimatePresence>';

refinedStream = refinedStream.replace(oldCloseOfMessages, newCloseOfMessages);

// 4. Refine afterInput (Bottom input box & attachment popover)
let refinedInput = afterInput;

// Replace input container
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
refinedInput = refinedInput.replace(oldBottomInputWrapper, newBottomInputWrapper);

// Replace attachment popover with AnimatePresence
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

refinedInput = refinedInput.replace(oldAttachPopover, newAttachPopover);
refinedInput = refinedInput.replace('Lumensky helps you execute faster, but always double-check the details.', 'The Council can make mistakes. Verify important information.');

const fullCode = beforeStream + refinedStream + refinedInput;
fs.writeFileSync(path.join(__dirname, 'apps', 'web', 'src', 'components', 'chat-view.tsx'), fullCode, 'utf8');
console.log('Successfully assembled refined chat-view.tsx');
