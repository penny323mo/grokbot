/**
 * app.js - Main coordinator for 就近 (Just Around)
 * Mobile-first civic wayfinding utility for Macau & Hong Kong
 * Nightly 2026-11-11 · Static web (no build step needed)
 */

import { DEFAULT_ORIGIN, isHongKong, isMacau, getBbox, formatMacauDateTime, formatMacauTimeOnly } from './geo.js';
import { CATEGORIES, CATEGORY_KEYS, parseOverpassOrSnapshot, filterAndSortPlaces, formatPlaceDetails } from './places.js';
import { parseWeather } from './weather.js';
import { joinHkCarparks, formatHkTime } from './hk-parking.js';
import { getIconSvg } from './icons.js';
import { AppMap } from './map.js';

export const LOCATION_ERROR_MESSAGES = {
  PERMISSION_DENIED: '定位未獲授權，你可以重試，或用議事亭前地做起點',
  POSITION_UNAVAILABLE: '暫時未能獲取位置（訊號未能定位），你可以重試，或用議事亭前地做起點',
  TIMEOUT: '定位逾時（訊號較弱），你可以重試，或用議事亭前地做起點',
  UNSUPPORTED: '瀏覽器未支援定位功能，已預設用議事亭前地做起點',
  INSECURE_CONTEXT: '需在安全連線（HTTPS）下使用定位，已預設用議事亭前地做起點',
  UNKNOWN: '暫時未能獲取位置，你可以重試，或用議事亭前地做起點'
};

export class App {
  constructor() {
    this.currentOrigin = { ...DEFAULT_ORIGIN };
    this.userGpsLocation = null;
    this.isLocating = false;
    this.activeCategory = 'all';
    this.allPlaces = [];
    this.filteredPlaces = [];
    this.selectedPlace = null;
    this.isUsingSnapshot = true;
    this.liveOsmFailed = false;
    this.isLiveOsmPending = false;
    this.snapshotIsoTime = '2026-11-10T09:08:00Z';
    this.liveOsmTimestamp = null;

    this.map = null;
    this.sheetState = 'peek'; // 'peek', 'half', 'full'

    this.dom = {};
  }

  init() {
    this.bindDom();
    this.initCategoryRail();
    this.initEventListeners();
    this.initMap();
    this.loadSnapshot();
    this.loadWeather();
  }

  bindDom() {
    this.dom = {
      appContainer: document.querySelector('.app-container'),
      weatherStrip: document.getElementById('weather-strip'),
      originLabel: document.getElementById('origin-label'),
      btnLocate: document.getElementById('btn-locate'),
      btnLocateText: document.querySelector('.btn-locate-text'),
      btnRecenter: document.getElementById('btn-recenter'),
      categoryRail: document.getElementById('category-rail'),
      mapContainer: document.getElementById('map-container'),
      mapFallback: document.getElementById('map-fallback'),
      bottomSheet: document.getElementById('bottom-sheet'),
      sheetHandle: document.getElementById('sheet-handle'),
      placeListContainer: document.getElementById('place-list-container'),
      placeList: document.getElementById('place-list'),
      placeDetail: document.getElementById('place-detail'),
      detailContent: document.getElementById('detail-content'),
      btnDetailBack: document.getElementById('btn-detail-back'),
      dataSourceNotice: document.getElementById('data-source-notice')
    };
  }

