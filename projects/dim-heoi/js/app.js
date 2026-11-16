/**
 * 點去 (Dim Heoi) - Macau Walk vs Bus Decision Tool
 * Main Application Controller
 */

import {
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
  CURATED_PLACES,
  formatMinutes,
  formatDistance,
  formatMacauTime,
  evaluateCoordinate,
  haversineDistance
} from './utils.js';

import { fetchWalkingRoute } from './router.js';
import { fetchRainHint } from './weather.js';
import { loadTransitData, findBusJourneys, fetchLiveBus, parseLiveBusResponse } from './transit.js';

// Application State
const state = {
  origin: { ...DEFAULT_ORIGIN, name: '澳門半島' },
  destination: { ...DEFAULT_DESTINATION, name: '關閘總站' },
  transitData: null,
  walkingResult: null,
  busJourneys: [],
  selectedBusIndex: 0,
  rainHint: null,
  map: null,
  mapLoaded: false,
  markers: {
    origin: null,
    dest: null,
    board: null,
    alight: null
  },
  showWalkLine: true,
  showBusLine: true
};

// Check WebGL support (MapLibre 4.7.1 trap: do not call supported method directly)
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Initialize DOM and Event Handlers
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupUIElements();
  initMap();

  try {
    // 1. Fetch Rain Hint in background
    fetchRainHint().then((hint) => {
      state.rainHint = hint;
      renderRainHint(hint);
    }).catch(() => {});

    // 2. Load Transit Data
    showStatus(true, '載入澳門巴士路線資料中...');
    state.transitData = await loadTransitData('./');
    populateStopsDatalist();
    updateSnapshotMeta(state.transitData.meta);
    showStatus(false);

    // 3. Perform Initial Routing
    await planTrip();
  } catch (err) {
    showStatus(true, `載入資料失敗：${err.message}`, true);
  }
});

/**
 * Setup UI Elements and Click Handlers
 */
