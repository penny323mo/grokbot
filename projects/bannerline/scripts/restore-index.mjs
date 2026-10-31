import fs from 'node:fs';

const src = 'index.source.html';
if (!fs.existsSync(src)) {
  console.error('missing index.source.html');
  process.exit(1);
}
fs.copyFileSync(src, 'index.html');
