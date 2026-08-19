const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');
const wsEnd = '<!-- Debug Panel -->';
const parts = content.split(wsEnd);
console.log(parts[0].slice(-100));