function setupUIElements() {
  const originInput = document.getElementById('input-origin');
  const destInput = document.getElementById('input-destination');
  const swapBtn = document.getElementById('btn-swap');
  const locateBtn = document.getElementById('btn-locate');
  const clearDestBtn = document.getElementById('btn-clear-dest');
  const quickChipsContainer = document.getElementById('quick-chips');

  originInput.value = state.origin.name;
  destInput.value = state.destination.name;

  if (clearDestBtn) {
    clearDestBtn.style.display = destInput.value ? 'inline-flex' : 'none';
    destInput.addEventListener('input', () => {
      clearDestBtn.style.display = destInput.value ? 'inline-flex' : 'none';
    });
    clearDestBtn.addEventListener('click', () => {
      destInput.value = '';
      clearDestBtn.style.display = 'none';
      destInput.focus();
    });
  }

  // Render Curated Chips
  quickChipsContainer.innerHTML = '';
  for (const place of CURATED_PLACES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-btn';
    btn.textContent = place.name;
    btn.addEventListener('click', () => {
      setDestination(place);
    });
    quickChipsContainer.appendChild(btn);
  }

  // Swap Origin and Destination
  swapBtn.addEventListener('click', () => {
    const temp = { ...state.origin };
    state.origin = { ...state.destination };
    state.destination = temp;

    originInput.value = state.origin.name;
    destInput.value = state.destination.name;

    const originHint = document.getElementById('origin-hint');
    if (originHint) {
      if (state.origin.name === '澳門半島') {
        originHint.textContent = '而家用澳門半島做起點（未開定位）';
      } else {
        originHint.textContent = `已設定出發點為「${state.origin.name}」`;
      }
    }

    if (clearDestBtn) {
      clearDestBtn.style.display = destInput.value ? 'inline-flex' : 'none';
    }

    planTrip();
  });

  // Current Geolocation
  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('你的瀏覽器未支援定位功能');
      return;
    }

    locateBtn.disabled = true;
    showStatus(true, '讀取你現時位置中...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locateBtn.disabled = false;
        showStatus(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const coordEval = evaluateCoordinate(lat, lon);

        if (!coordEval.isValid) {
          alert('你現時位置不在澳門範圍內，已保留原先出發點。');
          return;
        }

        state.origin = {
          lat,
          lon,
          name: coordEval.isMacau ? '我現時位置' : '我現時位置（周邊）'
        };
        originInput.value = state.origin.name;
        const originHint = document.getElementById('origin-hint');
        if (originHint) originHint.textContent = '已定位到你現時位置';
        planTrip();
      },
      (err) => {
        locateBtn.disabled = false;
        showStatus(false);
        const originHint = document.getElementById('origin-hint');
        if (originHint) originHint.textContent = '而家用澳門半島做起點（未開定位）';
        showStatus(true, '未能讀取現時定位，已保留澳門半島起點', true);
        setTimeout(() => showStatus(false), 2500);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });

  // Simple quick input matching on destination Enter or input change
  destInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = destInput.value.trim();
      matchAndSetPlace(query, false);
    }
  });

  destInput.addEventListener('change', () => {
    const query = destInput.value.trim();
    if (query) matchAndSetPlace(query, false);
  });

  originInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = originInput.value.trim();
      matchAndSetPlace(query, true);
    }
  });

  originInput.addEventListener('change', () => {
    const query = originInput.value.trim();
    if (query) matchAndSetPlace(query, true);
  });

  // Map Toggles
  const walkToggle = document.getElementById('toggle-walk-line');
  const busToggle = document.getElementById('toggle-bus-line');
  const fitBtn = document.getElementById('btn-fit-map');

  walkToggle.addEventListener('click', () => {
    state.showWalkLine = !state.showWalkLine;
    walkToggle.classList.toggle('active-walk', state.showWalkLine);
    if (state.map && state.map.setLayoutProperty) {
      state.map.setLayoutProperty('walk-line-layer', 'visibility', state.showWalkLine ? 'visible' : 'none');
    }
  });

  busToggle.addEventListener('click', () => {
    state.showBusLine = !state.showBusLine;
    busToggle.classList.toggle('active-bus', state.showBusLine);
    if (state.map && state.map.setLayoutProperty) {
      state.map.setLayoutProperty('bus-line-layer', 'visibility', state.showBusLine ? 'visible' : 'none');
    }
  });

  fitBtn.addEventListener('click', () => {
    fitMapBounds();
  });
}

function populateStopsDatalist() {
  const datalist = document.getElementById('macau-stops-list');
  if (!datalist || !state.transitData || !state.transitData.stops) return;
  datalist.innerHTML = '';
  const names = new Set();
  for (const place of CURATED_PLACES) {
    names.add(place.name);
  }
  for (const stop of Object.values(state.transitData.stops)) {
    if (stop.name) names.add(stop.name);
  }
  for (const name of names) {
    const opt = document.createElement('option');
    opt.value = name;
    datalist.appendChild(opt);
  }
}

function matchAndSetPlace(query, isOrigin) {
  if (!query) return;
  // Match curated places
  const match = CURATED_PLACES.find((p) => p.name.includes(query) || (p.code && p.code.includes(query)));
  if (match) {
    if (isOrigin) {
      state.origin = { ...match };
      document.getElementById('input-origin').value = match.name;
      const originHint = document.getElementById('origin-hint');
      if (originHint) {
        originHint.textContent = match.name === '澳門半島' ? '而家用澳門半島做起點（未開定位）' : `已設定出發點為「${match.name}」`;
      }
    } else {
      setDestination(match);
    }
    planTrip();
    return;
  }

  // Match stops in transitData if loaded
  if (state.transitData && state.transitData.stops) {
    for (const [code, s] of Object.entries(state.transitData.stops)) {
      if (s.name && s.name.includes(query) && typeof s.lat === 'number') {
        const place = { lat: s.lat, lon: s.lon, name: `${s.name} (${code})`, code };
        if (isOrigin) {
          state.origin = place;
          document.getElementById('input-origin').value = place.name;
          const originHint = document.getElementById('origin-hint');
          if (originHint) originHint.textContent = `已設定出發點為「${s.name}」`;
        } else {
          setDestination(place);
        }
        planTrip();
        return;
      }
    }
  }

  showStatus(true, `未能在澳門資料中找到「${query}」，請由熱門地點點選`, true);
  setTimeout(() => showStatus(false), 2500);
}

