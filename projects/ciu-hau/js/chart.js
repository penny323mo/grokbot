/**
 * chart.js · 潮候 Ciu Hau
 * 48-hour typographic interactive tide curve renderer (SVG).
 * Swiss-grid editorial styling: Josef Müller-Brockmann / WillyWeather / yr.no.
 */

import { formatMacauTimeOnly, getMacauCivilDate, getMacauCivilDateAddDays, getMacauMidnightTimestamp } from './geo.js';

export class TideChart {
  /**
   * @param {HTMLElement} container
   * @param {object} options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign(
      {
        width: 390,
        height: 224,
        marginTop: 34,
        marginBottom: 38,
        marginLeft: 20,
        marginRight: 20,
        accentColor: '#3D6B9A',
        inkColor: '#161C24',
        ruleColor: '#E2E6E9',
        stoneColor: '#6B7380',
        fieldColor: '#F4F6F8'
      },
      options
    );

    this.hourlyPoints = [];
    this.extremes = [];
    this.nowTime = new Date();
    this.datumLabel = '海圖基準面（CD）';
    this.onScrub = options.onScrub || null;
    this.onScrubEnd = options.onScrubEnd || null;

    this.isScrubbing = false;
    this.scrubX = null;
    this.revertTimer = null;

    this.initDom();
    this.initEvents();
  }

  initDom() {
    this.container.innerHTML = `
      <div class="tide-chart-wrapper" style="position: relative; width: 100%; user-select: none; touch-action: pan-y;">
        <svg class="tide-chart-svg" viewBox="0 0 ${this.options.width} ${this.options.height}" preserveAspectRatio="none" style="display: block; width: 100%; height: auto; overflow: visible;">
          <defs>
            <linearGradient id="tide-fill-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${this.options.accentColor}" stop-opacity="0.18" />
              <stop offset="100%" stop-color="${this.options.accentColor}" stop-opacity="0.02" />
            </linearGradient>
            <filter id="scrub-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#161C24" flood-opacity="0.12" />
            </filter>
          </defs>
          <g class="chart-bg-layer"></g>
          <g class="chart-grid-layer"></g>
          <g class="chart-curve-layer"></g>
          <g class="chart-extremes-layer"></g>
          <g class="chart-now-layer"></g>
          <g class="chart-scrub-layer" style="display: none;"></g>
        </svg>
        <div class="tide-chart-tooltip" style="display: none; position: absolute; pointer-events: none; transform: translate(-50%, -100%);"></div>
      </div>
    `;

    this.svg = this.container.querySelector('.tide-chart-svg');
    this.bgLayer = this.svg.querySelector('.chart-bg-layer');
    this.gridLayer = this.svg.querySelector('.chart-grid-layer');
    this.curveLayer = this.svg.querySelector('.chart-curve-layer');
    this.extremesLayer = this.svg.querySelector('.chart-extremes-layer');
    this.nowLayer = this.svg.querySelector('.chart-now-layer');
    this.scrubLayer = this.svg.querySelector('.chart-scrub-layer');
    this.tooltip = this.container.querySelector('.tide-chart-tooltip');
  }

  initEvents() {
    const wrapper = this.container.querySelector('.tide-chart-wrapper');

    const handlePointerMove = (e) => {
      if (!this.hourlyPoints || this.hourlyPoints.length < 2) return;
      const rect = this.svg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const svgX = (relX / rect.width) * this.options.width;

      this.isScrubbing = true;
      if (this.revertTimer) clearTimeout(this.revertTimer);

      this.renderScrub(svgX);
    };

    const handlePointerEnd = () => {
      if (!this.isScrubbing) return;
      this.revertTimer = setTimeout(() => {
        this.clearScrub();
        if (this.onScrubEnd) this.onScrubEnd();
      }, 2500);
    };

    wrapper.addEventListener('pointerdown', (e) => {
      wrapper.setPointerCapture?.(e.pointerId);
      handlePointerMove(e);
    });

    wrapper.addEventListener('pointermove', (e) => {
      if (this.isScrubbing || e.buttons === 1) {
        handlePointerMove(e);
      }
    });

    wrapper.addEventListener('pointerup', (e) => {
      wrapper.releasePointerCapture?.(e.pointerId);
      handlePointerEnd();
    });

    wrapper.addEventListener('pointercancel', handlePointerEnd);
  }

  /**
   * Updates chart data and re-renders.
   *
   * @param {Array<{ timestamp: Date, height: number }>} hourlyPoints
   * @param {Array<{ timestamp: Date, time: string, height: number, type: 'high'|'low', approx?: boolean }>} extremes
   * @param {Date} [nowTime]
   * @param {string} [datumLabel]
   */
  setData(hourlyPoints, extremes, nowTime = new Date(), datumLabel = '海圖基準面（CD）') {
    this.hourlyPoints = hourlyPoints || [];
    this.extremes = extremes || [];
    this.nowTime = nowTime;
    this.datumLabel = datumLabel;

    this.render();
  }

