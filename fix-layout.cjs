const fs = require('fs');
let content = fs.readFileSync('e:/vibe coding app/test-frontend.html', 'utf8');

// 1. Remove the extra closing </div> before <!-- Chat Area -->
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<!-- Chat Area -->/, '</div>\n    </div>\n\n    <!-- Chat Area -->');

// 2. Add a closing </div> for <div class="main"> before <!-- Debug Panel -->
content = content.replace(/<!-- Debug Panel -->/, '</div>\n\n  <!-- Debug Panel -->');

fs.writeFileSync('e:/vibe coding app/test-frontend.html', content);
console.log('Fixed layout');