function setDestination(place) {
  state.destination = { ...place };
  const destInput = document.getElementById('input-destination');
  if (destInput) destInput.value = place.name;
  const clearBtn = document.getElementById('btn-clear-dest');
  if (clearBtn) clearBtn.style.display = place.name ? 'inline-flex' : 'none';
  planTrip();
}

/**
 * Initialize MapLibre Map
 */
function initMap() {
  const container = document.getElementById('map-canvas');
  if (!isWebGLAvailable()) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748B;font-size:0.85rem;padding:16px;text-align:center;">瀏覽器未支援 WebGL 底圖，但不影響步行與巴士耗時比較。</div>';
    return;
  }

  try {
    state.map = new maplibregl.Map({
      container: 'map-canvas',
      style: 'data/style.json',
      center: [113.5439, 22.1987],
      zoom: 12.8,
      attributionControl: false
    });

    state.map.on('load', () => {
      state.mapLoaded = true;

      // Add Sources
      state.map.addSource('walk-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      state.map.addSource('bus-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add Layers
      // Walking line: Deep teal #0B6E6A, dashed
      state.map.addLayer({
        id: 'walk-line-layer',
        type: 'line',
        source: 'walk-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': state.showWalkLine ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#0B6E6A',
          'line-width': 4.5,
          'line-dasharray': [2, 1.5]
        }
      });

      // Bus line: Signal Red #C8102E, solid
      state.map.addLayer({
        id: 'bus-line-layer',
        type: 'line',
        source: 'bus-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': state.showBusLine ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#C8102E',
          'line-width': 5,
          'line-opacity': 0.85
        }
      });

      // Allow tapping the map to set destination
      state.map.on('click', (e) => {
        const lat = e.lngLat.lat;
        const lon = e.lngLat.lng;
        const coordEval = evaluateCoordinate(lat, lon);
        if (!coordEval.isValid) {
          showStatus(true, '點選位置不在澳門範圍內', true);
          setTimeout(() => showStatus(false), 2500);
          return;
        }
        setDestination({
          lat,
          lon,
          name: `地圖點 (${lat.toFixed(4)}, ${lon.toFixed(4)})`
        });
        showStatus(true, '已更新目的地為地圖點');
        setTimeout(() => showStatus(false), 2000);
      });

      updateMapFeatures();
    });
  } catch (e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748B;font-size:0.85rem;padding:16px;text-align:center;">地圖未能載入，但不影響步行與巴士耗時比較。</div>';
  }
}

/**
 * Execute Plan: Walk + Bus
 */
async function planTrip() {
  if (!state.origin || !state.destination) return;

  showStatus(true, '計算步行與巴士路線中...');

  try {
    // 1. Fetch Walking Route
    const walkPromise = fetchWalkingRoute(state.origin, state.destination);

    // 2. Bus Journeys
    let journeys = [];
    if (state.transitData) {
      journeys = findBusJourneys(state.origin, state.destination, state.transitData, 4);
    }

    const walkResult = await walkPromise;
    state.walkingResult = walkResult;
    state.busJourneys = journeys;
    state.selectedBusIndex = 0;

    renderWalkCard(walkResult);
    renderBusOptions(journeys);
    renderDecisionCallout();
    updateMapFeatures();

    // Query live bus for selected journey
    checkLiveBusForCurrent();

    showStatus(false);
  } catch (err) {
    showStatus(true, `計算路線時發生問題：${err.message}`, true);
  }
}

/**
 * Render Walking Comparison Card
 */
