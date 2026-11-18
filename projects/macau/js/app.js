import { formatDistance, formatElevation, formatMinutes } from '../../ce-lou/js/utils.js';
import { planLive, routeBusAccess } from './bus.js';
import { FACILITY_FILTERS, loadFacilities, rankFacilities } from './nearby.js';
import { loadMarine, loadModelWeather, OFFICIAL_TIDE, officialWeatherLine } from './conditions.js';
import { MODULES } from './inventory.js';
import { loadParks, rankParks } from './park.js';
import { loadRadar } from './radar.js';
import { loadLandmarks, nearestLandmarks } from './terrain.js';
import { applyGeoToTrip, readGeolocation } from './geo.js';
import { loadPlans } from './plans.js';
import { evaluateCoordinate, findPlace, PLACES } from './places.js';
import { renderProfile } from './profile.js';
import { smgLine } from './rain.js';
import {
  applyParts,
  busSourceParts,
  rainSourceParts,
  smgSourceParts,
  walkSourceParts
} from './sources.js';
import { createTrip } from './trip.js';
import { planWalk, stairsLine } from './walk.js';

const trip = createTrip();
const forceFail = new URLSearchParams(location.search).get('fail') === '1';
const $ = (id) => document.getElementById(id);

let plans = null;
let requestId = 0;
let busAccess = null;
let facilityPack = null;
let facilityFilter = 'all';
let weatherView = null;
let radarView = null;
let tideView = null;
let landmarkPack = null;
let parkPack = null;
const extraMarkers = [];
let map = null;
let fittedFor = '';
const pins = {};

function webglOk() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

function setSheet(next) {
  document.getElementById('app').dataset.sheet = next;
  $('btn-map').textContent = next === 'map' ? '睇比較' : '放大地圖';
  $('btn-detail').textContent = next === 'open' ? '收起詳情' : '詳情';
  $('btn-detail').setAttribute('aria-expanded', next === 'open' ? 'true' : 'false');
  if (next === 'open') {
    requestAnimationFrame(() => {
      const details = document.querySelector('.details');
      if (details) $('sheet-body').scrollTop = details.offsetTop;
    });
  }
  fittedFor = '';
  if (map) {
    map.resize();
    render();
  }
}

function activeOption(list, index) {
  if (!list?.length) return null;
  const i = Math.max(0, Math.min(index, list.length - 1));
  return list[i];
}

function renderVariants(state) {
  const box = $('variants');
  box.replaceChildren();
  const plan = plans?.walk;
  $('walk-block').hidden = state.mode !== 'walk';
  $('bus-block').hidden = state.mode !== 'bus';
  if (!plan) {
    $('walk-detail').textContent = '計緊行人路徑…';
    return;
  }
  if (!plan.ok) {
    $('walk-detail').textContent = plan.message || '暫時未能計算步行路線';
    return;
  }
  if (plan.singlePathNote) {
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = plan.singlePathNote;
    box.appendChild(note);
  }
  const current = Math.min(state.walkIndex, plan.options.length - 1);
  plan.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `variant${index === current ? ' is-on' : ''}`;
    const climb = option.elevationSamples?.length
      ? `爬升 ${formatElevation(option.climbMeters)}`
      : '高度未有';
    btn.textContent = `${option.tag} · ${formatMinutes(option.durationMinutes, true)} · ${climb} · ${formatDistance(option.distanceMeters)}`;
    btn.addEventListener('click', () => {
      trip.setWalkIndex(index);
      if (trip.getState().mode !== 'walk') trip.setMode('walk');
    });
    box.appendChild(btn);
  });
  const walk = activeOption(plan.options, state.walkIndex);
  $('walk-detail').textContent = walk
    ? `${stairsLine(walk.stairsCount)} · 估算時速約 ${walk.speedKmh} 公里`
    : '';
  const profile = $('profile');
  profile.replaceChildren();
  if (!walk) return;
  const drawn = renderProfile(walk);
  if (!drawn.available) {
    const p = document.createElement('p');
    p.className = 'note';
    p.textContent = drawn.label;
    profile.appendChild(p);
    return;
  }
  const holder = document.createElement('div');
  holder.innerHTML = drawn.svg;
  profile.appendChild(holder.firstElementChild);
  const cap = document.createElement('p');
  cap.className = 'note';
  cap.textContent = drawn.label;
  profile.appendChild(cap);
}

