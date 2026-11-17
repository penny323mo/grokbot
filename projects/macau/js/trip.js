/**
 * One origin, one destination, one location reading.
 * Walk and bus both read this state. Changing mode does not move the pins.
 */

import { DEFAULT_DESTINATION, DEFAULT_ORIGIN } from './places.js';

export function coordKey(origin, destination) {
  const n = (v) => Number(v).toFixed(5);
  return `${n(origin.lat)},${n(origin.lon)}|${n(destination.lat)},${n(destination.lon)}`;
}

export function createTrip(seed = {}) {
  let state = {
    origin: { ...DEFAULT_ORIGIN, ...(seed.origin || {}) },
    destination: { ...DEFAULT_DESTINATION, ...(seed.destination || {}) },
    mode: seed.mode === 'bus' ? 'bus' : 'walk',
    walkIndex: Number.isInteger(seed.walkIndex) ? seed.walkIndex : 0,
    busIndex: Number.isInteger(seed.busIndex) ? seed.busIndex : 0,
    mapPick: seed.mapPick === 'origin' ? 'origin' : 'destination',
    location: seed.location || {
      status: 'idle',
      mock: false,
      message: '而家用議事亭前地做起點（未開定位）'
    },
    revision: 0
  };
  const listeners = new Set();

  function commit(partial) {
    state = { ...state, ...partial, revision: state.revision + 1 };
    for (const fn of listeners) fn(state);
  }

  return {
    getState() {
      return state;
    },
    planKey() {
      return coordKey(state.origin, state.destination);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setOrigin(place) {
      commit({ origin: { ...place } });
    },
    setDestination(place) {
      commit({ destination: { ...place } });
    },
    setMode(mode) {
      if (mode !== 'walk' && mode !== 'bus') {
        throw new Error(`unknown mode ${mode}`);
      }
      commit({ mode });
    },
    setWalkIndex(index) {
      commit({ walkIndex: index });
    },
    setBusIndex(index) {
      commit({ busIndex: index });
    },
    setMapPick(pick) {
      if (pick !== 'origin' && pick !== 'destination') {
        throw new Error(`unknown map pick ${pick}`);
      }
      commit({ mapPick: pick });
    },
    setLocation(location) {
      commit({ location: { ...location } });
    },
    swap() {
      commit({ origin: state.destination, destination: state.origin });
    }
  };
}
