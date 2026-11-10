import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { AppMap } from '../js/map.js';

describe('AppMap module (map.js)', () => {
  let originalWindow;
  let originalDocument;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  test('Triggers calm fallback if maplibregl is undefined', () => {
    let fallbackMessage = null;
    const fallbackEl = {
      style: {},
      innerHTML: '',
      querySelector: () => null
    };

    globalThis.window = {
      location: { protocol: 'http:' }
    };
    globalThis.document = {
      createElement: () => ({ style: {}, className: '', innerHTML: '' })
    };

    const appMap = new AppMap({
      container: {},
      fallbackContainer: fallbackEl,
      initialOrigin: { lat: 22.1937, lon: 113.5406 },
      onMapError: (msg) => { fallbackMessage = msg; }
    });

    assert.strictEqual(appMap.hasError, true);
    assert.ok(fallbackMessage.includes('未能載入'));
  });

  test('Caches places and flushes markers on load event (Item 1 fix)', () => {
    let loadHandler = null;
    const addedMarkers = [];

    // Mock document
    globalThis.document = {
      createElement: (tag) => ({
        tagName: tag,
        className: '',
        classList: {
          add(c) { this.classes = this.classes || []; this.classes.push(c); },
          remove(c) { this.classes = (this.classes || []).filter(x => x !== c); },
          contains(c) { return (this.classes || []).includes(c); }
        },
        setAttribute: () => {},
        addEventListener: () => {},
        innerHTML: ''
      })
    };

    // Mock maplibregl
    const mockMap = {
      on(event, cb) {
        if (event === 'load') loadHandler = cb;
      },
      easeTo() {},
      getCanvasContainer() { return {}; }
    };

    class MockMarker {
      constructor(opts) {
        this.element = opts.element;
      }
      setLngLat() { return this; }
      on() { return this; }
      addTo() {
        addedMarkers.push(this);
        return this;
      }
      remove() {
        const idx = addedMarkers.indexOf(this);
        if (idx >= 0) addedMarkers.splice(idx, 1);
      }
      getElement() {
        return this.element;
      }
    }

    globalThis.window = {
      location: { protocol: 'http:' },
      maplibregl: {
        Map: function() { return mockMap; },
        Marker: MockMarker
      }
    };

    const appMap = new AppMap({
      container: {},
      initialOrigin: { lat: 22.1937, lon: 113.5406 }
    });

    const testPlaces = [
      { id: '1', category: 'toilets', name: '測試公廁', lat: 22.1937, lon: 113.5406 },
      { id: '2', category: 'parking', name: '測試停車場', lat: 22.1940, lon: 113.5410 }
    ];

    // renderPlaceMarkers called before map loaded (snapshot path)
    appMap.renderPlaceMarkers(testPlaces);
    assert.strictEqual(appMap.currentPlaces.length, 2);
    // Before load: place markers not added yet
    assert.strictEqual(appMap.placeMarkers.size, 0);

    // Map fires load event
    assert.ok(loadHandler, 'Load handler must be registered');
    loadHandler();

    // Now markers must be flushed!
    assert.strictEqual(appMap.isLoaded, true);
    assert.strictEqual(appMap.placeMarkers.size, 2);
  });

  test('Map lifecycle: hides fallback on load, cleans up old map on re-init, ignores single tile error', () => {
    let loadHandler = null;
    let errorHandler = null;
    let removeCalled = 0;

    globalThis.document = {
      createElement: () => ({
        setAttribute: () => {},
        addEventListener: () => {},
        innerHTML: ''
      })
    };

    const mockFallback = {
      style: { display: 'flex' },
      innerHTML: '',
      querySelector: () => null
    };

    const mockMap = {
      on(event, cb) {
        if (event === 'load') loadHandler = cb;
        if (event === 'error') errorHandler = cb;
      },
      remove() {
        removeCalled++;
      },
      easeTo() {},
      getCanvasContainer() { return {}; }
    };

    class MockMarker {
      setLngLat() { return this; }
      on() { return this; }
      addTo() { return this; }
      remove() {}
    }

    globalThis.window = {
      location: { protocol: 'http:' },
      maplibregl: {
        Map: function() { return mockMap; },
        Marker: MockMarker
      }
    };

    const appMap = new AppMap({
      container: {},
      fallbackContainer: mockFallback,
      initialOrigin: { lat: 22.1937, lon: 113.5406 }
    });

    // Simulate fallback was previously visible
    appMap.showFallback('測試暫時未能載入');
    assert.strictEqual(appMap.hasError, true);
    assert.strictEqual(mockFallback.style.display, 'flex');

    // On map load, fallback is hidden and hasError cleared
    loadHandler();
    assert.strictEqual(appMap.isLoaded, true);
    assert.strictEqual(appMap.hasError, false);
    assert.strictEqual(mockFallback.style.display, 'none');

    // Tile fetch errors after load do NOT trigger fallback (map is already drawn)
    for (let i = 0; i < 15; i++) {
      errorHandler({ error: { message: 'Failed to fetch' } });
    }
    assert.strictEqual(appMap.hasError, false);
    assert.strictEqual(mockFallback.style.display, 'none');

    // Re-init cleans up previous map instance to avoid stacking WebGL contexts
    appMap.init();
    assert.strictEqual(removeCalled, 1);
  });
});
