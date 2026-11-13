/**
 * 地勢 · Dei Sai — Main Application Logic
 */

import {
  DEFAULT_ORIGIN,
  MACAU_BBOX,
  MAP_MAX_BOUNDS,
  isInsideMacau,
  evaluateLocateCoordinate,
  formatElevationCopy,
  formatExaggerationLabel,
  formatMacauTime
} from './utils.js';
import { SHIPPED_LANDMARKS } from './landmarks-data.js';

// Application State
export const state = {
  is3D: true,
  exaggeration: 1.3,
  selectedLandmark: null,
  landmarks: [...SHIPPED_LANDMARKS],
  map: null,
  pinMarker: null,
  terrainAvailable: true,
  bannerTimer: null
};

// DOM Elements cache
export const el = {};

export function initDOM() {
  if (typeof document === 'undefined') return;
  el.map = document.getElementById('map');
  el.currentPlaceChip = document.getElementById('current-place-chip');
  el.btnCompass = document.getElementById('btn-compass');
  el.compassIcon = document.getElementById('compass-icon');
  el.btnLocate = document.getElementById('btn-locate');
  el.btnDimensionToggle = document.getElementById('btn-dimension-toggle');
  el.dimensionText = document.getElementById('dimension-text');
  el.searchInput = document.getElementById('search-input');
  el.btnSearchClear = document.getElementById('btn-search-clear');
  el.searchResults = document.getElementById('search-results');
  el.quickHillsRail = document.getElementById('quick-hills-rail');
  el.firstRunHint = document.getElementById('first-run-hint');
  el.btnHintClose = document.getElementById('btn-hint-close');
  el.bannerNotice = document.getElementById('banner-notice');
  el.bannerText = document.getElementById('banner-text');
  el.btnBannerClose = document.getElementById('btn-banner-close');
  el.chipExaggeration = document.getElementById('chip-exaggeration');
  el.btnOpenInfo = document.getElementById('btn-open-info');
  el.bottomSheet = document.getElementById('bottom-sheet');
  el.sheetTitle = document.getElementById('sheet-title');
  el.sheetSubtitle = document.getElementById('sheet-subtitle');
  el.sheetKind = document.getElementById('sheet-kind');
  el.sheetHeightVal = document.getElementById('sheet-height-val');
  el.sheetHeightUnit = document.getElementById('sheet-height-unit');
  el.sheetHeightSource = document.getElementById('sheet-height-source');
  el.sheetCoords = document.getElementById('sheet-coords');
  el.sheetArea = document.getElementById('sheet-area');
  el.btnCloseSheet = document.getElementById('btn-close-sheet');
  el.infoSheet = document.getElementById('info-sheet');
  el.btnCloseInfo = document.getElementById('btn-close-info');
  el.footerLoadTime = document.getElementById('footer-load-time');
}

// Helper: Determine motion preference
function shouldReduceMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Helper: Show banner notice
export function showBanner(text, autoDismissMs = 6000) {
  const banner = el.bannerNotice || (typeof document !== 'undefined' && document.getElementById('banner-notice'));
  const bannerText = el.bannerText || (typeof document !== 'undefined' && document.getElementById('banner-text'));
  if (!banner || !bannerText) return;

  bannerText.textContent = text;
  banner.classList.add('visible');

  if (autoDismissMs > 0) {
    clearTimeout(state.bannerTimer);
    state.bannerTimer = setTimeout(() => {
      hideBanner();
    }, autoDismissMs);
  }
}

export function hideBanner() {
  const banner = el.bannerNotice || (typeof document !== 'undefined' && document.getElementById('banner-notice'));
  if (banner) {
    banner.classList.remove('visible');
  }
}

// Helper: Dismiss first run hint
export function dismissHint() {
  const hint = el.firstRunHint || (typeof document !== 'undefined' && document.getElementById('first-run-hint'));
  if (hint) {
    hint.style.display = 'none';
  }
  try {
    sessionStorage.setItem('dei_sai_hint_dismissed', 'true');
  } catch (e) {}
}

