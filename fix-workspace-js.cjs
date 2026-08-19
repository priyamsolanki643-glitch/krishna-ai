const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

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
    if (!tree) return;
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
         if (codeBlock) {
             codeBlock.className = \`language-\${lang === 'js' ? 'javascript' : lang}\`;
             codeBlock.textContent = file.content;
             if (window.hljs) hljs.highlightElement(codeBlock);
         }
      };
      tree.appendChild(btn);
    });
  }
`;

// Insert the JS functions right before function toggleDebug()
content = content.replace(/function toggleDebug\(\)/, workspaceJs + '\n\n    function toggleDebug()');

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Injected workspace JS functions');
