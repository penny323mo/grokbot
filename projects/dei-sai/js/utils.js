/**
 * 地勢 · Dei Sai — Utility & Cartography Helpers
 */

export const DEFAULT_ORIGIN = {
  lat: 22.1987,
  lon: 113.5439,
  name: "澳門半島",
  message: "而家用澳門半島做起點（未開定位）"
};

export const MACAU_BBOX = {
  minLat: 22.06,
  maxLat: 22.26,
  minLon: 113.50,
  maxLon: 113.65
};

// Generous bounds for MapLibre maxBounds that accommodates Coloane and HZMB
export const MAP_MAX_BOUNDS = [
  [113.46, 22.04], // Southwest [lon, lat]
  [113.68, 22.28]  // Northeast [lon, lat]
];

/**
 * Decode Terrarium RGB to elevation in metres.
 * Formula: r * 256 + g + b / 256 - 32768
 * Returns null if rgb data is missing / undefined / invalid.
 * Missing tiles must never be treated as 0 m.
 */
export function decodeTerrariumRGB(r, g, b) {
  if (r == null || g == null || b == null) return null;
  const numR = Number(r);
  const numG = Number(g);
  const numB = Number(b);
  if (isNaN(numR) || isNaN(numG) || isNaN(numB)) return null;
  if (numR < 0 || numR > 255 || numG < 0 || numG > 255 || numB < 0 || numB > 255) return null;

  return (numR * 256 + numG + numB / 256) - 32768;
}

/**
 * Check if a coordinate is within Macau bounds.
 */
export function isInsideMacau(lat, lon) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return false;
  return (
    lat >= MACAU_BBOX.minLat &&
    lat <= MACAU_BBOX.maxLat &&
    lon >= MACAU_BBOX.minLon &&
    lon <= MACAU_BBOX.maxLon
  );
}

/**
 * Geolocation policy evaluator.
 */
export function evaluateLocateCoordinate(lat, lon) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return {
      accepted: false,
      reason: "invalid_coordinate",
      target: { lat: DEFAULT_ORIGIN.lat, lon: DEFAULT_ORIGIN.lon },
      message: DEFAULT_ORIGIN.message
    };
  }

  if (isInsideMacau(lat, lon)) {
    return {
      accepted: true,
      reason: "inside_macau",
      target: { lat, lon },
      message: "已定位到你嘅位置"
    };
  }

  return {
    accepted: false,
    reason: "out_of_bounds",
    target: { lat: DEFAULT_ORIGIN.lat, lon: DEFAULT_ORIGIN.lon },
    message: "你嘅位置喺澳門範圍以外，已返返澳門半島起點。"
  };
}

/**
 * Height copy formatter.
 * OSM elevation -> 「N 米」 (without DEM disclaimer)
 * DEM sample -> 「地形高程（DEM）約 N 米」
 * missing -> 「高度不詳」 (never 「0 米」)
 */
export function formatElevationCopy(ele_m, ele_source) {
  if (ele_source === "none" || ele_m == null || isNaN(ele_m)) {
    return "高度不詳";
  }

  const num = Number(ele_m);
  const formattedNum = Number.isInteger(num) ? num.toString() : num.toFixed(1);

  if (ele_source === "osm:ele" || ele_source === "osm:height") {
    return `${formattedNum} 米`;
  }

  if (ele_source === "dem") {
    return `地形高程（DEM）約 ${Math.round(num)} 米`;
  }

  return `${formattedNum} 米`;
}

/**
 * Exaggeration factor formatter.
 */
export function formatExaggerationLabel(factor) {
  const f = Number(factor);
  if (isNaN(f)) return "高度誇張 1.0 倍（無誇張）";
  if (Math.abs(f - 1.0) < 0.001) {
    return "高度誇張 1.0 倍（無誇張）";
  }
  return `高度誇張 ${f.toFixed(1)} 倍`;
}

/**
 * Footer time display in Asia/Macau time zone.
 */
export function formatMacauTime(date = new Date()) {
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Macau",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  return `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}（澳門時間）`;
}
