import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_ORIGIN,
  DISTRICTS,
  DEFAULT_ORIGIN_MSG,
  formatMacauTime,
  checkFrameFreshness,
  evaluateLocateCoordinate,
  generateHeroSentence
} from '../js/utils.js';

import {
  parseRainViewerIndex,
  buildTileUrl
} from '../js/rainviewer.js';

import {
  parseOpenMeteoForecast
} from '../js/openmeteo.js';

import {
  parseSMGXml
} from '../js/smg.js';

import {
  parseHKORainfall
} from '../js/hko.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, '..', 'data', 'fixtures');

test('Default coordinates are the Macau peninsula point (22.1987, 113.5439)', () => {
  assert.equal(DEFAULT_ORIGIN.name, '澳門半島');
  assert.equal(DEFAULT_ORIGIN.lat, 22.1987);
  assert.equal(DEFAULT_ORIGIN.lon, 113.5439);
  assert.equal(DISTRICTS.taipa.name, '氹仔');
  assert.equal(DISTRICTS.taipa.lat, 22.1566);
  assert.equal(DISTRICTS.coloane.name, '路環');
  assert.equal(DISTRICTS.coloane.lat, 22.1180);
});

test('Locate policy accepts Macau points and rejects out-of-area points', () => {
  const macau = evaluateLocateCoordinate(22.1938, 113.5400);
  assert.equal(macau.accepted, true);

  const outside = evaluateLocateCoordinate(31.2304, 121.4737); // Shanghai
  assert.equal(outside.accepted, false);
  assert.equal(outside.target.lat, DEFAULT_ORIGIN.lat);
  assert.equal(outside.target.lon, DEFAULT_ORIGIN.lon);
  assert.ok(outside.message.includes('澳門') || outside.message.includes('半島'));

  const invalid = evaluateLocateCoordinate(null, undefined);
  assert.equal(invalid.accepted, false);
  assert.equal(invalid.target.lat, DEFAULT_ORIGIN.lat);
  assert.equal(invalid.message, DEFAULT_ORIGIN_MSG);
});

test('RainViewer parser: handles empty nowcast without inventing frames', () => {
  const raw = fs.readFileSync(path.join(fixturesDir, 'rainviewer-normal.json'), 'utf-8');
  const json = JSON.parse(raw);
  const result = parseRainViewerIndex(json, 1794676525);

  assert.equal(result.available, true);
  assert.equal(result.pastFrames.length, 13);
  assert.equal(result.nowcastFrames.length, 0, 'Empty nowcast must have 0 nowcast frames');
  assert.equal(result.hasNowcast, false);
  assert.ok(result.nowcastMessage.includes('未有未來雨勢預測'));

  // Tile URL structure check
  const first = result.pastFrames[0];
  assert.ok(first.tileUrl.startsWith('https://tilecache.rainviewer.com/v2/radar/'));
  assert.ok(first.tileUrl.endsWith('/256/{z}/{x}/{y}/2/1_1.png'));

  // Freshness check: frame from 1794676200 vs now 1794676525 (diff 325s ≈ 5 min, not stale)
  const freshness = checkFrameFreshness(1794676200, 1794676525);
  assert.equal(freshness.isStale, false);

  // Stale frame check: frame from 25 min ago
  const staleFreshness = checkFrameFreshness(1794676200 - 25 * 60, 1794676200);
  assert.equal(staleFreshness.isStale, true);
  assert.equal(staleFreshness.warning, '資料可能已過時');
});

test('RainViewer parser: handles present nowcast frames correctly', () => {
  const raw = fs.readFileSync(path.join(fixturesDir, 'rainviewer-with-nowcast.json'), 'utf-8');
  const json = JSON.parse(raw);
  const result = parseRainViewerIndex(json, 1794676525);

  assert.equal(result.available, true);
  assert.equal(result.pastFrames.length, 3);
  assert.equal(result.nowcastFrames.length, 2);
  assert.equal(result.hasNowcast, true);
  assert.equal(result.nowcastFrames[0].isNowcast, true);
  assert.equal(result.nowcastFrames[0].tileUrl, 'https://tilecache.rainviewer.com/v2/radar/nowcast_01/256/{z}/{x}/{y}/2/1_1.png');
});

test('Open-Meteo parser: all-zero precipitation is "no rain", not an error', () => {
  const raw = fs.readFileSync(path.join(fixturesDir, 'openmeteo-dry.json'), 'utf-8');
  const json = JSON.parse(raw);
  const result = parseOpenMeteoForecast(json);

  assert.equal(result.available, true);
  assert.equal(result.allZero, true);
  assert.equal(result.isRainingNow, false);
  assert.equal(result.willRainSoon, false);
  assert.equal(result.timeline.length, 8);

  // Generate hero sentence
  const hero = generateHeroSentence({ forecast: result, official: null });
  assert.equal(hero.sentence, '而家冇雨，未來兩小時模式預測都唔預期會落。');
});

test('Open-Meteo parser: rain starting soon in the 15-minute forecast', () => {
  const raw = fs.readFileSync(path.join(fixturesDir, 'openmeteo-rain-starting.json'), 'utf-8');
  const json = JSON.parse(raw);
  const result = parseOpenMeteoForecast(json);

  assert.equal(result.available, true);
  assert.equal(result.isRainingNow, false);
  assert.equal(result.willRainSoon, true);
  assert.ok(result.rainStartTime);

  const hero = generateHeroSentence({ forecast: result, official: null });
  assert.ok(hero.sentence.includes('而家冇雨'));
  assert.ok(hero.sentence.includes('模式預測大約'));
  assert.ok(hero.sentence.includes('會開始有雨'));
});

