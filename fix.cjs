const fs = require('fs');
let lines = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8').split('\n');

// Find the first '} else if (eventType === ''done'') {'
let startIdx = lines.findIndex(l => l.includes(`} else if (eventType === 'done') {`));

// Find the first '} else if (eventType === ''answer_chunk'' || eventType === ''answer_start'') {'
let endIdx = lines.findIndex(l => l.includes(`} else if (eventType === 'answer_chunk' || eventType === 'answer_start') {`));

if(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const fixedBlock = `              } else if (eventType === 'done') {
                if (data.tokenUsage) {
                  document.getElementById('tokenInfo').textContent = \`Tokens: \${data.tokenUsage.total || 0} | Cost: $\${(data.costUsd || 0).toFixed(4)}\`;
                }
                
                // Extract any files from this chunk
                const fileRegex = /<file\\s+path="([^"]+)">\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/file>/gi;
                let match;
                while ((match = fileRegex.exec(contentBuffer)) !== null) {
                  const path = match[1];
                  const content = match[2].trim();
                  const existingIdx = globalProjectFiles.findIndex(f => f.path === path);
                  if (existingIdx >= 0) {
                     globalProjectFiles[existingIdx].content = content;
                  } else {
                     globalProjectFiles.push({ path, content });
                  }
                  setAgentLog(\`Wrote \${path}\`);
                }

                if (contentBuffer.includes('MORE_FILES_PENDING')) {
                   setAgentLog('More files pending, requesting next file...', true);
                   const previewDiv = document.createElement('div');
                   previewDiv.innerHTML = \`<div style="color: #3498db; font-size: 14px; margin-top: 10px;">⏳ Agent is writing multiple files. Fetching next part...</div>\`;
                   bubble.appendChild(previewDiv);
                   scrollToBottom();
                   
                   setTimeout(() => {
                     const input = document.getElementById('msgInput');
                     input.value = \`[Auto-System] continue\`;
                     sendMessage();
                   }, 1000);
                } else if (contentBuffer.includes('ALL_FILES_DONE') || (globalProjectFiles.length > 0 && !contentBuffer.includes('MORE_FILES_PENDING') && !contentBuffer.includes('<project'))) {
                   setAgentLog('All files written. Preparing deployment...', true);
                   const previewDiv = document.createElement('div');
                   previewDiv.innerHTML = \`
                     <div style="margin-top:15px; border:1px solid #444; border-radius:8px; overflow:hidden; font-family: monospace;">
                       <div style="background:#222; padding:8px 10px; border-bottom:1px solid #444; color: #a9dc76;">
                         <span id="deploy-status">🚀 Starting deployment...</span>
                       </div>
                       <div id="deploy-logs" style="background:#111; padding:10px; font-size:12px; color:#fff; max-height:150px; overflow-y:auto;">
                         <div>> Creating workspace \${currentSessionId}...</div>
                       </div>
                     </div>
                   \`;
                   bubble.appendChild(previewDiv);
                   scrollToBottom();
                   
                   const logDiv = document.getElementById('deploy-logs');
                   const statusSpan = document.getElementById('deploy-status');
                   
                   const addLog = (msg) => {
                     logDiv.innerHTML += \`<div>> \${msg}</div>\`;
                     logDiv.scrollTop = logDiv.scrollHeight;
                   };

                   setTimeout(() => addLog('Writing ' + globalProjectFiles.length + ' files to disk...'), 500);
                   const hasPkg = globalProjectFiles.some(f => f.path.includes('package.json'));
                   if (hasPkg) {
                     setTimeout(() => addLog('package.json detected. Running npm install... (This may take a minute)'), 1000);
                   } else {
                     setTimeout(() => addLog('Static project detected. Launching preview server...'), 1000);
                   }

                   fetch(\`\${API}/workspaces/\${currentSessionId}/deploy\`, {
                     method: 'POST',
                     headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                     body: JSON.stringify({ files: globalProjectFiles })
                   }).then(r => r.json()).then(res => {
                     if (res.url) {
                        setAgentLog('Deployment successful!');
                        addLog('✅ Deployment successful!');
                        statusSpan.textContent = '🟢 App Running';
                        
                        let previewUrl = res.url.startsWith('/') ? \`http://localhost:8080\${res.url}\` : res.url;
                        previewDiv.innerHTML = \`<div style="margin-top:15px; border:1px solid #444; border-radius:8px; overflow:hidden;"><div style="background:#222; padding:5px 10px; font-size:12px; border-bottom:1px solid #444; display:flex; justify-content:space-between;"><span>Live Workspace</span><a href="\${previewUrl}" target="_blank" style="color:#00e5ff; text-decoration:none;">Open App ↗</a></div><iframe style="width:100%; height:600px; border:none; background:white;" src="\${previewUrl}"></iframe></div>\`;
                        scrollToBottom();
                     } else {
                        setAgentLog('Deployment failed, triggering self-healing', true);
                        addLog(\`❌ Deploy failed: \${res.error}\`);
                        statusSpan.textContent = '🔴 Auto-Healing Triggered';
                        
                        setTimeout(() => {
                          const input = document.getElementById('msgInput');
                          input.value = \`[Auto-System] Deployment failed with error: \${res.error}. Please fix the code.\`;
                          sendMessage();
                        }, 2000);
                     }
                   }).catch(err => {
                     addLog(\`❌ Error: \${err.message}\`);
                     statusSpan.textContent = '🔴 Auto-Healing Triggered';
                     
                     setTimeout(() => {
                        const input = document.getElementById('msgInput');
                        input.value = \`[Auto-System] Deployment failed with system error: \${err.message}. Please fix the code.\`;
                        sendMessage();
                     }, 2000);
                   });
                } else if (contentBuffer.includes('<file') && !contentBuffer.includes('</file>')) {
                   window.globalTruncatedBuffer = contentBuffer;
                   window.autoResumeCount = (window.autoResumeCount || 0) + 1;
                   
                   const previewDiv = document.createElement('div');
                   if (window.autoResumeCount > 3) {
                      setAgentLog('Code too large, max resumes reached.');
                      previewDiv.innerHTML = \`<div style="color: #e74c3c; font-size: 14px; margin-top: 10px;">❌ Code is too large to generate in one go.</div>\`;
                      bubble.appendChild(previewDiv);
                      scrollToBottom();
                      window.autoResumeCount = 0;
                      window.globalTruncatedBuffer = '';
                   } else {
                      setAgentLog(\`Output truncated. Resuming (\${window.autoResumeCount}/3)..., true\`);
                      previewDiv.innerHTML = \`<div style="color: #f39c12; font-size: 14px; margin-top: 10px;">⚠️ File output truncated. Auto-resuming (\${window.autoResumeCount}/3)...</div>\`;
                      bubble.appendChild(previewDiv);
                      scrollToBottom();
                      
                      setTimeout(() => {
                        const input = document.getElementById('msgInput');
                        input.value = \`[Auto-System] CRITICAL INSTRUCTION: Your previous response was truncated inside a <file> block. You MUST continue outputting the XML exactly from where you stopped. Just output the exact next characters.\`;
                        sendMessage();
                      }, 2000);
                   }
                }`;
    lines.splice(startIdx, endIdx - startIdx, fixedBlock);
    fs.writeFileSync('e:/vibe coding app/test-frontend.html', lines.join('\n'));
    console.log('Fixed file');
} else {
    console.log('Could not find indices', startIdx, endIdx);
}