  render() {
    if (!this.hourlyPoints || this.hourlyPoints.length < 2) {
      this.renderEmpty();
      return;
    }

    const { width, height, marginTop, marginBottom, marginLeft, marginRight } = this.options;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    // Time domain
    const tMin = this.hourlyPoints[0].timestamp.getTime();
    const tMax = this.hourlyPoints[this.hourlyPoints.length - 1].timestamp.getTime();
    const dt = tMax - tMin;
    if (dt <= 0) return;

    // Height domain (with breathing room)
    const heights = this.hourlyPoints.map(p => p.height);
    const rawMin = Math.min(...heights);
    const rawMax = Math.max(...heights);
    const padding = Math.max(0.35, (rawMax - rawMin) * 0.18);
    const yMin = Math.floor((rawMin - padding) * 10) / 10;
    const yMax = Math.ceil((rawMax + padding) * 10) / 10;
    const dy = yMax - yMin;

    this.scales = {
      tMin,
      tMax,
      yMin,
      yMax,
      getX: (t) => marginLeft + ((t - tMin) / dt) * plotWidth,
      getY: (h) => marginTop + plotHeight - ((h - yMin) / dy) * plotHeight,
      getTimeFromX: (x) => tMin + ((x - marginLeft) / plotWidth) * dt
    };

    this.renderGrid();
    this.renderCurve();
    this.renderExtremes();
    this.renderNow();
  }

  renderEmpty(message = '讀取緊潮汐時間序列…') {
    this.gridLayer.innerHTML = '';
    this.curveLayer.innerHTML = '';
    this.extremesLayer.innerHTML = '';
    this.nowLayer.innerHTML = '';
    this.scrubLayer.innerHTML = '';
    if (this.tooltip) this.tooltip.style.display = 'none';

    this.bgLayer.innerHTML = `
      <text x="${this.options.width / 2}" y="${this.options.height / 2}" text-anchor="middle" fill="${this.options.stoneColor}" font-size="13">
        ${message}
      </text>
    `;
  }

  renderGrid() {
    const { width, height, marginTop, marginBottom, marginLeft, marginRight, ruleColor, stoneColor } = this.options;
    const { yMin, yMax, getY, getX, tMin, tMax } = this.scales;

    let gridHtml = '';

    // Horizontal height grid lines (every 0.5m or 1.0m)
    const step = (yMax - yMin) > 3 ? 1.0 : 0.5;
    const startY = Math.ceil(yMin / step) * step;

    for (let h = startY; h <= yMax; h += step) {
      const y = getY(h);
      if (y >= marginTop - 2 && y <= height - marginBottom + 2) {
        gridHtml += `
          <line x1="${marginLeft}" y1="${y}" x2="${width - marginRight}" y2="${y}" stroke="${ruleColor}" stroke-width="0.75" stroke-dasharray="2 3" />
          <text x="${marginLeft - 4}" y="${y + 3.5}" text-anchor="end" fill="${stoneColor}" font-size="9" font-family="'Newsreader', 'Source Serif Pro', Georgia, serif" font-variant-numeric="tabular-nums">
            ${h.toFixed(1)}
          </text>
        `;
      }
    }

    // Baseline (0.0m if in range)
    if (yMin <= 0 && yMax >= 0) {
      const y0 = getY(0);
      gridHtml += `
        <line x1="${marginLeft}" y1="${y0}" x2="${width - marginRight}" y2="${y0}" stroke="${stoneColor}" stroke-width="1" opacity="0.6" />
      `;
    }

    // Day boundary dividing line (midnight in Asia/Macau)
    const startCivil = getMacauCivilDate(new Date(tMin));
    const tomorrowCivil = startCivil ? getMacauCivilDateAddDays(startCivil, 1) : null;
    const midnightMs = tomorrowCivil ? getMacauMidnightTimestamp(new Date(Date.UTC(tomorrowCivil.year, tomorrowCivil.month - 1, tomorrowCivil.day, 4, 0, 0))) : 0;

    if (midnightMs > tMin && midnightMs < tMax) {
      const midX = getX(midnightMs);
      gridHtml += `
        <line x1="${midX.toFixed(1)}" y1="${marginTop}" x2="${midX.toFixed(1)}" y2="${height - marginBottom}" stroke="${stoneColor}" stroke-width="1" stroke-dasharray="3 3" opacity="0.7" />
        <!-- Dedicated Day Row below time ticks (y = height - marginBottom + 28) -->
        <text x="${((marginLeft + midX) / 2).toFixed(1)}" y="${height - marginBottom + 28}" text-anchor="middle" fill="${this.options.inkColor}" font-size="11" font-weight="600" letter-spacing="1">
          今日
        </text>
        <text x="${((midX + width - marginRight) / 2).toFixed(1)}" y="${height - marginBottom + 28}" text-anchor="middle" fill="${this.options.inkColor}" font-size="11" font-weight="600" letter-spacing="1">
          聽日
        </text>
      `;
    }

    // Time tick labels along the bottom on Row 1 (00:00, 06:00, 12:00, 18:00...)
    for (const pt of this.hourlyPoints) {
      const civil = getMacauCivilDate(pt.timestamp);
      if (!civil) continue;
      const h = civil.hour;
      if (h % 6 === 0 && civil.minute === 0) {
        const x = getX(pt.timestamp.getTime());
        if (x >= marginLeft + 8 && x <= width - marginRight - 8) {
          // Check if an extreme callout lands within 32px of this tick
          const nearExtreme = this.extremes.some(ext => {
            const extX = getX(ext.timestamp.getTime());
            return Math.abs(extX - x) < 32;
          });

          // Draw tick mark
          gridHtml += `
            <line x1="${x.toFixed(1)}" y1="${height - marginBottom}" x2="${x.toFixed(1)}" y2="${height - marginBottom + 4}" stroke="${stoneColor}" stroke-width="0.75" />
          `;

          // Only draw tick text if not colliding with an extreme label
          if (!nearExtreme) {
            const timeLabel = `${String(h).padStart(2, '0')}:00`;
            gridHtml += `
              <text x="${x.toFixed(1)}" y="${height - marginBottom + 14}" text-anchor="middle" fill="${stoneColor}" font-size="9.5" font-family="'Newsreader', 'Source Serif Pro', Georgia, serif" font-variant-numeric="tabular-nums">
                ${timeLabel}
              </text>
            `;
          }
        }
      }
    }

    this.gridLayer.innerHTML = gridHtml;
  }

