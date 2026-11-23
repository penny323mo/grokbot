/**
 * One load for the current origin and destination.
 * Walk, bus, and the optional rain hint all see the same coordinates.
 */

import { planBus, failedBus } from './bus.js';
import { planRain, parseRain } from './rain.js';
import { coordKey } from './trip.js';
import { failedWalk, planWalk } from './walk.js';

export function failedPlans(origin, destination, message) {
  return {
    key: coordKey(origin, destination),
    demo: true,
    origin,
    destination,
    walk: failedWalk(message || '示範：行人路徑服務當咗失敗'),
    bus: failedBus(message || '示範：巴士資料當咗失敗'),
    rain: parseRain(null)
  };
}

export async function loadPlans(origin, destination, deps = {}) {
  const key = coordKey(origin, destination);
  if (deps.forceFail) return failedPlans(origin, destination);
  const walkFn = deps.walk || planWalk;
  const busFn = deps.bus || ((o, d) => planBus(o, d, { fetchFn: deps.fetchFn }));
  const rainFn = deps.rain || planRain;
  const [walk, bus, rain] = await Promise.all([
    Promise.resolve(walkFn(origin, destination)).catch(() => failedWalk()),
    Promise.resolve(busFn(origin, destination)).catch(() => failedBus()),
    Promise.resolve(rainFn(origin)).catch(() => parseRain(null))
  ]);
  return { key, demo: false, origin, destination, walk, bus, rain };
}
