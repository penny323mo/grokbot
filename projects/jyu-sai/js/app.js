/**
 * 雨勢 · Jyu Sai — Macau Rain Field & Timing Main Application
 */

import {
  DISTRICTS,
  DEFAULT_ORIGIN,
  DEFAULT_ORIGIN_MSG,
  formatMacauTime,
  checkFrameFreshness,
  evaluateLocateCoordinate,
  generateHeroSentence
} from './utils.js';

import { fetchRainViewerData, sampleRadarReturn } from './rainviewer.js';
import { fetchOpenMeteoForecast } from './openmeteo.js';
import { fetchSMGData } from './smg.js';
import { fetchHKOData } from './hko.js';

// Application State
const state = {
  currentDistrict: DEFAULT_ORIGIN,
  customLocation: null,
  radarData: null,
  currentFrameIndex: 0,
  isPlaying: false,
  playTimer: null,
  forecastData: null,
  smgData: null,
  hkoData: null,
  map: null,
  marker: null,
  radarLayersAdded: false,
  isRefreshing: false,
  lastUpdates: {
    radar: null,
    forecast: null,
    smg: null,
    hko: null
  }
};

// DOM Elements
const elements = {
  map: document.getElementById('map'),
  mapFallback: document.getElementById('map-fallback'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnInfo: document.getElementById('btn-info'),
  btnDetails: document.getElementById('btn-details'),
  btnPlay: document.getElementById('btn-play'),
  iconPlay: document.getElementById('icon-play'),
  iconPause: document.getElementById('icon-pause'),
  scrubberSlider: document.getElementById('scrubber-slider'),
  scrubberTime: document.getElementById('scrubber-time'),
  scrubberBadge: document.getElementById('scrubber-badge'),
  scrubberNowcastMsg: document.getElementById('scrubber-nowcast-msg'),
  heroSentence: document.getElementById('hero-sentence'),
  heroSubtext: document.getElementById('hero-subtext'),
  timelineStrip: document.getElementById('timeline-strip'),
  timelineOriginLabel: document.getElementById('timeline-origin-label'),
  metaRadarTime: document.getElementById('meta-radar-time'),
  metaStaleTag: document.getElementById('meta-stale-tag'),
  smgCorsLine: document.getElementById('smg-cors-line'),
  bannerNotice: document.getElementById('banner-notice'),
  bannerText: document.getElementById('banner-text'),
  bannerClose: document.getElementById('banner-close'),
  infoSheet: document.getElementById('info-sheet'),
  sheetClose: document.getElementById('sheet-close'),
  rainviewerStatusText: document.getElementById('rainviewer-status-text'),
  openmeteoStatusText: document.getElementById('openmeteo-status-text'),
  smgStatusText: document.getElementById('smg-status-text'),
  hkoStatusText: document.getElementById('hko-status-text'),
  placeButtons: document.querySelectorAll('.btn-place')
};

/**
 * Feature detect WebGL using canvas context
 */
function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Show notice banner
 */
let bannerTimer = null;
function showBanner(text, autoHideMs = 5000) {
  if (!elements.bannerNotice || !elements.bannerText) return;
  elements.bannerText.textContent = text;
  elements.bannerNotice.classList.add('visible');
  if (bannerTimer) clearTimeout(bannerTimer);
  if (autoHideMs > 0) {
    bannerTimer = setTimeout(() => {
      elements.bannerNotice.classList.remove('visible');
    }, autoHideMs);
  }
}

function hideBanner() {
  if (!elements.bannerNotice) return;
  elements.bannerNotice.classList.remove('visible');
  if (bannerTimer) clearTimeout(bannerTimer);
}

/**
 * Initialize MapLibre GL Map
 */
function initMap() {
  if (!isWebGLSupported()) {
    console.warn('WebGL is not supported in this environment. Showing fallback view.');
    if (elements.map) elements.map.style.display = 'none';
    if (elements.mapFallback) elements.mapFallback.style.display = 'flex';
    return;
  }

  try {
    state.map = new maplibregl.Map({
      container: 'map',
      style: './data/style.json',
      center: [DEFAULT_ORIGIN.lon, DEFAULT_ORIGIN.lat],
      zoom: 11.8,
      minZoom: 9,
      maxZoom: 15,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      dragRotate: false,
      touchPitch: false
    });

    state.map.on('load', () => {
      initMapMarker();
      if (state.radarData && state.radarData.frames.length > 0) {
        setupRadarLayers();
      }
    });

    state.map.on('error', (e) => {
      console.warn('MapLibre error event:', e);
    });
  } catch (err) {
    console.warn('MapLibre map instantiation failed:', err);
    if (elements.map) elements.map.style.display = 'none';
    if (elements.mapFallback) elements.mapFallback.style.display = 'flex';
  }
}

/**
 * Custom location pin marker
 */
function initMapMarker() {
  if (!state.map) return;

  const el = document.createElement('div');
  el.className = 'map-place-marker';
  el.style.width = '14px';
  el.style.height = '14px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = '#7A3D62';
  el.style.border = '2.5px solid #FFFFFF';
  el.style.boxShadow = '0 0 0 2px rgba(122, 61, 98, 0.4), 0 2px 6px rgba(0,0,0,0.3)';
  el.style.pointerEvents = 'none';

  state.marker = new maplibregl.Marker({ element: el })
    .setLngLat([DEFAULT_ORIGIN.lon, DEFAULT_ORIGIN.lat])
    .addTo(state.map);
}

/**
 * Move map and marker to location
 */
function panToLocation(lat, lon, zoom = 12.0) {
  if (state.marker) {
    state.marker.setLngLat([lon, lat]);
  }
  if (state.map) {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      state.map.jumpTo({
        center: [lon, lat],
        zoom: zoom
      });
    } else {
      state.map.flyTo({
        center: [lon, lat],
        zoom: zoom,
        duration: 650,
        essential: true
      });
    }
  }
}

