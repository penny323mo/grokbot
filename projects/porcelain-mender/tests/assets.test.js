// tests/assets.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOBS_DATA, ENDINGS_DATA } from '../src/data/jobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Asset Reference Verification', () => {
  test('Every job piece image asset exists on disk and is non-empty', () => {
    JOBS_DATA.forEach(job => {
      const fullPath = path.resolve(ROOT_DIR, job.piece.asset);
      assert.ok(fs.existsSync(fullPath), `Asset file not found for job ${job.id}: ${job.piece.asset}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 1000, `Asset file is too small or empty: ${job.piece.asset}`);
    });
  });

  test('Every customer portrait asset exists on disk and is non-empty', () => {
    JOBS_DATA.forEach(job => {
      const fullPath = path.resolve(ROOT_DIR, job.customer.portrait);
      assert.ok(fs.existsSync(fullPath), `Portrait file not found for customer ${job.customer.name}: ${job.customer.portrait}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 1000, `Portrait file is too small: ${job.customer.portrait}`);
    });
  });

  test('Every ending vignette asset exists on disk', () => {
    Object.values(ENDINGS_DATA).forEach(ending => {
      const fullPath = path.resolve(ROOT_DIR, ending.vignette);
      assert.ok(fs.existsSync(fullPath), `Ending vignette not found: ${ending.vignette}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 1000, `Ending vignette is too small: ${ending.vignette}`);
    });
  });

  test('Core UI assets exist on disk', () => {
    const coreAssets = [
      'assets/art/title_key.webp',
      'assets/art/bench.webp',
      'assets/art/staple_brass.webp',
      'assets/art/cover.webp',
      'assets/art/thumb.webp',
      'assets/art/letter_paper.webp'
    ];
    coreAssets.forEach(relPath => {
      const fullPath = path.resolve(ROOT_DIR, relPath);
      assert.ok(fs.existsSync(fullPath), `Missing essential UI asset: ${relPath}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 500, `UI asset is too small: ${relPath}`);
    });
  });
});