function renderWalkCard(walk) {
  const timeEl = document.getElementById('walk-time');
  const distEl = document.getElementById('walk-distance');
  const metaEl = document.getElementById('walk-meta');

  if (!walk || !walk.ok) {
    timeEl.innerHTML = '暫未能計算';
    distEl.textContent = '未能提供步行路線';
    metaEl.textContent = (walk && walk.message) ? walk.message : '步行導航服務暫未能連線';
    return;
  }

  timeEl.innerHTML = `${walk.durationMinutes} <span class="metric-unit">分鐘</span>`;
  distEl.textContent = formatDistance(walk.distanceMeters);

  const providerLabel = walk.provider === 'valhalla' ? 'Valhalla' : 'OSRM';
  const fetchTime = formatMacauTime(walk.fetchedAt || new Date(), 'time');
  const isStale = walk.fetchedAt && (Date.now() - walk.fetchedAt > 24 * 3600 * 1000);
  const staleNotice = isStale ? ' · 路線可能已過期' : '';
  metaEl.textContent = `步行路線：OpenStreetMap / FOSSGIS ${providerLabel} 行人路徑（非官方測時 · 時速約 ${(walk.speedKmh || 4.5).toFixed(1)} km/h · ${fetchTime} 路徑計算${staleNotice}）`;
}

/**
 * Render Bus Journey Options and Card
 */
function renderBusOptions(journeys) {
  const variantsContainer = document.getElementById('bus-variants-container');
  const stepsCard = document.getElementById('bus-steps-card');
  const routeBadge = document.getElementById('bus-route-badge');
  const primaryEl = document.getElementById('bus-primary');
  const secondaryEl = document.getElementById('bus-secondary');
  const metaEl = document.getElementById('bus-meta');

  if (!journeys || journeys.length === 0) {
    variantsContainer.style.display = 'none';
    stepsCard.style.display = 'none';
    routeBadge.textContent = '無直達線';
    primaryEl.innerHTML = '未有合適路線';
    secondaryEl.textContent = '周邊巴士站距離較遠';
    metaEl.textContent = '建議步行或選擇其他鄰近地點';
    return;
  }

  // Render variant buttons if > 1 direct options
  variantsContainer.innerHTML = '';
  if (journeys.length > 1) {
    variantsContainer.style.display = 'flex';
    journeys.forEach((j, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `bus-var-btn ${idx === state.selectedBusIndex ? 'active' : ''}`;
      btn.textContent = `${j.routeName}號 (${j.stopCount}站)`;
      btn.addEventListener('click', () => {
        state.selectedBusIndex = idx;
        renderBusOptions(journeys);
        renderDecisionCallout();
        updateMapFeatures();
        checkLiveBusForCurrent();
      });
      variantsContainer.appendChild(btn);
    });
  } else {
    variantsContainer.style.display = 'none';
  }

  const active = journeys[state.selectedBusIndex] || journeys[0];

  if (active.type === 'direct') {
    routeBadge.textContent = `${active.routeName} 號`;
    primaryEl.innerHTML = `搭 ${active.stopCount} <span class="metric-unit">個站</span>`;
    secondaryEl.textContent = `上車行 ${active.boardingStop.distance} 米 · 落車行 ${active.alightingStop.distance} 米`;
    const metaDate = state.transitData?.meta?.fetchedAt ? formatMacauTime(state.transitData.meta.fetchedAt, 'date') : '2026年11月16日';
    metaEl.innerHTML = `往「${active.destTerminal}」方向 · 路線站位：<a href="https://bis.dsat.gov.mo/macauweb/" target="_blank" rel="noopener" class="footer-link">交通事務局公開巴士查詢</a>（${metaDate} 下載；非即時到站）`;

    // Timeline steps
    stepsCard.style.display = 'flex';
    document.getElementById('badge-metro').style.display = active.hasMetro ? 'inline-block' : 'none';

    const timeline = document.getElementById('steps-timeline');
    timeline.innerHTML = `
      <div class="step-node walk">
        <span class="step-label">由起點步行 ${active.boardingStop.distance} 米</span>
        <span class="step-sub">前往「${active.boardingStop.name}」${active.boardingStop.lane ? `(${active.boardingStop.lane})` : ''}</span>
      </div>
      <div class="step-node">
        <span class="step-label">登上 ${active.routeName} 號巴士（搭 ${active.stopCount} 個站）</span>
        <span class="step-sub">往 ${active.destTerminal} 方向</span>
      </div>
      <div class="step-node walk">
        <span class="step-label">喺「${active.alightingStop.name}」${active.alightingStop.lane ? `(${active.alightingStop.lane})` : ''}落車</span>
        <span class="step-sub">步行 ${active.alightingStop.distance} 米到達目的地</span>
      </div>
    `;
  } else {
    // 1-transfer journey
    routeBadge.textContent = `${active.leg1.routeName} 轉 ${active.leg2.routeName}`;
    primaryEl.innerHTML = `轉乘 1 次 · 共 ${active.stopCount} <span class="metric-unit">個站</span>`;
    secondaryEl.textContent = `步行接駁約 ${active.totalWalkDistance} 米`;
    metaEl.textContent = `喺「${active.leg1.transferStop.name}」轉車`;

    stepsCard.style.display = 'flex';
    document.getElementById('badge-metro').style.display = active.hasMetro ? 'inline-block' : 'none';

    const timeline = document.getElementById('steps-timeline');
    timeline.innerHTML = `
      <div class="step-node walk">
        <span class="step-label">由起點步行至「${active.leg1.boardingStop.name}」</span>
      </div>
      <div class="step-node">
        <span class="step-label">搭 ${active.leg1.routeName} 號（搭 ${active.leg1.stopCount} 個站）至「${active.leg1.transferStop.name}」</span>
      </div>
      <div class="step-node">
        <span class="step-label">同站轉乘 ${active.leg2.routeName} 號（搭 ${active.leg2.stopCount} 個站）</span>
      </div>
      <div class="step-node walk">
        <span class="step-label">喺「${active.leg2.alightingStop.name}」落車，步行至目的地</span>
      </div>
    `;
  }
}

