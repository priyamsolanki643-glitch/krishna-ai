const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'apps', 'web', 'src', 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

const fpStyles = `
/* ── FP Chat & UI Enhancements ── */
.shimmer-text-white {
  color: transparent;
  background: linear-gradient(90deg, #52525b, #ffffff, #ffffff, #ffffff, #52525b) 0 0 / 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: 3.5s linear infinite shimmer;
}

.shimmer-text-lumensky {
  color: transparent;
  background: linear-gradient(90deg, #666 0%, #fff 40%, #fff 60%, #666 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  animation: shimmer 2.5s linear infinite;
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@keyframes chatReveal {
  0% { opacity: 0; transform: translateY(12px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.reveal-chat-item {
  animation: chatReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes messageReveal {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-message-reveal {
  animation: messageReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.skeleton-line {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes oracle-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}
`;

if (!css.includes('.shimmer-text-white')) {
  css += fpStyles;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Appended FP styles to globals.css');
}
