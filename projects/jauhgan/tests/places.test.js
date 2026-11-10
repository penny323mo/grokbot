import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  CATEGORIES,
  matchCategory,
  resolvePlaceName,
  parseOverpassOrSnapshot,
  filterAndSortPlaces,
  formatOpeningHours,
  formatPlaceDetails
} from '../js/places.js';

describe('Places module (places.js)', () => {
  test('Category classification covers all 6 required amenities', () => {
    assert.strictEqual(matchCategory({ amenity: 'toilets' }), 'toilets');
    assert.strictEqual(matchCategory({ amenity: 'parking' }), 'parking');
    assert.strictEqual(matchCategory({ amenity: 'parking_entrance' }), 'parking');
    assert.strictEqual(matchCategory({ amenity: 'drinking_water' }), 'drinking_water');
    assert.strictEqual(matchCategory({ amenity: 'pharmacy' }), 'pharmacy');
    assert.strictEqual(matchCategory({ amenity: 'defibrillator' }), 'aed');
    assert.strictEqual(matchCategory({ emergency: 'defibrillator' }), 'aed');
    assert.strictEqual(matchCategory({ amenity: 'clinic' }), 'clinic');
    assert.strictEqual(matchCategory({ amenity: 'hospital' }), 'clinic');
    assert.strictEqual(matchCategory({ amenity: 'doctors' }), 'clinic');

    // Non-target amenities return null
    assert.strictEqual(matchCategory({ amenity: 'restaurant' }), null);
    assert.strictEqual(matchCategory({ amenity: 'bank' }), null);
    assert.strictEqual(matchCategory({}), null);
    assert.strictEqual(matchCategory(null), null);
  });

  test('Cantonese place name resolution with multilingual fallback', () => {
    // Traditional Chinese name preferred
    assert.strictEqual(
      resolvePlaceName({ 'name:zh-Hant': '大三巴公廁', name: '大三巴洗手间', 'name:en': 'Ruins Toilet' }, 'toilets'),
      '大三巴公廁'
    );
    // name:zh fallback
    assert.strictEqual(
      resolvePlaceName({ 'name:zh': '仁伯爵綜合醫院', 'name:en': 'Hospital' }, 'clinic'),
      '仁伯爵綜合醫院'
    );
    // Default Cantonese fallbacks
    assert.strictEqual(resolvePlaceName({}, 'toilets'), '公廁');
    assert.strictEqual(resolvePlaceName({}, 'parking'), '停車場');
    assert.strictEqual(resolvePlaceName({ amenity: 'parking_entrance' }, 'parking'), '停車場入口');
    assert.strictEqual(resolvePlaceName({}, 'drinking_water'), '飲水機');
    assert.strictEqual(resolvePlaceName({}, 'pharmacy'), '藥房');
    assert.strictEqual(resolvePlaceName({}, 'aed'), '自動體外心臟除顫器 (AED)');
    assert.strictEqual(resolvePlaceName({}, 'clinic'), '診所');
    assert.strictEqual(resolvePlaceName({ amenity: 'hospital' }, 'clinic'), '醫院');
  });

  test('Overpass / snapshot parser parses real-shaped fixture', () => {
    const fixture = {
      version: 0.6,
      fetched_at: '2026-11-10T09:08:00Z',
      source_url: 'https://download.geofabrik.de/asia/china/macau-latest.osm.pbf',
      elements: [
        {
          type: 'node',
          id: 101,
          lat: 22.1937,
          lon: 113.5406,
          tags: {
            amenity: 'toilets',
            'name:zh-Hant': '議事亭前地公廁',
            wheelchair: 'yes',
            opening_hours: '24/7'
          }
        },
        {
          type: 'way',
          id: 202,
          center: { lat: 22.1950, lon: 113.5420 },
          tags: {
            amenity: 'parking',
            name: '栢湖停車場',
            fee: 'yes'
          }
        },
        {
          type: 'node',
          id: 303,
          lat: 22.1960,
          lon: 113.5430,
          tags: {
            emergency: 'defibrillator',
            indoor: 'yes'
          }
        }
      ]
    };

    const parsed = parseOverpassOrSnapshot(fixture, true);
    assert.strictEqual(parsed.places.length, 3);
    assert.strictEqual(parsed.fetchedAt, '2026-11-10T09:08:00Z');
    assert.strictEqual(parsed.sourceUrl, 'https://download.geofabrik.de/asia/china/macau-latest.osm.pbf');

    const toilet = parsed.places.find(p => p.category === 'toilets');
    assert.ok(toilet);
    assert.strictEqual(toilet.name, '議事亭前地公廁');
    assert.strictEqual(toilet.tags.opening_hours, '24/7');

    const parking = parsed.places.find(p => p.category === 'parking');
    assert.ok(parking);
    assert.strictEqual(parking.lat, 22.195);
    assert.strictEqual(parking.lon, 113.542);

    const aed = parsed.places.find(p => p.category === 'aed');
    assert.ok(aed);
    assert.strictEqual(aed.name, '自動體外心臟除顫器 (AED)');
  });

  test('Snapshot parser rejects missing fetched_at or source_url', () => {
    // Missing fetched_at
    assert.throws(
      () => parseOverpassOrSnapshot({ source_url: 'https://example.com', elements: [{ id: 1 }] }, true),
      /快照缺乏有效的截取時間戳/
    );

    // Missing source_url
    assert.throws(
      () => parseOverpassOrSnapshot({ fetched_at: '2026-11-11T00:00:00Z', elements: [{ id: 1 }] }, true),
      /快照缺乏來源網址/
    );

    // Empty elements in snapshot
    assert.throws(
      () => parseOverpassOrSnapshot({ fetched_at: '2026-11-11T00:00:00Z', source_url: 'https://example.com', elements: [] }, true),
      /快照不能為空/
    );
  });

  test('Synthetic or fake placeholder elements are rejected', () => {
    const fixture = {
      fetched_at: '2026-11-10T09:08:00Z',
      source_url: 'https://example.com',
      elements: [
        {
          type: 'node',
          id: 99999,
          lat: 22.19,
          lon: 113.54,
          is_synthetic: true,
          tags: { amenity: 'toilets', name: '假測試廁所' }
        },
        {
          type: 'node',
          id: 11111,
          lat: 22.19,
          lon: 113.54,
          tags: { amenity: 'toilets', name: '真廁所' }
        }
      ]
    };
    const parsed = parseOverpassOrSnapshot(fixture, true);
    assert.strictEqual(parsed.places.length, 1);
    assert.strictEqual(parsed.places[0].name, '真廁所');
  });

  test('Filtering and sorting places enforces 2 km default radius cap', () => {
    const places = [
      { id: '1', category: 'toilets', name: '遠公廁（超過2公里）', lat: 22.2500, lon: 113.5500 }, // ~6.3km
      { id: '2', category: 'toilets', name: '近公廁', lat: 22.1940, lon: 113.5410 }, // ~50m
      { id: '3', category: 'pharmacy', name: '近藥房', lat: 22.1942, lon: 113.5412 }, // ~80m
      { id: '4', category: 'toilets', name: '香港遠公廁', lat: 22.2820, lon: 114.1580 } // ~60km
    ];
    const origin = { lat: 22.1937, lon: 113.5406 };

    // Default 2km cap: only places within 2km are returned
    const toilets = filterAndSortPlaces(places, 'toilets', origin);
    assert.strictEqual(toilets.length, 1);
    assert.strictEqual(toilets[0].name, '近公廁');

    // All within 2km
    const all = filterAndSortPlaces(places, 'all', origin);
    assert.strictEqual(all.length, 2);
  });

  test('Parking ranking prioritizes named lot over entrance within similar distance', () => {
    const places = [
      {
        id: '1',
        category: 'parking',
        name: '停車場入口',
        lat: 22.1940,
        lon: 113.5406,
        tags: { amenity: 'parking_entrance' }
      },
      {
        id: '2',
        category: 'parking',
        name: '栢湖停車場',
        lat: 22.1942,
        lon: 113.5406,
        tags: { amenity: 'parking' }
      }
    ];
    const origin = { lat: 22.1937, lon: 113.5406 };
    const sorted = filterAndSortPlaces(places, 'parking', origin);
    // Even though entrance is slightly closer (33m vs 55m, < 80m diff), lot ranks ahead
    assert.strictEqual(sorted[0].name, '栢湖停車場');
  });

  test('formatOpeningHours parses common patterns and quotes unparsed values', () => {
    assert.strictEqual(formatOpeningHours('24/7'), '24 小時開放');
    assert.strictEqual(formatOpeningHours('Mo-Fr 09:00-18:00'), '星期一至五 09:00-18:00');
    assert.strictEqual(formatOpeningHours('Mo-Su 08:00-22:00'), '星期一至日 08:00-22:00');
    assert.strictEqual(formatOpeningHours('complex irregular text'), '「complex irregular text」');
    assert.strictEqual(formatOpeningHours(null), null);
  });

  test('Private access and geo fallback in formatPlaceDetails', () => {
    const privatePlace = {
      id: 'node/999',
      category: 'parking',
      name: '私人物業停車場',
      lat: 22.1900,
      lon: 113.5400,
      tags: {
        amenity: 'parking',
        access: 'private',
        opening_hours: 'Mo-Fr 08:00-20:00'
      }
    };
    const details = formatPlaceDetails(privatePlace, { lat: 22.1937, lon: 113.5406 });
    assert.strictEqual(details.accessText, '非公開設施（私人專用）');
    assert.strictEqual(details.openingHoursText, '星期一至五 08:00-20:00');
    assert.strictEqual(details.geoUrl, 'geo:22.19,113.54');
    assert.strictEqual(details.appleMapsUrl, 'https://maps.apple.com/?daddr=22.19,113.54');
  });

  test('Macau car park NEVER displays or invents remaining spaces field', () => {
    // Macau car park with an attempted fake vacancy tag in the input
    const macauCarpark = {
      id: 'node/2800435403',
      category: 'parking',
      categoryLabel: '停車場',
      name: '居雅大廈停車場',
      lat: 22.129064,
      lon: 113.560348,
      tags: {
        amenity: 'parking',
        name: '居雅大廈停車場',
        fee: 'yes',
        vacancy: 42, // Attempted fake vacancy
        remaining_spaces: 42 // Attempted fake remaining spaces
      }
    };

    const details = formatPlaceDetails(macauCarpark, { lat: 22.1937, lon: 113.5406 }, '42 個車位');
    // For Macau, parkingVacancy MUST be null even if external text attempted to pass it
    assert.strictEqual(details.parkingVacancy, null);
    assert.strictEqual(details.feeText, '收費設施');
    assert.strictEqual(details.appleMapsUrl, 'https://maps.apple.com/?daddr=22.129064,113.560348');
  });

  test('formatPlaceDetails exposes openingStatusText for HK carparks', () => {
    const hkCarpark = {
      id: 'hk-carpark/12',
      category: 'parking',
      name: '淘大商場',
      lat: 22.3247,
      lon: 114.2167,
      tags: {
        amenity: 'parking',
        opening_status: '開放中',
        opening_hours: '星期一至五 08:00 - 22:00'
      },
      hkData: {
        currentStatus: '開放中'
      }
    };
    const details = formatPlaceDetails(hkCarpark, { lat: 22.3247, lon: 114.2167 }, '剩餘車位：18 個');
    assert.strictEqual(details.openingStatusText, '開放中');
    assert.strictEqual(details.openingHoursText, '星期一至五 08:00 - 22:00');
    assert.strictEqual(details.parkingVacancy, '剩餘車位：18 個');

    // Test with '而家開放中' prefix stripped
    const hkCarparkPrefixed = {
      id: 'hk-carpark/13',
      category: 'parking',
      name: '測試停車場',
      lat: 22.3247,
      lon: 114.2167,
      tags: {
        amenity: 'parking',
        opening_status: '而家暫停開放'
      }
    };
    const details2 = formatPlaceDetails(hkCarparkPrefixed, { lat: 22.3247, lon: 114.2167 });
    assert.strictEqual(details2.openingStatusText, '暫停開放');

    // Test HK carpark with unpublished vacancy passes lastUpdate
    const hkCarparkNoVac = {
      id: 'hk-carpark/100',
      category: 'parking',
      name: '未發布車位停車場',
      lat: 22.3247,
      lon: 114.2167,
      tags: { amenity: 'parking' },
      hkData: {
        vacancyCount: null,
        vacancyText: null,
        lastUpdate: '2026-11-07 15:00:00'
      }
    };
    const detailsNoVac = formatPlaceDetails(hkCarparkNoVac, { lat: 22.3247, lon: 114.2167 });
    assert.strictEqual(detailsNoVac.id, 'hk-carpark/100');
    assert.strictEqual(detailsNoVac.parkingVacancy, null);
    assert.strictEqual(detailsNoVac.lastUpdate, '2026-11-07 15:00:00');
  });

  test('Committed data/snapshot-macau.json loads and parses real data', () => {
    const snapshotPath = path.resolve(process.cwd(), 'data/snapshot-macau.json');
    assert.ok(fs.existsSync(snapshotPath), 'data/snapshot-macau.json must exist');
    const content = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

    const parsed = parseOverpassOrSnapshot(content, true);
    assert.ok(parsed.places.length >= 700, `Expected >= 700 places, got ${parsed.places.length}`);
    assert.ok(parsed.fetchedAt, 'Must have fetchedAt');
    assert.ok(parsed.sourceUrl, 'Must have sourceUrl');

    // Confirm all 6 categories exist in real data
    const categoriesFound = new Set(parsed.places.map(p => p.category));
    assert.ok(categoriesFound.has('toilets'), 'Must have toilets');
    assert.ok(categoriesFound.has('parking'), 'Must have parking');
    assert.ok(categoriesFound.has('drinking_water'), 'Must have drinking_water');
    assert.ok(categoriesFound.has('pharmacy'), 'Must have pharmacy');
    assert.ok(categoriesFound.has('aed'), 'Must have aed');
    assert.ok(categoriesFound.has('clinic'), 'Must have clinic');
  });
});