  renderCurve() {
    const { getX, getY } = this.scales;
    const { height, marginBottom } = this.options;
    const bottomY = height - marginBottom;

    const points = this.hourlyPoints.map(p => ({
      x: getX(p.timestamp.getTime()),
      y: getY(p.height)
    }));

    if (points.length < 2) return;

    // Stroke a polyline through the hourly points (matches linear interpolation of scrub dot)
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    // Closed area path for gradient fill
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${bottomY} L ${points[0].x.toFixed(1)} ${bottomY} Z`;

    this.curveLayer.innerHTML = `
      <path d="${areaD}" fill="url(#tide-fill-grad)" />
      <path d="${pathD}" fill="none" stroke="${this.options.accentColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    `;
  }

  renderExtremes() {
    const { getX, getY, tMin, tMax } = this.scales;
    const { height, marginBottom, marginTop } = this.options;
    let extremesHtml = '';

    const validExtremes = this.extremes.filter(ext => {
      const t = ext.timestamp.getTime();
      return t >= tMin && t <= tMax;
    });

    for (const ext of validExtremes) {
      const t = ext.timestamp.getTime();
      const x = getX(t);
      const y = getY(ext.height);

      const isHigh = ext.type === 'high';
      const dotColor = isHigh ? this.options.accentColor : this.options.inkColor;

      // Check if another callout is within 36px horizontally
      const hasNearbyCallout = validExtremes.some(other => {
        if (other === ext) return false;
        const otherX = getX(other.timestamp.getTime());
        return Math.abs(otherX - x) < 36;
      });

      // Lows near baseline or intermediate callouts within 36px draw ONLY metres.
      // High peaks with plenty of headroom draw both time and metres separated by at least 16px.
      const canShowTime = isHigh && !hasNearbyCallout && (y - 24 >= marginTop - 10);

      const isNearBottom = y >= (height - marginBottom - 24);
      const placeAbove = isHigh || isNearBottom;

      const timePrefix = ext.approx ? '約 ' : '';
      const metresY = isHigh ? y - 8 : (isNearBottom ? y - 16 : y + 16);
      const timeY = placeAbove ? y - 24 : y + 32;

      let labelContent = `
        <text x="${x.toFixed(1)}" y="${metresY.toFixed(1)}" text-anchor="middle" fill="${this.options.inkColor}" font-size="10.5" font-family="'Newsreader', 'Source Serif Pro', Georgia, serif" font-weight="600" font-variant-numeric="tabular-nums">
          ${ext.height.toFixed(2)}m
        </text>
      `;

      if (canShowTime) {
        labelContent += `
          <text x="${x.toFixed(1)}" y="${timeY.toFixed(1)}" text-anchor="middle" fill="${this.options.stoneColor}" font-size="9" font-family="'Newsreader', 'Source Serif Pro', Georgia, serif">
            ${timePrefix}${ext.time}
          </text>
        `;
      }

      extremesHtml += `
        <g class="chart-extreme-node" data-type="${ext.type}">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${dotColor}" stroke="#FFFFFF" stroke-width="1.8" />
          ${labelContent}
        </g>
      `;
    }

    this.extremesLayer.innerHTML = extremesHtml;
  }

