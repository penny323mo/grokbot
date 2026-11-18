/**
 * 出門 (Cheut Mun) - Compact SVG Elevation Profile Drawing & Interactive Scrub
 */

import { formatDistance, formatElevation } from './utils.js';

export function renderElevationProfile(container, route, options = {}) {
  if (!container) return;

  if (!route || !route.ok || !route.elevationSamples || route.elevationSamples.length < 2) {
    container.innerHTML = `
      <div class="profile-unavailable">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 17l6-6 4 4 8-8"></path>
          <line x1="3" y1="21" x2="21" y2="21"></line>
        </svg>
        <span>暫時未能讀到高度剖面（無地形樣本）</span>
      </div>
    `;
    return;
  }

  const samples = route.elevationSamples;
  const interval = route.elevationInterval || 15;
  const totalDist = route.distanceMeters || (samples.length - 1) * interval;
  const strokeColor = options.strokeColor || '#2143A8';
  const washColor = options.washColor || '#D4D8E6';

  const W = 360;
  const H = 130;
  const padL = 34;
  const padR = 20;
  const padT = 20;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  let minElev = Math.min(...samples);
  let maxElev = Math.max(...samples);
  if (minElev === maxElev) {
    minElev -= 5;
    maxElev += 5;
  }
  const elevRange = maxElev - minElev;
  const yPad = Math.max(4, elevRange * 0.15);
  const yMin = Math.max(0, Math.floor((minElev - yPad) / 5) * 5);
  const yMax = Math.ceil((maxElev + yPad) / 5) * 5;
  const ySpan = Math.max(10, yMax - yMin);

  const getX = (i) => padL + (i / (samples.length - 1)) * plotW;
  const getY = (elev) => padT + plotH - ((elev - yMin) / ySpan) * plotH;

  let pathD = `M ${getX(0).toFixed(1)} ${getY(samples[0]).toFixed(1)}`;
  for (let i = 1; i < samples.length; i++) {
    pathD += ` L ${getX(i).toFixed(1)} ${getY(samples[i]).toFixed(1)}`;
  }

  const bottomY = padT + plotH;
  const areaD = `${pathD} L ${getX(samples.length - 1).toFixed(1)} ${bottomY} L ${getX(0).toFixed(1)} ${bottomY} Z`;

  // Horizontal elevation grid lines
  const gridSteps = 2;
  let gridSvg = '';
  for (let s = 0; s <= gridSteps; s++) {
    const val = Math.round(yMin + (s / gridSteps) * ySpan);
    const gy = getY(val);
    gridSvg += `
      <line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}" stroke="#C5C7D1" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.6" />
      <text x="${padL - 4}" y="${(gy + 3).toFixed(1)}" font-family="'Source Serif Pro', 'Newsreader', serif" font-size="9.5" fill="#6B7280" text-anchor="end">${val}m</text>
    `;
  }

  // Distance marks
  const distSteps = 3;
  let distMarksSvg = '';
  for (let d = 0; d <= distSteps; d++) {
    const distRatio = d / distSteps;
    const distM = Math.round(totalDist * distRatio);
    const gx = padL + distRatio * plotW;
    const label = distM >= 1000 ? `${(distM / 1000).toFixed(1)}km` : `${distM}m`;
    distMarksSvg += `
      <line x1="${gx.toFixed(1)}" y1="${bottomY}" x2="${gx.toFixed(1)}" y2="${bottomY + 3}" stroke="#C5C7D1" stroke-width="1" />
      <text x="${gx.toFixed(1)}" y="${bottomY + 14}" font-family="'Source Serif Pro', 'Newsreader', serif" font-size="9.5" fill="#6B7280" text-anchor="middle">${label}</text>
    `;
  }

  // Peak marker
  let maxIdx = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i] > samples[maxIdx]) maxIdx = i;
  }
  const peakX = getX(maxIdx);
  const peakY = getY(samples[maxIdx]);

  container.innerHTML = `
    <div class="profile-svg-wrap">
      <svg viewBox="0 0 ${W} ${H}" class="profile-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cmProfileWash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${washColor}" stop-opacity="0.85" />
            <stop offset="100%" stop-color="${washColor}" stop-opacity="0.15" />
          </linearGradient>
        </defs>

        <!-- Gridlines -->
        ${gridSvg}

        <!-- Bottom Axis -->
        <line x1="${padL}" y1="${bottomY}" x2="${W - padR}" y2="${bottomY}" stroke="#C5C7D1" stroke-width="1.2" />
        ${distMarksSvg}

        <!-- Wash Fill -->
        <path d="${areaD}" fill="url(#cmProfileWash)" />

        <!-- Profile Line -->
        <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Peak Dot & Label -->
        <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="4" fill="${strokeColor}" stroke="#FFF" stroke-width="1.5" />
        <text x="${peakX.toFixed(1)}" y="${(peakY - 6).toFixed(1)}" font-family="'Source Serif Pro', 'Newsreader', serif" font-size="10" font-weight="600" fill="${strokeColor}" text-anchor="middle">最高 ${Math.round(samples[maxIdx])}m</text>

        <!-- Interactive Scrub Elements -->
        <line id="scrub-line" x1="0" y1="${padT}" x2="0" y2="${bottomY}" stroke="#12141A" stroke-width="1.2" stroke-dasharray="3 2" style="display: none;" />
        <circle id="scrub-dot" cx="0" cy="0" r="4" fill="#2143A8" stroke="#FFF" stroke-width="1.5" style="display: none;" />
      </svg>
      <div id="scrub-tooltip" class="profile-tooltip" style="display: none;"></div>
    </div>
  `;

  attachProfileScrubber(container, samples, interval, totalDist, getX, getY, padL, plotW, padT, plotH);
}

