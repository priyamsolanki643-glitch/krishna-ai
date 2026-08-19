const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

const regexChunk = /\} else if \(eventType === 'answer_chunk' \|\| eventType === 'answer_start'\) \{\s*if \(data\.chunk\) \{\s*contentBuffer \+\= data\.chunk;\s*bubble\.textContent = contentBuffer;\s*scrollToBottom\(\);\s*\}/;

const replacementChunk = `} else if (eventType === 'answer_chunk' || eventType === 'answer_start') {
                if (data.chunk) {
                  contentBuffer += data.chunk;
                  bubble.textContent = contentBuffer;
                  scrollToBottom();
                  
                  // Real-time Agent Action Logs based on data parsing
                  const fileMatch = contentBuffer.match(/<file path="([^"]+)">/g);
                  if (fileMatch && fileMatch.length > 0) {
                      const latestFileTag = fileMatch[fileMatch.length - 1];
                      const filePath = latestFileTag.match(/path="([^"]+)"/)[1];
                      
                      if (window.currentGeneratingFile !== filePath) {
                          if (window.currentGeneratingFile) {
                              setAgentLog(\`Saved \${window.currentGeneratingFile} to memory\`, false);
                          }
                          window.currentGeneratingFile = filePath;
                          if (filePath.includes('package.json')) {
                              setAgentLog(\`Configuring dependencies (\${filePath})\`, true);
                          } else if (filePath.endsWith('.css')) {
                              setAgentLog(\`Styling components (\${filePath})\`, true);
                          } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                              setAgentLog(\`Writing application logic (\${filePath})\`, true);
                          } else {
                              setAgentLog(\`Generating \${filePath}\`, true);
                          }
                      }
                      
                      // Check if current file just closed
                      if (data.chunk.includes('</file>')) {
                          setAgentLog(\`Completed \${filePath}\`, false);
                          window.currentGeneratingFile = null;
                      }
                  } else if (contentBuffer.length > 10 && !window.currentGeneratingFile) {
                      if (!window.thinkingLogSet) {
                          setAgentLog('Analyzing requirements & drafting architecture', true);
                          window.thinkingLogSet = true;
                      }
                  }
                }
              }`;

content = content.replace(regexChunk, replacementChunk);

// Also need to reset window.thinkingLogSet and window.currentGeneratingFile when sending a message
const regexSend = /setAgentLog\('Thinking and planning architecture', true\);/;
const replacementSend = `setAgentLog('Thinking and planning architecture', true);
      window.thinkingLogSet = false;
      window.currentGeneratingFile = null;`;

content = content.replace(regexSend, replacementSend);

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Real-time Agent Action Logs added');