function renderBus(state) {
  const box = $('bus-options');
  box.replaceChildren();
  const plan = plans?.bus;
  if (!plan) {
    $('bus-note').textContent = '對緊下載嘅巴士路線…';
    $('bus-stops').textContent = '';
    return;
  }
  const accessLine = busAccess
    ? `${busAccess.toBoard.text}。${busAccess.fromAlight.text}。`
    : '去上車站同行人時間未計好。直線距離唔會當成行路分鐘。';
  $('bus-note').textContent = [plan.message, plan.pathNote, plan.accessNote, accessLine].filter(Boolean).join(' ');
  if (!plan.ok || !plan.options.length) {
    $('bus-stops').textContent = '';
    return;
  }
  const current = Math.min(state.busIndex, plan.options.length - 1);
  plan.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `variant${index === current ? ' is-on' : ''}`;
    btn.textContent = option.summary;
    btn.addEventListener('click', () => {
      trip.setBusIndex(index);
      if (trip.getState().mode !== 'bus') trip.setMode('bus');
    });
    box.appendChild(btn);
  });
  const bus = activeOption(plan.options, state.busIndex);
  $('bus-stops').textContent = bus?.via?.length ? `順序：${bus.via.join('、')}` : '';
  if (bus?.metroNote) $('bus-stops').textContent += ` ${bus.metroNote}`;
}

function fillExtra(title, lines, points) {
  const box = $('panel-extra');
  box.replaceChildren();
  const h = document.createElement('p');
  h.className = 'ends';
  h.textContent = title;
  box.appendChild(h);
  for (const line of lines) {
    const p = document.createElement('p');
    p.className = 'note';
    p.textContent = line;
    box.appendChild(p);
  }
  drawExtra(points || []);
}

function renderExtra(state) {
  const panel = state.panel;
  if (panel === 'nearby') {
    if (!facilityPack) {
      fillExtra('就近', ['讀緊設施擷取…']);
      return;
    }
    const rows = rankFacilities(facilityPack.places, state.origin, facilityFilter, 5);
    const lines = [
      `內容時間 ${facilityPack.contentTime || '未知'}，下載時間 ${facilityPack.retrievedAt || '未知'}。${facilityPack.completeness}`,
      ...rows.map((row) => `${row.categoryLabel} · ${row.name} · 直線約 ${row.rankMetres} 米（唔係行路時間）`)
    ];
    if (!rows.length) lines.push('呢個分類喺擷取入面搵唔到。');
    fillExtra('就近設施', lines, rows);
    const filters = document.createElement('div');
    filters.className = 'chips';
    for (const filter of FACILITY_FILTERS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = filter.label;
      btn.addEventListener('click', () => {
        facilityFilter = filter.id;
        render();
      });
      filters.appendChild(btn);
    }
    $('panel-extra').appendChild(filters);
    return;
  }
  if (panel === 'weather') {
    const model = weatherView?.message || '天氣模式讀緊…';
    fillExtra('天氣', [officialWeatherLine().text, model]);
    return;
  }
  if (panel === 'rain') {
    fillExtra('雨勢', [radarView?.message || '雷達讀緊…']);
    return;
  }
  if (panel === 'tide') {
    fillExtra('潮候', [OFFICIAL_TIDE.text, tideView?.message || '水位模式讀緊…']);
    return;
  }
  if (panel === 'terrain') {
    if (!landmarkPack) {
      fillExtra('地勢', ['讀緊地標…']);
      return;
    }
    const rows = nearestLandmarks(landmarkPack.items, state.origin, 5);
    fillExtra('地勢', [landmarkPack.note, ...rows.map((row) => `${row.name} · ${row.kind} · ${row.heightText}`)], rows);
    return;
  }
  if (panel === 'park') {
    if (!parkPack) {
      fillExtra('泊車', ['讀緊停車場…']);
      return;
    }
    const rows = rankParks(parkPack.parks, state.destination, 4);
    const when = parkPack.retrievedAt || '未知日期';
    const featured = parkPack.featured;
    const walkLine = !featured
      ? '最近一個場嘅行人路徑計緊。'
      : featured.walkMinutes == null
        ? `${featured.name} 去終點嘅行人路徑暫時計唔到。`
        : `${featured.name} 去終點，行人路徑約 ${featured.walkMinutes} 分鐘。`;
    fillExtra(
      '泊車再行',
      [
        `停車場擷取時間 ${when}。官方車位讀唔到，所以冇空位數字。直線只係用嚟揀場。`,
        walkLine,
        ...rows.map((row) => `${row.name} · 直線約 ${row.rankMetres} 米`)
      ],
      rows
    );
  }
}

