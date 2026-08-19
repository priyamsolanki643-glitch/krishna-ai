const fs = require('fs');
const content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');
const lines = content.split('\n');
let mainStart = lines.findIndex(l => l.includes('<div class="main">'));
let depth = 0;
for (let i = mainStart; i < mainStart + 100; i++) {
  const line = lines[i];
  if(line) {
      let open = (line.match(/<div/g) || []).length;
      let close = (line.match(/<\/div/g) || []).length;
      depth += (open - close);
      console.log(`L${i} [depth:${depth}] ${line.trim()}`);
  }
}
