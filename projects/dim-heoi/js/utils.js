/**
 * 點去 · Dim Heoi — Core Utilities, Coordinates & Copy Helpers
 */

export const DEFAULT_ORIGIN = {
  code: "ORIGIN_DEFAULT",
  name: "澳門半島",
  name_pt: "Península de Macau",
  lat: 22.1987,
  lon: 113.5439,
  isCustom: false
};

export const DEFAULT_DESTINATION = {
  code: "M1/11",
  name: "關閘總站",
  name_pt: "Portas do Cerco / Terminal",
  lane: "",
  metro: "",
  lat: 22.215282,
  lon: 113.54882,
  isCustom: false
};

export const DEFAULT_ORIGIN_MSG = "而家用澳門半島做起點（未開定位）";

// Curated destinations list from official station coordinates
export const CURATED_PLACES = [
  DEFAULT_DESTINATION,
  {
    code: "M3/4",
    name: "媽閣交通樞紐",
    name_pt: "Centro de Transportes e Trocas da Barra",
    lane: "",
    metro: "1",
    lat: 22.184305,
    lon: 113.53007
  },
  {
    code: "T345/1",
    name: "氹仔客運碼頭",
    name_pt: "Terminal Marítimo de Passageiros da Taipa",
    lane: "B 車道",
    metro: "1",
    lat: 22.163336,
    lon: 113.576
  },
  {
    code: "T356/1",
    name: "澳門機場",
    name_pt: "Aeroporto de Macau",
    lane: "",
    metro: "1",
    lat: 22.15779,
    lon: 113.57395
  },
  {
    code: "M172/1",
    name: "亞馬喇前地",
    name_pt: "Praça Ferreira do Amaral",
    lane: "A 車道",
    metro: "",
    lat: 22.189245,
    lon: 113.54358
  },
  {
    code: "M239/2",
    name: "外港碼頭",
    name_pt: "Terminal Marítimo do Porto Exterior",
    lane: "B 車道",
    metro: "",
    lat: 22.19749,
    lon: 113.55742
  },
  {
    code: "C689/1",
    name: "和諧廣場/樂群樓",
    name_pt: "Praceta da Harmonia / Edifício Lok Kuan",
    lane: "",
    metro: "",
    lat: 22.12965,
    lon: 113.56283
  }
];

// Macau & immediate waters bounding box
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
      isZhuhaiBorder: false,
      target: DEFAULT_ORIGIN,
      message: DEFAULT_ORIGIN_MSG
    };
  }

  const numLat = Number(lat);
  const numLon = Number(lon);

  // Macau core territory
  const isMacau = (
    numLat >= 22.10 &&
    numLat <= 22.23 &&
    numLon >= 113.52 &&
    numLon <= 113.60
  );

  // Greater border / Hengqin / Zhuhai adjacent area
  const isZhuhaiBorder = !isMacau && (
    numLat >= 22.05 &&
    numLat <= 22.30 &&
    numLon >= 113.45 &&
    numLon <= 113.65
  );

  const isValid = isMacau || isZhuhaiBorder;

  if (isMacau) {
    return {
      accepted: true,
      isValid: true,
      isMacau: true,
      isZhuhaiBorder: false,
      target: {
        code: "LOCATE_USER",
        name: "定位位置",
        name_pt: "Posição Atual",
        lat: numLat,
        lon: numLon,
        isCustom: true
      },
      message: "已定位到你嘅位置"
    };
  }

  if (isZhuhaiBorder) {
    return {
      accepted: false,
      isValid: true,
      isMacau: false,
      isZhuhaiBorder: true,
      target: DEFAULT_ORIGIN,
      message: "你現時位置在珠海/橫琴鄰近區域，已保留澳門半島起點。"
    };
  }

  return {
    accepted: false,
    isValid: false,
    isMacau: false,
    isZhuhaiBorder: false,
    target: DEFAULT_ORIGIN,
    message: "你嘅位置超出澳門水陸範圍，已返返澳門半島起點。"
  };
}

/**
 * Haversine formula for straight-line distance in meters.
 * NOTE: Strictly used for indexing/ranking nearby bus stops.
 * NEVER display this result as a walking duration or distance!
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format duration into clean Cantonese minutes.
 * Accepts seconds or integer minutes.
 * E.g. 2671.6s -> "45 分鐘", 75 -> "1 小時 15 分鐘"
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
 * E.g. 450 -> "450 米", 3329.9 -> "3.3 公里"
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
 * Validate that walking speed is realistic for a pedestrian (1.5 to 8.5 km/h).
 * Reject abnormal car-speed results such as 36 km/h.
 * Supports isRealisticWalkingSpeed(distanceMeters, durationSeconds) OR isRealisticWalkingSpeed(speedKmh).
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
