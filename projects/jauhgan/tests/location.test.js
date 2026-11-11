import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { DEFAULT_ORIGIN } from '../js/geo.js';

// We import App dynamically or instantiate mock App
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

  function createMockDom() {
    let _originInnerHtml = '而家用議事亭前地做起點（未開定位）';
    let _originTextContent = '而家用議事亭前地做起點（未開定位）';
    const originLabelListeners = {};
    const originLabel = {
      listeners: originLabelListeners,
      addEventListener(evt, fn) {
        originLabelListeners[evt] = fn;
      },
      get textContent() {
        return _originTextContent;
      },
      set textContent(val) {
        _originTextContent = String(val);
        _originInnerHtml = String(val);
      },
      get innerHTML() {
        return _originInnerHtml;
      },
      set innerHTML(val) {
        _originInnerHtml = String(val);
        _originTextContent = String(val).replace(/<[^>]+>/g, '');
      },
      querySelector(selector) {
        if (selector === '#btn-default-origin' || selector === '.btn-default-origin') {
          if (_originInnerHtml.includes('btn-default-origin')) {
            const match = _originInnerHtml.match(/<button[^>]*>([^<]+)<\/button>/);
            return {
              id: 'btn-default-origin',
              className: 'btn-default-origin',
              textContent: match ? match[1] : '議事亭前地',
              click() {
                if (originLabelListeners.click) {
                  originLabelListeners.click({
                    target: this,
                    preventDefault() {}
                  });
                }
              }
            };
          }
        }
        return null;
      }
    };
    const btnLocateText = { textContent: '用我嘅位置' };
    const listeners = {};
    const attrs = {};
    const btnLocate = {
      disabled: false,
      listeners,
      addEventListener(evt, fn) {
        listeners[evt] = fn;
      },
      click() {
        if (listeners.click) listeners.click();
      },
      setAttribute(name, val) {
        attrs[name] = String(val);
      },
      removeAttribute(name) {
        delete attrs[name];
      },
      getAttribute(name) {
        return attrs[name];
      }
    };
    const dummyEl = {
      innerHTML: '',
      textContent: '',
      addEventListener() {},
      setAttribute() {},
      removeAttribute() {},
      querySelectorAll: () => []
    };
    return {
      originLabel,
      btnLocateText,
      btnLocate,
      weatherStrip: dummyEl,
      dataSourceNotice: dummyEl,
      categoryRail: dummyEl,
      btnRecenter: dummyEl,
      btnDetailBack: dummyEl,
      sheetHandle: dummyEl,
      placeList: dummyEl
    };
  }

  function createApp(App, dom) {
    const app = new App();
    app.dom = dom;
    app.loadWeather = () => {};
    app.tryLiveOverpass = () => {};
    app.fetchHkCarparks = () => {};
    app.initEventListeners();
    return app;
  }

  test('User gesture on locate control invokes getCurrentPosition without dropping activation', async () => {
    const dom = createMockDom();
    let getCurrentPositionCalled = false;
    let buttonDisabledBeforeCall = false;

    const mockGeolocation = {
      getCurrentPosition(success, error, options) {
        getCurrentPositionCalled = true;
        // Verify button was not prematurely disabled prior to calling the API
        buttonDisabledBeforeCall = dom.btnLocate.disabled;
      }
    };

    globalThis.window = { isSecureContext: true, addEventListener: () => {} };
    setMockNavigator({ geolocation: mockGeolocation });

    const { App } = await import('../js/app.js?t=' + Date.now());
    const app = createApp(App, dom);

    // Trigger user click gesture
    dom.btnLocate.click();

    assert.strictEqual(getCurrentPositionCalled, true, 'User click gesture must invoke getCurrentPosition');
    assert.strictEqual(buttonDisabledBeforeCall, false, 'User gesture must not be dropped by disabling button before call');
  });

  test('Success with simulated coordinates updates origin and keeps control usable for later refresh', async () => {
    const dom = createMockDom();
    // Explicitly labelled simulated coordinates (Never a real device fix)
    const simulatedCoords = {
      coords: {
        latitude: 22.1985,
        longitude: 113.5432
      }
    };

    const mockGeolocation = {
      getCurrentPosition(success) {
        success(simulatedCoords);
      }
    };

    globalThis.window = { isSecureContext: true, addEventListener: () => {} };
    setMockNavigator({ geolocation: mockGeolocation });

    const { App } = await import('../js/app.js?t=' + Date.now());
    const app = createApp(App, dom);

    dom.btnLocate.click();

    // Verify origin updated to simulated coordinates
    assert.strictEqual(app.currentOrigin.lat, 22.1985);
    assert.strictEqual(app.currentOrigin.lon, 113.5432);
    assert.strictEqual(app.currentOrigin.name, '你嘅位置');
    // Button must be idle and usable for later refresh
    assert.strictEqual(dom.btnLocateText.textContent, '用我嘅位置');
    assert.strictEqual(dom.btnLocate.disabled, false);
  });

  test('Permission denied (code 1) shows honest distinct messaging without blaming user', async () => {
    const dom = createMockDom();
    const mockGeolocation = {
      getCurrentPosition(success, error) {
        error({ code: 1, message: 'User denied Geolocation' });
      }
    };

    globalThis.window = { isSecureContext: true, addEventListener: () => {} };
    setMockNavigator({ geolocation: mockGeolocation });

    const { App } = await import('../js/app.js?t=' + Date.now());
    const app = createApp(App, dom);

    dom.btnLocate.click();

    // Must offer retry and default origin clearly
    assert.ok(dom.originLabel.textContent.includes('未獲授權'), 'Must mention permission status');
    assert.ok(dom.originLabel.textContent.includes('重試'), 'Must offer retry option');
    assert.ok(dom.originLabel.textContent.includes('議事亭前地'), 'Must offer default origin option');
    // Control remains usable
    assert.strictEqual(dom.btnLocateText.textContent, '用我嘅位置');
    assert.strictEqual(dom.btnLocate.disabled, false);
  });

  test('Position unavailable (code 2) does NOT falsely report unauthorized', async () => {
    const dom = createMockDom();
    const mockGeolocation = {
      getCurrentPosition(success, error) {
        error({ code: 2, message: 'Position unavailable' });
      }
    };

    globalThis.window = { isSecureContext: true, addEventListener: () => {} };
    setMockNavigator({ geolocation: mockGeolocation });

    const { App } = await import('../js/app.js?t=' + Date.now());
    const app = createApp(App, dom);

    dom.btnLocate.click();

    // Must NOT say 未獲授權!
    assert.strictEqual(dom.originLabel.textContent.includes('未獲授權'), false, 'Code 2 must NOT claim unauthorized');
    assert.ok(dom.originLabel.textContent.includes('未能獲取位置') || dom.originLabel.textContent.includes('訊號'), 'Must report unavailable');
    assert.ok(dom.originLabel.textContent.includes('重試'), 'Must offer retry');
    assert.ok(dom.originLabel.textContent.includes('議事亭前地'), 'Must offer default origin');
    assert.strictEqual(dom.btnLocate.disabled, false);
  });

  test('Timeout (code 3) does NOT falsely report unauthorized', async () => {
    const dom = createMockDom();
    const mockGeolocation = {
      getCurrentPosition(success, error, opts) {
        error({ code: 3, message: 'Timeout expired' });
      }
    };

    globalThis.window = { isSecureContext: true, addEventListener: () => {} };
    setMockNavigator({ geolocation: mockGeolocation });

    const { App } = await import('../js/app.js?t=' + Date.now());
    const app = createApp(App, dom);

    dom.btnLocate.click();

    // Must NOT say 未獲授權!
    assert.strictEqual(dom.originLabel.textContent.includes('未獲授權'), false, 'Code 3 must NOT claim unauthorized');
    assert.ok(dom.originLabel.textContent.includes('逾時') || dom.originLabel.textContent.includes('訊號'), 'Must report timeout honestly');
    assert.ok(dom.originLabel.textContent.includes('重試'), 'Must offer retry');
    assert.ok(dom.originLabel.textContent.includes('議事亭前地'), 'Must offer default origin');
    assert.strictEqual(dom.btnLocate.disabled, false);
  });

  test('Missing geolocation API reports distinct unsupported message', async () => {
    const dom = createMockDom();
    globalThis.window = { isSecureContext: true, addEventListener: () => {} };
    setMockNavigator({}); // No geolocation

    const { App } = await import('../js/app.js?t=' + Date.now());
    const app = createApp(App, dom);

    dom.btnLocate.click();

    assert.ok(dom.originLabel.textContent.includes('未支援') || dom.originLabel.textContent.includes('未能使用'));
    assert.ok(dom.originLabel.textContent.includes('議事亭前地'));
  });

  test('Retry after a failure successfully updates origin on subsequent attempt', async () => {
    const dom = createMockDom();
    let attempt = 0;
    const simulatedCoords = {
      coords: {
        latitude: 22.1937,
        longitude: 113.5406
      }
    };

    const mockGeolocation = {
      getCurrentPosition(success, error) {
        attempt++;
        if (attempt === 1) {
          error({ code: 1, message: 'Denied' });
        } else {
          success(simulatedCoords);
        }
      }
    };

    globalThis.window = { isSecureContext: true, addEventListener: () => {} };
    setMockNavigator({ geolocation: mockGeolocation });

    const { App } = await import('../js/app.js?t=' + Date.now());
    const app = createApp(App, dom);

    // First attempt fails
    dom.btnLocate.click();
    assert.strictEqual(attempt, 1);
    assert.strictEqual(dom.btnLocate.disabled, false, 'Control must remain usable after failure');

    // Second attempt (retry) succeeds
    dom.btnLocate.click();
    assert.strictEqual(attempt, 2);
    assert.strictEqual(app.currentOrigin.name, '你嘅位置');
  });

  test('Default origin fallback remains available and selectable via visible control click', async () => {
    const dom = createMockDom();
    globalThis.window = { isSecureContext: true, addEventListener: () => {} };
    let shouldSucceed = false;
    const simulatedCoords = {
      coords: {
        latitude: 22.28,
        longitude: 114.15
      }
    };

    setMockNavigator({
      geolocation: {
        getCurrentPosition(s, e) {
          if (shouldSucceed) {
            s(simulatedCoords);
          } else {
            e({ code: 1, message: 'Denied' });
          }
        }
      }
    });

    const { App } = await import('../js/app.js?t=' + Date.now());
    const app = createApp(App, dom);

    // 1. Locate fails -> visible #btn-default-origin rendered in error copy
    dom.btnLocate.click();
    assert.strictEqual(app.currentOrigin.isDefault, true);

    const btnDefaultOnFailure = dom.originLabel.querySelector('#btn-default-origin');
    assert.ok(btnDefaultOnFailure, 'Visible #btn-default-origin must exist in failure copy');
    assert.strictEqual(btnDefaultOnFailure.textContent, '議事亭前地');

    // Simulate custom origin then tap #btn-default-origin
    app.currentOrigin = { lat: 22.3, lon: 114.2, name: '自訂位置', isDefault: false };
    btnDefaultOnFailure.click();
    assert.strictEqual(app.currentOrigin.lat, DEFAULT_ORIGIN.lat);
    assert.strictEqual(app.currentOrigin.lon, DEFAULT_ORIGIN.lon);
    assert.strictEqual(app.currentOrigin.isDefault, true);

    // 2. Locate succeeds with explicitly simulated coordinates -> visible #btn-default-origin rendered
    shouldSucceed = true;
    dom.btnLocate.click();
    assert.strictEqual(app.currentOrigin.name, '你嘅位置');
    assert.strictEqual(app.currentOrigin.isDefault, false);

    const btnDefaultOnSuccess = dom.originLabel.querySelector('#btn-default-origin');
    assert.ok(btnDefaultOnSuccess, 'Visible #btn-default-origin must exist after successful locate');
    assert.strictEqual(btnDefaultOnSuccess.textContent, '用議事亭前地');

    // Tap #btn-default-origin to go back to 議事亭前地
    btnDefaultOnSuccess.click();
    assert.strictEqual(app.currentOrigin.lat, DEFAULT_ORIGIN.lat);
    assert.strictEqual(app.currentOrigin.lon, DEFAULT_ORIGIN.lon);
    assert.strictEqual(app.currentOrigin.isDefault, true);
    assert.ok(dom.originLabel.textContent.includes('議事亭前地'));
  });
});