// Helper: Determine general area from latitude
export function getAreaFromLat(lat) {
  if (lat >= 22.180) return '澳門半島';
  if (lat >= 22.140) return '氹仔 / 路氹';
  return '路環';
}

// Create custom DOM Pin for selected point
function createPinElement() {
  const pin = document.createElement('div');
  pin.className = 'dei-sai-pin';
  pin.innerHTML = `
    <div class="dei-sai-pin-head">
      <div class="dei-sai-pin-dot"></div>
    </div>
    <div class="dei-sai-pin-stem"></div>
  `;
  return pin;
}

// Update or create map pin
export function updateMapPin(lngLat) {
  if (!state.map || typeof maplibregl === 'undefined') return;
  if (state.pinMarker) {
    state.pinMarker.setLngLat(lngLat);
  } else {
    const pinEl = createPinElement();
    state.pinMarker = new maplibregl.Marker({
      element: pinEl,
      anchor: 'bottom'
    })
      .setLngLat(lngLat)
      .addTo(state.map);
  }
}

export function openBottomSheet() {
  const sheet = el.bottomSheet || (typeof document !== 'undefined' && document.getElementById('bottom-sheet'));
  if (sheet) {
    sheet.classList.add('open');
  }
}

export function closeBottomSheet() {
  const sheet = el.bottomSheet || (typeof document !== 'undefined' && document.getElementById('bottom-sheet'));
  if (sheet) {
    sheet.classList.remove('open');
  }
  if (state.pinMarker) {
    state.pinMarker.remove();
    state.pinMarker = null;
  }
  const placeChip = el.currentPlaceChip || (typeof document !== 'undefined' && document.getElementById('current-place-chip'));
  if (placeChip) {
    placeChip.textContent = '澳門';
  }
}

// Selection logic for a known landmark
export function selectLandmark(lm) {
  if (!lm) return;
  state.selectedLandmark = lm;

  // Move camera if map is ready
  if (state.map) {
    const reduceMotion = shouldReduceMotion();
    const targetPitch = state.is3D ? 55 : 0;
    const currentZoom = state.map.getZoom ? state.map.getZoom() : 13;
    const targetZoom = Math.max(currentZoom, 14.8);

    if (reduceMotion) {
      state.map.jumpTo({
        center: [lm.lon, lm.lat],
        zoom: targetZoom,
        pitch: targetPitch
      });
    } else {
      state.map.flyTo({
        center: [lm.lon, lm.lat],
        zoom: targetZoom,
        pitch: targetPitch,
        essential: true,
        duration: 800
      });
    }

    updateMapPin([lm.lon, lm.lat]);
  }

  // Update top place chip
  const placeChip = el.currentPlaceChip || document.getElementById('current-place-chip');
  if (placeChip) {
    placeChip.textContent = lm.name;
  }

  // Populate sheet
  const title = el.sheetTitle || document.getElementById('sheet-title');
  const subtitle = el.sheetSubtitle || document.getElementById('sheet-subtitle');
  const kind = el.sheetKind || document.getElementById('sheet-kind');
  const heightVal = el.sheetHeightVal || document.getElementById('sheet-height-val');
  const heightUnit = el.sheetHeightUnit || document.getElementById('sheet-height-unit');
  const heightSource = el.sheetHeightSource || document.getElementById('sheet-height-source');
  const coords = el.sheetCoords || document.getElementById('sheet-coords');
  const area = el.sheetArea || document.getElementById('sheet-area');

  if (title) title.textContent = lm.name;
  if (subtitle) {
    subtitle.textContent = lm.name_en || '';
    subtitle.style.display = lm.name_en ? 'block' : 'none';
  }
  if (kind) kind.textContent = lm.kind || '地標';

  // Format elevation
  if (lm.ele_source === 'osm:ele' || lm.ele_source === 'osm:height') {
    if (heightVal) heightVal.textContent = lm.ele_m;
    if (heightUnit) heightUnit.textContent = '米';
    if (heightSource) {
      heightSource.textContent = lm.ele_source === 'osm:ele'
        ? 'OpenStreetMap 標記高程（osm:ele）'
        : 'OpenStreetMap 建築/結構高度（osm:height）';
    }
  } else if (lm.ele_source === 'dem') {
    if (heightVal) heightVal.textContent = Math.round(lm.ele_m);
    if (heightUnit) heightUnit.textContent = '米';
    if (heightSource) {
      heightSource.textContent = '地形高程（DEM）約 ' + Math.round(lm.ele_m) + ' 米';
    }
  } else {
    // Sample DEM dynamically if available
    let dynEle = null;
    try {
      if (state.map && typeof state.map.queryTerrainElevation === 'function') {
        dynEle = state.map.queryTerrainElevation([lm.lon, lm.lat]);
      }
    } catch (err) {}

    if (dynEle != null && !isNaN(dynEle)) {
      if (heightVal) heightVal.textContent = Math.round(dynEle);
      if (heightUnit) heightUnit.textContent = '米';
      if (heightSource) {
        heightSource.textContent = '地形高程（DEM）約 ' + Math.round(dynEle) + ' 米';
      }
    } else {
      if (heightVal) heightVal.textContent = '高度不詳';
      if (heightUnit) heightUnit.textContent = '';
      if (heightSource) {
        heightSource.textContent = 'OpenStreetMap 無記錄高度資料';
      }
    }
  }

  if (coords) coords.textContent = `${lm.lat.toFixed(4)}°N, ${lm.lon.toFixed(4)}°E`;
  if (area) area.textContent = lm.area || getAreaFromLat(lm.lat);

  openBottomSheet();
}