/**
 * Configure RainViewer raster layers on MapLibre map
 */
function setupRadarLayers() {
  if (!state.map || !state.map.isStyleLoaded() || !state.radarData) return;

  // Remove existing radar layers if any
  state.radarData.frames.forEach((_, idx) => {
    const layerId = `radar-layer-${idx}`;
    const sourceId = `radar-source-${idx}`;
    if (state.map.getLayer(layerId)) state.map.removeLayer(layerId);
    if (state.map.getSource(sourceId)) state.map.removeSource(sourceId);
  });

  // Add each frame as a raster source & layer
  state.radarData.frames.forEach((frame, idx) => {
    const layerId = `radar-layer-${idx}`;
    const sourceId = `radar-source-${idx}`;

    state.map.addSource(sourceId, {
      type: 'raster',
      tiles: [frame.tileUrl],
      tileSize: 256
    });

    state.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      layout: {
        visibility: idx === state.currentFrameIndex ? 'visible' : 'none'
      },
      paint: {
        'raster-opacity': 0.78,
        'raster-fade-duration': 100
      }
    });
  });

  state.radarLayersAdded = true;
}

/**
 * Switch active radar frame
 */
function setFrame(newIndex) {
  if (!state.radarData || !state.radarData.frames || state.radarData.frames.length === 0) return;

  const totalFrames = state.radarData.frames.length;
  const oldIndex = state.currentFrameIndex;
  state.currentFrameIndex = Math.max(0, Math.min(newIndex, totalFrames - 1));

  // Update map layer visibilities
  if (state.map && state.map.isStyleLoaded() && state.radarLayersAdded) {
    if (oldIndex !== state.currentFrameIndex) {
      const oldLayer = `radar-layer-${oldIndex}`;
      if (state.map.getLayer(oldLayer)) {
        state.map.setLayoutProperty(oldLayer, 'visibility', 'none');
      }
    }
    const curLayer = `radar-layer-${state.currentFrameIndex}`;
    if (state.map.getLayer(curLayer)) {
      state.map.setLayoutProperty(curLayer, 'visibility', 'visible');
    }
  }

  updateScrubberUI();
}

