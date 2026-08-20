const fs = require('fs');
const path = require('path');

const componentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fp_chat_components.json'), 'utf8'));
let chatViewCode = componentsData.find(d => d.file.includes('chat-view.tsx')).content;

// Add Framer Motion imports if not already there
if (!chatViewCode.includes('AnimatePresence')) {
  chatViewCode = chatViewCode.replace('import React, {', 'import { motion, AnimatePresence } from "framer-motion";\nimport React, {');
}

// Add MORPH_WORDS and morph state
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

// Inject morphStateCode inside ChatView component
chatViewCode = chatViewCode.replace('const [copiedId, setCopiedId] = useState<string | null>(null);', 'const [copiedId, setCopiedId] = useState<string | null>(null);\n' + morphStateCode);

// Replace empty state with Council's morph greeting
const oldEmptyState = `            /* Minimalist Empty State */
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
            </div>`;

const newEmptyState = `            /* Council Kinetic Morph Empty State */
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 select-none">
              <div 
                className="reveal-chat-item relative flex flex-col items-center justify-center w-full isolate text-center space-y-2 max-w-2xl px-4"
                style={{ animationDelay: "50ms" }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-['Instrument_Serif',serif] font-normal text-white tracking-tight leading-none mb-2 drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
                  Hi Ujjwal,
                </h1>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Instrument_Serif',serif] font-normal text-white tracking-tight flex flex-wrap items-center justify-center gap-2 sm:gap-3 drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
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
            </div>`;

chatViewCode = chatViewCode.replace(oldEmptyState, newEmptyState);

fs.writeFileSync(path.join(__dirname, 'apps', 'web', 'src', 'components', 'chat-view.tsx'), chatViewCode, 'utf8');
console.log('Wrote updated chat-view.tsx');