/**
 * Check Live Bus Positions for Current Selected Journey
 */
async function checkLiveBusForCurrent() {
  const journeys = state.busJourneys;
  const active = journeys[state.selectedBusIndex] || journeys[0];
  const pulseEl = document.getElementById('live-pulse');
  const liveTextEl = document.getElementById('live-bus-text');

  if (!active || active.type !== 'direct') {
    pulseEl.className = 'live-pulse dim';
    liveTextEl.textContent = '此為轉乘方案，請留意沿線站點常規班次。';
    return;
  }

  pulseEl.className = 'live-pulse dim';
  liveTextEl.textContent = '嘗試連線交通事務局即時班次...';

  const liveResp = await fetchLiveBus(active.routeName, active.dir);

  if (!liveResp.ok) {
    pulseEl.className = 'live-pulse dim';
    liveTextEl.textContent = liveResp.message || '即時巴士位置暫時未能喺瀏覽器讀到（受 DSAT 跨域限制），顯示班次為常規路線資料。';
    return;
  }

  const routeObj = state.transitData.routes[`${active.routeName}_${active.dir}`];
  const routeStops = routeObj ? routeObj.stops : [];
  const parsed = parseLiveBusResponse(liveResp.data, routeStops, active.boardingStop.code, state.transitData.stops);

  if (parsed.status === 'approaching' || parsed.status === 'arrived') {
    pulseEl.className = 'live-pulse';
  } else {
    pulseEl.className = 'live-pulse dim';
  }
  liveTextEl.textContent = parsed.text;
}

/**
 * Render Authentic Cantonese Decision Callout
 */
