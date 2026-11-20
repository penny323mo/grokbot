/**
 * Geolocation readings. Mock adapters must set mock: true so the copy says 模擬.
 * Codes follow the Geolocation API: 1 denied, 2 unavailable, 3 timeout.
 */

import { evaluateCoordinate } from './places.js';

const COPY = {
  success: '已用你而家嘅位置做起點',
  denied: '你未允許定位，起點保持議事亭前地',
  unavailable: '呢部機而家定位唔到，起點保持議事亭前地',
  timeout: '定位等太耐，起點保持議事亭前地',
  outside: '你而家唔喺澳門範圍，起點保持議事亭前地'
};

export function labelGeo(status, mock) {
  const base = COPY[status] || COPY.unavailable;
  return mock ? `模擬定位 · ${base}` : base;
}

export function readGeolocation(api, options = {}) {
  const timeoutMs = options.timeoutMs ?? 8000;
  const mock = options.mock === true || api?.mock === true;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (status, extra = {}) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        status,
        mock,
        lat: extra.lat ?? null,
        lon: extra.lon ?? null,
        message: labelGeo(status, mock)
      });
    };

    const timer = setTimeout(() => finish('timeout'), timeoutMs);

    if (!api || typeof api.getCurrentPosition !== 'function') {
      finish('unavailable');
      return;
    }

    try {
      api.getCurrentPosition(
        (pos) => {
          const lat = pos?.coords?.latitude;
          const lon = pos?.coords?.longitude;
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            finish('unavailable');
            return;
          }
          finish('success', { lat, lon });
        },
        (err) => {
          const code = Number(err?.code);
          if (code === 1) finish('denied');
          else if (code === 3) finish('timeout');
          else finish('unavailable');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
      );
    } catch {
      finish('unavailable');
    }
  });
}

export function applyGeoToTrip(trip, reading) {
  const mock = !!reading.mock;
  if (reading.status === 'success') {
    const judged = evaluateCoordinate(reading.lat, reading.lon);
    if (!judged.accepted) {
      trip.setLocation({
        status: 'outside',
        mock,
        message: labelGeo('outside', mock)
      });
      return trip.getState();
    }
    trip.setOrigin({
      id: 'here',
      name: '我而家嘅位置',
      lat: reading.lat,
      lon: reading.lon,
      source: 'geolocation'
    });
    trip.setLocation({
      status: 'success',
      mock,
      message: labelGeo('success', mock)
    });
    return trip.getState();
  }

  const status = ['denied', 'unavailable', 'timeout'].includes(reading.status)
    ? reading.status
    : 'unavailable';
  trip.setLocation({
    status,
    mock,
    message: labelGeo(status, mock)
  });
  return trip.getState();
}
