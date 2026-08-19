const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

// 1. Hide code from the chat bubble
const regexBubbleText = /bubble\.textContent = contentBuffer;/g;
content = content.replace(regexBubbleText, `const cleanedText = contentBuffer.replace(/<file[\\s\\S]*?(?:<\\/file>|$)/g, '\\n[Writing file...]\\n');
                  bubble.textContent = cleanedText.trim();`);

// 2. Dynamically add files to workspace on </file>
const regexFileClose = /\/\/ Check if current file just closed\s*if \(data\.chunk\.includes\('<\/file>'\)\) \{\s*setAgentLog\(\`Completed \$\{filePath\}\`, false\);\s*window\.currentGeneratingFile = null;\s*\}/;

const replacementFileClose = `// Check if current file just closed
                      if (data.chunk.includes('</file>')) {
                          setAgentLog(\`Completed \${filePath}\`, false);
                          window.currentGeneratingFile = null;
                          
                          // Parse and update workspace immediately
                          const matches = [...contentBuffer.matchAll(/<file path="([^"]+)">\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/file>/g)];
                          for (const match of matches) {
                              const path = match[1];
                              const fileContent = match[2].trim();
                              const existingIdx = globalProjectFiles.findIndex(f => f.path === path);
                              if (existingIdx >= 0) {
                                 globalProjectFiles[existingIdx].content = fileContent;
                              } else {
                                 globalProjectFiles.push({ path, content: fileContent });
                              }
                          }
                          
                          if (typeof updateFileTree === 'function') {
                              updateFileTree();
                          }
                      }`;

content = content.replace(regexFileClose, replacementFileClose);

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Chat UI cleaned and workspace updated in real-time');
