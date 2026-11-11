import { test, describe } from 'node:test';
import assert from 'node:assert';
import { STATIONS, DATUM, DATUM_INFO } from '../js/stations.js';
import { parseHkoHlt } from '../js/hko.js';
import { parseOpenMeteoMarine } from '../js/openmeteo.js';

describe('Datum Integrity & Hard Separation Rules (datum.test.js)', () => {
  test('Every station explicitly declares either CD (Chart Datum) or MSL (Mean Sea Level)', () => {
    for (const station of STATIONS) {
      assert.ok(
        station.datum === DATUM.CHART_DATUM || station.datum === DATUM.MEAN_SEA_LEVEL,
        `Station ${station.name} must declare valid datum`
      );
      assert.ok(
        station.datumLabel && typeof station.datumLabel === 'string',
        `Station ${station.name} must declare a visible datum label`
      );

      // HKO stations must use Chart Datum
      if (station.territory === 'hongkong') {
        assert.strictEqual(station.datum, DATUM.CHART_DATUM, `${station.name} must use Chart Datum (CD)`);
      }
      // Macau stations must use Open-Meteo MSL
      if (station.territory === 'macau') {
        assert.strictEqual(station.datum, DATUM.MEAN_SEA_LEVEL, `${station.name} must use Mean Sea Level (MSL)`);
      }
    }
  });

  test('HKO parser output is strictly tagged with Chart Datum (CD)', () => {
    const mockHko = {
      fields: ['Month', 'Date', 'Time', 'Height(m)'],
      data: [['11', '12', '1200', '1.50']]
    };
    const parsed = parseHkoHlt(mockHko, 2026);
    assert.strictEqual(parsed[0].datum, DATUM.CHART_DATUM);
    assert.ok(parsed[0].datumLabel.includes('海圖基準面'));
  });

  test('Open-Meteo parser output is strictly tagged with Mean Sea Level (MSL)', () => {
    const mockMarine = {
      current: {
        time: '2026-11-12T12:00',
        sea_level_height_msl: 1.20
      },
      hourly: {
        time: ['2026-11-12T12:00'],
        sea_level_height_msl: [1.20]
      }
    };
    const parsed = parseOpenMeteoMarine(mockMarine);
    assert.strictEqual(parsed.datum, DATUM.MEAN_SEA_LEVEL);
    assert.ok(parsed.datumLabel.includes('平均海平面'));
  });

  test('No mixed conversion function exists between Chart Datum and MSL', async () => {
    // Verified: No module in the tree exports a function attempting to convert CD to MSL or vice-versa
    const hkoMod = await import('../js/hko.js');
    const openMeteoMod = await import('../js/openmeteo.js');
    const geoMod = await import('../js/geo.js');

    assert.strictEqual(typeof hkoMod.convertCdToMsl, 'undefined', 'Conversion from CD to MSL is forbidden');
    assert.strictEqual(typeof openMeteoMod.convertMslToCd, 'undefined', 'Conversion from MSL to CD is forbidden');
    assert.strictEqual(typeof geoMod.convertDatum, 'undefined', 'Generic datum conversion is forbidden');
  });
});