function renderDecisionCallout() {
  const titleEl = document.getElementById('decision-title');
  const textEl = document.getElementById('decision-text');

  const walk = state.walkingResult;
  const journeys = state.busJourneys;
  const activeBus = journeys[state.selectedBusIndex] || journeys[0];
  const rain = state.rainHint;

  let rainPrefix = '';
  if (rain && rain.isRaining) {
    rainPrefix = '落緊雨行路會濕身，建議搭巴士。';
  }

  if (!walk || !walk.ok) {
    titleEl.textContent = '建議搭巴士';
    if (activeBus) {
      textEl.textContent = `${rainPrefix}暫未能計算步行路線。建議搭 ${activeBus.routeName} 號巴士（搭 ${activeBus.stopCount} 個站）。`;
    } else {
      textEl.textContent = '暫未有適當的步行與直達巴士方案，請確認起訖點。';
    }
    return;
  }

  const walkMins = walk.durationMinutes;
  const walkDistStr = formatDistance(walk.distanceMeters);

  if (!activeBus) {
    titleEl.textContent = '建議行路';
    textEl.textContent = `${rainPrefix}附近未有直達巴士路線，行路大約需要 ${walkMins} 分鐘（${walkDistStr}）。`;
    return;
  }

  const busRoute = activeBus.routeName;
  const stopCount = activeBus.stopCount;
  const busWalkDist = activeBus.totalWalkDistance;

  // Decision logic
  if (walkMins <= 12 && walkDistStr.includes('米')) {
    titleEl.textContent = '行路更直接快捷 👟';
    textEl.textContent = `${rainPrefix}行路只係 ${walkMins} 分鐘（約 ${walkDistStr}），等得巴士嚟行路都已經到咗！`;
  } else if (walkMins <= 20 && busWalkDist > 400) {
    titleEl.textContent = '行路同行去巴士站差唔多 👟';
    textEl.textContent = `${rainPrefix}行路約 ${walkMins} 分鐘（${walkDistStr}）；搭巴士前後都要行 ${busWalkDist} 米。如果天氣好，行路仲自由！`;
  } else if (walkMins > 25) {
    titleEl.textContent = '建議搭巴士 🚌';
    textEl.textContent = `${rainPrefix}行路要 ${walkMins} 分鐘（約 ${walkDistStr}），搭 ${busRoute} 號巴士搭 ${stopCount} 個站，只係行 ${busWalkDist} 米接駁，輕鬆好多。`;
  } else {
    titleEl.textContent = '視乎趕唔趕時間 ⚖️';
    textEl.textContent = `${rainPrefix}行路約 ${walkMins} 分鐘（${walkDistStr}），搭 ${busRoute} 號巴士搭 ${stopCount} 個站。如果好天想散步可行路，怕熱怕攰就搭巴士。`;
  }
}

/**
 * Render Rain Hint Chip
 */
function renderRainHint(hint) {
  const container = document.getElementById('rain-chip-container');
  const textEl = document.getElementById('rain-chip-text');

  if (!hint || !hint.hasRain) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const modelTimeStr = hint.modelTimeStr || formatMacauTime(new Date(), 'time');
  textEl.innerHTML = `${hint.message} <span style="font-size:0.75rem;font-weight:400;opacity:0.85;">（Open-Meteo 模式預測，非官方觀測 · ${modelTimeStr} 預測）</span>`;
}

/**
 * Update Snapshot Meta in Footer
 */
function updateSnapshotMeta(meta) {
  const el = document.getElementById('footer-snapshot-meta');
  if (!el) return;

  if (meta && meta.fetchedAt) {
    const d = new Date(meta.fetchedAt);
    const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    el.textContent = `路線同站位：澳門交通事務局 (DSAT) 公開查詢資料（${dateStr} 下載；唔係即時到站）`;
  }
}

/**
 * Update Map GeoJSON Features and Markers
 */
function updateMapFeatures() {
  if (!state.map || !state.mapLoaded) return;

  const walk = state.walkingResult;
  const journeys = state.busJourneys;
  const activeBus = journeys[state.selectedBusIndex] || journeys[0];

  // 1. Update Walk Line
  const walkSource = state.map.getSource('walk-route');
  if (walkSource) {
    if (walk && walk.ok && walk.geometry && walk.geometry.coordinates) {
      walkSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: walk.geometry,
            properties: {}
          }
        ]
      });
    } else {
      walkSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  // 2. Update Bus Line
  const busSource = state.map.getSource('bus-route');
  if (busSource) {
    if (activeBus && activeBus.stops && activeBus.stops.length > 1) {
      const coords = activeBus.stops
        .filter((s) => typeof s.lon === 'number' && typeof s.lat === 'number')
        .map((s) => [s.lon, s.lat]);

      if (coords.length > 1) {
        busSource.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: coords
              },
              properties: {}
            }
          ]
        });
      } else {
        busSource.setData({ type: 'FeatureCollection', features: [] });
      }
    } else {
      busSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  // 3. Update Markers
  updateMarkers(activeBus);

  // 4. Fit bounds
  fitMapBounds();
}

