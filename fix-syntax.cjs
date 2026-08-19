const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

// Find the exact spot and remove the extra brace
content = content.replace(`                }
              }
              }
            } catch (e) {`, `                }
              }
            } catch (e) {`);

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Fixed syntax error');