function drawExtra(points) {
  for (const marker of extraMarkers) marker.remove();
  extraMarkers.length = 0;
  if (!map || !points.length) return;
  for (const point of points) {
    const el = document.createElement('div');
    el.className = 'pin board';
    el.textContent = '點';
    const marker = new maplibregl.Marker({ element: el }).setLngLat([point.lon, point.lat]).addTo(map);
    extraMarkers.push(marker);
  }
}

function syncRadar(state) {
  if (!map || !map.getSource) return;
  const show = state.panel === 'rain' && radarView?.available && radarView.tileUrl;
  if (map.getLayer('radar-layer')) map.setLayoutProperty('radar-layer', 'visibility', show ? 'visible' : 'none');
  if (!show || !map.isStyleLoaded()) return;
  const spec = radarView.source;
  if (map.getSource('radar')) {
    const source = map.getSource('radar');
    if (typeof source.setTiles === 'function') source.setTiles(spec.tiles);
    return;
  }
  map.addSource('radar', spec);
  map.addLayer({
    id: 'radar-layer',
    type: 'raster',
    source: 'radar',
    paint: { 'raster-opacity': 0.72 }
  });
}

async function loadPanel(state) {
  if (forceFail) {
    weatherView = { message: '示範：天氣模式當咗失敗。' };
    radarView = { available: false, message: '示範：雷達當咗失敗。' };
    tideView = { message: '示範：水位模式當咗失敗。' };
    render();
    return;
  }
  const panel = state.panel;
  try {
    if (panel === 'nearby' && !facilityPack) facilityPack = await loadFacilities();
    if (panel === 'weather') weatherView = await loadModelWeather(state.origin.lat, state.origin.lon);
    if (panel === 'rain') radarView = await loadRadar();
    if (panel === 'tide') tideView = await loadMarine(state.origin.lat, state.origin.lon);
    if (panel === 'terrain' && !landmarkPack) landmarkPack = await loadLandmarks();
    if (panel === 'park') {
      if (!parkPack) parkPack = await loadParks();
      const destKey = `${state.destination.lat},${state.destination.lon}`;
      if (parkPack && parkPack.routedFor !== destKey) {
        parkPack.routedFor = destKey;
        const top = rankParks(parkPack.parks, state.destination, 1)[0];
        if (top) {
          const walk = await planWalk(top, state.destination);
          parkPack.featured = {
            ...top,
            walkMinutes: walk?.ok ? walk.options[0].durationMinutes : null
          };
        }
      }
    }
  } catch {
    if (panel === 'nearby') facilityPack = { places: [], contentTime: null, retrievedAt: null, completeness: '設施擷取讀唔到。' };
    if (panel === 'terrain') landmarkPack = { items: [], note: '地標讀唔到。' };
    if (panel === 'park') parkPack = { parks: [], retrievedAt: null };
  }
  if (trip.getState().panel === panel) render();
}

function renderSources() {
  const walk = plans?.walk?.ok ? activeOption(plans.walk.options, trip.getState().walkIndex) : null;
  if (walk) applyParts(document, $('source-walk'), walkSourceParts(walk));
  else {
    applyParts(document, $('source-walk'), [
      { type: 'text', text: `${plans?.walk?.message || '行人路徑未有結果。'} ` },
      { type: 'link', text: 'FOSSGIS Valhalla', href: 'https://valhalla1.openstreetmap.de' }
    ]);
  }
  applyParts(document, $('source-bus'), busSourceParts(plans?.bus || { provenance: {} }));
  applyParts(document, $('source-smg'), smgSourceParts(smgLine()));
  applyParts(document, $('source-rain'), rainSourceParts(plans?.rain || { show: false, note: '落雨模式預測暫時讀唔到。' }));
  const panel = moduleLine(trip.getState().panel);
  applyParts(document, $('source-module'), panel);
  const rain = $('rain-line');
  if (plans?.rain?.show) {
    rain.hidden = false;
    rain.textContent = `${plans.rain.message}（模式，非官方觀測，唔判斷路滑唔滑。）`;
  } else {
    rain.hidden = true;
    rain.textContent = '';
  }
}

