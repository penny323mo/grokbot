// Headless Sanity & Asset Integrity Test for Midnight Touge (《夜峠》)
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Headless Load & Static Asset Verification', () => {
  test('index.html exists and references offline relative resources without CDN', () => {
    const htmlPath = path.resolve('index.html');
    assert.ok(fs.existsSync(htmlPath), 'index.html must exist at project root');

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    assert.strictEqual(htmlContent.includes('cdn.'), false, 'Must not reference external CDNs');
    assert.strictEqual(htmlContent.includes('http://'), false, 'Must not reference insecure external HTTP');
    assert.strictEqual(htmlContent.includes('https://unpkg.com'), false, 'Must not reference unpkg CDN');
    assert.strictEqual(htmlContent.includes('https://cdnjs.cloudflare.com'), false, 'Must not reference cdnjs CDN');
    assert.ok(htmlContent.includes('game-canvas'), 'Must declare game canvas');
    assert.ok(htmlContent.includes('hud-container'), 'Must declare HUD container');
    assert.ok(htmlContent.includes('ui-container'), 'Must declare UI container');
  });

  test('All required 3D models and textures exist on disk', () => {
    const requiredFiles = [
      'assets/models/car_h86.glb',
      'assets/models/car_gt20.glb',
      'assets/models/car_re7.glb',
      'assets/models/track_kirine.glb',
      'assets/textures/asphalt_diffuse.jpg',
      'assets/textures/asphalt_roughness.jpg',
      'assets/textures/asphalt_normal.jpg',
      'assets/audio/eurobeat_kirine.mp3',
      'assets/fonts/BarlowCondensed-BoldItalic.ttf'
    ];

    for (const f of requiredFiles) {
      assert.ok(fs.existsSync(path.resolve(f)), `Required asset must exist: ${f}`);
      const stat = fs.statSync(path.resolve(f));
      assert.ok(stat.size > 0, `Asset file must not be empty: ${f}`);
    }
  });

  test('Source modules import correctly without syntax errors', async () => {
    const carsMod = await import('../src/data/cars.js');
    assert.ok(carsMod.CARS_DATA && carsMod.CARS_DATA.length >= 3);

    const eventsMod = await import('../src/data/events.js');
    assert.ok(eventsMod.EVENTS_DATA && eventsMod.EVENTS_DATA.length === 12);
    assert.ok(eventsMod.FREE_RUN_EVENT);

    const trackMod = await import('../src/data/track_data.js');
    assert.ok(trackMod.KIRINE_PASS_TRACK);

    const storageMod = await import('../src/core/storage.js');
    assert.ok(storageMod.storage);
  });
});
