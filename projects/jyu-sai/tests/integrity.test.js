import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test('File structure: all required assets and files exist on disk', () => {
  const files = [
    'index.html',
    'manifest.webmanifest',
    'package.json',
    'css/style.css',
    'js/app.js',
    'js/utils.js',
    'js/rainviewer.js',
    'js/openmeteo.js',
    'js/smg.js',
    'js/hko.js',
    'data/style.json',
    'vendor/maplibre-gl.js',
    'vendor/maplibre-gl.css',
    'vendor/LICENSE',
    'assets/fonts/NotoSansTC-Regular.woff',
    'assets/fonts/NotoSansTC-Bold.woff',
    'assets/fonts/SourceSans3-Regular.woff2',
    'assets/fonts/SourceSans3-SemiBold.woff2',
    'assets/icon-192.png',
    'assets/icon-512.png',
    'assets/apple-touch-icon.png',
    'assets/favicon.svg'
  ];

  for (const f of files) {
    const full = path.join(rootDir, f);
    assert.ok(fs.existsSync(full), `File must exist: ${f}`);
    assert.ok(fs.statSync(full).size > 0, `File must not be empty: ${f}`);
  }
});

test('index.html uses strictly relative paths and no CDN script/style tags', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // No absolute root paths like href="/..." or src="/..."
  const absoluteRootMatches = html.match(/(?:href|src)=["']\/(?!\/)[^"']*["']/g);
  assert.equal(
    absoluteRootMatches,
    null,
    `Found absolute root paths in index.html: ${JSON.stringify(absoluteRootMatches)}`
  );

  // No CDN script tags for MapLibre or other libs
  assert.ok(
    !html.includes('unpkg.com') && !html.includes('cdn.jsdelivr.net') && !html.includes('cdnjs.cloudflare.com'),
    'Vendored libraries must be used, no CDN script tags'
  );

  // Check essential mobile web app tags
  assert.ok(html.includes('apple-mobile-web-app-capable'), 'Must have apple-mobile-web-app-capable');
  assert.ok(html.includes('manifest.webmanifest'), 'Must reference manifest.webmanifest');
  assert.ok(html.includes('apple-touch-icon'), 'Must reference apple-touch-icon');
  assert.ok(html.includes('viewport-fit=cover'), 'Must include viewport-fit=cover');
});

test('manifest.webmanifest is valid and has required keys', () => {
  const manifestPath = path.join(rootDir, 'manifest.webmanifest');
  const content = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);

  assert.equal(manifest.short_name, '雨勢');
  assert.ok(manifest.start_url.startsWith('./'), 'start_url must be relative');
  assert.equal(manifest.display, 'standalone');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);

  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith('./'), `icon src must be relative: ${icon.src}`);
    const resolvedPath = path.join(rootDir, icon.src.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(resolvedPath), `Icon file missing: ${resolvedPath}`);
  }
});

test('js/app.js does not call missing maplibregl.supported()', () => {
  const appPath = path.join(rootDir, 'js/app.js');
  const code = fs.readFileSync(appPath, 'utf-8');
  assert.ok(
    !code.includes('maplibregl.supported()'),
    'MapLibre 4.7.1 does not support maplibregl.supported(), use canvas WebGL feature detection'
  );
});

test('css/style.css complies with design rules and constraints', () => {
  const cssPath = path.join(rootDir, 'css/style.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  // Palette colors check
  assert.ok(css.includes('#E4E9ED'), 'Must include cool rain-washed concrete #E4E9ED');
  assert.ok(css.includes('#16191C'), 'Must include ink #16191C');
  assert.ok(css.includes('#7A3D62'), 'Must include mulberry accent #7A3D62');
  assert.ok(css.includes('#A9C4D1'), 'Must include rain scale light #A9C4D1');
  assert.ok(css.includes('#3D6F8F'), 'Must include rain scale moderate #3D6F8F');
  assert.ok(css.includes('#1B3F5A'), 'Must include rain scale heavy #1B3F5A');

  // Safe area insets check
  assert.ok(css.includes('env(safe-area-inset-top)'), 'Must respect safe-area-inset-top');
  assert.ok(css.includes('env(safe-area-inset-bottom)'), 'Must respect safe-area-inset-bottom');

  // Tabular lining figures
  assert.ok(css.includes('tabular-nums'), 'Must define tabular numbers');

  // Reduced motion
  assert.ok(css.includes('prefers-reduced-motion'), 'Must support prefers-reduced-motion');
});

test('SPEC forbidden items are absent from index.html', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  const forbidden = ['AQI', 'UV', '7-day', 'tide', 'pharmacy', 'toilet'];
  for (const item of forbidden) {
    assert.ok(!html.toLowerCase().includes(item.toLowerCase()), `Forbidden item found in index.html: ${item}`);
  }
});
