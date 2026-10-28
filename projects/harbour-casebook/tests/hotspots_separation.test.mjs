import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/data/cases.js';

test('No two hotspots in any scene are closer than 44px tap diameter at 390px', () => {
  // Base dimensions: 390 x 585
  const baseW = 390;
  const baseH = 585;
  const minRequiredDistancePx = 44.0;

  for (const c of CASES) {
    const hs = c.hotspots;
    for (let i = 0; i < hs.length; i++) {
      for (let j = i + 1; j < hs.length; j++) {
        const dxPx = ((hs[j].x - hs[i].x) / 100) * baseW;
        const dyPx = ((hs[j].y - hs[i].y) / 100) * baseH;
        const distPx = Math.sqrt(dxPx * dxPx + dyPx * dyPx);

        assert.ok(
          distPx >= minRequiredDistancePx,
          `Case ${c.id} hotspot clash: "${hs[i].id}" (${hs[i].x}%, ${hs[i].y}%) and "${hs[j].id}" (${hs[j].x}%, ${hs[j].y}%) are only ${distPx.toFixed(1)}px apart (< ${minRequiredDistancePx}px)`
        );
      }
    }
  }
});