  renderNow() {
    if (!this.scales) return;
    const { getX, getY, tMin, tMax } = this.scales;
    const { height, marginTop, marginBottom, accentColor } = this.options;

    const nowMs = this.nowTime.getTime();
    if (nowMs < tMin || nowMs > tMax) {
      this.nowLayer.innerHTML = '';
      return;
    }

    const nowX = getX(nowMs);
    // Interpolate current height on curve
    let nowY = marginTop + (height - marginTop - marginBottom) / 2;
    for (let i = 0; i < this.hourlyPoints.length - 1; i++) {
      const t0 = this.hourlyPoints[i].timestamp.getTime();
      const t1 = this.hourlyPoints[i + 1].timestamp.getTime();
      if (nowMs >= t0 && nowMs <= t1) {
        const frac = (nowMs - t0) / (t1 - t0);
        const h = this.hourlyPoints[i].height + frac * (this.hourlyPoints[i + 1].height - this.hourlyPoints[i].height);
        nowY = getY(h);
        break;
      }
    }

    this.nowLayer.innerHTML = `
      <g class="chart-now-marker">
        <line x1="${nowX.toFixed(1)}" y1="${marginTop}" x2="${nowX.toFixed(1)}" y2="${height - marginBottom}" stroke="${accentColor}" stroke-width="1.5" stroke-dasharray="2 2" />
        <circle cx="${nowX.toFixed(1)}" cy="${nowY.toFixed(1)}" r="5.5" fill="${accentColor}" stroke="#FFFFFF" stroke-width="2" />
        <rect x="${(nowX - 16).toFixed(1)}" y="${(marginTop - 18).toFixed(1)}" width="32" height="15" rx="3" fill="${accentColor}" />
        <text x="${nowX.toFixed(1)}" y="${(marginTop - 7).toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="600">
          現時
        </text>
      </g>
    `;
  }

  renderScrub(svgX) {
    if (!this.scales) return;
    const { getX, getY, getTimeFromX, tMin, tMax, yMin, yMax } = this.scales;
    const { height, marginTop, marginBottom, marginLeft, marginRight, width } = this.options;

    const boundedX = Math.max(marginLeft, Math.min(width - marginRight, svgX));
    const targetTime = getTimeFromX(boundedX);
    const targetDate = new Date(targetTime);

    // Find surrounding hourly points to interpolate height
    let interpolatedHeight = yMin;
    for (let i = 0; i < this.hourlyPoints.length - 1; i++) {
      const t0 = this.hourlyPoints[i].timestamp.getTime();
      const t1 = this.hourlyPoints[i + 1].timestamp.getTime();
      if (targetTime >= t0 && targetTime <= t1) {
        const frac = (targetTime - t0) / (t1 - t0);
        interpolatedHeight = this.hourlyPoints[i].height + frac * (this.hourlyPoints[i + 1].height - this.hourlyPoints[i].height);
        break;
      }
    }

    const scrubY = getY(interpolatedHeight);
    const timeStr = formatMacauTimeOnly(targetDate);

    this.scrubLayer.style.display = 'block';
    this.scrubLayer.innerHTML = `
      <g class="chart-scrub-indicator">
        <line x1="${boundedX.toFixed(1)}" y1="${marginTop}" x2="${boundedX.toFixed(1)}" y2="${height - marginBottom}" stroke="${this.options.inkColor}" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.8" />
        <circle cx="${boundedX.toFixed(1)}" cy="${scrubY.toFixed(1)}" r="6" fill="${this.options.inkColor}" stroke="#FFFFFF" stroke-width="2" />
        <!-- Floating badge atop scrub line -->
        <rect x="${(boundedX - 38).toFixed(1)}" y="${(marginTop - 22).toFixed(1)}" width="76" height="18" rx="3" fill="${this.options.inkColor}" filter="url(#scrub-shadow)" />
        <text x="${boundedX.toFixed(1)}" y="${(marginTop - 9).toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-size="10" font-family="'Newsreader', 'Source Serif Pro', Georgia, serif" font-weight="600" font-variant-numeric="tabular-nums">
          ${timeStr} · ${interpolatedHeight.toFixed(2)}m
        </text>
      </g>
    `;

    if (this.onScrub) {
      this.onScrub({
        timeStr,
        height: Number(interpolatedHeight.toFixed(2)),
        timestamp: targetDate,
        datumLabel: this.datumLabel
      });
    }
  }

  clearScrub() {
    this.isScrubbing = false;
    this.scrubLayer.style.display = 'none';
    this.scrubLayer.innerHTML = '';
  }
}
