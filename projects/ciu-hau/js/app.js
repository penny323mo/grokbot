/**
 * app.js · 潮候 Ciu Hau
 * Main application coordinator: state, data fetching, geolocation, and DOM updates.
 */

import { STATIONS, DEFAULT_STATION, getStationById, getMacauStations, getHongKongStations, DATUM } from './stations.js';
import { findNearestStation, degreesToCompassCantonese, formatMacauTimeOnly, formatMacauDateTime, getMacauCivilDate, getMacauCivilDateAddDays, getMacauMidnightTimestamp } from './geo.js';
import { parseHkoHlt, parseHkoHhot, interpolateHkoHeight } from './hko.js';
import { parseOpenMeteoMarine, parseOpenMeteoWeather } from './openmeteo.js';
import { detectTendency, formatTendencyCantonese, findExtremesFromHourly, findNextExtreme } from './extremes.js';
import { TideChart } from './chart.js';

export const LOCATION_ERROR_MESSAGES = {
  PERMISSION_DENIED: '定位未獲授權，你可以重試，或用澳門內港做起點',
  POSITION_UNAVAILABLE: '暫時未能獲取位置（訊號未能定位），你可以重試，或用澳門內港做起點',
  TIMEOUT: '定位逾時（訊號較弱），你可以重試，或用澳門內港做起點',
  UNSUPPORTED: '瀏覽器未支援定位功能，現正使用澳門內港做起點',
  INSECURE_CONTEXT: '需在安全連線（HTTPS）下使用定位，現正使用澳門內港做起點',
  UNKNOWN: '暫時未能獲取位置，你可以重試，或用澳門內港做起點'
};

export class App {
  constructor() {
    this.currentStation = DEFAULT_STATION;
    this.loadRequestId = 0;
    this.userGpsLocation = null;
    this.isLocating = false;
    this.isOfflineMode = false;
    this.offlineNotice = '';

    // Data state
    this.currentHeight = null;
    this.currentTendency = 'slack';
    this.nextExtremeInfo = null;
    this.hourlyPoints = [];
    this.extremes = [];
    this.marineConditions = null;
    this.weatherConditions = null;
    this.lastUpdated = new Date();

    this.bindDom();
    this.initChart();
    this.initEventListeners();
    this.renderStationRail();

    // Initial station load
    this.loadStationData(this.currentStation);
  }

  bindDom() {
    this.dom = {
      appContainer: document.querySelector('.app-container'),
      stationNameTitle: document.getElementById('station-name-title'),
      stationTerritoryBadge: document.getElementById('station-territory-badge'),
      stationDatumTag: document.getElementById('station-datum-tag'),
      btnLocate: document.getElementById('btn-locate'),
      btnLocateText: document.querySelector('.btn-locate-text'),
      originStrip: document.getElementById('origin-strip'),
      originLabel: document.getElementById('origin-label'),
      heroHeightValue: document.getElementById('hero-height-value'),
      heroHeightUnit: document.getElementById('hero-height-unit'),
      heroDatumBadge: document.getElementById('hero-datum-badge'),
      heroTendencyBadge: document.getElementById('hero-tendency-badge'),
      heroNextExtreme: document.getElementById('hero-next-extreme'),
      extremesList: document.getElementById('extremes-list'),
      chartContainer: document.getElementById('chart-container'),
      chartSubtitle: document.getElementById('chart-subtitle'),
      stationRail: document.getElementById('station-rail'),
      marineStrip: document.getElementById('marine-strip'),
      footerSourceCredit: document.getElementById('footer-source-credit'),
      footerOfficialLinks: document.getElementById('footer-official-links'),
      footerUpdateTime: document.getElementById('footer-update-time'),
      offlineBanner: document.getElementById('offline-banner')
    };
  }

  initChart() {
    if (!this.dom.chartContainer) return;
    this.chart = new TideChart(this.dom.chartContainer, {
      onScrub: (scrubData) => {
        if (this.dom.heroHeightValue) {
          this.dom.heroHeightValue.textContent = scrubData.height.toFixed(2);
        }
        if (this.dom.heroTendencyBadge) {
          const badgeType = this.currentStation.territory === 'macau' ? '模式預測' : '天文潮';
          this.dom.heroTendencyBadge.textContent = `${scrubData.timeStr} ${badgeType}`;
          this.dom.heroTendencyBadge.className = 'status-badge status-scrub';
        }
      },
      onScrubEnd: () => {
        this.updateHeroReadout();
      }
    });
  }