/**
 * Scrubber and Playback UI
 */
function updateScrubberUI() {
  if (!state.radarData || !state.radarData.frames || state.radarData.frames.length === 0) {
    if (elements.scrubberTime) elements.scrubberTime.textContent = '--:--';
    if (elements.scrubberBadge) {
      elements.scrubberBadge.textContent = '無資料';
      elements.scrubberBadge.className = 'scrubber-badge';
    }
    if (elements.scrubberNowcastMsg) elements.scrubberNowcastMsg.style.display = 'none';
    if (elements.metaStaleTag) elements.metaStaleTag.style.display = 'none';
    return;
  }

  const frame = state.radarData.frames[state.currentFrameIndex];
  if (!frame) return;

  if (elements.scrubberSlider) {
    elements.scrubberSlider.max = state.radarData.frames.length - 1;
    elements.scrubberSlider.value = state.currentFrameIndex;
    elements.scrubberSlider.setAttribute('aria-valuenow', state.currentFrameIndex);
    elements.scrubberSlider.setAttribute('aria-valuetext', frame.timeStr || '');
  }

  if (elements.scrubberTime) {
    elements.scrubberTime.textContent = frame.timeStr || formatMacauTime(frame.time, 'time');
  }

  if (elements.scrubberBadge) {
    if (frame.isNowcast) {
      elements.scrubberBadge.textContent = '預測';
      elements.scrubberBadge.className = 'scrubber-badge nowcast';
    } else {
      elements.scrubberBadge.textContent = '實況';
      elements.scrubberBadge.className = 'scrubber-badge';
    }
  }

  // Display empty nowcast note if source has no nowcast frames
  if (elements.scrubberNowcastMsg) {
    elements.scrubberNowcastMsg.style.display = state.radarData.hasNowcast ? 'none' : 'block';
  }

  // Update footer time & stale tag
  if (elements.metaRadarTime) {
    elements.metaRadarTime.textContent = `RainViewer 雷達拼圖（非官方）· ${frame.timeStr}`;
  }
  if (elements.metaStaleTag) {
    elements.metaStaleTag.style.display = frame.isStale ? 'inline-block' : 'none';
  }
}

/**
 * Playback Control
 */
function play() {
  if (!state.radarData || !state.radarData.frames || state.radarData.frames.length <= 1) return;

  state.isPlaying = true;
  if (elements.iconPlay) elements.iconPlay.style.display = 'none';
  if (elements.iconPause) elements.iconPause.style.display = 'block';

  // If at the end, start from 0
  if (state.currentFrameIndex >= state.radarData.frames.length - 1) {
    setFrame(0);
  }

  if (state.playTimer) clearInterval(state.playTimer);
  state.playTimer = setInterval(() => {
    let next = state.currentFrameIndex + 1;
    if (next >= state.radarData.frames.length) {
      next = 0; // loop
    }
    setFrame(next);
  }, 750);
}

function pause() {
  state.isPlaying = false;
  if (elements.iconPlay) elements.iconPlay.style.display = 'block';
  if (elements.iconPause) elements.iconPause.style.display = 'none';

  if (state.playTimer) {
    clearInterval(state.playTimer);
    state.playTimer = null;
  }
}

function togglePlay() {
  if (state.isPlaying) {
    pause();
  } else {
    play();
  }
}

/**
 * Update Hero Sentence and Timeline UI
 */
