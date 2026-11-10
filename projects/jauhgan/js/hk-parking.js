/**
 * hk-parking.js - Official Hong Kong Carpark Info & Vacancy joiner
 * Source: data.gov.hk / Transport Department
 * Nightly 2026-11-11 · 就近 (Just Around)
 */

const CANTONESE_DAYS = {
  MON: '一',
  TUE: '二',
  WED: '三',
  THU: '四',
  FRI: '五',
  SAT: '六',
  SUN: '日'
};

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/**
 * Formats an array of weekday strings (e.g. ['MON', 'TUE', ...]) into natural Cantonese
 * @param {Array<string>} weekdays
 * @returns {string}
 */
export function formatWeekdays(weekdays) {
  if (!Array.isArray(weekdays) || weekdays.length === 0) return '';
  const days = weekdays.map(d => String(d).toUpperCase().trim()).filter(d => CANTONESE_DAYS[d]);
  if (days.length === 0) return '';
  if (days.length === 7) return ''; // All 7 days -> no prefix needed

  // Check if Monday to Friday
  const monFri = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  if (days.length === 5 && monFri.every(d => days.includes(d))) {
    return '星期一至五';
  }

  // Check if Monday to Saturday
  const monSat = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  if (days.length === 6 && monSat.every(d => days.includes(d))) {
    return '星期一至六';
  }

  // Check if weekend
  if (days.length === 2 && days.includes('SAT') && days.includes('SUN')) {
    return '星期六、日';
  }

  // Sort days by DAY_ORDER
  const sorted = [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  let isConsecutive = true;
  for (let i = 1; i < sorted.length; i++) {
    if (DAY_ORDER.indexOf(sorted[i]) !== DAY_ORDER.indexOf(sorted[i - 1]) + 1) {
      isConsecutive = false;
      break;
    }
  }

  if (isConsecutive && sorted.length >= 2) {
    return `星期${CANTONESE_DAYS[sorted[0]]}至${CANTONESE_DAYS[sorted[sorted.length - 1]]}`;
  }

  return '星期' + sorted.map(d => CANTONESE_DAYS[d]).join('、');
}

/**
 * Formats data.gov.hk openingHours array into a readable Cantonese string with weekday ranges
 * @param {Array} hoursArray
 * @returns {string|null}
 */
export function formatHkOpeningHours(hoursArray) {
  if (!Array.isArray(hoursArray) || hoursArray.length === 0) {
    return null;
  }

  const formattedPeriods = [];

  for (const item of hoursArray) {
    if (!item) continue;
    const dayPrefix = formatWeekdays(item.weekdays);

    let timeText = null;
    if (item.periodStart === '00:00' && (item.periodEnd === '24:00' || item.periodEnd === '23:59')) {
      timeText = '24 小時開放';
    } else if (item.periodStart && item.periodEnd) {
      timeText = `${item.periodStart} - ${item.periodEnd}`;
    }

    if (timeText) {
      const fullText = dayPrefix ? `${dayPrefix} ${timeText}` : timeText;
      formattedPeriods.push(fullText);
    }
  }

  if (formattedPeriods.length === 0) return null;
  return formattedPeriods.join('；');
}

/**
 * Joins official HK carpark info and vacancy datasets by park_Id.
 * Strictly adheres to truthfulness: missing vacancy (including -1 sentinel) ⇒ no number!
 * 
 * @param {object} infoData { results: [...] }
 * @param {object} [vacancyData=null] { results: [...] }
 * @returns {Array<object>}
 */
export function joinHkCarparks(infoData, vacancyData = null) {
  if (!infoData || !Array.isArray(infoData.results)) {
    return [];
  }

  // Build vacancy lookup by park_Id
  const vacancyMap = new Map();
  if (vacancyData && Array.isArray(vacancyData.results)) {
    for (const v of vacancyData.results) {
      if (!v || !v.park_Id) continue;
      const pid = String(v.park_Id).trim();

      // Check privateCar vacancy
      if (Array.isArray(v.privateCar) && v.privateCar.length > 0) {
        const pc = v.privateCar[0];
        if (pc) {
          // data.gov.hk uses -1 when vacancy is not published. Only non-negative numbers are valid.
          const isValidVac = typeof pc.vacancy === 'number' && Number.isFinite(pc.vacancy) && pc.vacancy >= 0;
          vacancyMap.set(pid, {
            vacancy: isValidVac ? pc.vacancy : null,
            lastupdate: pc.lastupdate || null,
            vacancyEV: typeof pc.vacancyEV === 'number' && pc.vacancyEV >= 0 ? pc.vacancyEV : null,
            vacancyDIS: typeof pc.vacancyDIS === 'number' && pc.vacancyDIS >= 0 ? pc.vacancyDIS : null
          });
        }
      }
    }
  }

  const places = [];

  for (const item of infoData.results) {
    if (!item || !item.park_Id) continue;

    const lat = typeof item.latitude === 'number' ? item.latitude : parseFloat(item.latitude);
    const lon = typeof item.longitude === 'number' ? item.longitude : parseFloat(item.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }

    const pid = String(item.park_Id).trim();
    const vac = vacancyMap.get(pid);

    let vacancyText = null;
    let vacancyCount = null;
    let lastUpdate = null;

    if (vac) {
      lastUpdate = vac.lastupdate || item.lastupdate || null;
      if (typeof vac.vacancy === 'number' && vac.vacancy >= 0) {
        vacancyCount = vac.vacancy;
        const updateLabel = lastUpdate ? `（${formatHkTime(lastUpdate)} 更新）` : '';
        if (vacancyCount === 0) {
          vacancyText = `私家車車位已滿 ${updateLabel}`.trim();
        } else {
          vacancyText = `私家車剩餘車位：${vacancyCount} 個 ${updateLabel}`.trim();
        }
      }
    } else if (item.lastupdate) {
      lastUpdate = item.lastupdate;
    }

    // Opening hours from data.gov.hk
    const parsedHours = formatHkOpeningHours(item.openingHours);

    // Current opening status
    let currentStatus = null;
    if (item.opening_status === 'OPEN' || item.opening_status === '開放中' || item.opening_status === '而家開放中') {
      currentStatus = '開放中';
    } else if (item.opening_status === 'CLOSED' || item.opening_status === '暫停開放' || item.opening_status === '而家暫停開放') {
      currentStatus = '暫停開放';
    }

    // Never invent operator from nature
    const operator = item.operator ? String(item.operator).trim() : null;

    places.push({
      id: `hk-carpark/${pid}`,
      category: 'parking',
      categoryLabel: '停車場',
      name: (item.name || '停車場').trim(),
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      tags: {
        amenity: 'parking',
        name: item.name,
        operator: operator, // strictly from payload or null
        opening_hours: parsedHours, // formatted hours or null
        opening_status: currentStatus,
        phone: item.contactNo || null,
        address: item.displayAddress || null
      },
      hkData: {
        parkId: pid,
        vacancyCount, // number or null
        vacancyText, // string or null
        lastUpdate,
        address: item.displayAddress || null,
        nature: item.nature || null,
        currentStatus,
        source: '香港政府 data.gov.hk／運輸署'
      }
    });
  }

  return places;
}

/**
 * Formats data.gov.hk lastupdate timestamp ("YYYY-MM-DD HH:mm:ss")
 * @param {string} ts
 * @returns {string}
 */
export function formatHkTime(ts) {
  if (!ts || typeof ts !== 'string') return '';
  const parts = ts.trim().split(' ');
  const timeStr = parts.length >= 2 ? parts[1] : parts[0];
  const timeParts = timeStr.split(':');
  if (timeParts.length >= 2) {
    return `${timeParts[0]}:${timeParts[1]}`;
  }
  return ts;
}
