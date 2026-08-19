const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

// 1. Hide [Auto-System] when sending
content = content.replace("appendMessage('user', text);", "if (!text.startsWith('[Auto-System]')) appendMessage('user', text);");

// 2. Hide [Auto-System] and clean AI code blocks when loading history
const loadRegex = /msgs\.forEach\(m => appendMessage\(m\.role, m\.content\)\);/;
const loadReplacement = `msgs.forEach(m => {
            if (m.content && m.content.startsWith('[Auto-System]')) return;
            if (m.role !== 'user' && m.content && m.content.includes('<file path=')) {
                let cleaned = m.content.replace(/<file[\\s\\S]*?(?:<\\/file>|$)/g, '\\n[File written to workspace]\\n').trim();
                if (!cleaned) return;
                m.content = cleaned;
            }
            appendMessage(m.role, m.content);
          });`;

content = content.replace(loadRegex, loadReplacement);

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Hidden Auto-System messages from UI');
