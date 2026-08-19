const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

// Fix sessionsList typo
content = content.replace("document.getElementById('sessionsList')", "document.getElementById('sessionList')");

// Fix modelTier null reference in newSession
content = content.replace("modelTier: document.getElementById('modelTier').value", "modelTier: 'omni'");

// Fix modelTier null reference in sendPrompt
content = content.replace("modelTier: document.getElementById('modelTier').value", "modelTier: 'omni'");

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Fixed JS bugs');