  initCategoryRail() {
    this.dom.categoryRail.innerHTML = '';
    for (const key of CATEGORY_KEYS) {
      const cat = CATEGORIES[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `category-chip ${key === this.activeCategory ? 'is-active' : ''}`;
      btn.dataset.category = key;
      btn.innerHTML = `
        <span class="category-chip-icon">${getIconSvg(cat.icon)}</span>
        <span class="category-chip-label">${cat.label}</span>
      `;
      btn.addEventListener('click', () => this.setCategory(key));
      this.dom.categoryRail.appendChild(btn);
    }
  }

  initEventListeners() {
    // Locate button (Item 12: Preserve icon)
    this.dom.btnLocate.addEventListener('click', () => this.requestGeolocation());

    // Delegated click for default origin button in origin line
    if (this.dom.originLabel) {
      this.dom.originLabel.addEventListener('click', (e) => {
        const btn = e.target && (e.target.id === 'btn-default-origin' || (e.target.closest && e.target.closest('#btn-default-origin, .btn-default-origin')));
        if (btn) {
          if (e.preventDefault) e.preventDefault();
          this.resetToDefaultOrigin();
        }
      });
    }

    // Recenter button
    this.dom.btnRecenter.addEventListener('click', () => {
      const target = this.userGpsLocation || this.currentOrigin;
      this.setOrigin(target);
      if (this.map) {
        this.map.centerOn(target.lat, target.lon, 16);
      }
    });

    // Detail back button
    this.dom.btnDetailBack.addEventListener('click', () => this.closeDetail());

    // Bottom sheet drag / toggle (Item 19: Keyboard accessibility)
    const toggleSheet = () => {
      if (this.sheetState === 'peek') {
        this.setSheetState('half');
      } else if (this.sheetState === 'half') {
        this.setSheetState('full');
      } else {
        this.setSheetState('peek');
      }
    };

    this.dom.sheetHandle.addEventListener('click', toggleSheet);
    this.dom.sheetHandle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSheet();
      }
    });

    // Keyboard accessibility: Escape closes detail
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.selectedPlace) {
        this.closeDetail();
      }
    });
  }

  initMap() {
    this.map = new AppMap({
      container: this.dom.mapContainer,
      fallbackContainer: this.dom.mapFallback,
      initialOrigin: this.currentOrigin,
      onSelectPlace: (place) => this.selectPlace(place),
      onOriginChange: (newOrigin) => {
        this.setOrigin(newOrigin);
      }
    });
  }

  async loadSnapshot() {
    try {
      const res = await fetch('data/snapshot-macau.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const parsed = parseOverpassOrSnapshot(data, true);
      this.allPlaces = parsed.places;
      this.isUsingSnapshot = true;
      if (parsed.fetchedAt) {
        this.snapshotIsoTime = parsed.fetchedAt;
      }
      this.updateDataNotice();
      this.render();

      // Attempt live Overpass query in background
      this.tryLiveOverpass();

      // If user is in HK, fetch HK carparks
      if (isHongKong(this.currentOrigin.lat, this.currentOrigin.lon)) {
        this.fetchHkCarparks();
      }
    } catch (err) {
      console.warn('Could not load snapshot:', err);
      // Item 19: Cantonese error string
      this.dom.dataSourceNotice.textContent = '地點存檔暫時讀唔到';
    }
  }

  async tryLiveOverpass() {
    const origin = this.currentOrigin;
    const originLat = origin.lat;
    const originLon = origin.lon;
    this.isLiveOsmPending = true;
    const bbox = getBbox(originLat, originLon, 1.5);
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.osm.ch/api/interpreter'
    ];

    const q = `[out:json][timeout:8];(node["amenity"~"toilets|parking|parking_entrance|drinking_water|pharmacy|clinic|hospital|doctors|defibrillator"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});way["amenity"~"toilets|parking|parking_entrance|drinking_water|pharmacy|clinic|hospital|doctors|defibrillator"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});node["emergency"="defibrillator"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}););out center tags;`;

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        if (typeof timeoutId?.unref === 'function') {
          timeoutId.unref();
        }

        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(q),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          // Item 1 fix: Ignore response if origin moved while fetching
          if (this.currentOrigin.lat !== originLat || this.currentOrigin.lon !== originLon) {
            return;
          }
          const parsed = parseOverpassOrSnapshot(json, false);
          if (parsed.places.length > 0) {
            // Item 1 fix: Merge live places with snapshot places AND preserve existing hk-carpark/* entries
            const liveMap = new Map(parsed.places.map(p => [p.id, p]));
            const merged = [...parsed.places];
            for (const sp of this.allPlaces) {
              if (sp.id.startsWith('hk-carpark/')) {
                merged.push(sp);
              } else if (!liveMap.has(sp.id)) {
                merged.push(sp);
              }
            }
            this.allPlaces = merged;
            this.isUsingSnapshot = false;
            this.liveOsmFailed = false;
            this.isLiveOsmPending = false;
            this.liveOsmTimestamp = parsed.fetchedAt || new Date().toISOString();
            this.updateDataNotice();
            this.render();
            return;
          }
        }
      } catch (e) {
        // Continue to next endpoint or fallback to snapshot
      }
    }

    // Ignore response if origin moved while fetching
    if (this.currentOrigin.lat !== originLat || this.currentOrigin.lon !== originLon) {
      return;
    }

    // Keep snapshot & flag that live query failed
    this.isUsingSnapshot = true;
    this.liveOsmFailed = true;
    this.isLiveOsmPending = false;
    this.updateDataNotice();
    this.render();
  }

  async fetchHkCarparks() {
    const originLat = this.currentOrigin.lat;
    const originLon = this.currentOrigin.lon;
    try {
      const [infoRes, vacRes] = await Promise.all([
        fetch('https://api.data.gov.hk/v1/carpark-info-vacancy?data=info&lang=zh_TW'),
        fetch('https://api.data.gov.hk/v1/carpark-info-vacancy?data=vacancy&vehicleTypes=privateCar&lang=zh_TW')
      ]);

      // Item 1 fix: Ignore response if origin moved while fetching
      if (this.currentOrigin.lat !== originLat || this.currentOrigin.lon !== originLon) {
        return;
      }

      if (infoRes.ok) {
        const info = await infoRes.json();
        const vac = vacRes.ok ? await vacRes.json() : null;

        if (this.currentOrigin.lat !== originLat || this.currentOrigin.lon !== originLon) {
          return;
        }

        const hkPlaces = joinHkCarparks(info, vac);
        if (hkPlaces.length > 0) {
          // Replace hk-carpark/* entries instead of concatenating repeatedly
          this.allPlaces = this.allPlaces.filter(p => !p.id.startsWith('hk-carpark/')).concat(hkPlaces);
          this.render();
        }
      }
    } catch (e) {
      console.warn('HK carpark fetch error:', e);
    }
  }

  async loadWeather() {
    const lat = this.currentOrigin.lat;
    const lon = this.currentOrigin.lon;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation,apparent_temperature,relative_humidity_2m,wind_speed_10m&hourly=precipitation,precipitation_probability&forecast_hours=2&timezone=Asia%2FMacau`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,us_aqi,european_aqi&timezone=Asia%2FMacau`;

    try {
      const [wRes, aRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(airUrl).catch(() => null)
      ]);

      if (this.currentOrigin.lat !== lat || this.currentOrigin.lon !== lon) {
        return;
      }

      if (!wRes.ok) throw new Error('Weather fetch failed');
      const wJson = await wRes.json();
      const aJson = aRes && aRes.ok ? await aRes.json() : null;

      if (this.currentOrigin.lat !== lat || this.currentOrigin.lon !== lon) {
        return;
      }

      const weather = parseWeather(wJson, aJson);
      // Item 5 fix: Render 2-line typographic weather strip
      if (weather && weather.line1) {
        this.dom.weatherStrip.innerHTML = `
          <div class="weather-strip-main">${escapeHtml(weather.line1)}</div>
          <div class="weather-strip-meta">${escapeHtml(weather.line2)}</div>
        `;
      } else {
        this.dom.weatherStrip.textContent = '天氣暫時讀唔到';
      }
    } catch (err) {
      this.dom.weatherStrip.textContent = '天氣暫時讀唔到';
    }
  }

  requestGeolocation(options = {}) {
    if (this.isLocating) {
      return; // prevent duplicate clicks while request in flight
    }

    // Insecure context check
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      this.handleLocationError({ code: 'INSECURE_CONTEXT' });
      return;
    }

    // Check navigator.geolocation
    const navGeo = options.geolocation || (typeof navigator !== 'undefined' ? navigator.geolocation : null);
    if (!navGeo || typeof navGeo.getCurrentPosition !== 'function') {
      this.handleLocationError({ code: 'UNSUPPORTED' });
      return;
    }

    this.isLocating = true;
    if (this.dom.btnLocateText) {
      this.dom.btnLocateText.textContent = '讀取緊…';
    }
    if (this.dom.btnLocate) {
      this.dom.btnLocate.setAttribute('aria-busy', 'true');
    }
    if (this.dom.originLabel) {
      this.dom.originLabel.textContent = '正在獲取你嘅位置…';
    }

    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: options.timeout || 10000,
      maximumAge: options.maximumAge !== undefined ? options.maximumAge : 30000
    };

    const handleSuccess = (pos) => {
      this.isLocating = false;
      if (this.dom.btnLocateText) {
        this.dom.btnLocateText.textContent = '用我嘅位置';
      }
      if (this.dom.btnLocate) {
        this.dom.btnLocate.removeAttribute('aria-busy');
        this.dom.btnLocate.disabled = false;
      }

      const lat = Number(pos.coords.latitude.toFixed(6));
      const lon = Number(pos.coords.longitude.toFixed(6));

      this.userGpsLocation = {
        lat,
        lon,
        name: '你嘅位置',
        isDefault: false,
        description: '以你嘅實際定位為起點'
      };

      this.setOrigin(this.userGpsLocation);
      if (this.map) {
        this.map.centerOn(lat, lon, 16);
      }
    };

    const handleError = (err) => {
      // If high accuracy timed out and fallback not attempted yet, try low accuracy (cell/wifi)
      if (err && err.code === 3 && highAccuracyOptions.enableHighAccuracy && !options.disableFallback) {
        console.warn('High accuracy geolocation timed out, trying standard accuracy fallback...');
        navGeo.getCurrentPosition(
          handleSuccess,
          (fallbackErr) => {
            this.handleLocationError(fallbackErr);
          },
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000
          }
        );
        return;
      }

      this.handleLocationError(err);
    };

    // Invoke directly from user gesture without dropping gesture context
    navGeo.getCurrentPosition(handleSuccess, handleError, highAccuracyOptions);
  }

  handleLocationError(err) {
    this.isLocating = false;
    if (this.dom.btnLocateText) {
      this.dom.btnLocateText.textContent = '用我嘅位置';
    }
    if (this.dom.btnLocate) {
      this.dom.btnLocate.removeAttribute('aria-busy');
      this.dom.btnLocate.disabled = false;
    }

    let errorKey = 'UNKNOWN';
    if (err) {
      if (err.code === 1 || err.code === 'PERMISSION_DENIED') {
        errorKey = 'PERMISSION_DENIED';
      } else if (err.code === 2 || err.code === 'POSITION_UNAVAILABLE') {
        errorKey = 'POSITION_UNAVAILABLE';
      } else if (err.code === 3 || err.code === 'TIMEOUT') {
        errorKey = 'TIMEOUT';
      } else if (err.code === 'UNSUPPORTED') {
        errorKey = 'UNSUPPORTED';
      } else if (err.code === 'INSECURE_CONTEXT') {
        errorKey = 'INSECURE_CONTEXT';
      }
    }

    const rawMessage = LOCATION_ERROR_MESSAGES[errorKey] || LOCATION_ERROR_MESSAGES.UNKNOWN;
    if (this.dom.originLabel) {
      if (rawMessage.includes('議事亭前地')) {
        const html = rawMessage.replace(
          '議事亭前地',
          '<button type="button" class="btn-default-origin" id="btn-default-origin" aria-label="用議事亭前地做起點">議事亭前地</button>'
        );
        this.dom.originLabel.innerHTML = html;
      } else {
        this.dom.originLabel.textContent = rawMessage;
      }
    }

    // Default origin fallback remains active/available
    if (!this.currentOrigin) {
      this.setOrigin(DEFAULT_ORIGIN);
    }
  }

  resetToDefaultOrigin() {
    this.userGpsLocation = null;
    this.setOrigin(DEFAULT_ORIGIN);
    if (this.map) {
      this.map.centerOn(DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lon, 15.5);
    }
  }

  setOrigin(origin) {
    this.currentOrigin = origin;
    this.liveOsmFailed = false;
    this.isLiveOsmPending = true;
    if (this.dom.originLabel) {
      if (origin.isDefault) {
        this.dom.originLabel.textContent = origin.description || origin.name;
      } else {
        const desc = origin.description || origin.name;
        this.dom.originLabel.innerHTML = `${desc} · <button type="button" class="btn-default-origin" id="btn-default-origin" aria-label="返回議事亭前地">用議事亭前地</button>`;
      }
    }
    if (this.map) {
      this.map.updateOriginMarker(origin);
    }

    // Refetch weather, Overpass & HK carparks on origin move
    this.loadWeather();
    this.tryLiveOverpass();

    if (isHongKong(origin.lat, origin.lon)) {
      this.fetchHkCarparks();
    }

    this.render();
  }

  setCategory(category) {
    this.activeCategory = category;
    const chips = this.dom.categoryRail.querySelectorAll('.category-chip');
    chips.forEach(chip => {
      if (chip.dataset.category === category) {
        chip.classList.add('is-active');
      } else {
        chip.classList.remove('is-active');
      }
    });
    this.render();
  }

  render() {
    // Item 2 fix: Cap to 2 km (2000m) around origin
    this.filteredPlaces = filterAndSortPlaces(
      this.allPlaces,
      this.activeCategory,
      this.currentOrigin,
      2000
    );

    if (this.map) {
      this.map.renderPlaceMarkers(this.filteredPlaces);
    }

    this.renderPlaceList();
  }

  renderPlaceList() {
    this.dom.placeList.innerHTML = '';

    if (this.filteredPlaces.length === 0) {
      const inHK = isHongKong(this.currentOrigin.lat, this.currentOrigin.lon);
      const inMacau = isMacau(this.currentOrigin.lat, this.currentOrigin.lon);
      const isOutside = !inMacau && !inHK;

      let emptySub;
      if (isOutside) {
        emptySub = '目前起點不在澳門或香港快照覆蓋範圍內（2 公里內未有設施），請選擇澳門或香港範圍。';
      } else if (inHK && this.isLiveOsmPending) {
        emptySub = '搵緊附近設施…';
      } else if (inHK && (this.liveOsmFailed || this.isUsingSnapshot)) {
        emptySub = '澳門離線快照覆蓋唔到呢度，即時查詢未成功';
      } else {
        emptySub = '試下切換其他類別，或者喺地圖點擊其他位置起步。';
      }

      this.dom.placeList.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-title">呢個範圍（2 公里內）暫時搵唔到相關設施</p>
          <p class="empty-state-subtitle">${emptySub}</p>
        </div>
      `;
      return;
    }

    // Item 14 fix: Render full set up to 80 items with "仲有 N 個" footer if capped
    const displayCap = 80;
    const displayList = this.filteredPlaces.slice(0, displayCap);

    for (const place of displayList) {
      const row = document.createElement('div');
      row.className = `place-row ${this.selectedPlace?.id === place.id ? 'is-selected' : ''}`;
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');

      let tagHint = '';
      if (place.tags) {
        if (place.tags.access === 'private' || place.tags.access === 'no') {
          tagHint = '<span class="place-badge place-badge-warn">非公開</span>';
        } else if (place.tags.opening_hours === '24/7') {
          tagHint = '<span class="place-badge">24 小時開放</span>';
        } else if (place.tags.fee === 'no' || place.tags.fee === 'free') {
          tagHint = '<span class="place-badge">免費</span>';
        } else if (place.tags['toilets:wheelchair'] === 'yes' || place.tags.wheelchair === 'yes') {
          tagHint = '<span class="place-badge">無障礙</span>';
        } else if (place.hkData && typeof place.hkData.vacancyCount === 'number') {
          tagHint = `<span class="place-badge place-badge-vac">${place.hkData.vacancyCount} 個空位</span>`;
        }
      }

      // Item 16: Format walk minutes with '約 N 分鐘'
      row.innerHTML = `
        <div class="place-row-icon place-marker-${place.category}">
          ${getIconSvg(place.category)}
        </div>
        <div class="place-row-info">
          <div class="place-row-name">${escapeHtml(place.name)}</div>
          <div class="place-row-meta">
            <span class="place-row-cat">${place.categoryLabel}</span>
            ${tagHint}
          </div>
        </div>
        <div class="place-row-distance">
          <div class="place-row-minutes">${place.walkMinutesFormatted}</div>
          <div class="place-row-meters">${place.distanceFormatted}</div>
        </div>
      `;

      row.addEventListener('click', () => {
        this.selectPlace(place);
        if (this.map) {
          this.map.centerOn(place.lat, place.lon, 16.5);
        }
      });

      this.dom.placeList.appendChild(row);
    }

    // Item 14: If capped, show remaining count
    if (this.filteredPlaces.length > displayCap) {
      const moreRow = document.createElement('div');
      moreRow.className = 'place-list-more';
      moreRow.textContent = `仲有 ${this.filteredPlaces.length - displayCap} 個設施（2 公里範圍內）`;
      this.dom.placeList.appendChild(moreRow);
    }
  }

  selectPlace(place) {
    this.selectedPlace = place;
    if (this.map) {
      this.map.selectPlace(place.id);
    }

    // Highlight row
    const rows = this.dom.placeList.querySelectorAll('.place-row');
    rows.forEach(r => r.classList.remove('is-selected'));

    const details = formatPlaceDetails(place, this.currentOrigin, place.hkData?.vacancyText);
    this.renderDetailSheet(details);
    this.openDetail();
  }

  renderDetailSheet(details) {
    let detailsHtml = `
      <div class="detail-header">
        <div class="detail-category-badge place-marker-${details.category}">
          ${getIconSvg(details.category)}
          <span>${details.categoryLabel}</span>
        </div>
        <h2 class="detail-name">${escapeHtml(details.name)}</h2>
        <div class="detail-walk-summary">
          <div class="detail-minutes">${details.walkMinutesFormatted}</div>
          <div class="detail-dist">距離起點 ${details.distanceFormatted}</div>
        </div>
      </div>

      <div class="detail-attributes">
    `;

    // HK Vacancy
    if (details.parkingVacancy) {
      detailsHtml += `
        <div class="detail-attr-item detail-attr-highlight">
          <span class="detail-attr-label">車位情況</span>
          <span class="detail-attr-val">${escapeHtml(details.parkingVacancy)}</span>
        </div>
      `;
    }

    // Access restrictions (Item 17)
    if (details.accessText) {
      detailsHtml += `
        <div class="detail-attr-item detail-attr-highlight">
          <span class="detail-attr-label">使用權限</span>
          <span class="detail-attr-val">${escapeHtml(details.accessText)}</span>
        </div>
      `;
    }

    // Current opening status (Item 4 fix: row labelled 而家)
    if (details.openingStatusText) {
      detailsHtml += `
        <div class="detail-attr-item">
          <span class="detail-attr-label">而家</span>
          <span class="detail-attr-val">${escapeHtml(details.openingStatusText)}</span>
        </div>
      `;
    }

    // Opening Hours (Item 13 & 17)
    if (details.openingHoursText) {
      detailsHtml += `
        <div class="detail-attr-item">
          <span class="detail-attr-label">開放時間</span>
          <span class="detail-attr-val">${escapeHtml(details.openingHoursText)}</span>
        </div>
      `;
    } else {
      detailsHtml += `
        <div class="detail-attr-item detail-attr-muted">
          <span class="detail-attr-label">開放時間</span>
          <span class="detail-attr-val">未有呢項資料</span>
        </div>
      `;
    }

    // Wheelchair
    if (details.wheelchairText) {
      detailsHtml += `
        <div class="detail-attr-item">
          <span class="detail-attr-label">無障礙</span>
          <span class="detail-attr-val">${escapeHtml(details.wheelchairText)}</span>
        </div>
      `;
    }

    // Fee
    if (details.feeText) {
      detailsHtml += `
        <div class="detail-attr-item">
          <span class="detail-attr-label">收費</span>
          <span class="detail-attr-val">${escapeHtml(details.feeText)}</span>
        </div>
      `;
    }

    // Water bottle
    if (details.bottleRefillText) {
      detailsHtml += `
        <div class="detail-attr-item">
          <span class="detail-attr-label">自備水樽</span>
          <span class="detail-attr-val">${escapeHtml(details.bottleRefillText)}</span>
        </div>
      `;
    }

    // Operator
    if (details.operator) {
      detailsHtml += `
        <div class="detail-attr-item">
          <span class="detail-attr-label">營運機構</span>
          <span class="detail-attr-val">${escapeHtml(details.operator)}</span>
        </div>
      `;
    }

    // Phone
    if (details.phone) {
      detailsHtml += `
        <div class="detail-attr-item">
          <span class="detail-attr-label">聯絡電話</span>
          <span class="detail-attr-val"><a href="tel:${escapeHtml(details.phone)}">${escapeHtml(details.phone)}</a></span>
        </div>
      `;
    }

    // Source info (Item 1 fix: HK carparks always credit Transport Dept even when vacancy is unpublished)
    let sourceLabel = '';
    if (details.id && details.id.startsWith('hk-carpark/')) {
      const timeStr = details.lastUpdate ? formatHkTime(details.lastUpdate) : '';
      sourceLabel = timeStr ? `香港政府 data.gov.hk／運輸署（${timeStr} 更新）` : '香港政府 data.gov.hk／運輸署';
    } else if (this.isUsingSnapshot) {
      const snapTimeStr = formatMacauDateTime(this.snapshotIsoTime);
      sourceLabel = `OpenStreetMap 離線快照（${snapTimeStr} 擷取）`;
    } else {
      const liveTimeStr = formatMacauTimeOnly(this.liveOsmTimestamp || new Date().toISOString());
      sourceLabel = `OpenStreetMap 即時數據（${liveTimeStr} 澳門時間）`;
    }

    detailsHtml += `
        <div class="detail-attr-item detail-attr-source">
          <span class="detail-attr-label">資料來源</span>
          <span class="detail-attr-val">${escapeHtml(sourceLabel)}</span>
        </div>
      </div>

      <!-- Item 7 fix: Primary Apple Maps + Secondary geo: fallback -->
      <div class="detail-actions">
        <a href="${details.appleMapsUrl}" class="btn-primary btn-navigate" target="_blank" rel="noopener">
          ${getIconSvg('navigate')}
          <span>開始導航</span>
        </a>
        <a href="${details.geoUrl}" class="btn-secondary btn-geo">
          <span>其他地圖</span>
        </a>
      </div>
    `;

    this.dom.detailContent.innerHTML = detailsHtml;
  }

  openDetail() {
    this.dom.placeListContainer.style.display = 'none';
    this.dom.placeDetail.style.display = 'block';
    this.setSheetState('half');
  }

  closeDetail() {
    this.selectedPlace = null;
    if (this.map) {
      this.map.selectPlace(null);
    }
    this.dom.placeDetail.style.display = 'none';
    this.dom.placeListContainer.style.display = 'block';
    this.setSheetState('peek');
  }

  setSheetState(state) {
    this.sheetState = state;
    this.dom.bottomSheet.dataset.state = state;
    // Item 9 fix: Update app container sheet state so recenter button stays clear
    if (this.dom.appContainer) {
      this.dom.appContainer.dataset.sheetState = state;
    }
  }

  updateDataNotice() {
    // Item 6 fix: Attribution with Asia/Macau time
    if (this.isUsingSnapshot) {
      const macauTime = formatMacauDateTime(this.snapshotIsoTime);
      this.dom.dataSourceNotice.textContent = `© OpenStreetMap contributors · OpenFreeMap · 快照 ${macauTime}`;
    } else {
      const liveTime = formatMacauTimeOnly(this.liveOsmTimestamp || new Date().toISOString());
      this.dom.dataSourceNotice.textContent = `© OpenStreetMap contributors · OpenFreeMap · 即時數據（${liveTime} 澳門時間）`;
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Bootstrap on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
  });
}
