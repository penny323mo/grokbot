/**
 * 出門 (Cheut Mun) - Macau Unified Going-Out Decision Tool
 * Main Application Controller: Editorial broadsheet comparing 行路 / 巴士 / 泊車再行
 */

import {
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
  CURATED_PLACES,
  formatMinutes,
  formatDistance,
  formatElevation,
  formatMacauTime,
  evaluateCoordinate
} from './utils.js';

import { fetchSlopeWalkingRoutes } from './router.js';
import { loadBusData, searchBusRoutes, fetchLiveBusPositions } from './bus.js';
import { loadCarParks, planParkThenWalk } from './parking.js';
import { fetchRainHint } from './weather.js';
import { renderElevationProfile } from './profile.js';

// Application State
const state = {
  origin: { ...DEFAULT_ORIGIN },
  destination: { ...DEFAULT_DESTINATION },
  activeMode: 'walk', // 'walk' | 'bus' | 'parking'
  walkPlan: null,
  walkIndex: 0,
  busPlan: null,
  busIndex: 0,
  parkingPlan: null,
  parkingIndex: 0,
  rainHint: null,
  liveBusInfo: null,
  map: null,
  mapLoaded: false,
  markers: {
    origin: null,
    dest: null,
    aux: []
  }
};

// Check WebGL support (MapLibre 4.x trap: avoid calling vendor supported helper directly)
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
 * Initialize on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupUI();
  initMap();

  try {
    // 1. Fetch Rain Hint in background
    fetchRainHint(state.origin.lat, state.origin.lon).then((hint) => {
      state.rainHint = hint;
      renderRainHint(hint);
      updateDecisionSentence();
    }).catch(() => {});

    // 2. Compute Unified Trip Plan (Walk, Bus, Park-then-walk)
    await planTrip();
  } catch (err) {
    showStatus(true, `載入資料失敗：${err.message}`, true);
  }
});

/**
 * Setup UI Elements and Event Handlers
 */
function setupUI() {
  const originInput = document.getElementById('input-origin');
  const destInput = document.getElementById('input-destination');
  const swapBtn = document.getElementById('btn-swap');
  const locateBtn = document.getElementById('btn-locate');
  const chipsScroll = document.getElementById('quick-chips');
  const datalist = document.getElementById('macau-curated-list');

  originInput.value = state.origin.name;
  destInput.value = state.destination.name;

  // Datalist options
  if (datalist) {
    datalist.innerHTML = '';
    for (const p of CURATED_PLACES) {
      const opt = document.createElement('option');
      opt.value = p.name;
      datalist.appendChild(opt);
    }
  }

  // Curated place chips
  if (chipsScroll) {
    chipsScroll.innerHTML = '';
    for (const p of CURATED_PLACES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-btn';
      btn.textContent = p.name;
      btn.addEventListener('click', () => {
        setDestination(p);
      });
      chipsScroll.appendChild(btn);
    }
  }

  // Swap button
  swapBtn.addEventListener('click', () => {
    const temp = { ...state.origin };
    state.origin = { ...state.destination };
    state.destination = temp;

    originInput.value = state.origin.name;
    destInput.value = state.destination.name;

    const originHint = document.getElementById('origin-hint');
    if (originHint) {
      originHint.textContent = state.origin.name === DEFAULT_ORIGIN.name
        ? '而家用議事亭前地做起點（未開定位）'
        : `已設定出發點為「${state.origin.name}」`;
    }
    planTrip();
  });

  // Geolocation
  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showStatus(true, '你的瀏覽器未支援定位功能', true);
      setTimeout(() => showStatus(false), 2500);
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
          showStatus(true, '你現時位置不在澳門範圍內，已保留原先起點', true);
          setTimeout(() => showStatus(false), 2500);
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
      () => {
        locateBtn.disabled = false;
        showStatus(false);
        const originHint = document.getElementById('origin-hint');
        if (originHint) originHint.textContent = '而家用議事亭前地做起點（未開定位）';
        showStatus(true, '未能讀取現時定位，已保留議事亭前地起點', true);
        setTimeout(() => showStatus(false), 2500);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });

  // Mode Selection Tabs (行路, 巴士, 泊車再行)
  const tabWalk = document.getElementById('tab-mode-walk');
  const tabBus = document.getElementById('tab-mode-bus');
  const tabPark = document.getElementById('tab-mode-park');

  tabWalk.addEventListener('click', () => selectMode('walk'));
  tabBus.addEventListener('click', () => selectMode('bus'));
  tabPark.addEventListener('click', () => selectMode('parking'));

  // Inputs change handlers
  destInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') matchAndSetPlace(destInput.value.trim(), false);
  });
  destInput.addEventListener('change', () => {
    matchAndSetPlace(destInput.value.trim(), false);
  });

  originInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') matchAndSetPlace(originInput.value.trim(), true);
  });
  originInput.addEventListener('change', () => {
    matchAndSetPlace(originInput.value.trim(), true);
  });

  const fitBtn = document.getElementById('btn-fit-map');
  if (fitBtn) fitBtn.addEventListener('click', fitMapBounds);
}

