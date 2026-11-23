/**
 * Elevation section from router samples only.
 * Two endpoint heights are not a route profile.
 */

export function renderProfile(route) {
  const samples = Array.isArray(route?.elevationSamples)
    ? route.elevationSamples.map(Number).filter((n) => Number.isFinite(n))
    : [];
  if (!route?.ok || samples.length < 3) {
    return {
      available: false,
      svg: '',
      label: '暫時未能讀到高度剖面'
    };
  }

  const W = 360;
  const H = 132;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  let min = Math.min(...samples);
  let max = Math.max(...samples);
  if (min === max) {
    min -= 5;
    max += 5;
  }
  const yMin = Math.max(0, Math.floor((min - 4) / 10) * 10);
  const yMax = Math.ceil((max + 4) / 10) * 10;
  const span = Math.max(10, yMax - yMin);
  const x = (i) => padL + (i / (samples.length - 1)) * plotW;
  const y = (v) => padT + plotH - ((v - yMin) / span) * plotH;
  let d = `M ${x(0).toFixed(1)} ${y(samples[0]).toFixed(1)}`;
  for (let i = 1; i < samples.length; i += 1) {
    d += ` L ${x(i).toFixed(1)} ${y(samples[i]).toFixed(1)}`;
  }
  const base = padT + plotH;
  const area = `${d} L ${x(samples.length - 1).toFixed(1)} ${base} L ${x(0).toFixed(1)} ${base} Z`;
  const stroke = route.role === 'shorter' ? '#8E3B2A' : '#245C45';
  const start = Math.round(samples[0]);
  const end = Math.round(samples[samples.length - 1]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="高度剖面，${samples.length} 個樣本，由 ${start} 米到 ${end} 米">
    <line x1="${padL}" y1="${base}" x2="${W - padR}" y2="${base}" stroke="#E4D9CC" stroke-width="1"/>
    <text x="4" y="${y(yMax).toFixed(1)}" fill="#6B6258" font-size="11">${yMax}</text>
    <text x="4" y="${(base + 4).toFixed(1)}" fill="#6B6258" font-size="11">${yMin}</text>
    <path d="${area}" fill="#E7D8C4" opacity="0.85"/>
    <path d="${d}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="${padL}" y="${H - 8}" fill="#6B6258" font-size="11">起 ${start} 米</text>
    <text x="${W - padR}" y="${H - 8}" text-anchor="end" fill="#6B6258" font-size="11">終 ${end} 米</text>
  </svg>`;
  return {
    available: true,
    svg,
    label: `高度剖面，${samples.length} 個樣本，由樣本計，唔係官方高程`
  };
}
