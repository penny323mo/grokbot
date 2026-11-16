/**
 * 斜路 (Ce Lou) - Macau Slope-Aware Walking Decision Tool
 * Core Utilities, Coordinate Validation, and Geometric / Elevation Functions
 */

export const DEFAULT_ORIGIN = {
  code: "SENADO",
  name: "議事亭前地",
  name_pt: "Largo do Senado",
  lat: 22.1938271,
  lon: 113.5399903
};

export const DEFAULT_DESTINATION = {
  code: "GUIA_LIGHTHOUSE",
  name: "東望洋燈塔",
  name_pt: "Farol da Guia",
  lat: 22.1964359,
  lon: 113.5497062
};

export const DEFAULT_ORIGIN_MSG = "而家用議事亭前地做起點（未開定位）";

// Curated places with verified Nominatim / OSM coordinates
export const CURATED_PLACES = [
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
  {
    code: "A_MA",
    name: "媽閣廟",
    name_pt: "Templo de A-Ma",
    lat: 22.1861086,
    lon: 113.5312671
  },
  {
    code: "MONG_HA",
    name: "望廈炮台",
    name_pt: "Fortaleza de Mong-Há",
    lat: 22.2079651,
    lon: 113.5476729
  },
  {
    code: "HAC_SA",
    name: "黑沙海灘",
    name_pt: "Praia de Hác Sá",
    lat: 22.1212703,
    lon: 113.5709904
  },
  {
    code: "ALTO_COLOANE",
    name: "疊石塘山",
    name_pt: "Alto de Coloane",
    lat: 22.1206541,
    lon: 113.5612955
  }
];

export const MACAU_BOUNDS = {
  minLat: 22.08,
  maxLat: 22.25,
  minLon: 113.50,
  maxLon: 113.62
};

/**
 * Validate geolocation coordinate against Macau bounds.
 */
export function evaluateCoordinate(lat, lon) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return {
      accepted: false,
      isValid: false,
      isMacau: false,
      target: DEFAULT_ORIGIN,
      message: DEFAULT_ORIGIN_MSG
    };
  }

  const numLat = Number(lat);
  const numLon = Number(lon);

  const isMacau = (
    numLat >= 22.10 &&
    numLat <= 22.24 &&
    numLon >= 113.51 &&
    numLon <= 113.61
  );

  const isAdjacent = !isMacau && (
    numLat >= 22.05 &&
    numLat <= 22.28 &&
    numLon >= 113.48 &&
    numLon <= 113.65
  );

  const isValid = isMacau || isAdjacent;

  if (isMacau) {
    return {
      accepted: true,
      isValid: true,
      isMacau: true,
      target: {
        code: "USER_LOC",
        name: "我現時位置",
        lat: numLat,
        lon: numLon
      },
      message: "已定位到你現時位置"
    };
  }

  if (isAdjacent) {
    return {
      accepted: false,
      isValid: true,
      isMacau: false,
      target: DEFAULT_ORIGIN,
      message: "你現時位置在澳門邊界外，已保留議事亭前地起點。"
    };
  }

  return {
    accepted: false,
    isValid: false,
    isMacau: false,
    target: DEFAULT_ORIGIN,
    message: "你嘅位置超出澳門範圍，已返返議事亭前地起點。"
  };
}

/**
 * Haversine formula for straight-line distance in meters.
 * NOTE: Strictly used for indexing/bounds calculations.
 * NEVER display this result as a walking duration or distance!
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate that walking speed is realistic for a pedestrian (1.5 to 8.5 km/h).
 * Reject abnormal car-speed results such as 36 km/h.
 */
export function isRealisticWalkingSpeed(distanceOrSpeed, durationSeconds) {
  if (durationSeconds !== undefined) {
    if (!distanceOrSpeed || !durationSeconds || durationSeconds <= 0) return false;
    const speedKmh = (distanceOrSpeed / durationSeconds) * 3.6;
    return speedKmh >= 1.5 && speedKmh <= 8.5;
  }
  const speed = Number(distanceOrSpeed);
  if (isNaN(speed) || speed <= 0) return false;
  return speed >= 1.5 && speed <= 8.5;
}

/**
 * Format duration into clean Cantonese minutes.
 * Accepts seconds or integer minutes.
 * E.g. 1370s -> "23 分鐘"
 */
export function formatMinutes(val, isMinutes = false) {
  if (val == null || isNaN(val) || val < 0) return "--";
  let mins;
  if (isMinutes || (val < 180 && Number.isInteger(val))) {
    mins = val;
  } else {
    mins = Math.round(val / 60);
  }

  if (mins === 0) return "少於 1 分鐘";
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} 小時 ${m} 分鐘` : `${h} 小時`;
  }
  return `${mins} 分鐘`;
}

/**
 * Format distance into meters or kilometers.
 * E.g. 1659 -> "1.7 公里", 450 -> "450 米"
 */
export function formatDistance(meters) {
  if (meters == null || isNaN(meters) || meters < 0) return "--";
  if (meters < 1000) {
    return `${Math.round(meters)} 米`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} 公里`;
}

