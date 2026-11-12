/**
 * app.js · 天色 Tin Sik
 * Main application coordinator: state, data fetch, live geolocate,
 * hourly filmstrip pinning, 7-day accordion, and honest Cantonese UI rendering.
 */

import { PLACES, DEFAULT_PLACE, getPlaceById } from './places.js';
import { findNearestPlace, formatMacauTimeOnly, formatMacauDateTime, getMacauCivilDate, getWeekdayCantonese } from './geo.js';
import { parseOpenMeteoWeather, parseOpenMeteoAir } from './parser-openmeteo.js';
import { parseHkoWarnings, parseHkoObservations } from './parser-hko.js';
import { WEATHER_SVGS } from './weather-codes.js';

class TinSikApp {
  constructor() {
    this.currentPlace = DEFAULT_PLACE;
    this.locationState = {
      status: 'default', // 'default' | 'locating' | 'located' | 'denied' | 'unsupported'
      notice: '而家用澳門半島做起點（未開定位）'
    };
    this.weatherData = null;
    this.airData = null;
    this.hkoWarnings = [];
    this.hkoObservations = null;
    this.pinnedHourlyIndex = null;
    this.expandedDayIndex = null;
    this.isLoading = false;
    this.errorMessage = null;
    this.isOffline = false;
    this.requestId = 0;

    // DOM references
    this.dom = {
      placeNotice: document.getElementById('place-notice'),
      btnLocate: document.getElementById('btn-locate'),
      btnRefresh: document.getElementById('btn-refresh'),
      placeRail: document.getElementById('place-rail'),
      warningBanner: document.getElementById('warning-banner'),
      heroSection: document.getElementById('hero-section'),
      rainRibbonSection: document.getElementById('rain-ribbon-section'),
      filmstripSection: document.getElementById('filmstrip-section'),
      hourlyPinnedBox: document.getElementById('hourly-pinned-box'),
      hourlyTrack: document.getElementById('hourly-track'),
      sevenDaySection: document.getElementById('seven-day-section'),
      sevenDayList: document.getElementById('seven-day-list'),
      uvAirSection: document.getElementById('uv-air-section'),
      footerMeta: document.getElementById('footer-meta'),
      statusToast: document.getElementById('status-toast')
    };
  }

  init() {
    this.renderPlaceRail();
    this.bindEvents();
    this.loadWeatherData(this.currentPlace);
  }

