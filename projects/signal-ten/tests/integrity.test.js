// 十號風球 · Signal Ten (1962) — Structural, Historical & Simulation Integrity Tests
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SIGNALS_1962,
  SIGNAL_BY_CODE,
  CHARACTERS,
  INITIAL_METRICS,
  STORMS,
  CAMPAIGN_ENDINGS,
  projectLatLon
} from '../src/data.js';

import {
  evaluateShiftDecision,
  resolveCampaignEnding,
  simulateSoundForecaster,
  simulateNeverHoistPlayer,
  simulatePanicHoister
} from '../src/game.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), '..');

describe('1962 Hong Kong Storm Signal System & Synoptic Chart Geography', () => {
  test('1962 signal table contains 0, 1, 3, 5, 6, 7, 8, 9, 10 with accurate lights and quadrants', () => {
    const codes = SIGNALS_1962.map((s) => s.code);
    assert.deepEqual(codes, [0, 1, 3, 5, 6, 7, 8, 9, 10]);

    assert.deepEqual(SIGNAL_BY_CODE[1].lights, ['W', 'W', 'W']);
    assert.deepEqual(SIGNAL_BY_CODE[3].lights, ['G', 'W', 'G']);
    assert.deepEqual(SIGNAL_BY_CODE[5].lights, ['W', 'G', 'G']);
    assert.equal(SIGNAL_BY_CODE[5].quadrant, 'NW');
    assert.deepEqual(SIGNAL_BY_CODE[6].lights, ['G', 'W', 'W']);
    assert.equal(SIGNAL_BY_CODE[6].quadrant, 'SW');
    assert.deepEqual(SIGNAL_BY_CODE[7].lights, ['G', 'G', 'W']);
    assert.equal(SIGNAL_BY_CODE[7].quadrant, 'NE');
    assert.deepEqual(SIGNAL_BY_CODE[8].lights, ['W', 'W', 'G']);
    assert.equal(SIGNAL_BY_CODE[8].quadrant, 'SE');
    assert.deepEqual(SIGNAL_BY_CODE[9].lights, ['G', 'G', 'G']);
    assert.deepEqual(SIGNAL_BY_CODE[10].lights, ['R', 'G', 'R']);
    assert.equal(SIGNAL_BY_CODE[10].quadrant, 'HURRICANE');
  });

  test('Synoptic chart projection places Hong Kong, Waglan, Pratas, and Manila in accurate relative quadrants', () => {
    const hk = projectLatLon(22.30, 114.17);
    const waglan = projectLatLon(22.18, 114.30);
    const pratas = projectLatLon(20.70, 116.72);
    const manila = projectLatLon(14.59, 120.98);
    const macau = projectLatLon(22.19, 113.54);

    // Macau is west of HK (smaller xPct)
    assert.ok(macau.xPct < hk.xPct, 'Macau must be west of Hong Kong');
    // Waglan is SE of ROHK
    assert.ok(waglan.xPct > hk.xPct && waglan.yPct > hk.yPct, 'Waglan must be SE of ROHK');
    // Pratas is SE of HK
    assert.ok(pratas.xPct > hk.xPct && pratas.yPct > hk.yPct, 'Pratas must be SE of Hong Kong');
    // Manila is further SE of Pratas
    assert.ok(manila.xPct > pratas.xPct && manila.yPct > pratas.yPct, 'Manila must be SE of Pratas');
  });
});

describe('Campaign Structure (4 Storms, 22 Shifts, Historical Typhoon Wanda Climax)', () => {
  test('All 4 storms and all shifts have complete reports, candidate tracks, barometer/anemometer data, and outcomes', () => {
    assert.equal(STORMS.length, 4);

    for (const storm of STORMS) {
      assert.ok(storm.id && storm.nameZh && storm.coverArt);
      assert.ok(storm.shifts.length >= 4 && storm.shifts.length <= 6);
      assert.ok(storm.debrief && storm.debrief.goodHeadlineZh && storm.debrief.badHeadlineZh);

      for (const shift of storm.shifts) {
        assert.ok(shift.telegrams.length >= 2, `${storm.id} shift ${shift.shiftNum} needs >= 2 telegrams`);
        assert.ok(shift.tracks.length >= 2, `${storm.id} shift ${shift.shiftNum} needs >= 2 tracks`);
        assert.ok(
          shift.tracks.some((t) => t.id === shift.recommendedTrack),
          `${storm.id} shift ${shift.shiftNum} recommendedTrack must exist in tracks`
        );
        assert.ok(SIGNAL_BY_CODE[shift.recommendedSignal], 'recommendedSignal must be a valid 1962 signal code');
        assert.ok(Number.isFinite(shift.hkObs.pressureMb) && shift.hkObs.pressureMb > 900);
        assert.ok(Number.isFinite(shift.hkObs.windKt) && shift.hkObs.windKt >= 0);
        assert.ok(Number.isFinite(shift.hkObs.waglanKt) && shift.hkObs.waglanKt >= 0);
        assert.ok(shift.outcomes.exact && shift.outcomes.under && shift.outcomes.over);
      }
    }

    // Verify Super Typhoon Wanda (1 Sep 1962) climax has historical 953.2 mb record low and Signal No. 10
    const wanda = STORMS[3];
    assert.equal(wanda.id, 'storm4_wanda');
    const climaxShift = wanda.shifts.find((s) => s.recommendedSignal === 10);
    assert.ok(climaxShift, 'Wanda must include a Signal No. 10 hurricane shift');
    assert.equal(climaxShift.hkObs.pressureMb, 953.2);
  });
});

