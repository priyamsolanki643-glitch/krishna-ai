const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

const startIdx = content.indexOf('}).catch(err => {');
if (startIdx > -1) {
    const searchStr = 'sendMessage();\n                     }, 2000);\n                   });';
    const endIdx = content.indexOf('sendMessage();', startIdx);
    if (endIdx > -1) {
        const realEndIdx = content.indexOf('});', endIdx) + 3;
        const toReplace = content.substring(startIdx, realEndIdx);
        
        const newCatch = `}).catch(err => {
                     addLog(\`❌ Error: \${err.message}\`);
                     if (err.name === 'TypeError' || err.name === 'ReferenceError' || err.message.includes('fetch')) {
                        addLog('Frontend/Network error. Not triggering AI self-healing.');
                        statusSpan.textContent = '🔴 UI Error';
                     } else {
                        statusSpan.textContent = '🛠️ Auto-Healing Triggered';
                        setTimeout(() => {
                           const input = document.getElementById('msgInput');
                           input.value = \`[Auto-System] Deployment failed with system error: \${err.message}. Please fix the code.\`;
                           sendMessage();
                        }, 2000);
                     }
                   });`;
        
        content = content.replace(toReplace, newCatch);
        fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
        console.log('Fixed auto-healing loop using string replacement');
    } else {
        console.log('Could not find sendMessage();');
    }
} else {
    console.log('Could not find catch block');
}