/**
 * Update Map Markers for Origin, Destination, Boarding, Alighting
 */
function updateMarkers(activeBus) {
  // Clear existing
  for (const k of Object.keys(state.markers)) {
    if (state.markers[k]) {
      state.markers[k].remove();
      state.markers[k] = null;
    }
  }

  // Origin Marker
  if (state.origin && state.origin.lat && state.origin.lon) {
    const el = document.createElement('div');
    el.className = 'custom-pin origin';
    el.textContent = '起';
    state.markers.origin = new maplibregl.Marker({ element: el })
      .setLngLat([state.origin.lon, state.origin.lat])
      .addTo(state.map);
  }

  // Destination Marker
  if (state.destination && state.destination.lat && state.destination.lon) {
    const el = document.createElement('div');
    el.className = 'custom-pin dest';
    el.textContent = '訖';
    state.markers.dest = new maplibregl.Marker({ element: el })
      .setLngLat([state.destination.lon, state.destination.lat])
      .addTo(state.map);
  }

  // Boarding Stop Marker
  if (activeBus && activeBus.boardingStop && activeBus.boardingStop.lat) {
    const el = document.createElement('div');
    el.className = 'custom-pin bus-stop';
    el.title = `上車站點：${activeBus.boardingStop.name}`;
    el.textContent = '上';
    state.markers.board = new maplibregl.Marker({ element: el })
      .setLngLat([activeBus.boardingStop.lon, activeBus.boardingStop.lat])
      .addTo(state.map);
  }

  // Alighting Stop Marker
  if (activeBus && activeBus.alightingStop && activeBus.alightingStop.lat) {
    const el = document.createElement('div');
    el.className = 'custom-pin bus-stop';
    el.title = `落車站點：${activeBus.alightingStop.name}`;
    el.textContent = '落';
    state.markers.alight = new maplibregl.Marker({ element: el })
      .setLngLat([activeBus.alightingStop.lon, activeBus.alightingStop.lat])
      .addTo(state.map);
  }
}

/**
 * Fit Map Bounds to Route
 */
function fitMapBounds() {
  if (!state.map) return;

  const bounds = new maplibregl.LngLatBounds();

  if (state.origin && state.origin.lat) {
    bounds.extend([state.origin.lon, state.origin.lat]);
  }
  if (state.destination && state.destination.lat) {
    bounds.extend([state.destination.lon, state.destination.lat]);
  }

  const walk = state.walkingResult;
  if (walk && walk.ok && walk.geometry && walk.geometry.coordinates) {
    for (const pt of walk.geometry.coordinates) {
      bounds.extend(pt);
    }
  }

  if (!bounds.isEmpty()) {
    try {
      state.map.fitBounds(bounds, {
        padding: { top: 35, bottom: 35, left: 35, right: 35 },
        maxZoom: 15.5
      });
    } catch (e) {}
  }
}

/**
 * Status Banner Helper
 */
function showStatus(show, msg = '', isError = false) {
  const banner = document.getElementById('status-banner');
  const msgEl = document.getElementById('status-message');
  if (!banner || !msgEl) return;

  if (show) {
    banner.style.display = 'flex';
    banner.className = `state-banner ${isError ? 'error' : 'loading'}`;
    msgEl.textContent = msg;
    const spinner = banner.querySelector('.spinner');
    if (spinner) spinner.style.display = isError ? 'none' : 'inline-block';
  } else {
    banner.style.display = 'none';
  }
}