function selectMode(mode) {
  state.activeMode = mode;
  document.getElementById('tab-mode-walk').classList.toggle('active', mode === 'walk');
  document.getElementById('tab-mode-bus').classList.toggle('active', mode === 'bus');
  document.getElementById('tab-mode-park').classList.toggle('active', mode === 'parking');

  document.getElementById('mode-pane-walk').style.display = mode === 'walk' ? 'block' : 'none';
  document.getElementById('mode-pane-bus').style.display = mode === 'bus' ? 'block' : 'none';
  document.getElementById('mode-pane-park').style.display = mode === 'parking' ? 'block' : 'none';

  updateMapFeatures();
}

function setDestination(place) {
  state.destination = { ...place };
  const destInput = document.getElementById('input-destination');
  if (destInput) destInput.value = place.name;
  planTrip();
}

function matchAndSetPlace(query, isOrigin) {
  if (!query) return;

  const match = CURATED_PLACES.find(
    (p) => p.name.includes(query) || (p.code && p.code.includes(query))
  );

  if (match) {
    if (isOrigin) {
      state.origin = { ...match };
      document.getElementById('input-origin').value = match.name;
    } else {
      setDestination(match);
    }
    planTrip();
    return;
  }

  // Parse raw coordinate lat, lon
  const coordMatch = query.match(/^(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    const coordEval = evaluateCoordinate(lat, lon);
    if (coordEval.isValid) {
      const customPlace = {
        lat,
        lon,
        name: `座標 (${lat.toFixed(4)}, ${lon.toFixed(4)})`
      };
      if (isOrigin) {
        state.origin = customPlace;
        document.getElementById('input-origin').value = customPlace.name;
      } else {
        setDestination(customPlace);
      }
      planTrip();
      return;
    }
  }

  showStatus(true, `未能在熱門地點中找到「${query}」，請由列表或地圖點選`, true);
  setTimeout(() => showStatus(false), 2500);
}

/**
 * Initialize 2D MapLibre Map
 */
function initMap() {
  const container = document.getElementById('map-canvas');
  if (!isWebGLAvailable()) {
    container.innerHTML = '<div class="map-fallback-msg">瀏覽器未支援 WebGL 底圖，但不影響出行方案與剖面分析。</div>';
    return;
  }

  try {
    state.map = new maplibregl.Map({
      container: 'map-canvas',
      style: 'data/style.json',
      center: [113.5448, 22.1951],
      zoom: 13.5,
      attributionControl: false
    });

    state.map.on('error', (e) => {
      // Guard expected missing tile errors at edge of Macau bbox per SPEC line 146
      if (e && e.error && (e.error.status === 404 || (e.error.message && e.error.message.includes('404')))) {
        return;
      }
    });

    state.map.on('load', () => {
      state.mapLoaded = true;

      state.map.addSource('route-line', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      state.map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2143A8',
          'line-width': 5,
          'line-opacity': 0.92
        }
      });

      state.map.on('click', (e) => {
        const lat = e.lngLat.lat;
        const lon = e.lngLat.lng;
        const coordEval = evaluateCoordinate(lat, lon);
        if (!coordEval.isValid) {
          showStatus(true, '點選位置不在澳門範圍內', true);
          setTimeout(() => showStatus(false), 2000);
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
    container.innerHTML = '<div class="map-fallback-msg">地圖未能載入，但不影響出行方案與剖面分析。</div>';
  }
}

/**
 * Plan Trip: Jointly evaluate Walk, Bus, and Park-then-walk
 */
async function planTrip() {
  if (!state.origin || !state.destination) return;

  showStatus(true, '計算出行方案（行路、巴士、泊車再行）中...');

  try {
    // 1. Walking Route Plan
    const walkPromise = fetchSlopeWalkingRoutes(state.origin, state.destination);

    // 2. Bus Plan
    const busPromise = (async () => {
      const busData = await loadBusData();
      if (!busData || !busData.routes) return null;
      return searchBusRoutes(state.origin, state.destination, busData.routes, busData.stops);
    })();

    // 3. Park-then-walk Plan
    const parkPromise = (async () => {
      const parks = await loadCarParks();
      if (!parks || parks.length === 0) return null;
      return planParkThenWalk(state.destination, parks, fetchSlopeWalkingRoutes);
    })();

    const [walkPlan, busPlan, parkPlan] = await Promise.all([
      walkPromise,
      busPromise,
      parkPromise
    ]);

    state.walkPlan = walkPlan;
    state.walkIndex = 0;
    state.busPlan = busPlan;
    state.busIndex = 0;
    state.parkingPlan = parkPlan;
    state.parkingIndex = 0;

    renderDecisionOverview();
    renderWalkOption();
    renderBusOption();
    renderParkingOption();
    updateMapFeatures();
    updateFooterMeta();

    showStatus(false);
  } catch (err) {
    showStatus(true, `計算路線時發生問題：${err.message}`, true);
  }
}

/**
 * Render Editorial Serif Decision Sentence
 */
function renderDecisionOverview() {
  updateDecisionSentence();
}

function updateDecisionSentence() {
  const sentenceEl = document.getElementById('editorial-decision-sentence');
  if (!sentenceEl) return;

  const walk = state.walkPlan && state.walkPlan.ok ? state.walkPlan.primary : null;
  const bus = state.busPlan && state.busPlan.direct && state.busPlan.direct.length > 0 ? state.busPlan.direct[0] : null;
  const rain = state.rainHint;

  let parts = [];

  // 1. Walk part
  if (walk) {
    const mins = walk.durationMinutes;
    const climb = walk.climbMeters;
    parts.push(`行路大約 ${mins} 分鐘，爬升約 ${climb} 米。`);
  } else {
    parts.push('步行路線暫未能計算。');
  }

  // 2. Bus part
  if (bus) {
    if (bus.isDirect) {
      parts.push(`巴士可坐 ${bus.routeName}，喺${bus.alightingStop.name}落；車程分鐘冇官方數字就唔寫。`);
    } else if (bus.isTransfer) {
      parts.push(`巴士可坐 ${bus.routeA}，喺${bus.transferStop.name}轉乘 ${bus.routeB}；車程分鐘冇官方數字就唔寫。`);
    }
  } else {
    parts.push('此路段暫無直達巴士。');
  }

  // 3. Parking part
  const park = state.parkingPlan && state.parkingPlan.parks && state.parkingPlan.parks.length > 0
    ? (state.parkingPlan.parks[state.parkingIndex] || state.parkingPlan.selectedPark)
    : null;
  if (park) {
    parts.push(`泊車可泊「${park.name}」，再行約 ${park.walkMinutes} 分鐘。`);
  }

  // 4. Rain part
  if (rain && rain.hasRain && rain.isRaining) {
    parts.push('而家落緊雨，行路會濕。');
  } else if (rain && rain.hasRain && rain.message) {
    parts.push(`${rain.message}。`);
  }

  sentenceEl.textContent = parts.join(' ');
}

/**
 * Render Walk Option Card
 */
function renderWalkOption() {
  const plan = state.walkPlan;
  const summaryEl = document.getElementById('walk-summary-text');
  const altsContainer = document.getElementById('walk-alts-container');
  const profileContainer = document.getElementById('profile-container');
  const statsWrap = document.getElementById('walk-stats-strip');

  if (!plan || !plan.ok || plan.options.length === 0) {
    summaryEl.innerHTML = '<span class="status-unavailable">暫時未能計算步行路線</span>';
    altsContainer.style.display = 'none';
    statsWrap.style.display = 'none';
    renderElevationProfile(profileContainer, null);
    return;
  }

  statsWrap.style.display = 'flex';
  const activeRoute = plan.options[state.walkIndex] || plan.options[0];

  // Flatter vs Shorter alternatives
  if (plan.hasAlternative && plan.options.length > 1) {
    altsContainer.style.display = 'flex';
    altsContainer.innerHTML = '';
    plan.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `alt-tab-btn ${idx === state.walkIndex ? 'active' : ''}`;
      btn.innerHTML = `
        <strong>${opt.tag || (idx === 0 ? '較平' : '較短')}</strong>
        <span>${opt.durationMinutes}分鐘 · 爬升${formatElevation(opt.climbMeters)}</span>
      `;
      btn.addEventListener('click', () => {
        state.walkIndex = idx;
        renderWalkOption();
        updateMapFeatures();
      });
      altsContainer.appendChild(btn);
    });
  } else {
    altsContainer.style.display = 'none';
  }

  summaryEl.innerHTML = `
    <span class="mode-hero-num">${activeRoute.durationMinutes}</span>
    <span class="mode-hero-unit">分鐘</span>
    <span class="mode-hero-sub">· 距離 ${formatDistance(activeRoute.distanceMeters)} · 爬升 ${formatElevation(activeRoute.climbMeters)}</span>
  `;

  document.getElementById('stat-walk-dist').textContent = formatDistance(activeRoute.distanceMeters);
  document.getElementById('stat-walk-climb').textContent = formatElevation(activeRoute.climbMeters);
  document.getElementById('stat-walk-descent').textContent = formatElevation(activeRoute.descentMeters);
  document.getElementById('stat-walk-stairs').textContent = activeRoute.stairsCount > 0 ? `${activeRoute.stairsCount} 處樓梯` : '無梯級路段';

  renderElevationProfile(profileContainer, activeRoute);
}

/**
 * Render Bus Option Card
 */
function renderBusOption() {
  const plan = state.busPlan;
  const contentEl = document.getElementById('bus-option-content');
  if (!contentEl) return;

  const hasDirect = plan && plan.direct && plan.direct.length > 0;
  const hasTransfers = plan && plan.transfers && plan.transfers.length > 0;

  if (!hasDirect && !hasTransfers) {
    contentEl.innerHTML = `
      <div class="option-empty-state">
        <span>此區間未找到直達或一次轉乘巴士路線</span>
        <span class="subtext">直線距離只用嚟揀站、唔係行路時間</span>
      </div>
    `;
    return;
  }

  const busList = hasDirect ? plan.direct : plan.transfers;
  const selectedBus = busList[state.busIndex] || busList[0];

  // Try live bus positions for direct routes
  if (selectedBus.isDirect) {
    fetchLiveBusPositions(selectedBus.routeName, selectedBus.dir).then((liveRes) => {
      state.liveBusInfo = liveRes;
      const liveEl = document.getElementById('bus-live-indicator');
      if (liveEl) {
        liveEl.textContent = liveRes.message;
      }
    }).catch(() => {});
  }

  let routeBadges = busList.slice(0, 5).map((b, idx) => `
    <button type="button" class="bus-route-pill ${idx === state.busIndex ? 'active' : ''}" data-idx="${idx}">
      ${b.routeName}
    </button>
  `).join('');

  if (selectedBus.isDirect) {
    contentEl.innerHTML = `
      <div class="bus-selector-row">
        <span class="selector-label">可搭路線：</span>
        <div class="bus-pills-list">${routeBadges}</div>
      </div>

      <div class="bus-detail-body">
        <div class="bus-leg-item">
          <div class="leg-marker board"></div>
          <div class="leg-info">
            <div class="leg-title">上車站：<strong>${selectedBus.boardingStop.name}</strong>${selectedBus.boardingStop.hasMetro ? '<span class="lrt-chip">此站可轉輕軌</span>' : ''}</div>
            <div class="leg-sub">由起點步行約 ${selectedBus.boardingStop.accessDistanceM} 米（直線標示）</div>
          </div>
        </div>

        <div class="bus-transit-strip">
          <span class="strip-line"></span>
          <span class="strip-text">搭 ${selectedBus.stopsCount} 個站（車程分鐘無官方數字不作猜測）</span>
        </div>

        <div class="bus-leg-item">
          <div class="leg-marker alight"></div>
          <div class="leg-info">
            <div class="leg-title">下車站：<strong>${selectedBus.alightingStop.name}</strong>${selectedBus.alightingStop.hasMetro ? '<span class="lrt-chip">此站可轉輕軌</span>' : ''}</div>
            <div class="leg-sub">步行約 ${selectedBus.alightingStop.egressDistanceM} 米至目的地（直線標示）</div>
          </div>
        </div>

        <div class="bus-live-strip">
          <span class="live-dot"></span>
          <span id="bus-live-indicator">讀取即時車輛位置中...</span>
        </div>
      </div>
    `;
  } else {
    // 1-transfer itinerary
    contentEl.innerHTML = `
      <div class="bus-selector-row">
        <span class="selector-label">轉乘方案：</span>
        <div class="bus-pills-list">${routeBadges}</div>
      </div>

      <div class="bus-detail-body">
        <div class="bus-leg-item">
          <div class="leg-marker board"></div>
          <div class="leg-info">
            <div class="leg-title">起步搭 <strong>${selectedBus.routeA}</strong> 號線</div>
            <div class="leg-sub">上車站：${selectedBus.boardingStop.name}（距起點約 ${selectedBus.boardingStop.accessDistanceM} 米）</div>
          </div>
        </div>

        <div class="bus-transit-strip">
          <span class="strip-line"></span>
          <span class="strip-text">至「${selectedBus.transferStop.name}」轉車</span>
        </div>

        <div class="bus-leg-item">
          <div class="leg-marker alight"></div>
          <div class="leg-info">
            <div class="leg-title">轉乘 <strong>${selectedBus.routeB}</strong> 號線</div>
            <div class="leg-sub">下車站：${selectedBus.alightingStop.name}（距終點約 ${selectedBus.alightingStop.egressDistanceM} 米）</div>
          </div>
        </div>
      </div>
    `;
  }

  contentEl.querySelectorAll('.bus-route-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      state.busIndex = parseInt(btn.dataset.idx, 10);
      renderBusOption();
      updateMapFeatures();
      updateDecisionSentence();
    });
  });
}

