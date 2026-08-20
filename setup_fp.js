const fs = require('fs');
const path = require('path');
const baseDir = path.join(__dirname, 'apps', 'web', 'src');

fs.mkdirSync(path.join(baseDir, 'utils', 'supabase'), { recursive: true });
fs.mkdirSync(path.join(baseDir, 'components', 'ui'), { recursive: true });

const supabaseContent = `import { createClient } from '@supabase/supabase-js';

let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kscqvigvcfjdulonvdxa.supabase.co';
if (rawUrl.includes('/rest/v1')) {
  rawUrl = rawUrl.replace('/rest/v1/', '').replace('/rest/v1', '');
}
if (rawUrl.endsWith('/')) {
  rawUrl = rawUrl.slice(0, -1);
}

const supabaseUrl = rawUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzY3F2aWd2Y2ZqZHVsb252ZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder_fallback_key_for_build';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;

fs.writeFileSync(path.join(baseDir, 'utils', 'supabase', 'client.ts'), supabaseContent, 'utf8');

const componentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fp_chat_components.json'), 'utf8'));
componentsData.forEach(item => {
  let targetPath = '';
  if (item.file.includes('skeleton')) {
    targetPath = path.join(baseDir, 'components', 'ui', 'skeleton.tsx');
  } else if (item.file.includes('gyro-logo')) {
    targetPath = path.join(baseDir, 'components', 'gyro-logo.tsx');
  } else if (item.file.includes('markdown-renderer')) {
    targetPath = path.join(baseDir, 'components', 'markdown-renderer.tsx');
  } else if (item.file.includes('sidebar.tsx')) {
    targetPath = path.join(baseDir, 'components', 'sidebar.tsx');
  }
  if (targetPath) {
    fs.writeFileSync(targetPath, item.content, 'utf8');
    console.log('Wrote', targetPath);
  }
});
