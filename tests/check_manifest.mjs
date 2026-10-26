import fs from 'node:fs';
const { projects } = JSON.parse(fs.readFileSync('projects/manifest.json', 'utf8'));
let bad = 0;
for (const p of projects) {
  for (const k of ['id','title','description','path','added']) if (!p[k]) { console.error(`${p.id}: missing ${k}`); bad++; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.added || '')) { console.error(`${p.id}: bad added`); bad++; }
  if (!fs.existsSync(p.path + 'index.html')) { console.error(`${p.id}: no index.html`); bad++; }
}
console.log(bad ? `FAIL ${bad}` : `OK ${projects.length} projects`); process.exit(bad ? 1 : 0);
