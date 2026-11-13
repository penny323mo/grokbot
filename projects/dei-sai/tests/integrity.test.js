import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test('File structure: all required files and assets exist on disk', () => {
  const requiredFiles = [
    'index.html',
    'manifest.webmanifest',
    'css/style.css',
    'js/app.js',
    'js/utils.js',
    'js/landmarks-data.js',
    'data/landmarks.json',
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

  for (const relPath of requiredFiles) {
    const fullPath = path.join(rootDir, relPath);
    assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 0, `File should not be empty: ${relPath}`);
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

  assert.equal(manifest.short_name, '地勢');
  assert.ok(manifest.start_url.startsWith('./'), 'start_url must be relative');
  assert.equal(manifest.display, 'standalone');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);

  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith('./'), `icon src must be relative: ${icon.src}`);
    const resolvedPath = path.join(rootDir, icon.src.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(resolvedPath), `Icon file missing: ${resolvedPath}`);
  }
});

test('css/style.css complies with design rules and constraints', () => {
  const cssPath = path.join(rootDir, 'css/style.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  // Palette colors check
  assert.ok(css.includes('#E8E6E1'), 'Must include cool limestone chrome color #E8E6E1');
  assert.ok(css.includes('#1A1C1B'), 'Must include ink color #1A1C1B');
  assert.ok(css.includes('#8A9590'), 'Must include mineral grey-green water #8A9590');
  assert.ok(css.includes('#7A3E2B'), 'Must include iron oxide accent #7A3E2B');

  // Safe area insets check
  assert.ok(css.includes('env(safe-area-inset-top)'), 'Must respect safe-area-inset-top');
  assert.ok(css.includes('env(safe-area-inset-bottom)'), 'Must respect safe-area-inset-bottom');

  // Input font size check (>= 16px to prevent iOS zoom)
  assert.ok(css.includes('font-size: 16px'), 'Search input must have font-size >= 16px');

  // Tabular lining figures
  assert.ok(css.includes('tabular-nums'), 'Must define tabular numbers');

  // Touch action
  assert.ok(css.includes('touch-action: none'), 'Map container must have touch-action: none');

  // Reduced motion
  assert.ok(css.includes('prefers-reduced-motion'), 'Must support prefers-reduced-motion');
});

test('OpenFreeMap style.json contains terrainSource and 3D buildings layer', () => {
  const stylePath = path.join(rootDir, 'data/style.json');
  const content = fs.readFileSync(stylePath, 'utf-8');
  const style = JSON.parse(content);

  // Check terrain source
  assert.ok(style.sources.terrainSource, 'Must contain terrainSource');
  assert.equal(style.sources.terrainSource.type, 'raster-dem');
  assert.equal(style.sources.terrainSource.encoding, 'terrarium');
  assert.ok(
    style.sources.terrainSource.tiles[0].includes('elevation-tiles-prod/terrarium'),
    'Must use AWS Terrarium elevation tiles'
  );

  // Check 3D building layer
  const bld3d = style.layers.find(l => l.id === 'building-3d');
  assert.ok(bld3d, 'Must have building-3d layer');
  assert.equal(bld3d.type, 'fill-extrusion');
  assert.ok(bld3d.minzoom <= 12, 'building-3d minzoom should be <= 12 so buildings show at default SAR pitch view');
});