/**
 * Format elevation in meters.
 * E.g. 98.4 -> "98 米"
 */
export function formatElevation(meters) {
  if (meters == null || isNaN(meters)) return "--";
  return `${Math.round(meters)} 米`;
}

/**
 * Format timestamp in Asia/Macau timezone.
 */
export function formatMacauTime(dateOrUnix, format = 'time') {
  if (!dateOrUnix) return '';
  let d;
  if (typeof dateOrUnix === 'number') {
    d = new Date(dateOrUnix < 1e11 ? dateOrUnix * 1000 : dateOrUnix);
  } else if (typeof dateOrUnix === 'string') {
    d = new Date(dateOrUnix);
  } else {
    d = dateOrUnix;
  }

  if (isNaN(d.getTime())) return '';

  const opts = {
    timeZone: 'Asia/Macau',
    hour12: false
  };

  if (format === 'time') {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
    return new Intl.DateTimeFormat('zh-HK', opts).format(d);
  }

  if (format === 'date') {
    opts.year = 'numeric';
    opts.month = '2-digit';
    opts.day = '2-digit';
    const parts = new Intl.DateTimeFormat('zh-HK', opts).formatToParts(d);
    const m = {};
    for (const p of parts) m[p.type] = p.value;
    return `${m.year}年${Number(m.month)}月${Number(m.day)}日`;
  }

  opts.year = 'numeric';
  opts.month = '2-digit';
  opts.day = '2-digit';
  opts.hour = '2-digit';
  opts.minute = '2-digit';
  const parts = new Intl.DateTimeFormat('zh-HK', opts).formatToParts(d);
  const m = {};
  for (const p of parts) m[p.type] = p.value;
  return `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}`;
}

/**
 * Compute climb, descent, and elevation extrema strictly from an elevation sample array.
 * Never invent climb or descent from crow-flies endpoints!
 * @param {Array<number>} elevationSamples
 * @returns {{ climb: number, descent: number, minElev: number, maxElev: number, startElev: number, endElev: number, sampleCount: number }}
 */
export function calculateClimbAndDescent(elevationSamples) {
  if (!Array.isArray(elevationSamples) || elevationSamples.length === 0) {
    return {
      climb: 0,
      descent: 0,
      minElev: 0,
      maxElev: 0,
      startElev: 0,
      endElev: 0,
      sampleCount: 0
    };
  }

  let climb = 0;
  let descent = 0;
  let minElev = elevationSamples[0];
  let maxElev = elevationSamples[0];

  for (let i = 0; i < elevationSamples.length; i++) {
    const val = Number(elevationSamples[i]);
    if (val < minElev) minElev = val;
    if (val > maxElev) maxElev = val;

    if (i > 0) {
      const prev = Number(elevationSamples[i - 1]);
      const diff = val - prev;
      if (diff > 0) {
        climb += diff;
      } else {
        descent += Math.abs(diff);
      }
    }
  }

  return {
    climb: Number(climb.toFixed(1)),
    descent: Number(descent.toFixed(1)),
    minElev: Number(minElev.toFixed(1)),
    maxElev: Number(maxElev.toFixed(1)),
    startElev: Number(elevationSamples[0].toFixed(1)),
    endElev: Number(elevationSamples[elevationSamples.length - 1].toFixed(1)),
    sampleCount: elevationSamples.length
  };
}

/**
 * Decode Valhalla polyline 6 string into [[lon, lat], ...]
 * @param {string} str
 * @returns {Array<[number, number]>}
 */
export function decodeValhallaShape(str) {
  if (!str || typeof str !== 'string') return [];
  let index = 0;
  let lat = 0;
  let lon = 0;
  const coordinates = [];
  const factor = 1e6;

  while (index < str.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlon = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lon += dlon;

    coordinates.push([lon / factor, lat / factor]);
  }
  return coordinates;
}

/**
 * Check whether two routes are meaningfully different.
 * SPEC line 41:
 * "Keep an alternative only when it is meaningfully different:
 * length differs by ≥ 50 m, or climb differs by ≥ 8 m, or the stairs-maneuver count differs, or the decoded shape is clearly not the same path."
 * @param {Object} routeA
 * @param {Object} routeB
 * @returns {boolean}
 */
export function areMeaningfullyDifferent(routeA, routeB) {
  if (!routeA || !routeB) return false;

  const lengthDiff = Math.abs(routeA.distanceMeters - routeB.distanceMeters);
  const climbDiff = Math.abs(routeA.climbMeters - routeB.climbMeters);
  const stairsDiff = Math.abs((routeA.stairsCount || 0) - (routeB.stairsCount || 0));

  if (routeA.shape && routeB.shape && routeA.shape === routeB.shape) {
    // Exact same shape polyline
    if (lengthDiff < 50 && climbDiff < 8 && stairsDiff === 0) {
      return false;
    }
  }

  return lengthDiff >= 50 || climbDiff >= 8 || stairsDiff > 0;
}