async function updateHeroAndTimeline() {
  const target = state.customLocation || state.currentDistrict;
  const smgCode = state.currentDistrict ? state.currentDistrict.smgCode : 'FM';
  const officialStation = state.smgData && state.smgData.stations ? state.smgData.stations[smgCode] : null;

  let radarHasRain = false;
  let radarExplicitlyDry = false;

  if (state.radarData && state.radarData.latestPastFrame && state.radarData.latestPastFrame.tileUrl) {
    try {
      radarHasRain = await sampleRadarReturn(
        state.radarData.latestPastFrame.tileUrl,
        target.lat,
        target.lon
      );
      radarExplicitlyDry = !radarHasRain;
    } catch (e) {
      radarHasRain = false;
      radarExplicitlyDry = false;
    }
  }

  const result = generateHeroSentence({
    forecast: state.forecastData,
    official: officialStation ? { available: true, pastHour: officialStation.pastHour } : null,
    radarHasRain,
    radarExplicitlyDry
  });

  if (elements.heroSentence) {
    elements.heroSentence.textContent = result.sentence;
  }

  if (elements.heroSubtext) {
    elements.heroSubtext.textContent = result.subtext;
  }

  // Update timeline strip
  renderTimelineStrip();
}

/**
 * Render 15-minute 2-hour timeline strip
 */
function renderTimelineStrip() {
  if (!elements.timelineStrip) return;
  elements.timelineStrip.innerHTML = '';

  const locName = state.customLocation ? '定位位置' : state.currentDistrict.name;
  const firstTime = (state.forecastData && state.forecastData.firstStepTime)
    ? formatMacauTime(state.forecastData.firstStepTime, 'time')
    : '';

  if (elements.timelineOriginLabel) {
    elements.timelineOriginLabel.textContent = firstTime ? `${locName} · ${firstTime} 預測` : `${locName} · 預測`;
  }

  if (!state.forecastData || !state.forecastData.available || !Array.isArray(state.forecastData.timeline)) {
    elements.timelineStrip.innerHTML = '<div style="grid-column: 1 / -1; padding: 6px; font-size: 11px; text-align: center; color: var(--c-stone-dark);">未有未來兩小時模式預測</div>';
    return;
  }

  const steps = state.forecastData.timeline.slice(0, 8);
  steps.forEach(step => {
    const el = document.createElement('div');
    el.className = 'timeline-step';

    const p = step.precip || 0;
    const isDry = p < 0.05;
    const barHeight = isDry ? 2 : Math.min(20, Math.max(3, Math.round(p * 10)));
    const valText = isDry ? '0' : (p >= 1 ? p.toFixed(1) : p.toFixed(2));

    el.innerHTML = `
      <span class="timeline-time">${step.timeStr || '--:--'}</span>
      <div class="timeline-bar-wrap">
        <div class="timeline-bar ${isDry ? 'dry' : ''}" style="height: ${barHeight}px;"></div>
      </div>
      <span class="timeline-val">${valText}</span>
    `;
    elements.timelineStrip.appendChild(el);
  });
}

/**
 * Update Details Sheet Status Messages
 */