/**
 * Render Parking Option Card
 */
function renderParkingOption() {
  const plan = state.parkingPlan;
  const contentEl = document.getElementById('parking-option-content');
  if (!contentEl) return;

  if (!plan || !plan.ok || !plan.parks || plan.parks.length === 0) {
    contentEl.innerHTML = `
      <div class="option-empty-state">
        <span>${plan && plan.message ? plan.message : '目的地周邊暫未找到合適停車場'}</span>
        <span class="subtext">${plan && plan.vacancyDisclaimer ? plan.vacancyDisclaimer : '澳門即時車位（交通事務局）暫時未能喺無密鑰情況下讀到'}</span>
      </div>
    `;
    return;
  }

  const selectedPark = plan.parks[state.parkingIndex] || plan.parks[0];

  const parkItems = plan.parks.map((p, idx) => `
    <div class="park-candidate-item ${idx === state.parkingIndex ? 'active' : ''}" data-idx="${idx}">
      <div class="park-name-row">
        <strong>${p.name}</strong>
        <span class="park-walk-badge">行 ${p.walkMinutes} 分鐘至目的地</span>
      </div>
      <div class="park-sub-row">
        <span>步程 ${formatDistance(p.walkDistanceM)} · 爬升 ${formatElevation(p.climbMeters)}</span>
        <span>${p.stairsCount > 0 ? p.stairsCount + '處樓梯' : '無梯級'}</span>
      </div>
    </div>
  `).join('');

  contentEl.innerHTML = `
    <div class="parking-list-header">
      <span>泊車後步行至目的地（按步行時間排序）：</span>
    </div>
    <div class="parking-list">${parkItems}</div>
    <div class="parking-vacancy-note">
      <span class="note-icon">ℹ</span>
      <span>${plan.vacancyDisclaimer}</span>
    </div>
  `;

  contentEl.querySelectorAll('.park-candidate-item').forEach(el => {
    el.addEventListener('click', () => {
      state.parkingIndex = parseInt(el.dataset.idx, 10);
      renderParkingOption();
      updateMapFeatures();
    });
  });
}

