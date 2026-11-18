import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/app.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const all = fs.readdirSync(path.join(root, 'js'))
  .filter((name) => name.endsWith('.js'))
  .map((name) => fs.readFileSync(path.join(root, 'js', name), 'utf8'))
  .join('\n');

test('the page is one app, keeps the back link, and does not hub or iframe the old tools', () => {
  assert.match(html, /src="\.\.\/_shared\/back\.js"/);
  assert.match(html, /id="map"/);
  assert.match(html, /id="mode-walk"/);
  assert.match(html, /id="mode-bus"/);
  assert.doesNotMatch(html, /<iframe/i);
  assert.doesNotMatch(html, /projects\/dim-heoi\/index|projects\/ce-lou\/index/);
  assert.doesNotMatch(all, /project-osrm\.org/);
  assert.doesNotMatch(all, /maplibregl\.supported\(/);
  assert.doesNotMatch(all, /ApiKey|APPCODE|password/i);
  assert.doesNotMatch(all, /濕滑|好安全|危險/);
});

test('chips wrap and source updates go through link parts, not footer textContent', () => {
  assert.match(css, /\.chips[^{]*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(css, /\.variants[^{]*\{[^}]*flex-wrap:\s*wrap/);
  assert.doesNotMatch(css, /flex-wrap:\s*nowrap/);
  assert.match(app, /applyParts\(/);
  assert.doesNotMatch(app, /source-walk[\s\S]{0,40}textContent/);
  assert.doesNotMatch(app, /footer-router-meta/);
});
