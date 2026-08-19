const fs = require('fs');
const content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');
const lines = content.split('\n');
let depth = 0;
let inSend = false;
for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  if(line.includes('async function sendPrompt')) inSend = true;
  if(inSend) {
      for(let j=0; j<line.length; j++) {
        if(line[j] === '{') depth++;
        if(line[j] === '}') depth--;
      }
      if (depth > 0 && i > 830 && i < 890) console.log('Line ' + i + ' (total=' + depth + '): ' + line.trim());
      if(depth === 0) { console.log('End of sendPrompt at ' + i); inSend = false; break; }
  }
}