function updateSheetStatus() {
  if (elements.rainviewerStatusText) {
    if (state.radarData && state.radarData.available) {
      const latestTime = state.radarData.latestPastFrame
        ? state.radarData.latestPastFrame.timeStr
        : '--:--';
      const updated = state.lastUpdates.radar
        ? formatMacauTime(state.lastUpdates.radar, 'full')
        : '剛剛';
      const nowcastInfo = state.radarData.hasNowcast
        ? `，包含 ${state.radarData.nowcastFrames.length} 幀預測`
        : '，未有預測幀';
      elements.rainviewerStatusText.textContent = `最新回波：${latestTime}（共 ${state.radarData.pastFrames.length} 幀實況${nowcastInfo}；上次成功更新：${updated}）。`;
    } else {
      elements.rainviewerStatusText.textContent = '雷達拼圖資料未能讀取。';
    }
  }

  if (elements.openmeteoStatusText) {
    if (state.forecastData && state.forecastData.available) {
      const firstTime = state.forecastData.firstStepTime
        ? formatMacauTime(state.forecastData.firstStepTime, 'time')
        : '--:--';
      const updated = state.lastUpdates.forecast
        ? formatMacauTime(state.lastUpdates.forecast, 'full')
        : '剛剛';
      elements.openmeteoStatusText.textContent = `預測起點：${firstTime}（8 步 15 分鐘計時；上次成功更新：${updated}）。`;
    } else {
      elements.openmeteoStatusText.textContent = '未有未來兩小時模式預測。';
    }
  }

  if (elements.smgStatusText) {
    if (state.smgData && state.smgData.available) {
      const pub = state.smgData.sysPubdate || '';
      const updated = state.lastUpdates.smg
        ? formatMacauTime(state.lastUpdates.smg, 'full')
        : '剛剛';
      elements.smgStatusText.textContent = `成功讀取澳門地球物理氣象局官方觀測（發布時間：${pub}；上次成功更新：${updated}）。`;
    } else {
      elements.smgStatusText.textContent = '澳門地球物理氣象局官方雨量未能喺瀏覽器讀取（來源無開放跨域）。如需官方實況，請瀏覽氣象局官網。';
    }
  }

  if (elements.hkoStatusText) {
    if (state.hkoData && state.hkoData.available) {
      const updated = state.lastUpdates.hko
        ? formatMacauTime(state.lastUpdates.hko, 'full')
        : '剛剛';
      elements.hkoStatusText.textContent = `香港天文台官方雨量（${state.hkoData.place}錄得 ${state.hkoData.maxMm} ${state.hkoData.unit}，非澳門觀測；上次成功更新：${updated}）。`;
    } else {
      elements.hkoStatusText.textContent = '香港天文台雨量開放數據未能取得。';
    }
  }
}

/**
 * Fetch all remote data sources
 */
async function loadAllData() {
  if (state.isRefreshing) return;
  state.isRefreshing = true;

  if (elements.btnRefresh) elements.btnRefresh.classList.add('loading');

  const loc = state.customLocation || state.currentDistrict;

  try {
    const [radarRes, forecastRes, smgRes, hkoRes] = await Promise.allSettled([
      fetchRainViewerData(),
      fetchOpenMeteoForecast(loc.lat, loc.lon),
      fetchSMGData(),
      fetchHKOData()
    ]);

    // RainViewer
    if (radarRes.status === 'fulfilled' && radarRes.value.available) {
      state.radarData = radarRes.value;
      state.lastUpdates.radar = new Date();
      // Default to latest past frame
      if (state.radarData.pastFrames.length > 0) {
        state.currentFrameIndex = state.radarData.pastFrames.length - 1;
      } else {
        state.currentFrameIndex = 0;
      }
      if (state.map && state.map.isStyleLoaded()) {
        setupRadarLayers();
      }
      updateScrubberUI();
    } else {
      if (elements.metaRadarTime) {
        elements.metaRadarTime.textContent = '雷達未能載入';
      }
    }

    // Open-Meteo
    if (forecastRes.status === 'fulfilled' && forecastRes.value.available) {
      state.forecastData = forecastRes.value;
      state.lastUpdates.forecast = new Date();
    } else {
      state.forecastData = { available: false, message: '未有未來兩小時模式預測', timeline: [] };
    }

    // SMG
    if (smgRes.status === 'fulfilled') {
      state.smgData = smgRes.value;
      if (state.smgData.available) {
        state.lastUpdates.smg = new Date();
      }
      if (elements.smgCorsLine) {
        elements.smgCorsLine.style.display = state.smgData.available ? 'none' : 'flex';
      }
    } else {
      state.smgData = {
        available: false,
        message: '澳門地球物理氣象局官方雨量未能喺瀏覽器讀取（來源無開放跨域）'
      };
      if (elements.smgCorsLine) {
        elements.smgCorsLine.style.display = 'flex';
      }
    }

    // HKO
    if (hkoRes.status === 'fulfilled') {
      state.hkoData = hkoRes.value;
      if (state.hkoData && state.hkoData.available) {
        state.lastUpdates.hko = new Date();
      }
    }

    await updateHeroAndTimeline();
    updateSheetStatus();

  } catch (err) {
    console.warn('Data fetching error:', err);
  } finally {
    state.isRefreshing = false;
    if (elements.btnRefresh) elements.btnRefresh.classList.remove('loading');
  }
}