// Selection logic for an arbitrary tapped terrain point
export function selectArbitraryPoint(lat, lon, sampledEle) {
  updateMapPin([lon, lat]);

  const placeChip = el.currentPlaceChip || document.getElementById('current-place-chip');
  if (placeChip) {
    placeChip.textContent = '呢個位置';
  }

  const title = el.sheetTitle || document.getElementById('sheet-title');
  const subtitle = el.sheetSubtitle || document.getElementById('sheet-subtitle');
  const kind = el.sheetKind || document.getElementById('sheet-kind');
  const heightVal = el.sheetHeightVal || document.getElementById('sheet-height-val');
  const heightUnit = el.sheetHeightUnit || document.getElementById('sheet-height-unit');
  const heightSource = el.sheetHeightSource || document.getElementById('sheet-height-source');
  const coords = el.sheetCoords || document.getElementById('sheet-coords');
  const area = el.sheetArea || document.getElementById('sheet-area');

  if (title) title.textContent = '呢個位置';
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }
  if (kind) kind.textContent = '地形位置';

  if (sampledEle != null && !isNaN(sampledEle)) {
    const roundedEle = Math.round(sampledEle);
    if (heightVal) heightVal.textContent = roundedEle;
    if (heightUnit) heightUnit.textContent = '米';
    if (heightSource) heightSource.textContent = `地形高程（DEM）約 ${roundedEle} 米`;
  } else {
    if (heightVal) heightVal.textContent = '高度不詳';
    if (heightUnit) heightUnit.textContent = '';
    if (heightSource) heightSource.textContent = '地形高程資料未載入或超出範圍';
  }

  if (coords) coords.textContent = `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
  if (area) area.textContent = getAreaFromLat(lat);

  openBottomSheet();
}

// Selection logic for a tapped 3D building
export function selectBuildingPoint(lat, lon, props = {}, sampledEle = null) {
  updateMapPin([lon, lat]);

  const placeChip = el.currentPlaceChip || document.getElementById('current-place-chip');
  const bldName = props.name || props['name:zh'] || props['name:en'] || '樓宇建築';
  if (placeChip) {
    placeChip.textContent = bldName;
  }

  const title = el.sheetTitle || document.getElementById('sheet-title');
  const subtitle = el.sheetSubtitle || document.getElementById('sheet-subtitle');
  const kind = el.sheetKind || document.getElementById('sheet-kind');
  const heightVal = el.sheetHeightVal || document.getElementById('sheet-height-val');
  const heightUnit = el.sheetHeightUnit || document.getElementById('sheet-height-unit');
  const heightSource = el.sheetHeightSource || document.getElementById('sheet-height-source');
  const coords = el.sheetCoords || document.getElementById('sheet-coords');
  const area = el.sheetArea || document.getElementById('sheet-area');

  if (title) title.textContent = bldName;
  if (subtitle) {
    subtitle.textContent = props['name:en'] || '';
    subtitle.style.display = props['name:en'] ? 'block' : 'none';
  }
  if (kind) kind.textContent = '樓宇';

  const rawHeight = props.render_height || props.height;
  if (rawHeight != null && !isNaN(rawHeight)) {
    const num = Math.round(Number(rawHeight));
    if (heightVal) heightVal.textContent = num;
    if (heightUnit) heightUnit.textContent = '米';
    if (heightSource) heightSource.textContent = 'OpenStreetMap 建築物高度';
  } else if (props.levels != null && !isNaN(props.levels)) {
    if (heightVal) heightVal.textContent = props.levels;
    if (heightUnit) heightUnit.textContent = '層';
    if (heightSource) heightSource.textContent = 'OpenStreetMap 建築層數（未有實測高度）';
  } else {
    if (heightVal) heightVal.textContent = '高度不詳';
    if (heightUnit) heightUnit.textContent = '';
    if (heightSource) heightSource.textContent = '未有標記實測高度（模型僅作示意）';
  }

  if (coords) coords.textContent = `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
  if (area) area.textContent = getAreaFromLat(lat);

  openBottomSheet();
}

