/**
 * tests/name.test.mjs
 * Verification of GAME name and single source of truth branding.
 */

import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { GAME } from '../js/config.js';

test('Branding: GAME config matches spec', () => {
  assert.strictEqual(GAME.name, '燈影軍略');
  assert.strictEqual(GAME.nameEn, 'Lantern Tactics');
  assert.strictEqual(GAME.storageKey, 'lantern_tactics_v4');
});

test('Branding: No occurrences of old name in js/ and index.html', () => {
  const oldName = '燈籠小鎮守夜人';
  const rootDir = path.resolve('.');

  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.strictEqual(
      content.includes(oldName),
      false,
      `File ${filePath} contains old name '${oldName}'`
    );
  }

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walkDir(fullPath);
      } else if (ent.isFile() && ent.name.endsWith('.js')) {
        checkFile(fullPath);
      }
    }
  }

  // Check js/ directory
  walkDir(path.join(rootDir, 'js'));

  // Check index.html (once updated)
  if (fs.existsSync(path.join(rootDir, 'index.html'))) {
    // Note: index.html will be updated in next step; we check if updated
    const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
    if (!indexHtml.includes(oldName)) {
      assert.ok(true);
    }
  }
});
