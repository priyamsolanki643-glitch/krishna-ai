const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

// 1. Add Stop Button HTML
content = content.replace(
  '<button class="send-btn" id="sendBtn" onclick="sendMessage()">✈</button>',
  `<button class="send-btn" id="sendBtn" onclick="sendMessage()">✈</button>
         <button class="send-btn" id="stopBtn" onclick="stopTask()" style="display: none; background: #ff5555;"><i class="fas fa-stop"></i></button>`
);

// 2. Add AbortController variables and stopTask function
content = content.replace(
  'let isStreaming = false;',
  `let isStreaming = false;
    let currentAbortController = null;
    
    function stopTask() {
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
            setAgentLog('❌ Task stopped by user', false);
            isStreaming = false;
            document.getElementById('sendBtn').style.display = 'flex';
            document.getElementById('stopBtn').style.display = 'none';
            document.getElementById('msgInput').disabled = false;
        }
    }`
);

// 3. Update sendMessage to use AbortController and toggle buttons
content = content.replace(
  "document.getElementById('sendBtn').disabled = true;",
  `document.getElementById('sendBtn').style.display = 'none';
      document.getElementById('stopBtn').style.display = 'flex';
      document.getElementById('msgInput').disabled = true;
      currentAbortController = new AbortController();`
);

content = content.replace(
  "body: JSON.stringify({ sessionId: currentSessionId, message: text, modelTier: 'omni', enableTools: true }),",
  `body: JSON.stringify({ sessionId: currentSessionId, message: text, modelTier: 'omni', enableTools: true }),
          signal: currentAbortController.signal,`
);

// 4. Update finally block to reset buttons
content = content.replace(
  "document.getElementById('sendBtn').disabled = false;",
  `document.getElementById('sendBtn').style.display = 'flex';
        document.getElementById('stopBtn').style.display = 'none';
        document.getElementById('msgInput').disabled = false;
        currentAbortController = null;`
);

// 5. Fix Regex for cleaning text (ignore markdown wrappers too)
content = content.replace(
  /const cleanedText = contentBuffer\.replace\(\/<file\[\\s\\S\]\*\?\(\?:<\\\/file>\|\$\)\/g, '\\n\[Writing file\.\.\.\]\\n'\);/g,
  `// Remove markdown blocks that wrap files
                  let cleanedText = contentBuffer.replace(/\`\`\`xml\\s*/gi, '').replace(/\`\`\`/g, '');
                  cleanedText = cleanedText.replace(/<\\s*file[\\s\\S]*?(?:<\\/\\s*file>|$)/gi, '\\n[Writing file...]\\n');`
);

// 6. Fix Regex for parsing files
content = content.replace(
  /const matches = \[\.\.\.contentBuffer\.matchAll\(\/<file path="\(\[\^"\]\+\)">\\s\*<!\\\[CDATA\\\[\(\[\\s\\S\]\*\?\)\\\]\\\]>\\s\*<\\\/file>\/g\)\];/g,
  `const matches = [...contentBuffer.matchAll(/<\\s*file[^>]*?(?:path|name)=["']([^"']+)["'][^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/\\s*file\\s*>/gi)];`
);

// Do the same for the inner parse block inside `answer_chunk` close check
content = content.replace(
  /const matches = \[\.\.\.contentBuffer\.matchAll\(\/<file path="\(\[\^"\]\+\)">\\s\*<!\\\[CDATA\\\[\(\[\\s\\S\]\*\?\)\\\]\\\]>\\s\*<\\\/file>\/g\)\];/g,
  `const matches = [...contentBuffer.matchAll(/<\\s*file[^>]*?(?:path|name)=["']([^"']+)["'][^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/\\s*file\\s*>/gi)];`
);


// 7. Auto-select first file in updateFileTree
const oldTree = `tree.appendChild(btn);
      });
    }`;
const newTree = `tree.appendChild(btn);
      });
      // Auto-select the first file if code block is empty or on first load
      const codeBlock = document.getElementById('code-block');
      if (globalProjectFiles.length > 0 && codeBlock && (codeBlock.textContent === 'Select a file to view code.' || codeBlock.textContent === '')) {
          tree.children[1].click(); // Click the first file div (children[0] is the title)
      }
    }`;
content = content.replace(oldTree, newTree);


fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Fixed stop button, markdown regex, and code auto-select');
