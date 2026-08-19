const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

// 1. Inject Workspace DOM right after chat-area
const workspaceDOM = `
    <!-- Workspace Area -->
    <div class="workspace-area" id="workspace-area" style="flex: 1; display: flex; flex-direction: column; background: #0e0e0e; border-left: 1px solid #222;">
      <div class="workspace-header" style="height: 48px; border-bottom: 1px solid #222; display: flex; align-items: center; padding: 0 15px; gap: 10px; background: #151515;">
        <button id="tab-preview" onclick="switchTab('preview')" style="background: transparent; border: none; color: #a9dc76; font-weight: bold; cursor: pointer; padding: 5px 10px; border-bottom: 2px solid #a9dc76;">Live Preview</button>
        <button id="tab-code" onclick="switchTab('code')" style="background: transparent; border: none; color: #888; font-weight: bold; cursor: pointer; padding: 5px 10px; border-bottom: 2px solid transparent;">Code Editor</button>
      </div>
      <div class="workspace-content" style="flex: 1; display: flex; position: relative;">
        
        <!-- Preview Panel -->
        <div id="panel-preview" style="flex: 1; display: flex; flex-direction: column;">
           <div id="preview-container" style="flex: 1; display: flex; align-items: center; justify-content: center; color: #555;">
             (No preview available)
           </div>
        </div>

        <!-- Code Panel -->
        <div id="panel-code" style="flex: 1; display: none; background: #1e1e1e;">
           <div style="display: flex; height: 100%;">
             <div class="file-tree" id="file-tree" style="width: 200px; border-right: 1px solid #333; padding: 10px; overflow-y: auto;">
               <!-- Files go here -->
             </div>
             <div class="code-viewer" style="flex: 1; overflow: auto; padding: 15px; position: relative;">
                <pre><code id="code-block" class="language-html" style="font-size: 13px;">Select a file to view code.</code></pre>
             </div>
           </div>
        </div>

      </div>
    </div>
`;
content = content.replace('<!-- Debug Panel -->', workspaceDOM + '\n\n    <!-- Debug Panel -->');

// 2. Add syntax highlighter scripts and css to head
const highlighter = `
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
`;
content = content.replace('</head>', highlighter + '\n</head>');

// 3. Update CSS for layout
content = content.replace('.chat-area { flex: 1;', '.chat-area { width: 450px; flex-shrink: 0;');

// 4. Inject JS logic for Tabs and File Tree
const workspaceJs = `
  // Workspace UI Logic
  function switchTab(tab) {
    document.getElementById('panel-preview').style.display = tab === 'preview' ? 'flex' : 'none';
    document.getElementById('panel-code').style.display = tab === 'code' ? 'block' : 'none';
    
    document.getElementById('tab-preview').style.color = tab === 'preview' ? '#a9dc76' : '#888';
    document.getElementById('tab-preview').style.borderBottomColor = tab === 'preview' ? '#a9dc76' : 'transparent';
    
    document.getElementById('tab-code').style.color = tab === 'code' ? '#a9dc76' : '#888';
    document.getElementById('tab-code').style.borderBottomColor = tab === 'code' ? '#a9dc76' : 'transparent';
  }

  function updateFileTree() {
    const tree = document.getElementById('file-tree');
    tree.innerHTML = '<div style="color:#aaa; margin-bottom:10px; font-weight:bold; font-size:12px; text-transform:uppercase;">Files</div>';
    globalProjectFiles.forEach((file, index) => {
      const btn = document.createElement('div');
      btn.innerHTML = \`<i class="fas \${file.path.endsWith('.js') ? 'fa-js' : file.path.endsWith('.css') ? 'fa-css3' : 'fa-html5'}" style="width:20px; color:#569cd6;"></i> \${file.path}\`;
      btn.style.cssText = 'padding: 6px 10px; cursor: pointer; border-radius: 4px; font-size: 13px; color: #ccc; margin-bottom: 2px; display: flex; align-items: center;';
      btn.onmouseover = () => btn.style.background = '#2a2d2e';
      btn.onmouseout = () => btn.style.background = 'transparent';
      btn.onclick = () => {
         const lang = file.path.split('.').pop();
         const codeBlock = document.getElementById('code-block');
         codeBlock.className = \`language-\${lang === 'js' ? 'javascript' : lang}\`;
         codeBlock.textContent = file.content;
         hljs.highlightElement(codeBlock);
      };
      tree.appendChild(btn);
    });
  }
`;
content = content.replace(/\/\/\s+"\?"\?\s+UI Helpers\s+"\?"\?/, workspaceJs + '\n\n  // UI Helpers');

// 5. Update Deploy logic to target Workspace Area instead of Chat Bubble
const newDeployBlock = `
                        let previewUrl = res.url.startsWith('/') ? \`http://localhost:8080\${res.url}\` : res.url;
                        
                        // Show in Workspace Area instead of chat bubble
                        const previewContainer = document.getElementById('preview-container');
                        previewContainer.innerHTML = \`
                          <div style="width:100%; height:100%; display:flex; flex-direction:column;">
                            <div style="background:#222; padding:8px 15px; font-size:12px; border-bottom:1px solid #444; display:flex; justify-content:space-between; align-items:center;">
                              <span style="color:#aaa;">Previewing: <span style="color:#fff;">\${previewUrl}</span></span>
                              <a href="\${previewUrl}" target="_blank" style="color:#00e5ff; text-decoration:none; background:#005577; padding:4px 10px; border-radius:4px; font-weight:bold;">Open in New Tab ↗</a>
                            </div>
                            <iframe style="flex:1; border:none; background:white; width:100%;" src="\${previewUrl}"></iframe>
                          </div>
                        \`;
                        
                        // Update File tree
                        updateFileTree();
                        switchTab('preview');
                        
                        // Remove the iframe from the chat bubble
                        previewDiv.innerHTML = \`<div style="margin-top:10px; padding:10px; background:#1e1e1e; border:1px solid #333; border-radius:8px; color:#a9dc76;">
                          <i class="fas fa-check-circle"></i> App Deployed! Check the Workspace Panel on the right.
                        </div>\`;
                        scrollToBottom();
`;
content = content.replace(/let previewUrl = res\.url\.(?:.*?)scrollToBottom\(\);/s, newDeployBlock);

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
