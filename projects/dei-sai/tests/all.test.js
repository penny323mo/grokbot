import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_ORIGIN,
  MACAU_BBOX,
  MAP_MAX_BOUNDS,
  decodeTerrariumRGB,
  isInsideMacau,
  evaluateLocateCoordinate,
  formatElevationCopy,
  formatExaggerationLabel,
  formatMacauTime
} from '../js/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Terrarium decoder: fixture RGB triple decodes accurately', () => {
  // Test case 1: 0 metres elevation -> r=128, g=0, b=0 -> 128*256 - 32768 = 0
  assert.equal(decodeTerrariumRGB(128, 0, 0), 0);

  // Test case 2: 90 metres (e.g. Guia Hill) -> r=128, g=90, b=0 -> 90
  assert.equal(decodeTerrariumRGB(128, 90, 0), 90);

  // Test case 3: 170.5 metres -> r=128, g=170, b=128 -> (128*256 + 170 + 0.5) - 32768 = 170.5
  assert.equal(decodeTerrariumRGB(128, 170, 128), 170.5);

  // Test case 4: Negative elevation (below sea level) -> r=127, g=255, b=0 -> 32512 + 255 - 32768 = -1
  assert.equal(decodeTerrariumRGB(127, 255, 0), -1);

  // Missing tile or invalid pixel data must NOT decode to 0 m!
  assert.equal(decodeTerrariumRGB(null, null, null), null);
  assert.equal(decodeTerrariumRGB(undefined, 0, 0), null);
  assert.equal(decodeTerrariumRGB(NaN, 0, 0), null);
});

test('Default origin is 澳門半島 (22.1987, 113.5439)', () => {
  assert.equal(DEFAULT_ORIGIN.lat, 22.1987);
  assert.equal(DEFAULT_ORIGIN.lon, 113.5439);
  assert.equal(DEFAULT_ORIGIN.name, '澳門半島');
  assert.ok(DEFAULT_ORIGIN.message.includes('澳門半島'));
  assert.ok(DEFAULT_ORIGIN.message.includes('未開定位'));
});

