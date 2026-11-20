/**
 * Provenance helpers. Observation time and retrieval time stay separate.
 * Source lines are structured parts so a renderer cannot drop the hyperlink
 * by writing textContent over a whole footer.
 */

import { formatMacauTime } from '../../ce-lou/js/utils.js';

export const WALK_STALE_MS = 24 * 60 * 60 * 1000;
export const SNAPSHOT_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export function classifyCalculation(retrievedAt, now = Date.now(), staleMs = WALK_STALE_MS) {
  const t = new Date(retrievedAt).getTime();
  if (!Number.isFinite(t)) return 'unknown';
  return now - t > staleMs ? 'stale' : 'calculated';
}

export function classifySnapshot(retrievedAt, now = Date.now(), staleMs = SNAPSHOT_STALE_MS) {
  const t = new Date(retrievedAt).getTime();
  if (!Number.isFinite(t)) return 'unknown';
  return now - t > staleMs ? 'stale' : 'dated';
}

export function formatWhen(value) {
  if (value == null || value === '') return '';
  return formatMacauTime(value, 'datetime');
}

export function walkSourceParts(route) {
  const prov = route?.provenance || {};
  const when = formatWhen(prov.retrievedAt || route?.fetchedAt);
  const fresh = prov.freshness === 'stale' ? '，已超過一日，當過時' : '';
  return [
    { type: 'text', text: '行人路徑係估算，唔係官方測量。' },
    { type: 'link', text: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' },
    { type: 'text', text: '／' },
    {
      type: 'link',
      text: route?.provider === 'osrm' ? 'FOSSGIS 行人路徑' : 'FOSSGIS Valhalla',
      href: route?.sourceUrl || 'https://valhalla1.openstreetmap.de'
    },
    {
      type: 'text',
      text: `。計算時間 ${when || '未知'}（澳門時間）${fresh}。觀測時間：無，呢個服務唔提供實測時刻。`
    }
  ];
}

export function busSourceParts(plan) {
  const prov = plan?.provenance || {};
  const when = prov.retrievedAt ? formatMacauTime(prov.retrievedAt, 'date') : '未知日期';
  const stale = prov.freshness === 'stale' ? '呢份下載已超過七日。' : '';
  return [
    { type: 'text', text: `路線同站位係 ${when} 下載，唔係即時到站。${stale}` },
    { type: 'link', text: '交通事務局公開巴士查詢', href: 'https://bis.dsat.gov.mo/macauweb/' },
    { type: 'text', text: '。下載時間唔等於路上嘅觀測時間。' }
  ];
}

export function smgSourceParts(line) {
  return [
    { type: 'text', text: `${line.text} ` },
    { type: 'link', text: line.linkText, href: line.href }
  ];
}

export function rainSourceParts(hint) {
  if (!hint?.show) {
    return [
      { type: 'text', text: hint?.note || '落雨模式預測暫時讀唔到。' },
      { type: 'link', text: 'Open-Meteo', href: 'https://open-meteo.com/' },
      { type: 'text', text: '（可選模式，非官方觀測）。' }
    ];
  }
  return [
    { type: 'text', text: `${hint.message} ` },
    { type: 'link', text: 'Open-Meteo', href: 'https://open-meteo.com/' },
    { type: 'text', text: `。模式時間 ${hint.modelTimeStr || ''}（澳門時間），唔係官方觀測。` }
  ];
}

export function applyParts(doc, parent, parts) {
  parent.replaceChildren();
  for (const part of parts) {
    if (part.type === 'link') {
      const a = doc.createElement('a');
      a.href = part.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = part.text;
      parent.appendChild(a);
    } else {
      parent.appendChild(doc.createTextNode(part.text));
    }
  }
}

export function partsHaveLinks(parts) {
  return parts.some((p) => p.type === 'link' && typeof p.href === 'string' && p.href.startsWith('http'));
}