function attachProfileScrubber(container, samples, interval, totalDist, getX, getY, padL, plotW, padT, plotH) {
  const svg = container.querySelector('.profile-svg');
  const scrubLine = container.querySelector('#scrub-line');
  const scrubDot = container.querySelector('#scrub-dot');
  const tooltip = container.querySelector('#scrub-tooltip');

  if (!svg || !scrubLine || !scrubDot || !tooltip) return;

  function handleScrub(clientX) {
    const rect = svg.getBoundingClientRect();
    const relX = clientX - rect.left;
    const svgX = (relX / rect.width) * 360;

    const clampedX = Math.max(padL, Math.min(padL + plotW, svgX));
    const ratio = (clampedX - padL) / plotW;
    const index = Math.round(ratio * (samples.length - 1));
    const safeIdx = Math.max(0, Math.min(samples.length - 1, index));

    const curElev = samples[safeIdx];
    const curDist = Math.round(totalDist * (safeIdx / (samples.length - 1)));
    const targetX = getX(safeIdx);
    const targetY = getY(curElev);

    let slopePct = 0;
    if (safeIdx > 0 && safeIdx < samples.length - 1) {
      const run = interval * 2;
      const rise = samples[safeIdx + 1] - samples[safeIdx - 1];
      slopePct = Math.round((rise / run) * 100);
    } else if (safeIdx === 0 && samples.length > 1) {
      slopePct = Math.round(((samples[1] - samples[0]) / interval) * 100);
    }

    scrubLine.setAttribute('x1', targetX.toFixed(1));
    scrubLine.setAttribute('x2', targetX.toFixed(1));
    scrubLine.style.display = 'block';

    scrubDot.setAttribute('cx', targetX.toFixed(1));
    scrubDot.setAttribute('cy', targetY.toFixed(1));
    scrubDot.style.display = 'block';

    const slopeLabel = slopePct >= 0 ? `+${slopePct}% 坡度` : `${slopePct}% 坡度`;
    tooltip.innerHTML = `<strong>${formatElevation(curElev)}</strong> · 步程 ${formatDistance(curDist)} · ${slopeLabel}`;
    tooltip.style.display = 'block';

    const pctLeft = (relX / rect.width) * 100;
    tooltip.style.left = `${Math.max(10, Math.min(90, pctLeft))}%`;
  }

  function handleEnd() {
    scrubLine.style.display = 'none';
    scrubDot.style.display = 'none';
    tooltip.style.display = 'none';
  }

  svg.addEventListener('mousemove', (e) => handleScrub(e.clientX));
  svg.addEventListener('mouseleave', handleEnd);

  svg.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      handleScrub(e.touches[0].clientX);
    }
  }, { passive: true });

  svg.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      handleScrub(e.touches[0].clientX);
    }
  }, { passive: true });

  svg.addEventListener('touchend', handleEnd);
  svg.addEventListener('touchcancel', handleEnd);
}
