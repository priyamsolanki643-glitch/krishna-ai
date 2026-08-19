const fs = require('fs');
const content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

const mainIdx = content.indexOf('<div class="main">');
const subContent = content.substring(mainIdx);

let depth = 0;
let tags = [];
const regex = /<\/?div[^>]*>/g;
let match;
while ((match = regex.exec(subContent)) !== null) {
    if (match[0].startsWith('<div')) {
        depth++;
        if (depth === 2) {
           const classMatch = match[0].match(/class="([^"]+)"/);
           if(classMatch) tags.push(classMatch[1]);
           else tags.push('NO_CLASS');
        }
    } else if (match[0].startsWith('</div')) {
        depth--;
        if (depth === 0) break; // closed main
    }
}
console.log('Direct children of .main:', tags.join(', '));
