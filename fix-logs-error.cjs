const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

const oldSetLog = 'logsDiv.innerHTML = agentLogs.map(l => `<div><i class="fas fa-check" style="color:#a9dc76; margin-right:5px;"></i> ${l}</div>`).join(\\'\\');';
const newSetLog = `logsDiv.innerHTML = agentLogs.map(l => {
            const isErr = l.startsWith('❌');
            const icon = isErr ? '<i class="fas fa-times-circle" style="color:#ff5555; margin-right:5px;"></i>' : '<i class="fas fa-check" style="color:#a9dc76; margin-right:5px;"></i>';
            return \`<div>\${icon} \${l}</div>\`;
          }).join('');`;

content = content.replace(oldSetLog, newSetLog);
content = content.replace(oldSetLog, newSetLog); // There might be two occurrences

const oldEnd = `if (!contentBuffer) bubble.textContent = '(No response received)';
        await loadSessions();

    } catch (err) {
      bubble.textContent = \`Connection error: \${err.message}\`;
    } finally {`;

const newEnd = `if (contentBuffer && contentBuffer.includes('[Error from LLM Service:')) {
            setAgentLog('❌ AI Provider Error (Rate limit hit)', false);
        } else if (!contentBuffer) {
            bubble.textContent = '(No response received)';
            setAgentLog('❌ No response from AI', false);
        } else if (window.currentGeneratingFile || window.thinkingLogSet) {
            if (!contentBuffer.includes('ALL_FILES_DONE') && !contentBuffer.includes('MORE_FILES_PENDING')) {
                setAgentLog('Finished processing', false);
            }
        }
        
        await loadSessions();

    } catch (err) {
      bubble.textContent = \`Connection error: \${err.message}\`;
      setAgentLog(\`❌ Connection error: \${err.message}\`, false);
    } finally {`;

content = content.replace(oldEnd, newEnd);

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Fixed agent action log error logic');