  bindEvents() {
    // Geolocation button
    if (this.dom.btnLocate) {
      this.dom.btnLocate.addEventListener('click', () => this.handleGeolocate());
    }

    // Refresh button
    if (this.dom.btnRefresh) {
      this.dom.btnRefresh.addEventListener('click', () => this.loadWeatherData(this.currentPlace, true));
    }

    // Place switcher
    if (this.dom.placeRail) {
      this.dom.placeRail.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-place-id]');
        if (!btn) return;
        const placeId = btn.getAttribute('data-place-id');
        const nextPlace = getPlaceById(placeId);
        if (nextPlace && nextPlace.id !== this.currentPlace.id) {
          this.currentPlace = nextPlace;
          this.pinnedHourlyIndex = null;
          this.expandedDayIndex = null;
          this.locationState = {
            status: 'selected',
            notice: `已選擇${nextPlace.name}`
          };
          this.renderPlaceRail();
          this.renderNotice();
          this.loadWeatherData(this.currentPlace);
        }
      });
    }
  }

  renderNotice() {
    if (this.dom.placeNotice) {
      this.dom.placeNotice.textContent = this.locationState.notice;
    }
  }

  renderPlaceRail() {
    if (!this.dom.placeRail) return;
    this.dom.placeRail.innerHTML = PLACES.map(p => {
      const isSelected = p.id === this.currentPlace.id;
      return `
        <button type="button"
          class="place-chip ${isSelected ? 'active' : ''}"
          data-place-id="${p.id}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
          title="${p.name} · ${p.territoryName}">
          ${p.name}
        </button>
      `;
    }).join('');
  }

  async handleGeolocate() {
    if (!navigator.geolocation) {
      this.currentPlace = DEFAULT_PLACE;
      this.pinnedHourlyIndex = null;
      this.expandedDayIndex = null;
      this.locationState = {
        status: 'default',
        notice: '而家用澳門半島做起點（未開定位）'
      };
      this.renderPlaceRail();
      this.renderNotice();
      this.loadWeatherData(this.currentPlace);
      return;
    }

    this.locationState = {
      status: 'locating',
      notice: '正在尋找你嘅位置…'
    };
    this.renderNotice();
    if (this.dom.btnLocate) {
      this.dom.btnLocate.classList.add('locating');
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (this.dom.btnLocate) this.dom.btnLocate.classList.remove('locating');
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestPlace(latitude, longitude);
        this.currentPlace = nearest;
        this.pinnedHourlyIndex = null;
        this.expandedDayIndex = null;
        this.locationState = {
          status: 'located',
          notice: `已用你附近嘅〔${nearest.name}〕`
        };
        this.renderPlaceRail();
        this.renderNotice();
        this.loadWeatherData(nearest);
      },
      (err) => {
        if (this.dom.btnLocate) this.dom.btnLocate.classList.remove('locating');
        this.currentPlace = DEFAULT_PLACE;
        this.pinnedHourlyIndex = null;
        this.expandedDayIndex = null;
        this.locationState = {
          status: 'default',
          notice: '而家用澳門半島做起點（未開定位）'
        };
        this.renderPlaceRail();
        this.renderNotice();
        this.loadWeatherData(this.currentPlace);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

  async loadWeatherData(place, forceRefresh = false) {
    const activeReqId = ++this.requestId;
    this.isLoading = true;
    this.errorMessage = null;
    this.renderLoading();

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index,is_day&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,uv_index,wind_speed_10m,wind_direction_10m,relative_humidity_2m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,sunrise,sunset,wind_speed_10m_max&minutely_15=precipitation,weather_code&forecast_days=7&timezone=Asia%2FMacau`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${place.lat}&longitude=${place.lon}&current=pm2_5,us_aqi,european_aqi&timezone=Asia%2FMacau`;
    const warnsumUrl = `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc`;
    const warninfoUrl = `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc`;
    const hkoObsUrl = place.territory === 'hongkong'
      ? `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc`
      : null;

    try {
      // Fetch concurrently
      const fetchWithTimeout = async (url, ms = 7000) => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), ms);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(tid);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (err) {
          clearTimeout(tid);
          throw err;
        }
      };

      const [wRaw, airRaw, warnRaw, warnInfoRaw, hkoObsRaw] = await Promise.allSettled([
        fetchWithTimeout(weatherUrl),
        fetchWithTimeout(airUrl),
        fetchWithTimeout(warnsumUrl),
        fetchWithTimeout(warninfoUrl),
        hkoObsUrl ? fetchWithTimeout(hkoObsUrl) : Promise.resolve(null)
      ]);

      if (activeReqId !== this.requestId) return; // Stale request guard

      if (wRaw.status === 'fulfilled' && wRaw.value) {
        this.weatherData = parseOpenMeteoWeather(wRaw.value);
        this.isOffline = false;
        if (this.locationState.status === 'snapshot') {
          this.locationState = {
            status: place.id === DEFAULT_PLACE.id ? 'default' : 'selected',
            notice: place.id === DEFAULT_PLACE.id
              ? '而家用澳門半島做起點（未開定位）'
              : `已選擇${place.name}`
          };
          this.renderNotice();
        }
      } else {
        // Fallback to local recorded snapshot ONLY for Macau Peninsula
        if (place.id === 'macau-peninsula') {
          console.warn('Macau Peninsula weather fetch failed, attempting snapshot fallback...', wRaw.reason);
          const fallbackRes = await fetch('./data/snapshot-macau-weather.json');
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            this.weatherData = parseOpenMeteoWeather(fallbackJson);
            this.isOffline = true;
            this.locationState = {
              status: 'snapshot',
              notice: '未能連線，顯示澳門半島離線快照（2026-11-13）'
            };
            this.renderNotice();
          } else {
            throw new Error(`暫時無法讀取${place.name}天氣預報，請檢查網絡連線。`);
          }
        } else {
          // For every other place (氹仔, 路環, 香港天文台), DO NOT use the Macau Peninsula snapshot
          throw new Error(`暫時無法讀取${place.name}天氣預報，請檢查網絡連線。`);
        }
      }

      // Air Quality
      if (airRaw.status === 'fulfilled' && airRaw.value) {
        this.airData = parseOpenMeteoAir(airRaw.value);
      } else if (this.isOffline && place.id === 'macau-peninsula') {
        try {
          const fbAir = await fetch('./data/snapshot-macau-air.json');
          if (fbAir.ok) this.airData = parseOpenMeteoAir(await fbAir.json());
        } catch (_) {
          this.airData = null;
        }
      } else {
        this.airData = null;
      }

      // HKO Warnings
      if (warnRaw.status === 'fulfilled' && warnRaw.value) {
        const warnInfoVal = warnInfoRaw.status === 'fulfilled' ? warnInfoRaw.value : null;
        this.hkoWarnings = parseHkoWarnings(warnRaw.value, warnInfoVal);
      } else {
        this.hkoWarnings = [];
      }

      // HKO Observations (for HK only)
      if (place.territory === 'hongkong') {
        if (hkoObsRaw.status === 'fulfilled' && hkoObsRaw.value) {
          try {
            this.hkoObservations = parseHkoObservations(hkoObsRaw.value, place);
          } catch (_) {
            this.hkoObservations = null;
          }
        } else {
          this.hkoObservations = null;
        }
      } else {
        this.hkoObservations = null;
      }

      this.isLoading = false;
      this.renderAll();
    } catch (err) {
      if (activeReqId !== this.requestId) return;
      this.isLoading = false;
      this.errorMessage = err.message || '天氣資料載入失敗';
      this.renderError();
    }
  }

  renderLoading() {
    if (this.dom.heroSection) {
      this.dom.heroSection.classList.add('loading-skeleton');
    }
  }

  renderError() {
    this.weatherData = null;
    this.airData = null;
    this.hkoObservations = null;
    this.hkoWarnings = [];
    this.pinnedHourlyIndex = null;
    this.expandedDayIndex = null;

    if (this.dom.warningBanner) {
      this.dom.warningBanner.innerHTML = '';
      this.dom.warningBanner.hidden = true;
    }
    if (this.dom.rainRibbonSection) {
      this.dom.rainRibbonSection.innerHTML = '';
      this.dom.rainRibbonSection.hidden = true;
    }
    if (this.dom.filmstripSection) {
      this.dom.filmstripSection.hidden = true;
    }
    if (this.dom.sevenDaySection) {
      this.dom.sevenDaySection.hidden = true;
    }
    if (this.dom.uvAirSection) {
      this.dom.uvAirSection.hidden = true;
    }
    if (this.dom.footerMeta) {
      this.dom.footerMeta.innerHTML = '';
    }

    if (this.dom.heroSection) {
      this.dom.heroSection.classList.remove('loading-skeleton');
      this.dom.heroSection.innerHTML = `
        <div class="empty-state">
          <p class="empty-msg">${this.errorMessage || `暫時無法讀取${this.currentPlace.name}天氣預報`}</p>
          <button type="button" class="btn-action" id="btn-retry">重新載入</button>
        </div>
      `;
      const btnRetry = document.getElementById('btn-retry');
      if (btnRetry) {
        btnRetry.addEventListener('click', () => this.loadWeatherData(this.currentPlace, true));
      }
    }
  }

  renderAll() {
    if (this.dom.heroSection) {
      this.dom.heroSection.classList.remove('loading-skeleton');
    }
    this.renderNotice();
    this.renderWarningBanner();
    this.renderHero();
    this.renderRainRibbon();
    this.renderHourlyFilmstrip();
    this.renderSevenDayForecast();
    this.renderUvAir();
    this.renderFooter();
  }

  renderWarningBanner() {
    if (!this.dom.warningBanner) return;
    if (!this.hkoWarnings || this.hkoWarnings.length === 0) {
      this.dom.warningBanner.innerHTML = '';
      this.dom.warningBanner.hidden = true;
      return;
    }

    this.dom.warningBanner.hidden = false;
    this.dom.warningBanner.innerHTML = this.hkoWarnings.map(w => `
      <div class="warning-item" role="alert">
        <div class="warning-header">
          <span class="warning-badge">官方警告</span>
          <span class="warning-title">${w.name}</span>
          ${w.issueTime ? `<span class="warning-time">${formatMacauTimeOnly(w.issueTime)} 發出</span>` : ''}
        </div>
        ${w.statement ? `<p class="warning-statement">${w.statement}</p>` : ''}
      </div>
    `).join('');
  }

  renderHero() {
    if (!this.dom.heroSection || !this.weatherData || !this.weatherData.current) {
      return;
    }

    const c = this.weatherData.current;
    const cond = c.condition;
    const isNight = c.isDay === 0;

    // Whole degree display for calmer typographic hierarchy
    const tempDisplay = c.temperature != null ? `${Math.round(c.temperature)}°` : '--°';
    const apparentDisplay = c.apparentTemperature != null ? `體感 ${Math.round(c.apparentTemperature)}°` : '';
    
    // Wind & humidity line
    const windLine = [
      c.windBearing ? `${c.windBearing}風` : '',
      c.windSpeed != null ? `${Math.round(c.windSpeed)} km/h` : '',
      c.humidity != null ? `濕度 ${c.humidity}%` : ''
    ].filter(Boolean).join(' · ');

    // HK Official observation note if applicable
    let hkoReadoutHtml = '';
    if (this.currentPlace.territory === 'hongkong' && this.hkoObservations) {
      const hko = this.hkoObservations;
      const obsParts = [];
      if (hko.temperature != null) obsParts.push(`${hko.temperature}°C`);
      if (hko.humidity != null) obsParts.push(`濕度 ${hko.humidity}%`);
      if (obsParts.length > 0) {
        hkoReadoutHtml = `
          <div class="hko-observed-line">
            <span class="hko-badge">香港天文台實測</span>
            <span class="hko-text">${obsParts.join(' · ')}</span>
          </div>
        `;
      }
    }

    // Sky phrase: at night, can accompany condition e.g. 「密雲 · 夜晚」 or 「天晴」
    const skyPhrase = isNight && cond.label !== '天晴' && !cond.label.includes('夜')
      ? `${cond.label} · 夜晚`
      : cond.label;

    this.dom.heroSection.innerHTML = `
      <div class="hero-stage">
        <div class="hero-temp-row">
          <span class="hero-temp" aria-label="現時氣溫 ${tempDisplay}">${tempDisplay}</span>
          <div class="hero-sky-badge">
            <span class="hero-sky-icon" aria-hidden="true">${cond.iconSvg}</span>
            <span class="hero-sky-word">${skyPhrase}</span>
          </div>
        </div>
        <div class="hero-meta-row">
          ${apparentDisplay ? `<span class="hero-apparent">${apparentDisplay}</span>` : ''}
          ${apparentDisplay && windLine ? `<span class="meta-separator" aria-hidden="true">/</span>` : ''}
          ${windLine ? `<span class="hero-wind">${windLine}</span>` : ''}
        </div>
        ${hkoReadoutHtml}
      </div>
    `;
  }

  renderRainRibbon() {
    if (!this.dom.rainRibbonSection) return;
    const ribbon = this.weatherData?.rainRibbon;

    if (!ribbon || !ribbon.available || ribbon.intervals.length === 0) {
      this.dom.rainRibbonSection.innerHTML = '';
      this.dom.rainRibbonSection.hidden = true;
      return;
    }

    this.dom.rainRibbonSection.hidden = false;

    // Intensity strip: 8 intervals (15 mins each)
    const stripHtml = ribbon.intervals.map(slot => {
      const levelClass = `intensity-${slot.level}`;
      const precipText = slot.precipitation != null && slot.precipitation > 0 ? `${slot.precipitation.toFixed(1)}mm` : '無雨';
      return `
        <div class="ribbon-segment" title="${slot.timeLabel} · ${precipText}">
          <div class="segment-bar ${levelClass}"></div>
          <span class="segment-time">${slot.timeLabel}</span>
        </div>
      `;
    }).join('');

    this.dom.rainRibbonSection.innerHTML = `
      <div class="rain-ribbon-card">
        <div class="ribbon-sentence-row">
          ${ribbon.hasRain ? `<span class="ribbon-icon" aria-hidden="true">${WEATHER_SVGS['drizzle']}</span>` : ''}
          <span class="ribbon-sentence">${ribbon.sentence}</span>
        </div>
        <div class="ribbon-strip" role="img" aria-label="未來兩小時雨勢分佈">
          ${stripHtml}
        </div>
      </div>
    `;
  }

  renderHourlyFilmstrip() {
    if (!this.dom.filmstripSection || !this.dom.hourlyTrack) return;
    const hourly = this.weatherData?.hourly;

    if (!hourly || hourly.length === 0) {
      this.dom.filmstripSection.hidden = true;
      return;
    }

    this.dom.filmstripSection.hidden = false;

    // We show the next 24 hours starting from current local time
    const currentIso = this.weatherData.current?.time;
    let startIdx = 0;
    if (currentIso) {
      const matchIdx = hourly.findIndex(h => h.time >= currentIso);
      if (matchIdx !== -1) startIdx = matchIdx;
    }
    const next24 = hourly.slice(startIdx, startIdx + 24);

    this.renderPinnedHourlyReadout(next24);

    this.dom.hourlyTrack.innerHTML = next24.map((hour, idx) => {
      const isNow = idx === 0;
      const isPinned = this.pinnedHourlyIndex === idx;
      const timeLabel = isNow ? '而家' : formatMacauTimeOnly(hour.time);
      const tempDisplay = hour.temperature != null ? `${Math.round(hour.temperature)}°` : '--°';
      const probDisplay = hour.precipitationProbability != null && hour.precipitationProbability >= 15
        ? `${Math.round(hour.precipitationProbability)}%`
        : '';

      return `
        <button type="button"
          class="hourly-cell ${isNow ? 'is-now' : ''} ${isPinned ? 'is-pinned' : ''}"
          data-hourly-idx="${idx}"
          aria-label="${timeLabel} · ${hour.condition.label} · ${tempDisplay}">
          ${isNow ? '<span class="now-tick" title="而家"></span>' : ''}
          <span class="cell-time">${timeLabel}</span>
          <span class="cell-icon" aria-hidden="true">${hour.condition.iconSvg}</span>
          <span class="cell-temp">${tempDisplay}</span>
          <span class="cell-prob">${probDisplay}</span>
        </button>
      `;
    }).join('');

    // Attach click listeners to cells
    const cells = this.dom.hourlyTrack.querySelectorAll('.hourly-cell');
    cells.forEach(c => {
      c.addEventListener('click', () => {
        const idx = Number(c.getAttribute('data-hourly-idx'));
        if (this.pinnedHourlyIndex === idx) {
          this.pinnedHourlyIndex = null;
        } else {
          this.pinnedHourlyIndex = idx;
        }
        this.renderHourlyFilmstrip();
      });
    });
  }

  renderPinnedHourlyReadout(next24) {
    if (!this.dom.hourlyPinnedBox) return;

    if (this.pinnedHourlyIndex == null || !next24[this.pinnedHourlyIndex]) {
      this.dom.hourlyPinnedBox.innerHTML = '';
      this.dom.hourlyPinnedBox.hidden = true;
      return;
    }

    const item = next24[this.pinnedHourlyIndex];
    const isNow = this.pinnedHourlyIndex === 0;
    const timeLabel = isNow ? `而家 (${formatMacauTimeOnly(item.time)})` : formatMacauTimeOnly(item.time);
    const tempDisplay = item.temperature != null ? `${Math.round(item.temperature)}°C` : '--°C';
    const appTemp = item.apparentTemperature != null ? `體感 ${Math.round(item.apparentTemperature)}°` : '';
    const rainProb = item.precipitationProbability != null ? `降雨率 ${item.precipitationProbability}%` : '';
    const wind = item.windBearing && item.windSpeed != null ? `${item.windBearing}風 ${Math.round(item.windSpeed)} km/h` : '';
    const humidity = item.humidity != null ? `濕度 ${item.humidity}%` : '';

    const details = [tempDisplay, item.condition.label, appTemp, rainProb, wind, humidity].filter(Boolean).join(' · ');

    this.dom.hourlyPinnedBox.hidden = false;
    this.dom.hourlyPinnedBox.innerHTML = `
      <div class="pinned-pill">
        <span class="pinned-time">${timeLabel}</span>
        <span class="pinned-content">${details}</span>
        <button type="button" class="pinned-close" id="btn-close-pinned" aria-label="關閉鎖定資訊">✕</button>
      </div>
    `;

    const closeBtn = document.getElementById('btn-close-pinned');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pinnedHourlyIndex = null;
        this.renderHourlyFilmstrip();
      });
    }
  }

  renderSevenDayForecast() {
    if (!this.dom.sevenDaySection || !this.dom.sevenDayList) return;
    const daily = this.weatherData?.daily;

    if (!daily || daily.length === 0) {
      this.dom.sevenDaySection.hidden = true;
      return;
    }

    this.dom.sevenDaySection.hidden = false;

    const todayCivil = getMacauCivilDate(this.weatherData.current?.time || new Date());

    this.dom.sevenDayList.innerHTML = daily.map((day, idx) => {
      const isToday = day.date === todayCivil || idx === 0;
      const weekday = isToday ? '今日' : getWeekdayCantonese(day.date);
      const isExpanded = this.expandedDayIndex === idx;

      const maxTemp = day.tempMax != null ? `${Math.round(day.tempMax)}°` : '--°';
      const minTemp = day.tempMin != null ? `${Math.round(day.tempMin)}°` : '--°';
      const rainInfo = day.precipitationProbabilityMax != null && day.precipitationProbabilityMax >= 20
        ? `${Math.round(day.precipitationProbabilityMax)}%`
        : (day.precipSum != null && day.precipSum > 0 ? `${day.precipSum.toFixed(1)}mm` : '');

      // Detail accordion content: that day's hours in typographic language + meta line
      let accordionHtml = '';
      if (isExpanded) {
        const dayHours = (this.weatherData?.hourly || []).filter(h => {
          return h.time && h.time.startsWith(day.date);
        });

        let hoursHtml = '';
        if (dayHours.length > 0) {
          hoursHtml = `
            <div class="day-hours-list">
              ${dayHours.map(h => {
                const hTime = formatMacauTimeOnly(h.time);
                const hTemp = h.temperature != null ? `${Math.round(h.temperature)}°` : '--°';
                const hProb = h.precipitationProbability != null && h.precipitationProbability >= 15
                  ? `${Math.round(h.precipitationProbability)}%`
                  : '';
                return `
                  <div class="day-hour-row">
                    <span class="day-hour-time">${hTime}</span>
                    <span class="day-hour-sky">${h.condition.label}</span>
                    <span class="day-hour-temp">${hTemp}</span>
                    <span class="day-hour-prob">${hProb}</span>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }

        const detailParts = [];
        if (day.sunrise && day.sunset) {
          detailParts.push(`日出 ${formatMacauTimeOnly(day.sunrise)} · 日落 ${formatMacauTimeOnly(day.sunset)}`);
        }
        if (day.uvMax != null) {
          detailParts.push(`最高紫外線 ${day.uvMax.toFixed(1)}`);
        }
        if (day.windSpeedMax != null) {
          detailParts.push(`最高風速 ${Math.round(day.windSpeedMax)}&nbsp;km/h`);
        }
        if (day.precipSum != null && day.precipSum > 0) {
          detailParts.push(`全日降雨總量 ${day.precipSum.toFixed(1)}&nbsp;mm`);
        }

        accordionHtml = `
          <div class="day-detail-panel">
            ${hoursHtml}
            ${detailParts.length > 0 ? `
              <div class="day-detail-meta">
                ${detailParts.map(p => `<span class="meta-clause">${p}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }

      return `
        <li class="day-item ${isExpanded ? 'is-expanded' : ''}">
          <button type="button"
            class="day-row-btn"
            data-day-idx="${idx}"
            aria-expanded="${isExpanded ? 'true' : 'false'}">
            <span class="day-col-name">${weekday}</span>
            <div class="day-col-sky">
              <span class="day-icon" aria-hidden="true">${day.condition.iconSvg}</span>
              <span class="day-sky-word">${day.condition.label}</span>
            </div>
            <div class="day-col-rain">${rainInfo}</div>
            <div class="day-col-temp">
              <span class="temp-min">${minTemp}</span>
              <span class="temp-divider">/</span>
              <span class="temp-max">${maxTemp}</span>
            </div>
            <span class="expand-caret ${isExpanded ? 'open' : ''}" aria-hidden="true">›</span>
          </button>
          ${accordionHtml}
        </li>
      `;
    }).join('');

    // Attach accordion click events
    const rowBtns = this.dom.sevenDayList.querySelectorAll('.day-row-btn');
    rowBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-day-idx'));
        if (this.expandedDayIndex === idx) {
          this.expandedDayIndex = null;
        } else {
          this.expandedDayIndex = idx;
        }
        this.renderSevenDayForecast();
      });
    });
  }

  renderUvAir() {
    if (!this.dom.uvAirSection) return;

    const current = this.weatherData?.current;
    const air = this.airData;

    let uvText = '';
    if (current) {
      if (current.isDay === 1 && current.uvIndex != null) {
        uvText = `紫外線指數 ${current.uvIndex.toFixed(1)}`;
      } else {
        // Night: show today's max if available
        const todayMaxUv = this.weatherData?.daily?.[0]?.uvMax;
        if (todayMaxUv != null) {
          uvText = `今日最高紫外線 ${todayMaxUv.toFixed(1)}`;
        }
      }
    }

    let airText = '';
    if (air && (air.usAqi != null || air.pm2_5 != null)) {
      const parts = [];
      if (air.usAqi != null) {
        parts.push(`AQI ${air.usAqi} ${air.category}`);
      }
      if (air.pm2_5 != null) {
        parts.push(`PM2.5 ${air.pm2_5.toFixed(1)} µg/m³`);
      }
      airText = `空氣質素 · ${parts.join(' · ')}`;
    }

    if (!uvText && !airText) {
      this.dom.uvAirSection.hidden = true;
      return;
    }

    this.dom.uvAirSection.hidden = false;
    this.dom.uvAirSection.innerHTML = `
      <div class="uv-air-card">
        ${uvText ? `<div class="metric-row"><span class="metric-dot"></span><span>${uvText}</span></div>` : ''}
        ${airText ? `<div class="metric-row"><span class="metric-dot"></span><span>${airText}</span></div>` : ''}
      </div>
    `;
  }

  renderFooter() {
    if (!this.dom.footerMeta) return;

    const updateTimeStr = this.weatherData?.current?.time
      ? formatMacauDateTime(this.weatherData.current.time)
      : '';

    const isHk = this.currentPlace.territory === 'hongkong';
    const smgLink = `<a href="https://www.smg.gov.mo/" target="_blank" rel="noopener noreferrer">地球物理氣象局</a>`;
    const hkoLink = `<a href="https://www.hko.gov.hk/" target="_blank" rel="noopener noreferrer">香港天文台</a>`;
    const authorityLinksHtml = isHk
      ? `${hkoLink} ｜ ${smgLink}`
      : `${smgLink} ｜ ${hkoLink}`;

    this.dom.footerMeta.innerHTML = `
      <div class="footer-sources">
        <p>預報數據源自 Open-Meteo（CC BY 4.0）${isHk && this.hkoObservations ? ' · 實測源自香港天文台' : ''} ${this.isOffline ? '（離線快照：2026-11-13）' : ''}</p>
        ${updateTimeStr ? `<p class="update-time">預報時間：${updateTimeStr}（澳門時間）</p>` : ''}
      </div>
      <p class="footer-disclaimer">呢度係預報參考，官方警告以地球物理氣象局同香港天文台為準。</p>
      <div class="footer-links">
        官方機構：${authorityLinksHtml}
      </div>
    `;
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  const app = new TinSikApp();
  app.init();
  window.__tinsikApp = app; // Expose for browser test verification
});