/**
 * Handle place selection
 */
async function selectDistrict(districtId) {
  if (!DISTRICTS[districtId]) return;

  state.currentDistrict = DISTRICTS[districtId];
  state.customLocation = null;

  elements.placeButtons.forEach(btn => {
    const isTarget = btn.getAttribute('data-district') === districtId;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
  });

  panToLocation(state.currentDistrict.lat, state.currentDistrict.lon, 12.2);

  // Re-fetch forecast for selected district
  const forecastRes = await fetchOpenMeteoForecast(state.currentDistrict.lat, state.currentDistrict.lon);
  state.forecastData = forecastRes;
  await updateHeroAndTimeline();
}

/**
 * Handle Geolocation
 */
function handleLocate() {
  if (!('geolocation' in navigator)) {
    showBanner(DEFAULT_ORIGIN_MSG);
    return;
  }

  showBanner('正在獲取定位...');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const evalRes = evaluateLocateCoordinate(latitude, longitude);

      if (evalRes.accepted) {
        state.customLocation = { lat: latitude, lon: longitude };
        elements.placeButtons.forEach(btn => {
          const isLocate = btn.getAttribute('data-district') === 'locate';
          btn.classList.toggle('active', isLocate);
          btn.setAttribute('aria-pressed', isLocate ? 'true' : 'false');
        });

        panToLocation(latitude, longitude, 13.0);
        showBanner(evalRes.message);

        // Fetch forecast for user coordinate
        fetchOpenMeteoForecast(latitude, longitude).then(async (fRes) => {
          state.forecastData = fRes;
          await updateHeroAndTimeline();
        });
      } else {
        showBanner(evalRes.message);
        selectDistrict('peninsula');
      }
    },
    (err) => {
      console.warn('Geolocation error:', err);
      showBanner(DEFAULT_ORIGIN_MSG);
      selectDistrict('peninsula');
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000
    }
  );
}

/**
 * Bind UI event listeners
 */
function bindEvents() {
  // Place Buttons
  elements.placeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dist = btn.getAttribute('data-district');
      if (dist === 'locate') {
        handleLocate();
      } else if (dist) {
        selectDistrict(dist);
      }
    });
  });

  // Play / Pause
  if (elements.btnPlay) {
    elements.btnPlay.addEventListener('click', () => {
      togglePlay();
    });
  }

  // Scrubber slider
  if (elements.scrubberSlider) {
    const handleSlider = (e) => {
      pause();
      setFrame(parseInt(e.target.value, 10));
    };
    elements.scrubberSlider.addEventListener('input', handleSlider);
    elements.scrubberSlider.addEventListener('change', handleSlider);
  }

  // Network connectivity notifications
  window.addEventListener('online', () => {
    showBanner('網路已重新連線，正在更新雨情...');
    loadAllData();
  });
  window.addEventListener('offline', () => {
    showBanner('網路連線中斷，請檢查連線狀態。');
  });

  // Refresh button
  if (elements.btnRefresh) {
    elements.btnRefresh.addEventListener('click', () => {
      loadAllData();
    });
  }

  // Info modal sheet
  if (elements.btnInfo) {
    elements.btnInfo.addEventListener('click', () => {
      elements.infoSheet.classList.add('open');
    });
  }

  if (elements.btnDetails) {
    elements.btnDetails.addEventListener('click', () => {
      elements.infoSheet.classList.add('open');
    });
  }

  if (elements.sheetClose) {
    elements.sheetClose.addEventListener('click', () => {
      elements.infoSheet.classList.remove('open');
    });
  }

  // Close banner
  if (elements.bannerClose) {
    elements.bannerClose.addEventListener('click', hideBanner);
  }

  // Auto refresh every 5 minutes
  setInterval(loadAllData, 5 * 60 * 1000);
}

/**
 * Application Entrypoint
 */
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  initMap();
  loadAllData();
});
