/**
 * 雨勢 · Jyu Sai — Core Cartographic & Weather Helpers
 */

export const DISTRICTS = {
  peninsula: {
    id: "peninsula",
    name: "澳門半島",
    name_pt: "Península de Macau",
    lat: 22.1987,
    lon: 113.5439,
    smgCode: "FM"
  },
  taipa: {
    id: "taipa",
    name: "氹仔",
    name_pt: "Taipa",
    lat: 22.1566,
    lon: 113.5595,
    smgCode: "TG"
  },
  coloane: {
    id: "coloane",
    name: "路環",
    name_pt: "Coloane",
    lat: 22.1180,
    lon: 113.5528,
    smgCode: "DC"
  }
};

export const DEFAULT_ORIGIN = DISTRICTS.peninsula;

export const DEFAULT_ORIGIN_MSG = "而家用澳門半島做起點（未開定位）";

// Bounding box for Macau and immediate Pearl River Delta waters
export const PRD_BOUNDS = {
  minLat: 21.90,
  maxLat: 22.60,
  minLon: 113.20,
  maxLon: 114.30
};

export const MAP_MAX_BOUNDS = [
  [113.35, 22.02], // Southwest [lon, lat]
  [113.75, 22.32]  // Northeast [lon, lat]
];

/**
 * Format a timestamp into Asia/Macau timezone.
 */
export function formatMacauTime(dateOrUnix, format = 'time') {
  if (!dateOrUnix) return '';
  let d;
  if (typeof dateOrUnix === 'number') {
    // Check if unix seconds or ms
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
 * Check if a radar frame is stale (> 20 minutes older than now).
 */
export function checkFrameFreshness(frameUnixTime, nowUnixTime = Math.floor(Date.now() / 1000)) {
  if (!frameUnixTime) return { isStale: true, warning: '資料可能已過時' };
  const ageSeconds = nowUnixTime - frameUnixTime;
  const isStale = ageSeconds > 20 * 60;
  return {
    isStale,
    ageMinutes: Math.floor(ageSeconds / 60),
    warning: isStale ? '資料可能已過時' : null
  };
}

/**
 * Validate geolocation coordinate against Pearl River Delta / Macau region.
 */
export function evaluateLocateCoordinate(lat, lon) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return {
      accepted: false,
      target: { lat: DEFAULT_ORIGIN.lat, lon: DEFAULT_ORIGIN.lon },
      message: DEFAULT_ORIGIN_MSG
    };
  }

  const inside = (
    lat >= PRD_BOUNDS.minLat &&
    lat <= PRD_BOUNDS.maxLat &&
    lon >= PRD_BOUNDS.minLon &&
    lon <= PRD_BOUNDS.maxLon
  );

  if (inside) {
    return {
      accepted: true,
      target: { lat, lon },
      message: "已定位到你嘅位置"
    };
  }

  return {
    accepted: false,
    target: { lat: DEFAULT_ORIGIN.lat, lon: DEFAULT_ORIGIN.lon },
    message: "你嘅位置超出澳門及鄰近水域，已返返澳門半島起點。"
  };
}

/**
 * Generate natural Cantonese hero sentence based on forecast, radar, and official data.
 * Adheres strictly to SPEC.md copy requirements.
 */
export function generateHeroSentence({
  forecast,
  official,
  radarHasRain = false,
  radarExplicitlyDry = false
}) {
  // If forecast is unavailable
  if (!forecast || !forecast.available) {
    if (radarHasRain) {
      return {
        sentence: "而家落緊雨。",
        subtext: "雷達圖顯示澳門附近有降雨，未有未來兩小時模式預測。"
      };
    }
    return {
      sentence: "未有未來兩小時模式預測",
      subtext: "未能載入模式降雨資料，請參考即時雷達拼圖。"
    };
  }

  const { isRainingNow, willRainSoon, rainStartTime, rainStopTime, allZero } = forecast;

  // Disagreement case A: Radar return detected near Macau, but forecast model predicts dry
  if (radarHasRain && (allZero || (!isRainingNow && !willRainSoon))) {
    let sub = "雷達拼圖與模式預測有出入，出門建議帶備雨具。";
    if (official && official.available && official.pastHour > 0) {
      sub = `雷達見回波，氣象局錄得過去一小時 ${official.pastHour.toFixed(1)} 毫米。`;
    }
    return {
      sentence: "雷達拼圖顯示澳門附近有降雨回波，但模式預測未來兩小時偏乾。",
      subtext: sub
    };
  }

  // Disagreement case B: Model predicts raining now, but radar explicitly shows no rain return
  if (radarExplicitlyDry && isRainingNow) {
    return {
      sentence: "模式預測現時有雨，但雷達拼圖暫未錄得明顯回波。",
      subtext: "數值預測與雷達實況有出入，請留意天色變化。"
    };
  }

  // Case 1: No rain now, none in the next 2 hours
  if (allZero || (!isRainingNow && !willRainSoon)) {
    let sub = "未來兩小時降雨概率偏低。";
    if (official && official.available && official.pastHour > 0) {
      sub = `氣象局錄得過去一小時 ${official.pastHour.toFixed(1)} 毫米。`;
    }
    return {
      sentence: "而家冇雨，未來兩小時模式預測都唔預期會落。",
      subtext: sub
    };
  }

  // Case 2: Raining now, forecast going dry
  if (isRainingNow && rainStopTime) {
    const timeStr = formatMacauTime(rainStopTime, 'time');
    let sub = "請留意雷達雨區移動。";
    if (official && official.available && official.pastHour > 0) {
      sub = `氣象局錄得過去一小時 ${official.pastHour.toFixed(1)} 毫米。`;
    }
    return {
      sentence: `而家落緊，模式預測大約 ${timeStr} 可能轉停。`,
      subtext: sub
    };
  }

  // Case 3: Raining now and continuing
  if (isRainingNow) {
    let sub = "未來兩小時預期持續有雨。";
    if (official && official.available && official.pastHour > 0) {
      sub = `氣象局錄得過去一小時 ${official.pastHour.toFixed(1)} 毫米。`;
    }
    return {
      sentence: "而家落緊雨。",
      subtext: sub
    };
  }

  // Case 4: Dry now, rain in forecast
  if (!isRainingNow && willRainSoon && rainStartTime) {
    const timeStr = formatMacauTime(rainStartTime, 'time');
    return {
      sentence: `而家冇雨，模式預測大約 ${timeStr} 會開始有雨。`,
      subtext: "出門建議帶備雨具。"
    };
  }

  return {
    sentence: "而家冇雨，未來兩小時模式預測都唔預期會落。",
    subtext: "未來兩小時降雨概率偏低。"
  };
}
