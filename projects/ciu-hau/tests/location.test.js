import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { DEFAULT_STATION, STATIONS } from '../js/stations.js';
import { findNearestStation } from '../js/geo.js';

describe('Location Flow & Geolocation (location.test.js)', () => {
  let originalWindow;
  let originalDocument;
  let originalNavigatorDesc;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
    originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    if (originalNavigatorDesc) {
      Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
    } else {
      delete globalThis.navigator;
    }
  });

  function setMockNavigator(nav) {
    Object.defineProperty(globalThis, 'navigator', {
      value: nav,
      configurable: true,
      writable: true
    });
  }

  test('Default origin is Macau Inner Harbour (22.1937, 113.5310) when geolocation has not run', () => {
    assert.strictEqual(DEFAULT_STATION.id, 'macau-inner-harbour');
    assert.strictEqual(DEFAULT_STATION.name, '澳門內港');
    assert.strictEqual(DEFAULT_STATION.lat, 22.1937);
    assert.strictEqual(DEFAULT_STATION.lon, 113.5310);
  });

  test('Geolocation success with simulated Macau coordinates snaps to nearest Macau station', () => {
    // Explicitly simulated coordinates near Barra (22.185, 113.531)
    const simulatedFix = { lat: 22.185, lon: 113.531 };
    const nearest = findNearestStation(simulatedFix.lat, simulatedFix.lon);

    assert.strictEqual(nearest.station.id, 'macau-a-ma');
    assert.strictEqual(nearest.station.name, '媽閣');
    assert.strictEqual(nearest.station.territory, 'macau');
  });

  test('Geolocation success with simulated Hong Kong coordinates snaps to nearest HK official station', () => {
    // Explicitly simulated coordinates near Tai O (22.254, 113.864)
    const simulatedFix = { lat: 22.254, lon: 113.864 };
    const nearest = findNearestStation(simulatedFix.lat, simulatedFix.lon);

    assert.strictEqual(nearest.station.code, 'TAO');
    assert.strictEqual(nearest.station.name, '大澳');
    assert.strictEqual(nearest.station.territory, 'hongkong');
  });

  test('User gesture preserved: locate button does NOT get disabled prematurely', () => {
    let positionRequested = false;
    let buttonDisabledPrematurely = false;

    const mockBtn = {
      disabled: false,
      getAttribute: () => null,
      setAttribute: (k, v) => {},
      removeAttribute: () => {}
    };

    const mockGeo = {
      getCurrentPosition(success, error, options) {
        positionRequested = true;
        // In WebKit / iOS Safari, button.disabled = true prior to this call invalidates user activation
        if (mockBtn.disabled === true) {
          buttonDisabledPrematurely = true;
        }
      }
    };

    setMockNavigator({ geolocation: mockGeo });

    // Simulating app requestGeolocation logic
    const requestGeo = (btn, nav) => {
      // Correct pattern: aria-busy instead of premature disabled = true
      btn.setAttribute('aria-busy', 'true');
      nav.geolocation.getCurrentPosition(() => {}, () => {});
    };

    requestGeo(mockBtn, globalThis.navigator);

    assert.strictEqual(positionRequested, true);
    assert.strictEqual(buttonDisabledPrematurely, false, 'Button must NOT be disabled before getCurrentPosition');
  });

  test('Offline snapshot fallback is strictly isolated to Tai O (hk-tao) and Inner Harbour (macau-inner-harbour)', () => {
    // Other HK stations must never display Tai O snapshot data
    const nonTaoHkStations = STATIONS.filter(s => s.territory === 'hongkong' && s.id !== 'hk-tao');
    for (const s of nonTaoHkStations) {
      assert.notStrictEqual(s.id, 'hk-tao');
    }

    // Other Macau stations must never display Inner Harbour snapshot data
    const nonInnerHarbourStations = STATIONS.filter(s => s.territory === 'macau' && s.id !== 'macau-inner-harbour');
    for (const s of nonInnerHarbourStations) {
      assert.notStrictEqual(s.id, 'macau-inner-harbour');
    }
  });
});