// Dimension Toggle: 立體 / 平面
export function setDimension(is3D) {
  state.is3D = is3D;
  const reduceMotion = shouldReduceMotion();
  const duration = reduceMotion ? 0 : 500;

  const btnToggle = el.btnDimensionToggle || document.getElementById('btn-dimension-toggle');
  const dimText = el.dimensionText || document.getElementById('dimension-text');

  if (state.is3D) {
    if (btnToggle) btnToggle.classList.add('active');
    if (dimText) dimText.textContent = '立體';

    if (state.map) {
      state.map.easeTo({
        pitch: 55,
        duration,
        essential: true
      });

      if (state.terrainAvailable) {
        try {
          state.map.setTerrain({
            source: 'terrainSource',
            exaggeration: state.exaggeration
          });
        } catch (e) {}
      }
    }
  } else {
    if (btnToggle) btnToggle.classList.remove('active');
    if (dimText) dimText.textContent = '平面';

    if (state.map) {
      state.map.easeTo({
        pitch: 0,
        bearing: 0,
        duration,
        essential: true
      });

      try {
        state.map.setTerrain(null);
      } catch (e) {}
    }
  }
}

// Toggle Exaggeration: 1.3x vs 1.0x
export function toggleExaggeration() {
  if (Math.abs(state.exaggeration - 1.3) < 0.05) {
    state.exaggeration = 1.0;
  } else {
    state.exaggeration = 1.3;
  }

  const chip = el.chipExaggeration || document.getElementById('chip-exaggeration');
  if (chip) {
    chip.textContent = formatExaggerationLabel(state.exaggeration);
  }

  if (state.map && state.is3D && state.terrainAvailable) {
    try {
      state.map.setTerrain({
        source: 'terrainSource',
        exaggeration: state.exaggeration
      });
    } catch (e) {}
  }
}