/**
 * Render Rain Hint Chip
 */
function renderRainHint(hint) {
  const container = document.getElementById('rain-chip-container');
  const textEl = document.getElementById('rain-chip-text');

  if (!hint || !hint.hasRain || !hint.message) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const modelTimeStr = hint.modelTimeStr || formatMacauTime(new Date(), 'time');
  textEl.innerHTML = `${hint.message} <span style="font-size:0.75rem;font-weight:400;opacity:0.85;">（Open-Meteo 數值模式預測 · ${modelTimeStr} 預測）</span>`;
}

/**
 * Update Map GeoJSON Features and Custom Markers
 */
function updateMapFeatures() {
  if (!state.map || !state.mapLoaded) return;

  const source = state.map.getSource('route-line');
  if (!source) return;

  let activeGeometry = null;

  if (state.activeMode === 'walk') {
    const walk = state.walkPlan && state.walkPlan.ok ? (state.walkPlan.options[state.walkIndex] || state.walkPlan.primary) : null;
    if (walk && walk.geometry) activeGeometry = walk.geometry;
  } else if (state.activeMode === 'bus') {
    const bus = state.busPlan && state.busPlan.direct ? (state.busPlan.direct[state.busIndex] || state.busPlan.direct[0]) : null;
    if (bus && bus.geometry) activeGeometry = bus.geometry;
  } else if (state.activeMode === 'parking') {
    const park = state.parkingPlan && state.parkingPlan.parks ? (state.parkingPlan.parks[state.parkingIndex] || state.parkingPlan.selectedPark) : null;
    if (park && park.geometry) activeGeometry = park.geometry;
  }

  if (activeGeometry && activeGeometry.coordinates && activeGeometry.coordinates.length > 0) {
    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: activeGeometry,
        properties: {}
      }]
    });
  } else {
    source.setData({ type: 'FeatureCollection', features: [] });
  }

  updateMarkers();
  fitMapBounds();
}