describe('Asset Integrity on Disk', () => {
  test('Every asset referenced in data.js, index.html, css/style.css, and src/audio.js exists and is > 100 bytes', () => {
    const assetPaths = new Set([
      'assets/art/cover.webp',
      'assets/art/thumb.webp',
      'assets/art/title_key.webp',
      'assets/art/desk.webp',
      'assets/art/chart_base.webp',
      'assets/ui/telegram_blank.webp',
      'assets/ui/news_paper.webp',
      'assets/ui/barograph_frame.webp',
      'assets/ui/signal_board.webp',
      'assets/audio/rain.ogg',
      'assets/audio/wind.ogg',
      'assets/audio/teleprinter.ogg',
      'assets/audio/phone.ogg',
      'assets/audio/paper.ogg',
      'assets/audio/siren.ogg',
      'assets/fonts/CourierPrime-Regular.ttf',
      'assets/fonts/CourierPrime-Bold.ttf',
      'assets/fonts/SpecialElite-Regular.ttf',
      'assets/fonts/noto/noto-serif-tc.css'
    ]);

    for (const sig of SIGNALS_1962) assetPaths.add(sig.art);
    for (const ch of Object.values(CHARACTERS)) assetPaths.add(ch.portrait);
    for (const end of Object.values(CAMPAIGN_ENDINGS)) assetPaths.add(end.art);
    for (const storm of STORMS) {
      assetPaths.add(storm.coverArt);
      for (const shift of storm.shifts) {
        assetPaths.add(shift.outcomes.exact.sceneArt);
        assetPaths.add(shift.outcomes.under.sceneArt);
        assetPaths.add(shift.outcomes.over.sceneArt);
      }
    }

    for (const relPath of assetPaths) {
      const fullPath = path.join(ROOT_DIR, relPath);
      assert.ok(fs.existsSync(fullPath), `Missing asset file: ${relPath}`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 100, `Asset file too small (${stat.size}B): ${relPath}`);
    }
  });
});

describe('Automated Playthrough & Consequence Simulation', () => {
  test('Sound forecaster completes all 4 storms and achieves ending_best with high trust and low casualties', () => {
    const result = simulateSoundForecaster();
    for (const [k, v] of Object.entries(result.metrics)) {
      assert.ok(Number.isFinite(v) && !Number.isNaN(v), `Metric ${k} must be finite`);
      assert.ok(v >= 0 && v <= 100, `Metric ${k} out of bounds: ${v}`);
    }
    assert.equal(result.ending.id, 'ending_best');
    assert.ok(result.metrics.livesRisk <= 20, `Expected low livesRisk, got ${result.metrics.livesRisk}`);
    assert.ok(result.metrics.publicTrust >= 85, `Expected high publicTrust, got ${result.metrics.publicTrust}`);
    assert.ok(result.metrics.directorTrust >= 85, `Expected high directorTrust, got ${result.metrics.directorTrust}`);
  });

  test('Player who never hoists above Signal No. 1 suffers severe casualties on Wanda and triggers dismissal', () => {
    const result = simulateNeverHoistPlayer();
    for (const [k, v] of Object.entries(result.metrics)) {
      assert.ok(Number.isFinite(v) && !Number.isNaN(v), `Metric ${k} must be finite`);
    }
    assert.equal(result.ending.id, 'ending_dismissed');
    assert.ok(result.metrics.livesRisk >= 80, `Expected severe livesRisk, got ${result.metrics.livesRisk}`);
    assert.ok(result.metrics.directorTrust <= 20, `Expected collapsed directorTrust, got ${result.metrics.directorTrust}`);
  });

  test('Alarmist player who hoists Signal No. 10 on mild shifts suffers severe disruption and loses trust', () => {
    const result = simulatePanicHoister();
    assert.equal(result.ending.id, 'ending_dismissed');
    assert.ok(result.metrics.disruptionCost >= 80, `Expected severe disruptionCost, got ${result.metrics.disruptionCost}`);
  });

  test('Hoisting wrong directional gale quadrant (e.g. Signal 5 NW instead of Signal 8 SE) triggers quadrantMismatch penalty', () => {
    const patsyShift4 = STORMS[2].shifts[3]; // Recommended Signal 8 (SE Gale)
    const res = evaluateShiftDecision(
      patsyShift4,
      { trackId: 'A', confidence: 'med', signalCode: 5, actions: {} },
      INITIAL_METRICS
    );
    assert.equal(res.quadrantMismatch, true);
    assert.ok(res.deltas.livesRisk > 0);
    assert.ok(res.deltas.directorTrust < 0);
  });
});