function moduleLine(panel) {
  if (panel === 'rain') {
    return [
      { type: 'text', text: '雷達：' },
      { type: 'link', text: 'RainViewer', href: 'https://www.rainviewer.com/' },
      { type: 'text', text: '。原生圖磚最高 7 級，唔係氣象局。' }
    ];
  }
  if (panel === 'nearby' || panel === 'park' || panel === 'terrain') {
    return [
      { type: 'text', text: '地圖資料：' },
      { type: 'link', text: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' },
      { type: 'text', text: '。' }
    ];
  }
  if (panel === 'tide') {
    return [
      { type: 'text', text: `${OFFICIAL_TIDE.text} ` },
      { type: 'link', text: OFFICIAL_TIDE.linkText, href: OFFICIAL_TIDE.href }
    ];
  }
  return [{ type: 'text', text: '' }];
}

function emptyLine() {
  return { type: 'FeatureCollection', features: [] };
}

function renderMap(state) {
  const legend = $('map-legend');
  const panel = state.panel || 'trip';
  if (panel === 'rain') legend.textContent = '雷達係 RainViewer，圖磚原生只到 7 級，唔係氣象局。';
  else if (panel === 'nearby') legend.textContent = '圓點係設施。直線距離唔係行路時間。';
  else if (panel === 'terrain') legend.textContent = '圓點係地標。高度唔係官方測量。';
  else if (panel === 'park') legend.textContent = '圓點係停車場。空位數字讀唔到。';
  else if (panel === 'tide') legend.textContent = '水位係模式。官方潮汐讀唔到。';
  else if (panel === 'weather') legend.textContent = '氣溫係模式。氣象局 XML 讀唔到。';
  else if (state.mode === 'bus') legend.textContent = plans?.bus?.pathNote || '巴士行車路徑未核對，地圖只標上落站。';
  else if (plans?.walk?.ok) legend.textContent = '綠線或赤線係行人路徑估算，唔係官方測量。';
  else legend.textContent = '地圖未有路線之前，只標起點同終點，中間冇直線當行路。';
  if (!map || !map.getSource('route')) return;
  const walk = panel === 'trip' && state.mode === 'walk' && plans?.walk?.ok
    ? activeOption(plans.walk.options, state.walkIndex)
    : null;
  const bus = state.mode === 'bus' ? activeOption(plans?.bus?.options, state.busIndex) : null;
  if (walk?.geometry?.coordinates?.length > 1) {
    map.getSource('route').setData({ type: 'Feature', properties: {}, geometry: walk.geometry });
    map.setPaintProperty('route-line', 'line-color', walk.role === 'shorter' ? '#8E3B2A' : '#245C45');
  } else {
    map.getSource('route').setData(emptyLine());
  }
  placePin('origin', 'origin', '起', [state.origin.lon, state.origin.lat]);
  placePin('dest', 'dest', '終', [state.destination.lon, state.destination.lat]);
  placePin('board', 'board', '上', bus?.board?.lon != null ? [bus.board.lon, bus.board.lat] : null);
  placePin('alight', 'alight', '落', bus?.alight?.lon != null ? [bus.alight.lon, bus.alight.lat] : null);
  const token = `${trip.planKey()}|${state.mode}|${state.walkIndex}|${state.busIndex}|${document.getElementById('app').dataset.sheet}`;
  if (token !== fittedFor) {
    fittedFor = token;
    fitMap(state, walk, bus);
  }
}

function placePin(key, kind, label, lngLat) {
  if (!pins[key]) {
    const el = document.createElement('div');
    el.className = `pin ${kind}`;
    el.textContent = label;
    pins[key] = new maplibregl.Marker({ element: el, anchor: 'center' });
  }
  if (!lngLat) {
    pins[key].remove();
    return;
  }
  pins[key].setLngLat(lngLat).addTo(map);
}

function fitMap(state, walk, bus) {
  const bounds = new maplibregl.LngLatBounds();
  const add = (lng, lat) => {
    if (Number.isFinite(lng) && Number.isFinite(lat)) bounds.extend([lng, lat]);
  };
  add(state.origin.lon, state.origin.lat);
  add(state.destination.lon, state.destination.lat);
  if (walk?.geometry?.coordinates) {
    for (const pair of walk.geometry.coordinates) add(pair[0], pair[1]);
  }
  if (bus?.board) add(bus.board.lon, bus.board.lat);
  if (bus?.alight) add(bus.alight.lon, bus.alight.lat);
  if (bounds.isEmpty()) return;
  map.fitBounds(bounds, {
    padding: { top: 128, bottom: 28, left: 24, right: 56 },
    maxZoom: 16,
    animate: false
  });
}

function render() {
  const state = trip.getState();
  const root = document.getElementById('app');
  root.dataset.mode = state.mode;
  root.dataset.panel = state.panel || 'trip';
  $('summary-ends').textContent = `${state.origin.name} → ${state.destination.name}`;
  if (document.activeElement !== $('input-origin')) $('input-origin').value = state.origin.name;
  if (document.activeElement !== $('input-destination')) $('input-destination').value = state.destination.name;
  $('geo-status').textContent = state.location.message;
  for (const btn of document.querySelectorAll('.panel-btn')) {
    btn.setAttribute('aria-checked', String(btn.dataset.panel === (state.panel || 'trip')));
  }
  $('mode-walk').setAttribute('aria-checked', String(state.mode === 'walk'));
  $('mode-bus').setAttribute('aria-checked', String(state.mode === 'bus'));
  $('mode-walk').tabIndex = state.mode === 'walk' ? 0 : -1;
  $('mode-bus').tabIndex = state.mode === 'bus' ? 0 : -1;
  $('pick-origin').checked = state.mapPick === 'origin';
  $('pick-destination').checked = state.mapPick === 'destination';
  const walk = plans?.walk?.ok ? activeOption(plans.walk.options, state.walkIndex) : null;
  const bus = plans?.bus?.ok ? activeOption(plans.bus.options, state.busIndex) : null;
  $('walk-min').textContent = walk ? formatMinutes(walk.durationMinutes, true) : (plans?.walk ? '未能計' : '計緊');
  if (bus) $('bus-min').textContent = bus.routeName;
  else if (plans?.bus?.status === 'none') $('bus-min').textContent = '無班次';
  else if (plans?.bus?.status === 'failed') $('bus-min').textContent = '讀唔到';
  else $('bus-min').textContent = '計緊';
  $('demo-banner').hidden = !forceFail;
  const tripPanel = (state.panel || 'trip') === 'trip';
  renderVariants(state);
  renderBus(state);
  $('walk-block').hidden = !tripPanel || state.mode !== 'walk';
  $('bus-block').hidden = !tripPanel || state.mode !== 'bus';
  $('panel-extra').hidden = tripPanel;
  if (!tripPanel) renderExtra(state);
  else drawExtra([]);
  renderSources();
  renderMap(state);
  syncRadar(state);
}

async function refresh() {
  const id = ++requestId;
  const state = trip.getState();
  const key = trip.planKey();
  $('status').hidden = false;
  $('status').textContent = forceFail ? '示範：而家模擬來源失敗' : '計緊呢一程…';
  const next = await loadPlans(state.origin, state.destination, { forceFail });
  if (id !== requestId || trip.planKey() !== key) return;
  plans = next;
  $('status').hidden = true;
  $('live-bus').textContent = '';
  render();
  const bus = activeOption(plans.bus?.options, trip.getState().busIndex);
  busAccess = null;
  if (!forceFail && bus?.board && bus?.alight) {
    const access = await routeBusAccess(state.origin, state.destination, bus, planWalk);
    if (id !== requestId) return;
    busAccess = access;
    render();
  }
  if (forceFail) {
    $('live-bus').textContent = '示範：即時巴士位置當咗失敗。';
    return;
  }
  if (!bus) return;
  if (bus.dir == null || String(bus.routeName).includes('轉')) {
    $('live-bus').textContent = '呢個組合唔查即時位置。到站分鐘仍然唔估。';
    return;
  }
  const live = await planLive(bus.routeName, bus.dir);
  if (id !== requestId) return;
  $('live-bus').textContent = live.message;
}

function bind() {
  const list = $('place-list');
  const chips = $('chips');
  for (const place of PLACES) {
    const opt = document.createElement('option');
    opt.value = place.name;
    list.appendChild(opt);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = place.name;
    chip.addEventListener('click', () => {
      if (trip.getState().mapPick === 'origin') trip.setOrigin(place);
      else trip.setDestination(place);
    });
    chips.appendChild(chip);
  }
  const take = (input, set) => {
    const place = findPlace(input.value);
    if (place) set(place);
    else $('geo-status').textContent = '清單未有呢個名。請揀地點，或者點地圖。';
  };
  $('input-origin').addEventListener('change', () => take($('input-origin'), (p) => trip.setOrigin(p)));
  $('input-destination').addEventListener('change', () => take($('input-destination'), (p) => trip.setDestination(p)));
  $('btn-swap').addEventListener('click', () => trip.swap());
  $('btn-locate').addEventListener('click', async () => {
    const reading = await readGeolocation(navigator.geolocation);
    applyGeoToTrip(trip, reading);
  });
  $('mode-walk').addEventListener('click', () => trip.setMode('walk'));
  $('mode-bus').addEventListener('click', () => trip.setMode('bus'));
  $('modes').addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = trip.getState().mode === 'walk' ? 'bus' : 'walk';
    trip.setMode(next);
    $(next === 'walk' ? 'mode-walk' : 'mode-bus').focus();
  });
  $('pick-origin').addEventListener('change', () => trip.setMapPick('origin'));
  $('pick-destination').addEventListener('change', () => trip.setMapPick('destination'));
  $('btn-map').addEventListener('click', () => {
    const now = document.getElementById('app').dataset.sheet;
    setSheet(now === 'map' ? 'peek' : 'map');
  });
  const panels = $('panels');
  for (const mod of MODULES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-btn';
    btn.dataset.panel = mod.id;
    btn.textContent = mod.title;
    btn.setAttribute('role', 'radio');
    btn.addEventListener('click', () => trip.setPanel(mod.id));
    panels.appendChild(btn);
  }
  $('btn-detail').addEventListener('click', () => {
    const now = document.getElementById('app').dataset.sheet;
    setSheet(now === 'open' ? 'peek' : 'open');
  });
}