/**
 * Update Pins
 */
function updateMarkers() {
  if (state.markers.origin) {
    state.markers.origin.remove();
    state.markers.origin = null;
  }
  if (state.markers.dest) {
    state.markers.dest.remove();
    state.markers.dest = null;
  }
  if (Array.isArray(state.markers.aux)) {
    state.markers.aux.forEach(m => m.remove());
    state.markers.aux = [];
  }

  if (state.origin && state.origin.lat && state.origin.lon) {
    const el = document.createElement('div');
    el.className = 'cm-pin origin';
    el.textContent = '起';
    state.markers.origin = new maplibregl.Marker({ element: el })
      .setLngLat([state.origin.lon, state.origin.lat])
      .addTo(state.map);
  }

  if (state.destination && state.destination.lat && state.destination.lon) {
    const el = document.createElement('div');
    el.className = 'cm-pin dest';
    el.textContent = '訖';
    state.markers.dest = new maplibregl.Marker({ element: el })
      .setLngLat([state.destination.lon, state.destination.lat])
      .addTo(state.map);
  }

  // If in bus mode, add boarding and alighting stop markers
  if (state.activeMode === 'bus' && state.busPlan && state.busPlan.direct) {
    const bus = state.busPlan.direct[state.busIndex] || state.busPlan.direct[0];
    if (bus && bus.boardingStop) {
      const elBoard = document.createElement('div');
      elBoard.className = 'cm-pin bus-board';
      elBoard.textContent = '上';
      elBoard.title = `上車站：${bus.boardingStop.name}`;
      const m1 = new maplibregl.Marker({ element: elBoard })
        .setLngLat([bus.boardingStop.lon, bus.boardingStop.lat])
        .addTo(state.map);
      state.markers.aux.push(m1);
    }
    if (bus && bus.alightingStop) {
      const elAlight = document.createElement('div');
      elAlight.className = 'cm-pin bus-alight';
      elAlight.textContent = '落';
      elAlight.title = `下車站：${bus.alightingStop.name}`;
      const m2 = new maplibregl.Marker({ element: elAlight })
        .setLngLat([bus.alightingStop.lon, bus.alightingStop.lat])
        .addTo(state.map);
      state.markers.aux.push(m2);
    }
  }

  // If in parking mode, add parking marker
  if (state.activeMode === 'parking' && state.parkingPlan && state.parkingPlan.parks) {
    const park = state.parkingPlan.parks[state.parkingIndex] || state.parkingPlan.selectedPark;
    if (park && park.lat && park.lon) {
      const el = document.createElement('div');
      el.className = 'cm-pin park';
      el.textContent = 'P';
      const m = new maplibregl.Marker({ element: el })
        .setLngLat([park.lon, park.lat])
        .addTo(state.map);
      state.markers.aux.push(m);
    }
  }
}

