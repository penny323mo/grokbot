/**
 * 斜路 (Ce Lou) - Macau Slope-Aware Walking Decision Tool
 * Main Application Controller
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
import { fetchRainHint } from './weather.js';
import { renderElevationProfile } from './profile.js';

// Application State
const state = {
  origin: { ...DEFAULT_ORIGIN },
  destination: { ...DEFAULT_DESTINATION },
  currentRoutePlan: null,
  selectedIndex: 0,
  rainHint: null,
  map: null,
  mapLoaded: false,
  markers: {
    origin: null,
    dest: null
  }
};

// Check WebGL support (MapLibre 4.x trap: do not call supported method directly)
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
 * Initialize on DOM Load
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

    // 2. Perform Initial Route Computation (Senado -> Guia)
    await planTrip();
  } catch (err) {
    showStatus(true, `載入資料失敗：${err.message}`, true);
  }
});

/**
 * Setup UI Elements and Event Handlers
 */
function setupUIElements() {
  const originInput = document.getElementById('input-origin');
  const destInput = document.getElementById('input-destination');
  const swapBtn = document.getElementById('btn-swap');
  const locateBtn = document.getElementById('btn-locate');
  const clearDestBtn = document.getElementById('btn-clear-dest');
  const quickChipsContainer = document.getElementById('quick-chips');
  const datalist = document.getElementById('macau-curated-list');

  originInput.value = state.origin.name;
  destInput.value = state.destination.name;

  // Populate Datalist
  if (datalist) {
    datalist.innerHTML = '';
    for (const place of CURATED_PLACES) {
      const opt = document.createElement('option');
      opt.value = place.name;
      datalist.appendChild(opt);
    }
  }

  // Clear Destination Button
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

  // Render Curated Place Chips
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
      originHint.textContent = state.origin.name === DEFAULT_ORIGIN.name
        ? '而家用議事亭前地做起點（未開定位）'
        : `已設定出發點為「${state.origin.name}」`;
    }

    if (clearDestBtn) {
      clearDestBtn.style.display = destInput.value ? 'inline-flex' : 'none';
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

  // Input Enter and Change Handlers
  destInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      matchAndSetPlace(destInput.value.trim(), false);
    }
  });
  destInput.addEventListener('change', () => {
    matchAndSetPlace(destInput.value.trim(), false);
  });

  originInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      matchAndSetPlace(originInput.value.trim(), true);
    }
  });
  originInput.addEventListener('change', () => {
    matchAndSetPlace(originInput.value.trim(), true);
  });

  // Fit Map Button
  const fitBtn = document.getElementById('btn-fit-map');
  if (fitBtn) {
    fitBtn.addEventListener('click', fitMapBounds);
  }
}

