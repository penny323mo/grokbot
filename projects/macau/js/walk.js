/**
 * Pedestrian plans from FOSSGIS Valhalla, with OSRM foot as fallback.
 * A car-speed "foot" profile from the generic public OSRM host is rejected upstream.
 * Flatter and shorter are labelled from the metrics, not assumed to be opposites.
 */

import { areMeaningfullyDifferent } from '../../ce-lou/js/utils.js';
import { fetchSlopeWalkingRoutes, parseOsrmFootResponse } from '../../ce-lou/js/router.js';
import { classifyCalculation } from './sources.js';

export { parseOsrmFootResponse };

export function failedWalk(message = '暫時未能計算步行路線') {
  return {
    ok: false,
    status: 'failed',
    hasAlternative: false,
    options: [],
    message,
    durationMinutes: null,
    distanceMeters: null
  };
}

export function presentRejectedWalk(parsed) {
  return failedWalk(parsed?.message || '暫時未能計算步行路線');
}

function pickFlatter(a, b) {
  if (a.climbMeters !== b.climbMeters) return a.climbMeters < b.climbMeters ? a : b;
  if ((a.stairsCount || 0) !== (b.stairsCount || 0)) {
    return (a.stairsCount || 0) < (b.stairsCount || 0) ? a : b;
  }
  return a.distanceMeters <= b.distanceMeters ? a : b;
}

function pickShorter(a, b) {
  if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters < b.distanceMeters ? a : b;
  return (a.durationSeconds || 0) <= (b.durationSeconds || 0) ? a : b;
}

export function classifyWalkRoutes(primary, alternative) {
  if (!primary?.ok) return failedWalk(primary?.message);
  if (!alternative?.ok || !areMeaningfullyDifferent(primary, alternative)) {
    return {
      ok: true,
      status: 'ok',
      hasAlternative: false,
      singlePathNote: '去呢度主要得呢條行人路',
      options: [{ ...primary, role: 'only', tag: '行人路' }]
    };
  }
  const flatter = pickFlatter(primary, alternative);
  const shorter = pickShorter(primary, alternative);
  if (flatter === shorter) {
    const other = flatter === primary ? alternative : primary;
    return {
      ok: true,
      status: 'ok',
      hasAlternative: true,
      singlePathNote: null,
      options: [
        { ...flatter, role: 'both', tag: '較平又較短' },
        { ...other, role: 'other', tag: '另一條行法' }
      ]
    };
  }
  return {
    ok: true,
    status: 'ok',
    hasAlternative: true,
    singlePathNote: null,
    options: [
      { ...flatter, role: 'flatter', tag: '較平' },
      { ...shorter, role: 'shorter', tag: '較短' }
    ]
  };
}

export function withWalkProvenance(route, now = Date.now()) {
  const retrievedAt = route.fetchedAt || now;
  return {
    ...route,
    provenance: {
      official: false,
      kind: 'estimate',
      observedAt: null,
      retrievedAt,
      calculatedAt: retrievedAt,
      freshness: classifyCalculation(retrievedAt, now),
      sourceName: route.sourceName,
      sourceUrl: route.sourceUrl,
      coverage: 'OpenStreetMap 行人路網估算，唔係澳門官方測量，亦唔保證無障礙',
      cadence: '改起點或終點先再計；公開服務無承諾'
    }
  };
}

export function stairsLine(count) {
  const n = Number(count) || 0;
  if (n > 0) return `導航指示有 ${n} 處樓梯`;
  return '導航指示冇提到樓梯（唔等於路上冇梯）';
}

export async function planWalk(origin, destination, fetchFn = fetch, timeoutMs = 8000) {
  try {
    const plan = await fetchSlopeWalkingRoutes(origin, destination, fetchFn, timeoutMs);
    if (!plan?.ok || !Array.isArray(plan.options) || plan.options.length === 0) {
      return failedWalk(plan?.message);
    }
    const now = Date.now();
    const classified = plan.hasAlternative && plan.options.length >= 2
      ? classifyWalkRoutes(plan.options[0], plan.options[1])
      : classifyWalkRoutes(plan.options[0], null);
    if (!classified.ok) return classified;
    classified.options = classified.options.map((o) => withWalkProvenance(o, now));
    return classified;
  } catch {
    return failedWalk();
  }
}
