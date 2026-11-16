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
    'js/transit.js',
    'js/utils.js',
    'js/weather.js',
    'data/routes.json',
    'data/stops.json',
    'data/meta.json',
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

  // Check essential elements are present
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /vendor\/maplibre-gl\.js/);
  assert.match(html, /vendor\/maplibre-gl\.css/);
  assert.match(html, /css\/style\.css/);
  assert.match(html, /js\/app\.js/);
  assert.match(html, /assets\/favicon\.svg/);
});

test('Integrity: JS files never call maplibregl.supported()', () => {
  const jsDir = path.resolve('js');
  const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));

  for (const f of jsFiles) {
    const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
    assert.ok(
      !/\bmaplibregl\.supported\s*\(/.test(content),
      `File js/${f} must not call maplibregl.supported() (MapLibre 4.7.1 trap)`
    );
  }
});

test('Integrity: manifest.webmanifest is valid and has proper structure', () => {
  const manifestContent = fs.readFileSync(path.resolve('manifest.webmanifest'), 'utf8');
  const manifest = JSON.parse(manifestContent);

  assert.equal(manifest.name, '點去 · 澳門行路定搭巴士');
  assert.equal(manifest.short_name, '點去');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons && manifest.icons.length >= 2);
  assert.equal(manifest.start_url, './index.html');
});

test('Integrity: Authentic Cantonese copy and honest attribution check', () => {
  const transitContent = fs.readFileSync(path.resolve('js/transit.js'), 'utf8');
  const appContent = fs.readFileSync(path.resolve('js/app.js'), 'utf8');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf8');

  // Check honest DSAT CORS explanation is present
  const hasCorsNotice = transitContent.includes('即時巴士位置暫時未能喺瀏覽器讀到（受 DSAT 跨域限制）') ||
                        appContent.includes('即時巴士位置暫時未能喺瀏覽器讀到（受 DSAT 跨域限制）');
  assert.ok(hasCorsNotice, 'Must include honest DSAT CORS notice');

  // Check snapshot date / attribution notice is present
  assert.match(htmlContent, /路線同站位：澳門交通事務局 \(DSAT\) 公開查詢資料/);
  assert.match(htmlContent, /唔係即時到站/);

  // Check Cantonese wording
  assert.match(appContent, /行路/);
  assert.match(appContent, /搭.*個站/);
  assert.match(appContent, /落車/);
});