test('Open-Meteo parser: raining now, stopping soon in the forecast', () => {
  const raw = fs.readFileSync(path.join(fixturesDir, 'openmeteo-rain-stopping.json'), 'utf-8');
  const json = JSON.parse(raw);
  const result = parseOpenMeteoForecast(json);

  assert.equal(result.available, true);
  assert.equal(result.isRainingNow, true);
  assert.ok(result.rainStopTime);

  const hero = generateHeroSentence({ forecast: result, official: null });
  assert.ok(hero.sentence.includes('而家落緊'));
  assert.ok(hero.sentence.includes('可能轉停'));
});

test('SMG XML parser: parses Rainfall types 3/4/5 and SysPubdate for 澳門, 氹仔, 路環', () => {
  const raw = fs.readFileSync(path.join(fixturesDir, 'smg-actualweather.xml'), 'utf-8');
  const result = parseSMGXml(raw);

  assert.equal(result.available, true);
  assert.equal(result.sysPubdate, '2026-11-15 01:15');

  // Macau peninsula (FM)
  const fm = result.stations.FM;
  assert.ok(fm, 'Station FM must exist');
  assert.equal(fm.instantaneous, 0.0);
  assert.equal(fm.pastHour, 3.2);
  assert.equal(fm.todayAccumulation, 12.6);

  // Taipa (TG)
  const tg = result.stations.TG;
  assert.ok(tg, 'Station TG must exist');
  assert.equal(tg.pastHour, 0.0);
  assert.equal(tg.todayAccumulation, 5.4);

  // Coloane (DC)
  const dc = result.stations.DC;
  assert.ok(dc, 'Station DC must exist');
  assert.equal(dc.instantaneous, 0.5);
  assert.equal(dc.pastHour, 1.0);
  assert.equal(dc.todayAccumulation, 8.2);
});

test('Failure & CORS paths: returns unavailable state, never fabricated official 0 mm', () => {
  // Empty or invalid SMG XML
  const failedSMG = parseSMGXml(null);
  assert.equal(failedSMG.available, false);
  assert.ok(failedSMG.message.includes('未能喺瀏覽器讀取'));
  assert.ok(failedSMG.message.includes('跨域'));

  // Copy helper check
  const missingForecastHero = generateHeroSentence({ forecast: null, official: null });
  assert.equal(missingForecastHero.sentence, '未有未來兩小時模式預測');
});

test('Copy helpers: never label Open-Meteo or RainViewer as official observations', () => {
  const omHero = generateHeroSentence({
    forecast: { available: true, isRainingNow: false, willRainSoon: false, allZero: true },
    official: null
  });

  // Must not claim to be 官方觀測
  assert.ok(!omHero.sentence.includes('官方觀測'));
  assert.ok(omHero.sentence.includes('模式預測') || omHero.sentence.includes('冇雨'));
});

test('HKO open data parser: parses nearby HK station rainfall', () => {
  const fixture = {
    rainfall: {
      data: [
        { unit: "mm", place: "離島區", max: 1.5, main: "FALSE" },
        { unit: "mm", place: "屯門", max: 0, main: "FALSE" }
      ],
      startTime: "2026-11-14T23:45:00+08:00",
      endTime: "2026-11-15T00:45:00+08:00"
    }
  };

  const result = parseHKORainfall(fixture);
  assert.equal(result.available, true);
  assert.equal(result.place, '離島區');
  assert.equal(result.maxMm, 1.5);
  assert.ok(result.sourceName.includes('香港天文台官方雨量'));
  assert.ok(result.sourceName.includes('非澳門觀測'));
});

test('Radar and Forecast disagreement: states both sources honestly', () => {
  // Case A: Radar detects rain near Macau, but forecast model predicts dry
  const disagreeA = generateHeroSentence({
    forecast: { available: true, isRainingNow: false, willRainSoon: false, allZero: true },
    official: null,
    radarHasRain: true
  });
  assert.ok(disagreeA.sentence.includes('雷達'), 'Must mention radar');
  assert.ok(disagreeA.sentence.includes('模式預測') || disagreeA.subtext.includes('模式預測'), 'Must mention forecast model');
  assert.ok(!disagreeA.sentence.includes('官方觀測'));

  // Case B: Forecast predicts raining now, but radar explicitly detects no rain return
  const disagreeB = generateHeroSentence({
    forecast: { available: true, isRainingNow: true, willRainSoon: false, allZero: false },
    official: null,
    radarHasRain: false,
    radarExplicitlyDry: true
  });
  assert.ok(disagreeB.sentence.includes('模式預測'), 'Must mention forecast model');
  assert.ok(disagreeB.sentence.includes('雷達'), 'Must mention radar');
  assert.ok(!disagreeB.sentence.includes('官方觀測'));
});

test('Touch hit targets and UI accessibility constraints', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf-8');
  assert.ok(css.includes('min-height: 44px') || css.includes('height: 44px'), 'Must enforce >= 44px touch targets');
  assert.ok(css.includes('scrubber-nowcast-msg'), 'Must style empty nowcast message');
  assert.ok(css.includes('smg-cors-line'), 'Must style SMG CORS fallback line');
  assert.ok(css.includes('stale-warning'), 'Must style stale frame warning');
  assert.ok(css.includes('source-status-text'), 'Must style source status text in info sheet');
  assert.ok(css.includes('btn-icon.loading'), 'Must provide feedback animation for refresh');
});

test('Time formatting helpers adhere to Asia/Macau timezone', () => {
  // Test unix timestamp in Asia/Macau (1794680400 is 2026-11-15 02:20 Asia/Macau, UTC is 18:20 Nov 14)
  const timeOnly = formatMacauTime(1794680400, 'time');
  assert.equal(timeOnly, '02:20');

  const fullTime = formatMacauTime(1794680400, 'full');
  assert.ok(fullTime.startsWith('2026-11-15 02:20'));
});
