import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Integrity: all essential files exist and are non-empty', () => {
  const files = [
    'index.html',
    'manifest.webmanifest',
    'package.json',
    'css/style.css',
    'js/app.js',
    'js/router.js',
    'js/weather.js',
    'js/profile.js',
    'js/utils.js',
    'data/style.json',
    'vendor/maplibre-gl.js',
    'vendor/maplibre-gl.css',
    'assets/icon-192.png',
    'assets/icon-512.png',
    'assets/apple-touch-icon.png',
    'assets/favicon.svg',
    'assets/fonts/NotoSansTC-Regular.woff',
    'assets/fonts/NotoSansTC-Bold.woff',
    'assets/fonts/SourceSans3-Regular.woff2',
    'assets/fonts/SourceSans3-SemiBold.woff2'
  ];

  for (const f of files) {
    const fullPath = path.resolve(f);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${f}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 0, `File must not be empty: ${f}`);
  }
});

test('Integrity: index.html uses strictly relative paths for assets', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');

  // Check for leading slashes in href and src attributes (e.g. href="/css/...")
  const absoluteMatches = html.match(/(?:href|src)=["']\/[a-zA-Z0-9_-]/g);
  assert.equal(
    absoluteMatches,
    null,
    `index.html must not contain root-relative paths like href="/...": ${JSON.stringify(absoluteMatches)}`
  );

  // Check essential elements
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /vendor\/maplibre-gl\.js/);
  assert.match(html, /vendor\/maplibre-gl\.css/);
  assert.match(html, /css\/style\.css/);
  assert.match(html, /js\/app\.js/);
  assert.match(html, /assets\/favicon\.svg/);
});

test('Integrity: JS files never invoke maplibregl.supported()', () => {
  const jsDir = path.resolve('js');
  const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));

  for (const f of jsFiles) {
    const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
    assert.ok(
      !/\bmaplibregl\.supported\s*\(/.test(content),
      `File js/${f} must not call maplibregl.supported() (MapLibre 4.x trap)`
    );
  }
});

test('Integrity: manifest.webmanifest is valid and configured for standalone', () => {
  const manifestContent = fs.readFileSync(path.resolve('manifest.webmanifest'), 'utf8');
  const manifest = JSON.parse(manifestContent);

  assert.equal(manifest.name, '斜路 · 澳門步道坡度剖面');
  assert.equal(manifest.short_name, '斜路');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './index.html');
  assert.ok(manifest.icons && manifest.icons.length >= 2);
});

test('Integrity: Copy honesty & safety rules check', () => {
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf8');
  const appContent = fs.readFileSync(path.resolve('js/app.js'), 'utf8');
  const routerContent = fs.readFileSync(path.resolve('js/router.js'), 'utf8');

  // Must NEVER judge safety (SPEC line 26: Never say a path is 安全, 危險, 適合或唔適合某類行人)
  assert.doesNotMatch(appContent, /安全|危險/);
  assert.doesNotMatch(htmlContent, /安全|危險/);
  assert.doesNotMatch(routerContent, /安全|危險/);

  // Must NEVER claim router/model is official measurement/survey
  assert.doesNotMatch(appContent, /官方測量|官方觀測/);
  assert.doesNotMatch(htmlContent, /官方測量|官方觀測/);
  assert.doesNotMatch(routerContent, /官方測量|官方觀測/);

  // Must include OpenStreetMap attribution
  assert.match(htmlContent, /OpenStreetMap/);
  assert.match(htmlContent, /Valhalla/);
});
