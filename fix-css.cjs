const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

content = content.replace(/\.chat-area\s*\{\s*flex:\s*1;/g, '.chat-area {\n      width: 450px;\n      flex-shrink: 0;');

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Fixed chat-area CSS');