// Geolocation Handler
export function handleLocate() {
  const btnLocate = el.btnLocate || document.getElementById('btn-locate');
  const placeChip = el.currentPlaceChip || document.getElementById('current-place-chip');

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    showBanner(DEFAULT_ORIGIN.message);
    if (state.map) {
      state.map.flyTo({
        center: [DEFAULT_ORIGIN.lon, DEFAULT_ORIGIN.lat],
        zoom: 14,
        pitch: state.is3D ? 55 : 0
      });
    }
    return;
  }

  if (btnLocate) btnLocate.classList.add('active');
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (btnLocate) btnLocate.classList.remove('active');
      const { latitude, longitude } = position.coords;
      const result = evaluateLocateCoordinate(latitude, longitude);

      if (result.accepted) {
        if (state.map) {
          state.map.flyTo({
            center: [result.target.lon, result.target.lat],
            zoom: 15.5,
            pitch: state.is3D ? 55 : 0,
            essential: true
          });
        }
        selectArbitraryPoint(latitude, longitude, null);
        if (placeChip) placeChip.textContent = '我的位置';
      } else {
        showBanner(result.message);
        if (state.map) {
          state.map.flyTo({
            center: [result.target.lon, result.target.lat],
            zoom: 13.8,
            pitch: state.is3D ? 55 : 0
          });
        }
        if (placeChip) placeChip.textContent = DEFAULT_ORIGIN.name;
      }
    },
    (err) => {
      if (btnLocate) btnLocate.classList.remove('active');
      showBanner(DEFAULT_ORIGIN.message);
      if (state.map) {
        state.map.flyTo({
          center: [DEFAULT_ORIGIN.lon, DEFAULT_ORIGIN.lat],
          zoom: 13.8,
          pitch: state.is3D ? 55 : 0
        });
      }
      if (placeChip) placeChip.textContent = DEFAULT_ORIGIN.name;
    },
    { timeout: 8000, enableHighAccuracy: true }
  );
}

// Search input handling
export function handleSearch(term) {
  const resultsEl = el.searchResults || document.getElementById('search-results');
  const clearBtn = el.btnSearchClear || document.getElementById('btn-search-clear');
  if (!resultsEl) return;

  if (!term || term.trim() === '') {
    resultsEl.innerHTML = '';
    resultsEl.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  if (clearBtn) clearBtn.style.display = 'flex';
  const query = term.trim().toLowerCase();

  const matches = state.landmarks.filter(lm => {
    const matchName = lm.name && lm.name.toLowerCase().includes(query);
    const matchEn = lm.name_en && lm.name_en.toLowerCase().includes(query);
    const matchKind = lm.kind && lm.kind.toLowerCase().includes(query);
    const matchArea = lm.area && lm.area.toLowerCase().includes(query);
    return matchName || matchEn || matchKind || matchArea;
  });

  if (matches.length === 0) {
    resultsEl.innerHTML = `
      <div class="search-result-item" style="color: var(--c-stone-dark); cursor: default;">
        搵唔到相關山丘或地標
      </div>
    `;
    resultsEl.style.display = 'block';
    return;
  }

  resultsEl.innerHTML = matches.map(lm => `
    <div class="search-result-item" data-id="${lm.id}" role="option">
      <div class="search-result-info">
        <div class="search-result-title">${lm.name}</div>
        <div class="search-result-subtitle">${lm.name_en || lm.area || ''}</div>
      </div>
      <div class="search-result-tag">
        ${lm.ele_m ? lm.ele_m + 'm' : lm.kind}
      </div>
    </div>
  `).join('');

  resultsEl.style.display = 'block';
}

// Attach all DOM Event Listeners
function setupDOMListeners() {
  if (el.btnCompass) {
    el.btnCompass.addEventListener('click', () => {
      if (state.map) {
        state.map.easeTo({
          bearing: 0,
          pitch: state.is3D ? 55 : 0,
          duration: shouldReduceMotion() ? 0 : 400
        });
      }
    });
  }

  if (el.btnLocate) {
    el.btnLocate.addEventListener('click', handleLocate);
  }

  if (el.btnDimensionToggle) {
    el.btnDimensionToggle.addEventListener('click', () => {
      setDimension(!state.is3D);
    });
  }

  if (el.chipExaggeration) {
    el.chipExaggeration.addEventListener('click', toggleExaggeration);
  }

  if (el.btnHintClose) {
    el.btnHintClose.addEventListener('click', dismissHint);
  }

  if (el.btnBannerClose) {
    el.btnBannerClose.addEventListener('click', hideBanner);
  }

  if (el.btnCloseSheet) {
    el.btnCloseSheet.addEventListener('click', closeBottomSheet);
  }

  if (el.btnOpenInfo) {
    el.btnOpenInfo.addEventListener('click', () => {
      const info = el.infoSheet || document.getElementById('info-sheet');
      if (info) info.classList.add('open');
    });
  }

  if (el.btnCloseInfo) {
    el.btnCloseInfo.addEventListener('click', () => {
      const info = el.infoSheet || document.getElementById('info-sheet');
      if (info) info.classList.remove('open');
    });
  }

  // Quick hills rail chips
  if (el.quickHillsRail) {
    el.quickHillsRail.addEventListener('click', (e) => {
      const chip = e.target.closest('.hill-chip');
      if (chip) {
        const id = chip.dataset.id;
        const found = state.landmarks.find(l => l.id === id);
        if (found) {
          selectLandmark(found);
        }
      }
    });
  }

  // Search input events
  if (el.searchInput) {
    el.searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });

    el.searchInput.addEventListener('focus', () => {
      if (el.searchInput.value) {
        handleSearch(el.searchInput.value);
      }
    });
  }

  if (el.btnSearchClear) {
    el.btnSearchClear.addEventListener('click', () => {
      el.searchInput.value = '';
      handleSearch('');
      el.searchInput.focus();
    });
  }

  if (el.searchResults) {
    el.searchResults.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (item && item.dataset.id) {
        const found = state.landmarks.find(l => l.id === item.dataset.id);
        if (found) {
          selectLandmark(found);
          el.searchResults.style.display = 'none';
        }
      }
    });
  }

  // Click outside search results to hide
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      if (el.searchResults) el.searchResults.style.display = 'none';
    }
  });
}

