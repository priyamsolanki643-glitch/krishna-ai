const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps', 'web', 'src', 'components', 'chat-view.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Refine the Message stream area and Active Stage Transition with AnimatePresence
const oldStreamTarget = `{isLoadingThread ? (`;
const newStreamTarget = `<AnimatePresence mode="wait">
          {isLoadingThread ? (
            <motion.div
              key="skeleton-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >`;

// Find and replace the Stream Section
content = content.replace(oldStreamTarget, newStreamTarget);

// Replace empty state
const oldEmptyStateRegex = /\/\* Council Kinetic Morph Empty State \*\/[\s\S]*?<\/div>\s*<\/div>\s*\)\s*:\s*\(\s*\/\* Messages list \(bubbleless, flat style\) \*\/\s*<div className="py-4 space-y-4">/;

const newEmptyStateBlock = `/* Council Kinetic Morph Empty State */
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
          ) : (
            /* Messages list (bubbleless, flat style) */
            <motion.div
              key="active-messages"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="py-4 space-y-4"
            >`;

content = content.replace(oldEmptyStateRegex, newEmptyStateBlock);

// Close the AnimatePresence after the messages list
content = content.replace('                    </div>\n                  </div>\n                );\n              })}\n            </div>\n          )}', '                    </div>\n                  </div>\n                );\n              })}\n            </motion.div>\n          )}\n          </AnimatePresence>');

// 2. Refine the bottom input bar container & attachment popover
const oldInputContainerRegex = /<div \s*className="shrink-0 px-4 md:px-8 pt-2 bg-\[#000000\] relative z-10"[\s\S]*?<div \s*className="reveal-chat-item max-w-\[720px\] w-full mx-auto"/;
const newInputContainer = `<div className="relative z-20 pt-2 mb-8 sm:mb-10 max-w-3xl mx-auto w-full px-4 shrink-0">
        <div 
          className="reveal-chat-item w-full mx-auto"`;
content = content.replace(oldInputContainerRegex, newInputContainer);

// Refine attachment popover with AnimatePresence & motion.div
const oldPopoverRegex = /\{\/\* Attachment Menu Popover \*\/\}[\s\S]*?\{\/\* Input area \*\/\}/;
const newPopover = `{/* Attachment Menu Popover */}
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
              </AnimatePresence>
            </div>

            {/* Input area */}`;

content = content.replace(oldPopoverRegex, newPopover);

// Refine subtext info
content = content.replace('Lumensky helps you execute faster, but always double-check the details.', 'The Council can make mistakes. Verify important information.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refined chat-view.tsx');
