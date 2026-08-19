
  const API = 'http://localhost:8080/api/v1';
  let token = localStorage.getItem('krishna_token');
  let currentSessionId = null;
  let useCouncil = false;
      let isStreaming = false;
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
    }
    let globalTruncatedBuffer = '';
    let globalProjectFiles = [];
    let agentLogs = [];
    
    function setAgentLog(msg, isActive = false) {
      const logsDiv = document.getElementById('agent-logs');
      if (!logsDiv) return;
      if (isActive) {
        logsDiv.innerHTML = agentLogs.map(l => {
          const isErr = l.startsWith('❌');
          const icon = isErr ? '<i class="fas fa-times-circle" style="color:#ff5555; margin-right:5px;"></i>' : '<i class="fas fa-check" style="color:#a9dc76; margin-right:5px;"></i>';
          return `<div>${icon} ${l}</div>`;
        }).join('') + `<div class="log-active">> ${msg}<span class="loading-dots"></span></div>`;
      } else {
        if (msg) agentLogs.push(msg);
        logsDiv.innerHTML = agentLogs.map(l => {
          const isErr = l.startsWith('❌');
          const icon = isErr ? '<i class="fas fa-times-circle" style="color:#ff5555; margin-right:5px;"></i>' : '<i class="fas fa-check" style="color:#a9dc76; margin-right:5px;"></i>';
          return `<div>${icon} ${l}</div>`;
        }).join('');
      }
      logsDiv.scrollTop = logsDiv.scrollHeight;
    }

  // ── Init ──
  async function init() {
    if (token) {
      await checkHealth();
      await loadSessions();
      document.getElementById('authModal').classList.add('hidden');
    } else {
      document.getElementById('authModal').classList.remove('hidden');
    }
  }

  async function checkHealth() {
    try {
      const res = await fetch('http://localhost:8080/health');
      const data = await res.json();
      if (data.status === 'ok') {
        document.getElementById('statusDot').classList.add('online');
        document.getElementById('statusText').textContent = 'Backend Connected';
      }
    } catch {
      document.getElementById('statusText').textContent = 'Backend Offline — start: npm run dev';
    }
  }

  // ── Auth ──
  
  async function sendOTP() {
    const email = document.getElementById('emailInput').value.trim();
    if (!email) return;
    document.querySelector('.primary-btn').disabled = true;
    document.getElementById('authNote').textContent = 'Sending...';
    try {
      const res = await fetch(`${API}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        document.getElementById('otpStep1').style.display = 'none';
        document.getElementById('otpStep2').style.display = 'block';
        if (data.dev_otp) {
          document.getElementById('otpInput').value = data.dev_otp;
          document.getElementById('authNote').innerHTML = `<span style="color:var(--green)">[DEV MODE] OTP Autofilled: ${data.dev_otp}</span>`;
        } else {
          document.getElementById('authNote').textContent = '';
        }
      } else {
        const err = await res.json();
        document.getElementById('authNote').textContent = err.message || 'Error sending OTP';
      }
    } catch (e) {
      document.getElementById('authNote').textContent = 'Cannot reach backend. Is it running?';
    }
    document.querySelector('.primary-btn').disabled = false;
  }

  async function verifyOTP() {
    const email = document.getElementById('emailInput').value.trim();
    const otp = document.getElementById('otpInput').value.trim();
    try {
      const res = await fetch(`${API}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (res.ok) {
        const data = await res.json();
        token = data.token;
        localStorage.setItem('krishna_token', token);
        document.getElementById('authModal').classList.add('hidden');
        await loadSessions();
      } else {
        const err = await res.json();
        document.getElementById('authNote').textContent = err.message || 'Invalid OTP';
      }
    } catch (e) {
      document.getElementById('authNote').textContent = 'Error verifying OTP';
    }
  }

  function logout() {
    localStorage.removeItem('krishna_token');
    token = null;
    currentSessionId = null;
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('sessionList').innerHTML = '';
    document.getElementById('messages').innerHTML = '';
    document.getElementById('sessionInfo').textContent = 'No session';
    document.getElementById('tokenInfo').textContent = '';
  }

  function authHeaders() {
    return { 'Authorization': `Bearer ${token}` };
  }

  async function loadSessions() {
    try {
      const res = await fetch(`${API}/sessions?limit=20`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      renderSessions(data.data || []);
    } catch {}
  }

  function renderSessions(sessions) {
    const list = document.getElementById('sessionList');
    list.innerHTML = sessions.length === 0
      ? '<div style="padding:12px;font-size:12px;color:var(--text-dim);text-align:center">No sessions yet</div>'
      : sessions.map(s => `
          <div class="session-item ${s.id === currentSessionId ? 'active' : ''}" onclick="selectSession('${s.id}', '${s.title}')">
            <div class="session-name">${s.title || 'New Chat'}</div>
            <div class="session-date">${new Date(s.createdAt || s.created_at).toLocaleDateString()}</div>
          </div>
        `).join('');
  }

  async function newSession() {
    try {
      const res = await fetch(`${API}/sessions`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat', modelTier: 'omni' }),
      });
      if (res.ok) {
        const data = await res.json();
        currentSessionId = data.id;
        document.getElementById('sessionInfo').textContent = `Session: ${data.id.slice(0,8)}...`;
        clearMessages();
        await loadSessions();
      }
    } catch {}
  }

  async function selectSession(id, title) {
    currentSessionId = id;
    document.getElementById('sessionInfo').textContent = `Session: ${id.slice(0,8)}...`;
    clearMessages();
    try {
      const res = await fetch(`${API}/sessions/${id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];
        msgs.forEach(m => {
            if (m.content && m.content.startsWith('[Auto-System]')) return;
            if (m.role !== 'user' && m.content && m.content.includes('<file')) {
                let cleaned = m.content.replace(/```xml\s*/gi, '').replace(/```/g, '');
                cleaned = cleaned.replace(/<\s*file[\s\S]*?(?:<\/\s*file>|$)/gi, '\n[File written to workspace]\n').trim();
                if (!cleaned) return;
                m.content = cleaned;
            }
            appendMessage(m.role, m.content);
          });
      }
    } catch {}
    
    renderSessions(Array.from(document.querySelectorAll('.session-item')).map(el => ({
      id: el.onclick?.toString().match(/'([^']+)'/)?.[1],
      title: el.querySelector('.session-name')?.textContent,
    })));
    await loadSessions();
  }

  function clearMessages() {
    document.getElementById('messages').innerHTML = '';
  }

  function appendMessage(role, content) {
    const welcome = document.getElementById('welcome');
    if (welcome) welcome.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    const roleText = role === 'user' ? 'You' : '⚡ Krishna AI';
    
    let displayContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    displayContent = displayContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    displayContent = displayContent.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    displayContent = displayContent.replace(/`([^`]+)`/g, '<code>$1</code>');

    msgDiv.innerHTML = `
      <div class="msg-role">${roleText}</div>
      <div class="msg-bubble">${displayContent}</div>
    `;
    document.getElementById('messages').appendChild(msgDiv);
    scrollToBottom();
  }

  function createStreamingMessage() {
    const welcome = document.getElementById('welcome');
    if (welcome) welcome.remove();

    const container = document.createElement('div');
    container.className = 'message assistant';
    container.id = 'streaming-msg';

    const role = document.createElement('div');
    role.className = 'msg-role';
    role.textContent = '⚡ Krishna AI';

    const thinking = document.createElement('div');
    thinking.className = 'thinking-block';
    thinking.id = 'stream-thinking';
    thinking.style.display = 'none';
    thinking.innerHTML = `
      <div class="thinking-label" onclick="toggleThinking()">
        <span>🧠</span> <span>Reasoning</span> <span style="margin-left:auto;font-size:9px">▼ click to expand</span>
      </div>
      <div class="thinking-content expanded" id="thinking-content"></div>
    `;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.id = 'stream-bubble';
    bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    container.appendChild(role);
    container.appendChild(thinking);
    container.appendChild(bubble);
    document.getElementById('messages').appendChild(container);
    scrollToBottom();
    return { bubble, thinking };
  }

  async function sendMessage() {
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await sendPrompt(text);
  }

  async function sendPrompt(text) {
    if (!token) { document.getElementById('authModal').classList.remove('hidden'); return; }
    if (!currentSessionId) await newSession();
    if (!currentSessionId) return;

    if (!text.startsWith('[Auto-System]')) appendMessage('user', text);
    isStreaming = true;
    
    document.getElementById('sendBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'flex';
    document.getElementById('msgInput').disabled = true;
    currentAbortController = new AbortController();
    document.getElementById('debugContent').innerHTML = '';

    const { bubble, thinking } = createStreamingMessage();
    let contentBuffer = window.globalTruncatedBuffer || '';
    window.globalTruncatedBuffer = '';
    let thinkingBuffer = '';

    const endpoint = useCouncil ? `${API}/council/chat` : `${API}/chat/stream`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          message: text,
          modelTier: 'omni',
          enableTools: true,
        }),
        signal: currentAbortController.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        bubble.textContent = `Error: ${err.message || 'Request failed'}`;
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      bubble.textContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        let eventType = '';
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6).trim();
            if (!eventData) continue;

            try {
              const data = JSON.parse(eventData);
              addDebugEvent(eventType, data);

              if (eventType === 'thinking' && data.chunk) {
                thinkingBuffer += data.chunk;
                thinking.style.display = 'block';
                document.getElementById('thinking-content').textContent = thinkingBuffer;
              } else if ((eventType === 'message' || eventType === 'answer_chunk') && data.chunk) {
                  contentBuffer += data.chunk;
                  
                  let displayContent = contentBuffer.replace(/```xml\s*/gi, '').replace(/```/g, '');
                  displayContent = displayContent.replace(/<\s*file[\s\S]*?(?:<\/\s*file>|$)/gi, '\n[Writing file...]\n');
                  if (displayContent.includes('<project')) {
                    displayContent = displayContent.replace(/<project[\s\S]*?(<\/project>|$)/gi, '*(Building workspace files...)*');
                  }
                  
                  bubble.innerHTML = window.marked ? window.marked.parse(displayContent.trim()) : displayContent.trim();
                  scrollToBottom();
                  
                  // Real-time Agent Action Logs based on data parsing
                  const fileMatch = contentBuffer.match(/<\s*file[^>]*?(?:path|name)=["']([^"']+)["'][^>]*>/gi);
                  if (fileMatch && fileMatch.length > 0) {
                      const latestFileTag = fileMatch[fileMatch.length - 1];
                      const pathMatch = latestFileTag.match(/(?:path|name)=["']([^"']+)["']/i);
                      if (pathMatch) {
                          const filePath = pathMatch[1];
                          
                          if (window.currentGeneratingFile !== filePath) {
                              if (window.currentGeneratingFile) {
                                  setAgentLog(`Saved ${window.currentGeneratingFile} to memory`, false);
                              }
                              window.currentGeneratingFile = filePath;
                              if (filePath.includes('package.json')) {
                                  setAgentLog(`Configuring dependencies (${filePath})`, true);
                              } else if (filePath.endsWith('.css')) {
                                  setAgentLog(`Styling components (${filePath})`, true);
                              } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                                  setAgentLog(`Writing application logic (${filePath})`, true);
                              } else {
                                  setAgentLog(`Generating ${filePath}`, true);
                              }
                          }
                      }
                      
                      // Check if current file just closed
                      if (data.chunk.includes('</file>')) {
                          if (window.currentGeneratingFile) {
                              setAgentLog(`Completed ${window.currentGeneratingFile}`, false);
                              window.currentGeneratingFile = null;
                          }
                          
                          // Parse and update workspace immediately
                          const matches = [...contentBuffer.matchAll(/<\s*file[^>]*?(?:path|name)=["']([^"']+)["'][^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/\s*file\s*>/gi)];
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
                      }
                  } else if (contentBuffer.length > 10 && !window.currentGeneratingFile) {
                      if (!window.thinkingLogSet) {
                          setAgentLog('Analyzing requirements & drafting architecture', true);
                          window.thinkingLogSet = true;
                      }
                  }
              } else if (eventType === 'stage_update') {
                const stage = document.createElement('div');
                stage.className = 'stage-update';
                stage.innerHTML = `<div class="stage-dot"></div>${data.stage || data.description}`;
                document.getElementById('messages').appendChild(stage);
              } else if (eventType === 'tool_start') {
                const toolEl = document.createElement('div');
                toolEl.className = 'tool-event';
                toolEl.textContent = `🛠️ Tool: ${data.name} — ${data.query || JSON.stringify(data)}`;
                document.getElementById('messages').appendChild(toolEl);
              } else if (eventType === 'done') {
                if (data.tokenUsage) {
                  document.getElementById('tokenInfo').textContent = `Tokens: ${data.tokenUsage.total || 0} | Cost: ${(data.costUsd || 0).toFixed(4)}`;
                }
                
                // Extract any files from this chunk
                const fileRegex = /<file\s+path="([^"]+)">\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/file>/gi;
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
                  setAgentLog(`Wrote ${path}`);
                }

                if (contentBuffer.includes('MORE_FILES_PENDING')) {
                   setAgentLog('More files pending, requesting next file...', true);
                   const previewDiv = document.createElement('div');
                   previewDiv.innerHTML = `<div style="color: #3498db; font-size: 14px; margin-top: 10px;">⏳ Agent is writing multiple files. Fetching next part...</div>`;
                   bubble.appendChild(previewDiv);
                   scrollToBottom();
                   
                   setTimeout(() => {
                     const input = document.getElementById('msgInput');
                     input.value = `[Auto-System] continue`;
                     sendMessage();
                   }, 1000);
                } else if (contentBuffer.includes('ALL_FILES_DONE') || (globalProjectFiles.length > 0 && !contentBuffer.includes('MORE_FILES_PENDING') && !contentBuffer.includes('<project'))) {
                   setAgentLog('All files written. Preparing deployment...', true);
                   const previewDiv = document.createElement('div');
                   previewDiv.innerHTML = `
                     <div style="margin-top:15px; border:1px solid #444; border-radius:8px; overflow:hidden; font-family: monospace;">
                       <div style="background:#222; padding:8px 10px; border-bottom:1px solid #444; color: #a9dc76;">
                         <span id="deploy-status">🚀 Starting deployment...</span>
                       </div>
                       <div id="deploy-logs" style="background:#111; padding:10px; font-size:12px; color:#fff; max-height:150px; overflow-y:auto;">
                         <div>> Creating workspace ${currentSessionId}...</div>
                       </div>
                     </div>
                   `;
                   bubble.appendChild(previewDiv);
                   scrollToBottom();
                   
                   const logDiv = document.getElementById('deploy-logs');
                   const statusSpan = document.getElementById('deploy-status');
                   
                   const addLog = (msg) => {
                     logDiv.innerHTML += `<div>> ${msg}</div>`;
                     logDiv.scrollTop = logDiv.scrollHeight;
                   };

                   setTimeout(() => addLog('Writing ' + globalProjectFiles.length + ' files to disk...'), 500);
                   const hasPkg = globalProjectFiles.some(f => f.path.includes('package.json'));
                   if (hasPkg) {
                     setTimeout(() => addLog('package.json detected. Running npm install... (This may take a minute)'), 1000);
                   } else {
                     setTimeout(() => addLog('Static project detected. Launching preview server...'), 1000);
                   }

                   fetch(`${API}/workspaces/${currentSessionId}/deploy`, {
                     method: 'POST',
                     headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                     body: JSON.stringify({ files: globalProjectFiles })
                   }).then(r => r.json()).then(res => {
                     if (res.url) {
                        setAgentLog('Deployment successful!');
                        addLog('✅ Deployment successful!');
                        statusSpan.textContent = '🟢 App Running';
                        
                        let previewUrl = res.url.startsWith('/') ? `http://localhost:8080${res.url}` : res.url;
                        
                        const previewContainer = document.getElementById('preview-container');
                        previewContainer.innerHTML = `
                          <div style="width:100%; height:100%; display:flex; flex-direction:column;">
                            <div style="background:#222; padding:8px 15px; font-size:12px; border-bottom:1px solid #444; display:flex; justify-content:space-between; align-items:center;">
                              <span style="color:#aaa;">Previewing: <span style="color:#fff;">${previewUrl}</span></span>
                              <a href="${previewUrl}" target="_blank" style="color:#00e5ff; text-decoration:none; background:#005577; padding:4px 10px; border-radius:4px; font-weight:bold;">Open in New Tab ↗</a>
                            </div>
                            <iframe style="flex:1; border:none; background:white; width:100%;" src="${previewUrl}"></iframe>
                          </div>
                        `;
                        
                        updateFileTree();
                        switchTab('preview');
                        
                        previewDiv.innerHTML = `<div style="margin-top:10px; padding:10px; background:#1e1e1e; border:1px solid #333; border-radius:8px; color:#a9dc76;">
                          <i class="fas fa-check-circle"></i> App Deployed! Check the Workspace Panel on the right.
                        </div>`;
                        scrollToBottom();

                     } else {
                        setAgentLog('Deployment failed, triggering self-healing', true);
                        addLog(`❌ Deploy failed: ${res.error}`);
                        statusSpan.textContent = '🔴 Auto-Healing Triggered';
                        
                        setTimeout(() => {
                          const input = document.getElementById('msgInput');
                          input.value = `[Auto-System] Deployment failed with error: ${res.error}. Please fix the code.`;
                          sendMessage();
                        }, 2000);
                     }
                   }).catch(err => {
                     addLog(`❌ Error: ${err.message}`);
                     if (err.name === 'TypeError' || err.name === 'ReferenceError' || err.message.includes('fetch')) {
                        addLog('Frontend/Network error. Not triggering AI self-healing.');
                        statusSpan.textContent = '🔴 UI Error';
                     } else {
                        statusSpan.textContent = '🛠️ Auto-Healing Triggered';
                        setTimeout(() => {
                           const input = document.getElementById('msgInput');
                           input.value = `[Auto-System] Deployment failed with system error: ${err.message}. Please fix the code.`;
                           sendMessage();
                        }, 2000);
                     }
                   });
                } else if (contentBuffer.includes('<file') && !contentBuffer.includes('</file>')) {
                   window.globalTruncatedBuffer = contentBuffer;
                   window.autoResumeCount = (window.autoResumeCount || 0) + 1;
                   
                   const previewDiv = document.createElement('div');
                   if (window.autoResumeCount > 3) {
                      setAgentLog('Code too large, max resumes reached.');
                      previewDiv.innerHTML = `<div style="color: #e74c3c; font-size: 14px; margin-top: 10px;">❌ Code is too large to generate in one go.</div>`;
                      bubble.appendChild(previewDiv);
                      scrollToBottom();
                      window.autoResumeCount = 0;
                      window.globalTruncatedBuffer = '';
                   } else {
                      setAgentLog(`Output truncated. Resuming (${window.autoResumeCount}/3)..., true`);
                      previewDiv.innerHTML = `<div style="color: #f39c12; font-size: 14px; margin-top: 10px;">⚠️ File output truncated. Auto-resuming (${window.autoResumeCount}/3)...</div>`;
                      bubble.appendChild(previewDiv);
                      scrollToBottom();
                      
                      setTimeout(() => {
                        const input = document.getElementById('msgInput');
                        input.value = `[Auto-System] CRITICAL INSTRUCTION: Your previous response was truncated inside a <file> block. You MUST continue outputting the XML exactly from where you stopped. Just output the exact next characters.`;
                        sendMessage();
                      }, 2000);
                   }
                }
              }
            } catch (e) {
               console.error("Parse Error: ", e);
            }
          }
        }
      }
      
      if (contentBuffer && contentBuffer.includes('[Error from LLM Service:')) {
          setAgentLog('❌ AI Provider Error (Rate limit hit)', false);
      } else if (!contentBuffer) {
          bubble.textContent = '(No response received)';
          setAgentLog('❌ No response from AI', false);
      } else if (window.currentGeneratingFile || window.thinkingLogSet) {
          if (!contentBuffer.includes('ALL_FILES_DONE') && !contentBuffer.includes('MORE_FILES_PENDING')) {
              setAgentLog('Finished processing (Waiting for next step)', false);
          }
      }
      await loadSessions();
  }