test('data/landmarks.json schema, bounds, and content integrity', () => {
  const filePath = path.join(__dirname, '..', 'data', 'landmarks.json');
  assert.ok(fs.existsSync(filePath), 'data/landmarks.json must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  const landmarks = JSON.parse(content);
  assert.ok(Array.isArray(landmarks), 'landmarks should be an array');
  assert.ok(landmarks.length >= 10, 'landmarks should have at least 10 items');

  let hasPeninsulaHill = false;
  let hasColoaneHill = false;
  let hasMacauTower = false;

  for (const lm of landmarks) {
    // Basic fields
    assert.ok(lm.id && typeof lm.id === 'string', `id missing on ${JSON.stringify(lm)}`);
    assert.ok(lm.name && typeof lm.name === 'string', `Cantonese name missing on ${lm.id}`);
    assert.ok(lm.kind && typeof lm.kind === 'string', `kind missing on ${lm.id}`);
    assert.ok(['osm:ele', 'osm:height', 'dem', 'none'].includes(lm.ele_source), `invalid ele_source on ${lm.id}: ${lm.ele_source}`);

    // Bounds check: 22.06–22.26 N, 113.50–113.65 E
    assert.ok(
      lm.lat >= MACAU_BBOX.minLat && lm.lat <= MACAU_BBOX.maxLat,
      `${lm.name} lat (${lm.lat}) outside Macau bbox [${MACAU_BBOX.minLat}, ${MACAU_BBOX.maxLat}]`
    );
    assert.ok(
      lm.lon >= MACAU_BBOX.minLon && lm.lon <= MACAU_BBOX.maxLon,
      `${lm.name} lon (${lm.lon}) outside Macau bbox [${MACAU_BBOX.minLon}, ${MACAU_BBOX.maxLon}]`
    );

    // ele_source check
    if (lm.ele_source === 'none') {
      assert.equal(lm.ele_m, undefined, `${lm.id} has ele_source "none" but ele_m is present (${lm.ele_m})`);
    } else {
      assert.ok(typeof lm.ele_m === 'number', `${lm.id} ele_m should be number when ele_source is ${lm.ele_source}`);
      assert.ok(lm.ele_m > 0, `${lm.id} ele_m should be > 0`);
    }

    if (lm.kind === '山丘' && (lm.area === '澳門半島' || lm.name.includes('東望洋') || lm.name.includes('松山') || lm.name.includes('望廈'))) {
      hasPeninsulaHill = true;
    }
    if (lm.kind === '山丘' && (lm.area === '路環' || lm.name.includes('疊石塘') || lm.name.includes('九澳'))) {
      hasColoaneHill = true;
    }
    if (lm.name.includes('澳門塔') || lm.name.includes('旅遊塔') || lm.id === 'macau-tower') {
      hasMacauTower = true;
    }
  }

  assert.ok(hasPeninsulaHill, 'Must include at least one named hill on the peninsula');
  assert.ok(hasColoaneHill, 'Must include at least one named hill on 路環');
  assert.ok(hasMacauTower, 'Must include 澳門塔');
});

test('Height copy helper formats correctly', () => {
  // OSM elevation -> N 米 without DEM disclaimer
  const osmCopy = formatElevationCopy(90, 'osm:ele');
  assert.equal(osmCopy, '90 米');
  assert.ok(!osmCopy.includes('DEM') && !osmCopy.includes('地形'));

  const osmHeightCopy = formatElevationCopy(338, 'osm:height');
  assert.equal(osmHeightCopy, '338 米');

  // DEM sample -> includes 地形 or DEM
  const demCopy = formatElevationCopy(125.4, 'dem');
  assert.ok(demCopy.includes('地形') || demCopy.includes('DEM'), 'DEM sample must include 地形 or DEM');
  assert.ok(demCopy.includes('125 米'), 'DEM sample should round appropriately');

  // Missing elevation -> 高度不詳, never 0 米
  const missingCopy1 = formatElevationCopy(undefined, 'none');
  assert.equal(missingCopy1, '高度不詳');
  assert.ok(!missingCopy1.includes('0 米'));

  const missingCopy2 = formatElevationCopy(null, 'dem');
  assert.equal(missingCopy2, '高度不詳');
  assert.ok(!missingCopy2.includes('0 米'));
});

test('Exaggeration helper labels 1.3 and 1.0 correctly', () => {
  const label13 = formatExaggerationLabel(1.3);
  assert.ok(label13.includes('1.3 倍'), '1.3 must be labelled as 1.3 倍');

  const label10 = formatExaggerationLabel(1.0);
  assert.ok(label10.includes('1.0'), '1.0 must be labelled as 1.0');
  assert.ok(!label10.includes('1.3'), '1.0 must not show 1.3');
  assert.ok(label10.includes('無誇張') || label10.includes('1.0 倍'), '1.0 should mention no exaggeration or 1.0 倍');
});

test('Locate policy accepts Macau points and rejects out-of-area points', () => {
  // Inside Macau (e.g. San Ma Lo / Senado Square)
  const inside = evaluateLocateCoordinate(22.1938, 113.5400);
  assert.equal(inside.accepted, true);
  assert.equal(inside.target.lat, 22.1938);
  assert.equal(inside.target.lon, 113.5400);

  // Outside Macau (e.g. Tsim Sha Tsui in Hong Kong: 22.30, 114.17)
  const outsideHK = evaluateLocateCoordinate(22.30, 114.17);
  assert.equal(outsideHK.accepted, false);
  assert.equal(outsideHK.target.lat, DEFAULT_ORIGIN.lat);
  assert.equal(outsideHK.target.lon, DEFAULT_ORIGIN.lon);
  assert.ok(outsideHK.message.includes('澳門範圍以外'), 'Out-of-area copy must be shown');

  // Boundary check: Guangzhou (23.13, 113.26)
  const outsideGZ = evaluateLocateCoordinate(23.13, 113.26);
  assert.equal(outsideGZ.accepted, false);
  assert.equal(outsideGZ.target.lat, DEFAULT_ORIGIN.lat);
});

test('Time display outputs in Asia/Macau time zone', () => {
  // Pick an instant: 2026-11-14T00:30:00Z (which is 08:30 in Macau UTC+8)
  const testDate = new Date('2026-11-14T00:30:00Z');
  const macauFormatted = formatMacauTime(testDate);
  assert.ok(macauFormatted.includes('08:30'), `Expected 08:30 in Macau time, got ${macauFormatted}`);
  assert.ok(macauFormatted.includes('澳門時間'));
});

test('Bounding box helper for map max-bounds includes Coloane and HZMB', () => {
  const [[swLon, swLat], [neLon, neLat]] = MAP_MAX_BOUNDS;

  // Coloane southern tip is ~22.11 N, 113.56 E
  const coloaneLat = 22.11;
  const coloaneLon = 113.56;
  assert.ok(swLat <= coloaneLat && neLat >= coloaneLat, 'South boundary must include Coloane');
  assert.ok(swLon <= coloaneLon && neLon >= coloaneLon, 'Lon boundary must include Coloane');

  // HZMB Macau side is ~22.20 N, 113.576 E (and bridge extends northeast)
  const hzmbLat = 22.20;
  const hzmbLon = 113.58;
  assert.ok(swLat <= hzmbLat && neLat >= hzmbLat, 'North boundary must include HZMB Macau side');
  assert.ok(swLon <= hzmbLon && neLon >= hzmbLon, 'East boundary must include HZMB Macau side');
});
