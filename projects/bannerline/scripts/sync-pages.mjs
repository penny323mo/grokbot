import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist';
const builtIndex = path.join(dist, 'index.html');
if (!fs.existsSync(builtIndex)) {
  console.error('dist/index.html missing');
  process.exit(1);
}

fs.rmSync('static', { recursive: true, force: true });

for (const name of fs.readdirSync(dist)) {
  fs.cpSync(path.join(dist, name), path.join('.', name), { recursive: true });
}

const built = fs.readFileSync('index.html', 'utf8');
if (!built.includes('static/app.js')) {
  console.error('built index.html does not reference static/app.js');
  process.exit(1);
}
const source = fs.readFileSync('index.source.html', 'utf8');
if (!source.includes('./src/main.js')) {
  console.error('index.source.html lost the Vite entry');
  process.exit(1);
}
console.log('pages root synced');