function matchAndSetPlace(query, isOrigin) {
  if (!query) return;

  // 1. Try matching curated place by name or code
  const match = CURATED_PLACES.find(
    (p) => p.name.includes(query) || (p.code && p.code.includes(query))
  );

  if (match) {
    if (isOrigin) {
      state.origin = { ...match };
      document.getElementById('input-origin').value = match.name;
      const originHint = document.getElementById('origin-hint');
      if (originHint) {
        originHint.textContent = match.name === DEFAULT_ORIGIN.name
          ? '而家用議事亭前地做起點（未開定位）'
          : `已設定出發點為「${match.name}」`;
      }
    } else {
      setDestination(match);
    }
    planTrip();
    return;
  }

  // 2. Try parsing direct latitude, longitude input (e.g. "22.1938, 113.5400")
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
        const originHint = document.getElementById('origin-hint');
        if (originHint) {
          originHint.textContent = `已設定自訂出發點 (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        }
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

function setDestination(place) {
  state.destination = { ...place };
  const destInput = document.getElementById('input-destination');
  if (destInput) destInput.value = place.name;
  const clearBtn = document.getElementById('btn-clear-dest');
  if (clearBtn) clearBtn.style.display = place.name ? 'inline-flex' : 'none';
  planTrip();
}

/**
 * Initialize 2D MapLibre Map
 */
function initMap() {
  const container = document.getElementById('map-canvas');
  if (!isWebGLAvailable()) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#7C7368;font-size:0.84rem;padding:16px;text-align:center;">瀏覽器未支援 WebGL 底圖，但不影響步道爬升與剖面分析。</div>';
    return;
  }

  try {
    state.map = new maplibregl.Map({
      container: 'map-canvas',
      style: 'data/style.json',
      center: [113.5448, 22.1951],
      zoom: 13.8,
      attributionControl: false
    });

    // Guard expected missing tile errors at edge of Macau bbox per SPEC line 146
    state.map.on('error', (e) => {
      if (e && e.error && (e.error.status === 404 || (e.error.message && e.error.message.includes('404')))) {
        // Quietly absorb edge tile 404s
        return;
      }
    });

    state.map.on('load', () => {
      state.mapLoaded = true;

      // Add Source for Walking Line
      state.map.addSource('walk-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add Layer for Walking Line
      state.map.addLayer({
        id: 'walk-line-layer',
        type: 'line',
        source: 'walk-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#B44A2A',
          'line-width': 5,
          'line-opacity': 0.9
        }
      });

      // Click on map to set destination
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
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#7C7368;font-size:0.84rem;padding:16px;text-align:center;">地圖未能載入，但不影響步道爬升與剖面分析。</div>';
  }
}

/**
 * Plan Trip: Fetch Valhalla Routes and render hero, profile, map
 */
async function planTrip() {
  if (!state.origin || !state.destination) return;

  showStatus(true, '計算步道坡度與高度剖面中...');

  try {
    const plan = await fetchSlopeWalkingRoutes(state.origin, state.destination);
    state.currentRoutePlan = plan;
    state.selectedIndex = 0;

    renderRouteHero();
    updateMapFeatures();
    updateFooterMeta();

    showStatus(false);
  } catch (err) {
    showStatus(true, `計算路線時發生問題：${err.message}`, true);
  }
}

/**
 * Render Typographic Hero and Options Switcher
 */
function renderRouteHero() {
  const plan = state.currentRoutePlan;
  const tabsContainer = document.getElementById('options-tabs-container');
  const singleNoteEl = document.getElementById('single-path-note');
  const heroClimb = document.getElementById('hero-climb');
  const heroMinutes = document.getElementById('hero-minutes');
  const statDist = document.getElementById('stat-dist');
  const statDescent = document.getElementById('stat-descent');
  const statStairs = document.getElementById('stat-stairs');
  const statElevRange = document.getElementById('stat-elev-range');
  const profileContainer = document.getElementById('profile-container');

  if (!plan || !plan.ok || plan.options.length === 0) {
    tabsContainer.style.display = 'none';
    singleNoteEl.style.display = 'none';
    heroClimb.innerHTML = '暫未能計算';
    heroMinutes.textContent = '--';
    statDist.textContent = '--';
    statDescent.textContent = '-- 米';
    statStairs.textContent = '-- 處樓梯';
    statElevRange.textContent = '--m → --m';
    renderElevationProfile(profileContainer, null);
    renderSummaryCallout(null);
    return;
  }

  // Handle options switcher if alternative exists
  if (plan.hasAlternative && plan.options.length > 1) {
    singleNoteEl.style.display = 'none';
    tabsContainer.style.display = 'flex';
    tabsContainer.innerHTML = '';

    plan.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `option-tab-btn ${idx === state.selectedIndex ? 'active' : ''} ${opt.tagClass || ''}`;
      btn.innerHTML = `
        <span class="tab-tag">${opt.tag || (idx === 0 ? '較平' : '較短')}</span>
        <span class="tab-sub">爬升 ${formatElevation(opt.climbMeters)} · ${opt.durationMinutes}分鐘</span>
      `;
      btn.addEventListener('click', () => {
        state.selectedIndex = idx;
        renderRouteHero();
        updateMapFeatures();
      });
      tabsContainer.appendChild(btn);
    });
  } else {
    tabsContainer.style.display = 'none';
    singleNoteEl.style.display = 'block';
    singleNoteEl.textContent = plan.singlePathNote || '去呢度主要得呢條行人路';
  }

  const activeRoute = plan.options[state.selectedIndex] || plan.options[0];

  // Set Hero Numbers
  const isGentler = activeRoute.tagClass === 'gentler';
  heroClimb.className = `metric-climb num ${isGentler ? 'gentler' : ''}`;
  heroClimb.innerHTML = `爬升 ${formatElevation(activeRoute.climbMeters)}`;
  heroMinutes.textContent = activeRoute.durationMinutes;

  // Set Secondary Stats
  statDist.textContent = formatDistance(activeRoute.distanceMeters);
  statDescent.textContent = `${formatElevation(activeRoute.descentMeters)}`;
  statStairs.textContent = activeRoute.stairsCount > 0 ? `${activeRoute.stairsCount} 處樓梯` : '無梯級路段';
  statElevRange.textContent = `${Math.round(activeRoute.startElevation)}m → ${Math.round(activeRoute.endElevation)}m`;

  // Render SVG Elevation Profile
  renderElevationProfile(profileContainer, activeRoute, {
    strokeColor: isGentler ? '#2F5E49' : '#B44A2A'
  });

  // Render Callout
  renderSummaryCallout(activeRoute);
}

/**
 * Render Authentic Cantonese Summary Callout
 */
function renderSummaryCallout(route) {
  const titleEl = document.getElementById('callout-title');
  const textEl = document.getElementById('callout-text');

  if (!route || !route.ok) {
    titleEl.textContent = '未能計算路線';
    textEl.textContent = '暫未能由步行導航計算路徑，請嘗試更換地點。';
    return;
  }

  const mins = route.durationMinutes;
  const climb = route.climbMeters;
  const dist = formatDistance(route.distanceMeters);
  const stairs = route.stairsCount;
  const rain = state.rainHint;

  let rainSentence = '';
  if (rain && rain.hasRain && rain.isRaining) {
    rainSentence = '而家落緊雨，斜路梯級會濕滑。';
  } else if (rain && rain.hasRain && rain.message) {
    rainSentence = `${rain.message}。`;
  }

  let stairsDesc = '';
  if (stairs > 0) {
    stairsDesc = `途中有 ${stairs} 處樓梯；`;
  } else {
    stairsDesc = '沿途無階梯路段；';
  }

  titleEl.textContent = climb > 60 ? '上斜坡度較大 📈' : '步道坡度平緩 🚶';
  textEl.textContent = `大約要行 ${mins} 分鐘（${dist}），爬升約 ${climb} 米，${stairsDesc} ${rainSentence}`;
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
 * Update Map GeoJSON Line and Markers
 */
function updateMapFeatures() {
  if (!state.map || !state.mapLoaded) return;

  const plan = state.currentRoutePlan;
  const activeRoute = plan && plan.options ? (plan.options[state.selectedIndex] || plan.options[0]) : null;

  // Update Route Line
  const source = state.map.getSource('walk-route');
  if (source) {
    if (activeRoute && activeRoute.geometry && activeRoute.geometry.coordinates && activeRoute.geometry.coordinates.length > 0) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: activeRoute.geometry,
            properties: {}
          }
        ]
      });

      // Update line color based on tag
      const isGentler = activeRoute.tagClass === 'gentler';
      state.map.setPaintProperty('walk-line-layer', 'line-color', isGentler ? '#2F5E49' : '#B44A2A');
      const legendInd = document.getElementById('legend-line-indicator');
      if (legendInd) {
        legendInd.className = `legend-line ${isGentler ? 'gentler' : 'climb'}`;
      }
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  // Update Markers
  updateMarkers();

  // Fit bounds
  fitMapBounds();
}

/**
 * Update Origin and Destination Markers
 */
function updateMarkers() {
  for (const k of Object.keys(state.markers)) {
    if (state.markers[k]) {
      state.markers[k].remove();
      state.markers[k] = null;
    }
  }

  if (state.origin && state.origin.lat && state.origin.lon) {
    const el = document.createElement('div');
    el.className = 'custom-pin origin';
    el.textContent = '起';
    el.title = `起點：${state.origin.name}`;
    state.markers.origin = new maplibregl.Marker({ element: el })
      .setLngLat([state.origin.lon, state.origin.lat])
      .addTo(state.map);
  }

  if (state.destination && state.destination.lat && state.destination.lon) {
    const el = document.createElement('div');
    el.className = 'custom-pin dest';
    el.textContent = '訖';
    el.title = `目的地：${state.destination.name}`;
    state.markers.dest = new maplibregl.Marker({ element: el })
      .setLngLat([state.destination.lon, state.destination.lat])
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

  const plan = state.currentRoutePlan;
  const activeRoute = plan && plan.options ? (plan.options[state.selectedIndex] || plan.options[0]) : null;
  if (activeRoute && activeRoute.geometry && activeRoute.geometry.coordinates) {
    for (const pt of activeRoute.geometry.coordinates) {
      bounds.extend(pt);
    }
  }

  if (!bounds.isEmpty()) {
    try {
      state.map.fitBounds(bounds, {
        padding: { top: 30, bottom: 30, left: 30, right: 30 },
        maxZoom: 15.5
      });
    } catch (e) {}
  }
}

/**
 * Update Footer Attribution Meta
 */
function updateFooterMeta() {
  const el = document.getElementById('footer-router-meta');
  if (!el) return;

  const plan = state.currentRoutePlan;
  const activeRoute = plan && plan.options ? (plan.options[state.selectedIndex] || plan.options[0]) : null;

  if (activeRoute && activeRoute.ok) {
    const timeStr = formatMacauTime(activeRoute.fetchedAt || new Date(), 'time');
    const isStale = activeRoute.fetchedAt && (Date.now() - activeRoute.fetchedAt > 24 * 3600 * 1000);
    const staleNotice = isStale ? ' · 資料可能已過期' : '';
    el.textContent = `步道與高度剖面：${activeRoute.sourceName}（時速約 ${activeRoute.speedKmh} km/h · ${timeStr} 計算${staleNotice}）`;
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