/**
 * Fit Map to Route / Coordinates
 */
function fitMapBounds() {
  if (!state.map) return;
  const bounds = new maplibregl.LngLatBounds();

  if (state.origin && state.origin.lat) bounds.extend([state.origin.lon, state.origin.lat]);
  if (state.destination && state.destination.lat) bounds.extend([state.destination.lon, state.destination.lat]);

  let activeGeometry = null;
  if (state.activeMode === 'walk' && state.walkPlan && state.walkPlan.ok) {
    activeGeometry = (state.walkPlan.options[state.walkIndex] || state.walkPlan.primary).geometry;
  } else if (state.activeMode === 'bus' && state.busPlan && state.busPlan.direct) {
    const bus = state.busPlan.direct[state.busIndex] || state.busPlan.direct[0];
    if (bus && bus.geometry) activeGeometry = bus.geometry;
  } else if (state.activeMode === 'parking' && state.parkingPlan && state.parkingPlan.parks) {
    const p = state.parkingPlan.parks[state.parkingIndex] || state.parkingPlan.selectedPark;
    if (p) activeGeometry = p.geometry;
  }

  if (activeGeometry && activeGeometry.coordinates) {
    for (const pt of activeGeometry.coordinates) {
      bounds.extend(pt);
    }
  }

  if (!bounds.isEmpty()) {
    try {
      state.map.fitBounds(bounds, {
        padding: { top: 32, bottom: 32, left: 32, right: 32 },
        maxZoom: 15.2
      });
    } catch (e) {}
  }
}

/**
 * Update Footer Metadata
 */
function updateFooterMeta() {
  const metaEl = document.getElementById('footer-meta-info');
  if (!metaEl) return;

  const nowStr = formatMacauTime(new Date(), 'time');
  metaEl.textContent = `路網計算時間：${nowStr} · 路線同站位：交通事務局公開巴士查詢（2026-11-16 下載；唔係即時到站）`;
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
    banner.className = `status-banner ${isError ? 'error' : 'loading'}`;
    msgEl.textContent = msg;
    const spinner = banner.querySelector('.spinner');
    if (spinner) spinner.style.display = isError ? 'none' : 'inline-block';
  } else {
    banner.style.display = 'none';
  }
}