  initEventListeners() {
    // Locate button: preserves user gesture (no synchronous disabled = true before call)
    if (this.dom.btnLocate) {
      this.dom.btnLocate.addEventListener('click', () => this.requestGeolocation());
    }

    // Delegated click for default origin button
    if (this.dom.originLabel) {
      this.dom.originLabel.addEventListener('click', (e) => {
        const btn = e.target && (e.target.id === 'btn-default-origin' || e.target.closest?.('#btn-default-origin, .btn-default-origin'));
        if (btn) {
          if (e.preventDefault) e.preventDefault();
          this.resetToDefaultOrigin();
        }
      });
    }
  }

  renderStationRail() {
    if (!this.dom.stationRail) return;

    const macauStations = getMacauStations();
    const hkStations = getHongKongStations();

    let html = `
      <div class="station-group">
        <span class="station-group-label">澳門模式預測（MSL）</span>
        <div class="station-chips-row">
    `;

    for (const s of macauStations) {
      const isSelected = s.id === this.currentStation.id;
      html += `
        <button type="button" class="station-chip ${isSelected ? 'is-selected' : ''}" data-station-id="${s.id}" aria-pressed="${isSelected}">
          ${s.name}
        </button>
      `;
    }

    html += `
        </div>
      </div>
      <div class="station-group">
        <span class="station-group-label">香港官方潮汐表（CD）</span>
        <div class="station-chips-row">
    `;

    for (const s of hkStations) {
      const isSelected = s.id === this.currentStation.id;
      html += `
        <button type="button" class="station-chip ${isSelected ? 'is-selected' : ''}" data-station-id="${s.id}" aria-pressed="${isSelected}">
          ${s.name}
        </button>
      `;
    }

    html += `
        </div>
      </div>
    `;

    this.dom.stationRail.innerHTML = html;

    // Attach click listeners to chips
    const chips = this.dom.stationRail.querySelectorAll('.station-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.stationId;
        const station = getStationById(id);
        if (station && station.id !== this.currentStation.id) {
          this.switchStation(station);
        }
      });
    });
  }

  switchStation(station) {
    this.currentStation = station;
    this.renderStationRail();
    this.loadStationData(station);
  }

  async loadStationData(station) {
    const requestId = ++this.loadRequestId;
    this.isOfflineMode = false;
    this.offlineNotice = '';
    if (this.dom.offlineBanner) {
      this.dom.offlineBanner.style.display = 'none';
    }

    this.updateHeaderMeta(station);
    this.updateFooter(station);

    if (station.territory === 'hongkong') {
      await this.loadHongKongStation(station, requestId);
    } else {
      await this.loadMacauStation(station, requestId);
    }

    if (this.loadRequestId === requestId) {
      this.updateFooter(station);
    }
  }

  async loadMacauStation(station, requestId) {
    try {
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${station.lat}&longitude=${station.lon}&timezone=Asia/Macau&cell_selection=sea&forecast_days=3&hourly=sea_level_height_msl,sea_surface_temperature,wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height&current=sea_level_height_msl,sea_surface_temperature,wave_height,wave_direction,wave_period`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lon}&timezone=Asia/Macau&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&daily=sunrise,sunset`;

      const [marineRes, weatherRes] = await Promise.all([
        fetch(marineUrl).then(r => (r.ok ? r.json() : null)),
        fetch(weatherUrl).then(r => (r.ok ? r.json() : null))
      ]);

      if (this.loadRequestId !== requestId) return; // stale request
      if (!marineRes) throw new Error('Live Open-Meteo marine fetch failed');

      const parsedMarine = parseOpenMeteoMarine(marineRes);
      const parsedWeather = weatherRes ? parseOpenMeteoWeather(weatherRes) : null;

      if (this.loadRequestId !== requestId) return;
      this.applyMacauData(parsedMarine, parsedWeather);
    } catch (err) {
      if (this.loadRequestId !== requestId) return;
      console.warn('Live Macau fetch failed, falling back to real 2026-11-12 fixture:', err);
      await this.loadMacauOfflineFallback(station, requestId);
    }
  }

  async loadMacauOfflineFallback(station, requestId) {
    if (station.id !== 'macau-inner-harbour') {
      if (this.loadRequestId !== requestId) return;
      this.clearStationData('暫時未能載入該站海況數據，即時連線失敗');
      this.renderErrorState('暫時未能載入該站海況數據，即時連線失敗');
      return;
    }

    try {
      const res = await fetch('./data/snapshot-macau.json');
      if (!res.ok) throw new Error('Fallback file not found');
      const fixture = await res.json();

      if (this.loadRequestId !== requestId) return;

      const innerHarbourStation = getStationById('macau-inner-harbour') || station;
      this.currentStation = innerHarbourStation;
      this.updateHeaderMeta(innerHarbourStation);
      this.renderStationRail();

      const parsedMarine = parseOpenMeteoMarine(fixture.marine);
      const parsedWeather = parseOpenMeteoWeather(fixture.weather);

      this.isOfflineMode = true;
      this.offlineNotice = '即時網絡未能連線，已載入澳門內港離線備份數據（2026-11-12）';
      if (this.dom.offlineBanner) {
        this.dom.offlineBanner.textContent = this.offlineNotice;
        this.dom.offlineBanner.style.display = 'block';
      }

      this.applyMacauData(parsedMarine, parsedWeather);
    } catch (fallbackErr) {
      if (this.loadRequestId !== requestId) return;
      console.error('Macau fallback failed:', fallbackErr);
      this.clearStationData('暫時未能載入澳門海況數據');
      this.renderErrorState('暫時未能載入澳門海況數據');
    }
  }

  applyMacauData(parsedMarine, parsedWeather) {
    if (!parsedMarine) return;

    const now = new Date();
    const todayMidnightMs = getMacauMidnightTimestamp(now);
    const end48Ms = todayMidnightMs + 48 * 3600 * 1000;
    const allHourly = parsedMarine.hourly || [];

    // Slice to 48-hour window (today 00:00 to tomorrow 24:00 in Asia/Macau)
    const filteredHourly = allHourly.filter(p => {
      const t = p.timestamp.getTime();
      return t >= todayMidnightMs && t <= end48Ms;
    });

    this.hourlyPoints = filteredHourly.length >= 2 ? filteredHourly : allHourly.slice(0, 49);
    this.currentHeight = parsedMarine.current ? parsedMarine.current.height : interpolateHkoHeight(this.hourlyPoints, now);
    this.marineConditions = parsedMarine.current;
    this.weatherConditions = parsedWeather ? parsedWeather.current : null;
    this.weatherDaily = parsedWeather ? parsedWeather.daily : null;

    // Detect extremes from the 48-hour hourly series
    this.extremes = findExtremesFromHourly(this.hourlyPoints);

    // Detect tendency and next extreme
    this.currentTendency = detectTendency(this.hourlyPoints, now);
    this.nextExtremeInfo = findNextExtreme(this.extremes, now);

    this.lastUpdated = new Date();

    // Render UI components
    this.renderAll();
  }

  async loadHongKongStation(station, requestId) {
    const now = new Date();
    const todayCivil = getMacauCivilDate(now);
    const tomorrowCivil = getMacauCivilDateAddDays(todayCivil, 1);

    const year = todayCivil.year;
    const month = todayCivil.month;
    const day = todayCivil.day;

    const tYear = tomorrowCivil.year;
    const tMonth = tomorrowCivil.month;
    const tDay = tomorrowCivil.day;

    try {
      const hltTodayUrl = `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=HLT&rformat=json&station=${station.code}&year=${year}&month=${month}&day=${day}`;
      const hltTomorrowUrl = `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=HLT&rformat=json&station=${station.code}&year=${tYear}&month=${tMonth}&day=${tDay}`;
      const hhotTodayUrl = `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=HHOT&rformat=json&station=${station.code}&year=${year}&month=${month}&day=${day}`;
      const hhotTomorrowUrl = `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=HHOT&rformat=json&station=${station.code}&year=${tYear}&month=${tMonth}&day=${tDay}`;

      // Open-Meteo marine & weather at HK station coords for waves & weather strip
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${station.lat}&longitude=${station.lon}&timezone=Asia/Hong_Kong&cell_selection=sea&forecast_days=2&hourly=sea_surface_temperature,wave_height,wave_direction,wave_period&current=sea_surface_temperature,wave_height,wave_direction,wave_period`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lon}&timezone=Asia/Hong_Kong&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&daily=sunrise,sunset`;

      const [hltRes1, hltRes2, hhotRes1, hhotRes2, marineRes, weatherRes] = await Promise.all([
        fetch(hltTodayUrl).then(r => (r.ok ? r.json() : null)),
        fetch(hltTomorrowUrl).then(r => (r.ok ? r.json() : null)),
        fetch(hhotTodayUrl).then(r => (r.ok ? r.json() : null)),
        fetch(hhotTomorrowUrl).then(r => (r.ok ? r.json() : null)),
        fetch(marineUrl).then(r => (r.ok ? r.json() : null)).catch(() => null),
        fetch(weatherUrl).then(r => (r.ok ? r.json() : null)).catch(() => null)
      ]);

      if (this.loadRequestId !== requestId) return; // stale request
      if (!hltRes1 || !hhotRes1) {
        throw new Error('HKO live data unavailable');
      }

      // Combine HLT with proper respective years
      const extremesToday = parseHkoHlt(hltRes1, year);
      const extremesTomorrow = hltRes2 ? parseHkoHlt(hltRes2, tYear) : [];
      this.extremes = [...extremesToday, ...extremesTomorrow];

      // Combine HHOT with proper respective years
      const hourlyToday = parseHkoHhot(hhotRes1, year);
      const hourlyTomorrow = hhotRes2 ? parseHkoHhot(hhotRes2, tYear) : [];
      this.hourlyPoints = [...hourlyToday, ...hourlyTomorrow];

      // Interpolate current height from HHOT (null if out of range)
      this.currentHeight = interpolateHkoHeight(this.hourlyPoints, now);

      const parsedMarine = marineRes ? parseOpenMeteoMarine(marineRes) : null;
      const parsedWeather = weatherRes ? parseOpenMeteoWeather(weatherRes) : null;
      this.marineConditions = parsedMarine ? parsedMarine.current : null;
      this.weatherConditions = parsedWeather ? parsedWeather.current : null;
      this.weatherDaily = parsedWeather ? parsedWeather.daily : null;

      this.currentTendency = detectTendency(this.hourlyPoints, now);
      this.nextExtremeInfo = findNextExtreme(this.extremes, now);
      this.lastUpdated = new Date();

      if (this.loadRequestId !== requestId) return;
      this.renderAll();
    } catch (err) {
      if (this.loadRequestId !== requestId) return;
      console.warn('Live HK fetch failed, falling back to Tai O fixture:', err);
      await this.loadHongKongOfflineFallback(station, requestId);
    }
  }

  async loadHongKongOfflineFallback(station, requestId) {
    if (station.id !== 'hk-tao') {
      if (this.loadRequestId !== requestId) return;
      this.clearStationData('暫時未能載入該站潮汐數據，即時連線失敗');
      this.renderErrorState('暫時未能載入該站潮汐數據，即時連線失敗');
      return;
    }

    try {
      const [hltRes, hhotRes] = await Promise.all([
        fetch('./data/snapshot-hko-tao-hlt.json').then(r => r.json()),
        fetch('./data/snapshot-hko-tao-hhot.json').then(r => r.json())
      ]);

      if (this.loadRequestId !== requestId) return;

      const taoStation = getStationById('hk-tao') || station;
      this.currentStation = taoStation;
      this.updateHeaderMeta(taoStation);
      this.renderStationRail();

      // Clear marine & weather since snapshot does not contain them
      this.marineConditions = null;
      this.weatherConditions = null;
      this.weatherDaily = null;

      this.extremes = parseHkoHlt(hltRes, 2026);
      this.hourlyPoints = parseHkoHhot(hhotRes, 2026);

      const now = new Date();
      this.currentHeight = interpolateHkoHeight(this.hourlyPoints, now);
      this.currentTendency = detectTendency(this.hourlyPoints, now);
      this.nextExtremeInfo = findNextExtreme(this.extremes, now);

      this.isOfflineMode = true;
      this.offlineNotice = '即時網絡未能連線，已載入大澳離線備份數據（2026-11-12）';
      if (this.dom.offlineBanner) {
        this.dom.offlineBanner.textContent = this.offlineNotice;
        this.dom.offlineBanner.style.display = 'block';
      }

      this.renderAll();
    } catch (fallbackErr) {
      if (this.loadRequestId !== requestId) return;
      console.error('HK fallback failed:', fallbackErr);
      this.clearStationData('暫時未能載入香港天文台潮汐數據');
      this.renderErrorState('暫時未能載入香港天文台潮汐數據');
    }
  }

  updateHeaderMeta(station) {
    if (this.dom.stationNameTitle) {
      this.dom.stationNameTitle.textContent = station.name;
    }
    if (this.dom.stationTerritoryBadge) {
      this.dom.stationTerritoryBadge.textContent = station.territoryName;
    }
    if (this.dom.stationDatumTag) {
      this.dom.stationDatumTag.textContent = station.datumLabel;
    }
    if (this.dom.chartSubtitle) {
      if (station.territory === 'macau') {
        this.dom.chartSubtitle.textContent = 'Open-Meteo 模式預測（非官方潮汐表）';
      } else {
        this.dom.chartSubtitle.textContent = '香港天文台官方天文潮汐表（海圖基準面）';
      }
    }
  }

  renderAll() {
    this.updateHeroReadout();
    this.renderExtremesRow();
    this.renderMarineStrip();

    if (this.chart) {
      this.chart.setData(this.hourlyPoints, this.extremes, new Date(), this.currentStation.datumLabel);
    }
  }

  updateHeroReadout() {
    // Height number
    if (this.dom.heroHeightValue) {
      if (typeof this.currentHeight === 'number') {
        this.dom.heroHeightValue.textContent = this.currentHeight.toFixed(2);
      } else {
        this.dom.heroHeightValue.textContent = '--';
      }
    }

    // Datum badge
    if (this.dom.heroDatumBadge) {
      this.dom.heroDatumBadge.textContent = this.currentStation.datumLabel;
    }

    // Tendency badge
    if (this.dom.heroTendencyBadge) {
      const tendencyText = formatTendencyCantonese(this.currentTendency);
      this.dom.heroTendencyBadge.textContent = tendencyText;
      this.dom.heroTendencyBadge.className = `status-badge status-${this.currentTendency}`;
    }

    // Next extreme text
    if (this.dom.heroNextExtreme) {
      if (this.nextExtremeInfo) {
        this.dom.heroNextExtreme.innerHTML = this.nextExtremeInfo.summaryHtml || this.nextExtremeInfo.summary;
      } else {
        this.dom.heroNextExtreme.textContent = '稍後潮位計算中…';
      }
    }
  }

  renderExtremesRow() {
    if (!this.dom.extremesList) return;

    if (!this.extremes || this.extremes.length === 0) {
      this.dom.extremesList.innerHTML = '<span class="empty-note">未有今日潮位極值資料</span>';
      return;
    }

    const now = new Date();
    const todayCivil = getMacauCivilDate(now);
    const todayDateStr = todayCivil ? todayCivil.dateStr : '';

    // Filter to extremes whose Asia/Macau civil date is today
    const todayExtremes = this.extremes.filter(ext => {
      const civil = getMacauCivilDate(ext.timestamp);
      return civil && civil.dateStr === todayDateStr;
    });

    const displayExtremes = todayExtremes.length > 0 ? todayExtremes : this.extremes.slice(0, 4);

    let html = '';
    for (const ext of displayExtremes) {
      const isHigh = ext.type === 'high';
      const typeLabel = isHigh ? '高潮' : (ext.type === 'low' ? '低潮' : '潮位');
      const tagClass = isHigh ? 'tag-high' : 'tag-low';
      const timePrefix = ext.approx ? '約 ' : '';

      html += `
        <div class="extreme-item">
          <span class="extreme-tag ${tagClass}">${typeLabel}</span>
          <span class="extreme-time">${timePrefix}${ext.time}</span>
          <span class="extreme-sep">·</span>
          <div class="extreme-height">
            <span class="extreme-num">${ext.height.toFixed(2)}</span>
            <span class="extreme-unit">m</span>
          </div>
        </div>
      `;
    }

    this.dom.extremesList.innerHTML = html;
  }

  renderMarineStrip() {
    if (!this.dom.marineStrip) return;

    const items = [];

    // Wave height
    if (this.marineConditions && typeof this.marineConditions.waveHeight === 'number') {
      items.push({
        label: '浪高',
        value: `${this.marineConditions.waveHeight.toFixed(2)} 米`
      });
    }

    // Wave period
    if (this.marineConditions && typeof this.marineConditions.wavePeriod === 'number') {
      items.push({
        label: '週期',
        value: `${this.marineConditions.wavePeriod.toFixed(1)} 秒`
      });
    }

    // Wave direction
    if (this.marineConditions && typeof this.marineConditions.waveDirection === 'number') {
      const comp = degreesToCompassCantonese(this.marineConditions.waveDirection);
      if (comp) {
        items.push({
          label: '浪向',
          value: comp
        });
      }
    }

    // Sea surface temperature
    if (this.marineConditions && typeof this.marineConditions.seaSurfaceTemperature === 'number') {
      items.push({
        label: '水溫',
        value: `${this.marineConditions.seaSurfaceTemperature.toFixed(1)}°C`
      });
    }

    // Wind
    if (this.weatherConditions && typeof this.weatherConditions.windSpeed === 'number') {
      const comp = degreesToCompassCantonese(this.weatherConditions.windDirection);
      const windVal = comp ? `${comp} ${this.weatherConditions.windSpeed.toFixed(1)} km/h` : `${this.weatherConditions.windSpeed.toFixed(1)} km/h`;
      items.push({
        label: '風向風力',
        value: windVal
      });
    }

    // Sunrise / sunset
    if (this.weatherDaily && this.weatherDaily.sunrise && this.weatherDaily.sunset) {
      const riseStr = formatMacauTimeOnly(this.weatherDaily.sunrise);
      const setStr = formatMacauTimeOnly(this.weatherDaily.sunset);
      items.push({
        label: '日出日落',
        value: `日出 ${riseStr} · 日落 ${setStr}`
      });
    }

    if (items.length === 0) {
      this.dom.marineStrip.innerHTML = '<span class="empty-note">海況數據讀取中…</span>';
      return;
    }

    let html = '';
    for (const item of items) {
      html += `
        <div class="marine-cell">
          <span class="marine-label">${item.label}</span>
          <span class="marine-value">${item.value}</span>
        </div>
      `;
    }

    this.dom.marineStrip.innerHTML = html;
  }

  updateFooter(station) {
    if (this.dom.footerSourceCredit) {
      if (station.territory === 'hongkong') {
        this.dom.footerSourceCredit.textContent = '潮位：香港天文台官方天文潮汐表（政府資料開放授權） · 海況：Open-Meteo（CC-BY 4.0）';
      } else {
        this.dom.footerSourceCredit.textContent = '預報來源：Open-Meteo 數值模式預測（CC-BY 4.0） · 非官方潮汐表';
      }
    }

    if (this.dom.footerOfficialLinks) {
      if (station.territory === 'macau') {
        this.dom.footerOfficialLinks.innerHTML = `
          澳門官方實時潮汐請參閱：
          <a href="https://www.smg.gov.mo/zh/subpage/73/tide" target="_blank" rel="noopener">地球物理氣象局實時潮汐</a> ·
          <a href="https://www.marine.gov.mo/tide_search.aspx" target="_blank" rel="noopener">海事及水務局潮汐查詢</a>
        `;
      } else {
        this.dom.footerOfficialLinks.innerHTML = `
          香港官方資料：
          <a href="https://www.hko.gov.hk/tc/tide/ttext.htm" target="_blank" rel="noopener">香港天文台潮汐預報</a>
        `;
      }
    }

    if (this.dom.footerUpdateTime) {
      this.dom.footerUpdateTime.textContent = `${formatMacauDateTime(this.lastUpdated)} 更新（澳門時間）`;
    }
  }

  requestGeolocation(options = {}) {
    if (this.isLocating) return;

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      this.handleLocationError({ code: 'INSECURE_CONTEXT' });
      return;
    }

    const navGeo = options.geolocation || (typeof navigator !== 'undefined' ? navigator.geolocation : null);
    if (!navGeo || typeof navGeo.getCurrentPosition !== 'function') {
      this.handleLocationError({ code: 'UNSUPPORTED' });
      return;
    }

    this.isLocating = true;
    if (this.dom.btnLocateText) this.dom.btnLocateText.textContent = '讀取緊…';
    if (this.dom.btnLocate) this.dom.btnLocate.setAttribute('aria-busy', 'true');
    if (this.dom.originLabel) this.dom.originLabel.textContent = '正在獲取你嘅位置…';

    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: options.timeout || 10000,
      maximumAge: options.maximumAge !== undefined ? options.maximumAge : 30000
    };

    const handleSuccess = (pos) => {
      this.isLocating = false;
      if (this.dom.btnLocateText) this.dom.btnLocateText.textContent = '用我嘅位置';
      if (this.dom.btnLocate) {
        this.dom.btnLocate.removeAttribute('aria-busy');
        this.dom.btnLocate.disabled = false;
      }

      const lat = Number(pos.coords.latitude.toFixed(6));
      const lon = Number(pos.coords.longitude.toFixed(6));

      this.userGpsLocation = { lat, lon };

      const nearest = findNearestStation(lat, lon);
      this.currentStation = nearest.station;

      if (this.dom.originLabel) {
        this.dom.originLabel.innerHTML = `
          已用你附近嘅「${nearest.station.name}」（約 ${nearest.distanceKm} 公里） ·
          <button type="button" class="btn-default-origin" id="btn-default-origin" aria-label="返回澳門內港">返回澳門內港</button>
        `;
      }

      this.renderStationRail();
      this.loadStationData(this.currentStation);
    };

    const handleError = (err) => {
      // Fallback from high accuracy to standard accuracy once on timeout
      if (err && err.code === 3 && highAccuracyOptions.enableHighAccuracy && !options.disableFallback) {
        console.warn('High accuracy geolocation timed out, falling back to standard accuracy...');
        navGeo.getCurrentPosition(
          handleSuccess,
          (fallbackErr) => this.handleLocationError(fallbackErr),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
        return;
      }

      this.handleLocationError(err);
    };

    navGeo.getCurrentPosition(handleSuccess, handleError, highAccuracyOptions);
  }

  handleLocationError(err) {
    this.isLocating = false;
    if (this.dom.btnLocateText) this.dom.btnLocateText.textContent = '用我嘅位置';
    if (this.dom.btnLocate) {
      this.dom.btnLocate.removeAttribute('aria-busy');
      this.dom.btnLocate.disabled = false;
    }

    let errorKey = 'UNKNOWN';
    if (err) {
      if (err.code === 1 || err.code === 'PERMISSION_DENIED') errorKey = 'PERMISSION_DENIED';
      else if (err.code === 2 || err.code === 'POSITION_UNAVAILABLE') errorKey = 'POSITION_UNAVAILABLE';
      else if (err.code === 3 || err.code === 'TIMEOUT') errorKey = 'TIMEOUT';
      else if (err.code === 'UNSUPPORTED') errorKey = 'UNSUPPORTED';
      else if (err.code === 'INSECURE_CONTEXT') errorKey = 'INSECURE_CONTEXT';
    }

    const rawMessage = LOCATION_ERROR_MESSAGES[errorKey] || LOCATION_ERROR_MESSAGES.UNKNOWN;
    if (this.dom.originLabel) {
      if (rawMessage.includes('澳門內港')) {
        this.dom.originLabel.innerHTML = rawMessage.replace(
          '澳門內港',
          '<button type="button" class="btn-default-origin" id="btn-default-origin" aria-label="用澳門內港做起點">澳門內港</button>'
        );
      } else {
        this.dom.originLabel.textContent = rawMessage;
      }
    }
  }

  resetToDefaultOrigin() {
    this.userGpsLocation = null;
    this.currentStation = DEFAULT_STATION;
    if (this.dom.originLabel) {
      this.dom.originLabel.textContent = '而家用澳門內港做起點（未開定位）';
    }
    this.renderStationRail();
    this.loadStationData(DEFAULT_STATION);
  }

  clearStationData(errorMessage = '暫時未能載入該站潮汐數據，即時連線失敗') {
    this.currentHeight = null;
    this.extremes = [];
    this.hourlyPoints = [];
    this.marineConditions = null;
    this.weatherConditions = null;
    this.weatherDaily = null;
    this.nextExtremeInfo = null;
    this.updateHeroReadout();
    if (this.dom.extremesList) {
      this.dom.extremesList.innerHTML = '<span class="empty-note">未有今日潮位極值資料</span>';
    }
    if (this.dom.marineStrip) {
      this.dom.marineStrip.innerHTML = '<span class="empty-note">未有海況資料</span>';
    }
    if (this.chart) {
      this.chart.renderEmpty(errorMessage);
    }
  }

  renderErrorState(message) {
    if (this.dom.heroNextExtreme) {
      this.dom.heroNextExtreme.textContent = message;
    }
    if (this.chart) {
      this.chart.renderEmpty(message);
    }
  }
}

// Bootstrap on DOMContentLoaded in browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
}