function initMap() {
  const container = $('map');
  if (!webglOk() || typeof maplibregl === 'undefined') {
    const p = document.createElement('p');
    p.className = 'map-fallback';
    p.textContent = '呢部機顯示唔到地圖。下面嘅比較仍然用得。';
    container.appendChild(p);
    return;
  }
  map = new maplibregl.Map({
    container,
    style: '../ce-lou/data/style.json',
    center: [113.545, 22.195],
    zoom: 14.2,
    maxBounds: [[113.48, 22.06], [113.65, 22.23]],
    attributionControl: { compact: true }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.on('load', () => {
    map.addSource('route', { type: 'geojson', data: emptyLine() });
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#245C45', 'line-width': 4, 'line-opacity': 0.92 }
    });
    render();
  });
  map.on('click', (event) => {
    const judged = evaluateCoordinate(event.lngLat.lat, event.lngLat.lng);
    if (!judged.isValid) {
      $('geo-status').textContent = '呢點超出澳門同附近範圍，無改到。';
      return;
    }
    const place = {
      id: 'map-point',
      name: '地圖上嘅點',
      lat: event.lngLat.lat,
      lon: event.lngLat.lng,
      source: 'map-tap'
    };
    if (trip.getState().mapPick === 'origin') trip.setOrigin(place);
    else trip.setDestination(place);
  });
}

bind();
initMap();
let lastKey = '';
trip.subscribe(() => {
  const key = trip.planKey();
  const state = trip.getState();
  if (key !== lastKey) {
    lastKey = key;
    refresh();
  } else {
    render();
  }
  if (state.panel !== 'trip') loadPanel(state);
});
lastKey = trip.planKey();
refresh();
