const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

// Force body CSS
content = content.replace(/body\s*\{[\s\S]*?\}/, `body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      width: 100vw;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }`);

// Force main CSS
content = content.replace(/\.main\s*\{[\s\S]*?\}/, `.main {
      display: flex !important;
      flex-direction: row !important;
      flex: 1;
      height: calc(100vh - 60px);
      width: 100vw;
      overflow: hidden;
    }`);

// Force sidebar CSS
content = content.replace(/\.sidebar\s*\{[\s\S]*?\}/, `.sidebar {
      width: 260px;
      flex-shrink: 0;
      height: 100%;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 20px 10px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }`);

// Force chat-area CSS
content = content.replace(/\.chat-area\s*\{[\s\S]*?\}/, `.chat-area {
      width: 450px;
      flex-shrink: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      position: relative;
    }`);

// Force workspace-area inline CSS in HTML to external class
content = content.replace(/<div class="workspace-area"[^>]*>/, `<div class="workspace-area" id="workspace-area">`);
content = content.replace(/<\/style>/, `
    .workspace-area {
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #0e0e0e;
      border-left: 1px solid #222;
    }
    </style>`);

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Bulletproof layout applied');