// Initialize Map & Application
export async function initApp() {
  initDOM();

  // Update footer time immediately
  if (el.footerLoadTime) {
    el.footerLoadTime.textContent = formatMacauTime();
  }

  // Setup DOM listeners right away
  setupDOMListeners();

  // Check hint state from session storage
  try {
    if (sessionStorage.getItem('dei_sai_hint_dismissed') === 'true') {
      if (el.firstRunHint) el.firstRunHint.style.display = 'none';
    }
  } catch (e) {}

  // Fetch Landmarks
  try {
    const res = await fetch('./data/landmarks.json');
    state.landmarks = await res.json();
  } catch (err) {
    console.warn('Could not load landmarks.json:', err);
  }

  // Check WebGL / MapLibre support
  if (typeof maplibregl === 'undefined') {
    console.warn('MapLibre GL JS not loaded');
    return;
  }

  if (!maplibregl.supported || !maplibregl.supported()) {
    console.warn('WebGL is not supported in this browser environment');
    showBanner('你的瀏覽器未能啟用 WebGL 繪圖，地圖未能載入。', 0);
    return;
  }

  // Setup MapLibre
  const initialCenter = [113.5550, 22.1620];
  const initialPitch = 55;
  const initialBearing = -15;
  const initialZoom = (typeof window !== 'undefined' && window.innerWidth <= 400) ? 12.3 : 12.6;

  try {
    const map = new maplibregl.Map({
      container: 'map',
      style: './data/style.json',
      center: initialCenter,
      zoom: initialZoom,
      pitch: initialPitch,
      bearing: initialBearing,
      maxBounds: MAP_MAX_BOUNDS,
      minZoom: 11,
      maxZoom: 18.5,
      attributionControl: false
    });

    state.map = map;

    // Handle terrain errors honestly
    map.on('error', (e) => {
      if (e && e.error && (e.error.message?.includes('terrainSource') || e.error.message?.includes('elevation-tiles'))) {
        if (state.terrainAvailable) {
          state.terrainAvailable = false;
          try {
            map.setTerrain(null);
          } catch (err) {}
          showBanner('地勢暫時載入唔到，已切換至水平地形。');
        }
      }
    });

    map.on('load', () => {
      // Apply terrain
      try {
        map.setTerrain({
          source: 'terrainSource',
          exaggeration: state.exaggeration
        });
      } catch (e) {
        console.warn('Terrain initialization warning:', e);
      }

      // Add landmark source & layer for on-map typographic labels
      if (state.landmarks && state.landmarks.length > 0) {
        const geojsonFeatures = state.landmarks.map((lm) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lm.lon, lm.lat]
          },
          properties: {
            id: lm.id,
            name: lm.name,
            name_en: lm.name_en || '',
            kind: lm.kind,
            ele_m: lm.ele_m != null ? lm.ele_m : '',
            ele_source: lm.ele_source
          }
        }));

        map.addSource('landmarks-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geojsonFeatures
          }
        });

        // Discreet typographic landmark labels on the model
        map.addLayer({
          id: 'landmark-labels',
          type: 'symbol',
          source: 'landmarks-source',
          minzoom: 12,
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': [
              'interpolate', ['linear'], ['zoom'],
              12, 11,
              15, 14,
              18, 16
            ],
            'text-offset': [0, -1.2],
            'text-anchor': 'bottom',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#1A1C1B',
            'text-halo-color': '#E8E6E1',
            'text-halo-width': 2
          }
        });

        // Tap on landmark label
        map.on('click', 'landmark-labels', (e) => {
          if (e.features && e.features[0]) {
            const id = e.features[0].properties.id;
            const found = state.landmarks.find(item => item.id === id);
            if (found) {
              selectLandmark(found);
            }
          }
        });

        map.on('mouseenter', 'landmark-labels', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'landmark-labels', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    });

    // Track map gestures to dismiss hint
    const dismissGestures = ['rotatestart', 'pitchstart', 'movestart', 'zoomstart', 'dragstart'];
    dismissGestures.forEach(evt => {
      map.on(evt, () => {
        dismissHint();
      });
    });

    // Update compass needle on map rotation
    map.on('rotate', () => {
      const bearing = map.getBearing();
      const icon = el.compassIcon || document.getElementById('compass-icon');
      if (icon) {
        icon.style.transform = `rotate(${-bearing}deg)`;
      }
    });

    // Click on map terrain or buildings
    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['landmark-labels'] });
      if (features && features.length > 0) return;

      const clickLon = e.lngLat.lng;
      const clickLat = e.lngLat.lat;

      const nearbyLandmark = state.landmarks.find(lm => {
        const dLat = Math.abs(lm.lat - clickLat);
        const dLon = Math.abs(lm.lon - clickLon);
        return (dLat < 0.0015 && dLon < 0.0015);
      });

      if (nearbyLandmark) {
        selectLandmark(nearbyLandmark);
        return;
      }

      let sampledEle = null;
      try {
        if (typeof map.queryTerrainElevation === 'function') {
          sampledEle = map.queryTerrainElevation(e.lngLat);
        }
      } catch (err) {
        sampledEle = null;
      }

      // Check if user clicked on an extruded 3D building
      const buildingFeatures = map.queryRenderedFeatures(e.point, { layers: ['building-3d'] });
      if (buildingFeatures && buildingFeatures.length > 0) {
        const bld = buildingFeatures[0];
        const props = bld.properties || {};
        selectBuildingPoint(clickLat, clickLon, props, sampledEle);
        return;
      }

      selectArbitraryPoint(clickLat, clickLon, sampledEle);
    });
  } catch (err) {
    console.warn('MapLibre initialization caught error:', err);
    showBanner('你的瀏覽器未能啟用 WebGL 繪圖，地圖未能載入。', 0);
  }
}

// Start app on DOMContentLoaded or immediately if already loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
