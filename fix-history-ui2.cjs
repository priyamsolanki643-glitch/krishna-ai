const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

const oldLoadReplacement = `let cleaned = m.content.replace(/<file[\\s\\S]*?(?:<\\/file>|$)/g, '\\n[File written to workspace]\\n').trim();`;
const newLoadReplacement = `let cleaned = m.content.replace(/\\`\\`\\`xml\\s*/gi, '').replace(/\\`\\`\\`/g, '');
                cleaned = cleaned.replace(/<\\s*file[\\s\\S]*?(?:<\\/\\s*file>|$)/gi, '\\n[File written to workspace]\\n').trim();`;

content = content.replace(oldLoadReplacement, newLoadReplacement);

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Fixed history loader regex');
