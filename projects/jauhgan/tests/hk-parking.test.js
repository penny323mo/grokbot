import { test, describe } from 'node:test';
import assert from 'node:assert';
import { joinHkCarparks, formatHkTime, formatHkOpeningHours } from '../js/hk-parking.js';

describe('Hong Kong Carpark Module (hk-parking.js)', () => {
  const infoFixture = {
    results: [
      {
        park_Id: '12',
        name: '淘大商場',
        nature: 'commercial',
        displayAddress: '九龍九龍灣牛頭角道77號',
        latitude: 22.32470074,
        longitude: 114.21675324,
        contactNo: '2756 3666',
        opening_status: 'OPEN',
        openingHours: [
          { periodStart: '00:00', periodEnd: '24:00', weekdays: ['MON', 'TUE'] }
        ]
      },
      {
        park_Id: '99',
        name: '無即時數據停車場',
        nature: 'government',
        displayAddress: '新界荃灣青山公路123號',
        latitude: 22.3712,
        longitude: 114.1141,
        opening_status: 'OPEN'
      },
      {
        park_Id: '100',
        name: '未發布車位停車場（-1 標記）',
        nature: 'commercial',
        latitude: 22.3200,
        longitude: 114.1700
      },
      {
        park_Id: '101',
        name: '車位已滿停車場（0 個車位）',
        latitude: 22.3210,
        longitude: 114.1710
      },
      {
        park_Id: 'invalid-coords',
        name: '座標無效停車場',
        latitude: 'N/A',
        longitude: 'N/A'
      }
    ]
  };

  const vacancyFixture = {
    results: [
      {
        park_Id: '12',
        privateCar: [
          {
            vacancy_type: 'A',
            vacancy: 18,
            lastupdate: '2026-11-07 14:57:10'
          }
        ]
      },
      {
        park_Id: '99',
        // Vacancy list is empty or privateCar missing
        privateCar: []
      },
      {
        park_Id: '100',
        // data.gov.hk sentinel -1 for unpublished vacancy
        privateCar: [
          {
            vacancy: -1,
            lastupdate: '2026-11-07 15:00:00'
          }
        ]
      },
      {
        park_Id: '101',
        // Real zero vacancy
        privateCar: [
          {
            vacancy: 0,
            lastupdate: '2026-11-07 15:00:00'
          }
        ]
      }
    ]
  };

  test('Joins carpark info and vacancy by park_Id', () => {
    const joined = joinHkCarparks(infoFixture, vacancyFixture);
    // Invalid coordinate carpark must be skipped
    assert.strictEqual(joined.length, 4);

    const amoy = joined.find(c => c.hkData.parkId === '12');
    assert.ok(amoy);
    assert.strictEqual(amoy.name, '淘大商場');
    assert.strictEqual(amoy.category, 'parking');
    assert.strictEqual(amoy.hkData.vacancyCount, 18);
    assert.ok(amoy.hkData.vacancyText.includes('18 個'));
    assert.ok(amoy.hkData.vacancyText.includes('14:57'));
    assert.strictEqual(amoy.hkData.source, '香港政府 data.gov.hk／運輸署');
    assert.strictEqual(amoy.tags.opening_hours, '星期一至二 24 小時開放');
    assert.strictEqual(amoy.tags.operator, null); // NEVER invent operator!
  });

  test('Missing vacancy results in place WITHOUT an invented number', () => {
    const joined = joinHkCarparks(infoFixture, vacancyFixture);
    const noVac = joined.find(c => c.hkData.parkId === '99');
    assert.ok(noVac);
    assert.strictEqual(noVac.name, '無即時數據停車場');
    // Must be strictly null, never 0 or fake string!
    assert.strictEqual(noVac.hkData.vacancyCount, null);
    assert.strictEqual(noVac.hkData.vacancyText, null);
  });

  test('Sentinel -1 vacancy from data.gov.hk is treated as null (NOT -1 spaces)', () => {
    const joined = joinHkCarparks(infoFixture, vacancyFixture);
    const sentinelPark = joined.find(c => c.hkData.parkId === '100');
    assert.ok(sentinelPark);
    // -1 MUST NOT appear as a count
    assert.strictEqual(sentinelPark.hkData.vacancyCount, null);
    assert.strictEqual(sentinelPark.hkData.vacancyText, null);
    // lastUpdate must still be captured from the feed
    assert.strictEqual(sentinelPark.hkData.lastUpdate, '2026-11-07 15:00:00');
  });

  test('Real 0 vacancy is preserved as 0 spaces', () => {
    const joined = joinHkCarparks(infoFixture, vacancyFixture);
    const fullPark = joined.find(c => c.hkData.parkId === '101');
    assert.ok(fullPark);
    assert.strictEqual(fullPark.hkData.vacancyCount, 0);
    assert.ok(fullPark.hkData.vacancyText.includes('已滿'));
  });

  test('Handles completely empty or null vacancy data gracefully', () => {
    const joined = joinHkCarparks(infoFixture, null);
    assert.strictEqual(joined.length, 4);
    for (const c of joined) {
      assert.strictEqual(c.hkData.vacancyCount, null);
      assert.strictEqual(c.hkData.vacancyText, null);
    }
  });

  test('Timestamp formatting for HK Transport Department API', () => {
    assert.strictEqual(formatHkTime('2026-11-07 14:57:10'), '14:57');
    assert.strictEqual(formatHkTime('14:57:10'), '14:57');
    assert.strictEqual(formatHkTime(''), '');
  });

  test('formatHkOpeningHours formats opening hours correctly', () => {
    assert.strictEqual(formatHkOpeningHours([{ periodStart: '00:00', periodEnd: '24:00' }]), '24 小時開放');
    assert.strictEqual(formatHkOpeningHours([{ periodStart: '08:00', periodEnd: '22:00' }]), '08:00 - 22:00');
    assert.strictEqual(
      formatHkOpeningHours([{ periodStart: '08:00', periodEnd: '22:00', weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }]),
      '星期一至五 08:00 - 22:00'
    );
    assert.strictEqual(
      formatHkOpeningHours([
        { periodStart: '08:00', periodEnd: '22:00', weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'] },
        { periodStart: '10:00', periodEnd: '20:00', weekdays: ['SAT', 'SUN'] }
      ]),
      '星期一至五 08:00 - 22:00；星期六、日 10:00 - 20:00'
    );
    assert.strictEqual(
      formatHkOpeningHours([{ periodStart: '00:00', periodEnd: '24:00', weekdays: ['MON', 'TUE'] }]),
      '星期一至二 24 小時開放'
    );
    assert.strictEqual(formatHkOpeningHours([]), null);
    assert.strictEqual(formatHkOpeningHours(null), null);
  });
});
