/** Health data contracts and cloud/local mapping helpers. */

const HEALTH_KEYS = [
  'hrv', 'restingHr', 'steps', 'activeCal', 'cardio', 'sleep', 'bloodOxygen',
  'sleepDeep', 'sleepRem', 'sleepCore', 'sleepAwake', 'sleepInBed', 'sleepEfficiency',
  'weight',
];

const EMPTY_HEALTH_DATA = Object.freeze(
  HEALTH_KEYS.reduce((result, key) => ({ ...result, [key]: [] }), {})
);

const HEALTH_METRIC_KEY_MAP = Object.freeze({
  hrv: 'hrv', resting_hr: 'restingHr', steps: 'steps', active_cal: 'activeCal',
  cardio: 'cardio', sleep: 'sleep', blood_oxygen: 'bloodOxygen',
  weight: 'weight', body_mass: 'weight', weight_kg: 'weight',
  sleep_deep: 'sleepDeep', sleep_rem: 'sleepRem', sleep_core: 'sleepCore',
  sleep_awake: 'sleepAwake', sleep_in_bed: 'sleepInBed', sleep_efficiency: 'sleepEfficiency',
});

function emptyHealthData() {
  return HEALTH_KEYS.reduce((result, key) => ({ ...result, [key]: [] }), {});
}

function mapHealthRows(rows = []) {
  const result = emptyHealthData();
  rows.forEach(row => {
    const key = HEALTH_METRIC_KEY_MAP[row?.metric];
    const value = Number(row?.value);
    if (key && row?.date && Number.isFinite(value)) result[key].push({
      date: row.date, value,
      ...(row.source ? { source: row.source } : {}),
      ...(row.start_at ? { startAt: row.start_at } : {}),
      ...(row.end_at ? { endAt: row.end_at } : {}),
    });
  });
  return result;
}

function mergeHealthData(cloud, local, { preferCloud = false } = {}) {
  const cloudData = cloud || {};
  const localData = local || {};
  return HEALTH_KEYS.reduce((result, key) => {
    const cloudValues = Array.isArray(cloudData[key]) ? cloudData[key] : [];
    const localValues = Array.isArray(localData[key]) ? localData[key] : [];
    // Keep the union of both stores. A manual Health Auto Export can be newer
    // than the last cloud upload, so local readings must not be discarded just
    // because Supabase already has an older non-empty array.
    const byDate = new Map();
    // Normal startup preserves locally imported readings that are newer than a
    // previous cloud snapshot. An explicit refresh can opt into cloud-first
    // ordering so same-day exports replace stale cached values.
    const orderedValues = preferCloud
      ? [...localValues, ...cloudValues]
      : [...cloudValues, ...localValues];
    orderedValues.forEach(reading => {
      const date = typeof reading?.date === 'string' ? reading.date.slice(0, 10) : '';
      const value = Number(reading?.value);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value)) return;
      byDate.set(date, { ...reading, date, value });
    });
    result[key] = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }, {});
}

function localDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function lastNDaysReadings(readings = [], days = 7, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - (days - 1) * 86400000);
  return readings.filter(reading => {
    const date = new Date(`${reading.date}T00:00:00`);
    return date >= start && date <= today;
  });
}

function latestReading(readings = []) {
  return readings.length ? readings[readings.length - 1] : null;
}

function rollingAverage(readings = [], days = 14) {
  const recent = lastNDaysReadings(readings, days);
  if (!recent.length) return null;
  return recent.reduce((sum, reading) => sum + Number(reading.value), 0) / recent.length;
}

function computeSleepProfile(healthData) {
  const total = healthData?.sleep || [];
  const latest = latestReading(total);
  if (!latest) return null;
  const date = latest.date;
  const onDate = key => (healthData?.[key] || []).find(reading => reading.date === date);
  const totalSleep = Number(latest.value);
  const inBed = Number(onDate('sleepInBed')?.value);
  const deep = Number(onDate('sleepDeep')?.value);
  const rem = Number(onDate('sleepRem')?.value);
  const core = Number(onDate('sleepCore')?.value);
  const awake = Number(onDate('sleepAwake')?.value);
  const exportedEfficiency = Number(onDate('sleepEfficiency')?.value);
  const inferredInBed = Number.isFinite(inBed) && inBed > 0 ? inBed : (Number.isFinite(awake) && Number.isFinite(totalSleep) ? totalSleep + awake : null);
  const efficiency = Number.isFinite(exportedEfficiency)
    ? exportedEfficiency
    : (Number.isFinite(inferredInBed) && inferredInBed > 0 ? (totalSleep / inferredInBed) * 100 : null);
  const durationStatus = Number.isFinite(totalSleep)
    ? totalSleep >= 7 ? 'meets the 7-hour minimum' : 'below the 7-hour minimum'
    : 'not available';
  const efficiencyStatus = Number.isFinite(efficiency)
    ? efficiency >= 85 ? 'sleep was mostly continuous' : 'sleep was more interrupted'
    : 'not available';
  const parts = [
    Number.isFinite(totalSleep) ? `${Math.round(totalSleep * 10) / 10} h asleep` : null,
    Number.isFinite(deep) ? `${Math.round(deep * 10) / 10} h deep` : null,
    Number.isFinite(rem) ? `${Math.round(rem * 10) / 10} h REM` : null,
    Number.isFinite(awake) ? `${Math.round(awake * 10) / 10} h awake` : null,
  ].filter(Boolean);
  return {
    date, totalSleep, inBed, deep, rem, core, awake, efficiency,
    durationStatus, efficiencyStatus,
    summary: parts.join(' · '),
    hasStages: [deep, rem, core, awake, inBed, efficiency].some(Number.isFinite),
  };
}

function dateAtMidnight(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readingsBetween(readings = [], start, end) {
  return readings.filter(reading => {
    const date = dateAtMidnight(reading?.date);
    return date && date >= start && date <= end && Number.isFinite(Number(reading.value));
  });
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function standardDeviation(values, average) {
  if (!values.length || !Number.isFinite(average)) return null;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

function contextBand(readings, latestDate, lowerIsBetter = false) {
  if (!readings.length || !latestDate) return null;
  const latestDay = dateAtMidnight(latestDate);
  const rollingStart = new Date(latestDay.getTime() - 6 * 86400000);
  const baselineEnd = new Date(rollingStart.getTime() - 86400000);
  const baselineStart = new Date(baselineEnd.getTime() - 59 * 86400000);
  const rolling = readingsBetween(readings, rollingStart, latestDay).map(row => Number(row.value));
  const baseline = readingsBetween(readings, baselineStart, baselineEnd).map(row => Number(row.value));
  const rollingMean = mean(rolling);
  const baselineMean = mean(baseline);
  const baselineSd = standardDeviation(baseline, baselineMean);
  const enough = rolling.length >= 3 && baseline.length >= 14 && Number.isFinite(baselineSd) && baselineSd > 0;
  if (!enough) return {
    status: 'insufficient', statusLabel: 'Building baseline', rolling, baseline,
    rollingMean, baselineMean, baselineSd, lower: null, upper: null,
  };
  const lower = baselineMean - baselineSd * 0.5;
  const upper = baselineMean + baselineSd * 0.5;
  const value = rollingMean;
  let status;
  if (lowerIsBetter) status = value > upper ? 'elevated' : value < lower ? 'lower' : 'usual';
  else status = value < lower ? 'suppressed' : value > upper ? 'elevated' : 'usual';
  return {
    status,
    statusLabel: status === 'suppressed' ? 'Meaningfully suppressed'
      : status === 'elevated' ? 'Meaningfully elevated'
        : status === 'lower' ? 'Lower than usual' : 'Within usual range',
    rolling, baseline, rollingMean, baselineMean, baselineSd, lower, upper,
  };
}

function computeReadiness(healthData) {
  const hrv = healthData?.hrv || [];
  const rhr = healthData?.restingHr || [];
  const latestDate = latestReading(hrv)?.date || latestReading(rhr)?.date || null;
  const hrvBand = contextBand(hrv, latestDate, false);
  const rhrBand = contextBand(rhr, latestDate, true);
  const sleep = computeSleepProfile(healthData);
  const baselinePoints = hrvBand?.baseline?.length || 0;
  const rollingPoints = hrvBand?.rolling?.length || 0;
  const status = hrvBand?.status || 'insufficient';
  const confidence = status === 'insufficient' ? 'low'
    : baselinePoints >= 30 && rollingPoints >= 5 ? 'high' : 'medium';
  const color = status === 'suppressed' ? '#dc5252' : status === 'insufficient' ? '#5b9df5' : '#1f9d8a';
  const latestHrv = latestReading(hrv);
  const latestRhr = latestReading(rhr);
  return {
    status, statusLabel: status === 'suppressed' ? 'HRV meaningfully suppressed'
      : status === 'elevated' ? 'HRV meaningfully elevated'
        : status === 'usual' ? 'HRV within usual range' : 'Building baseline',
    color, confidence, hrvMetric: 'Apple Health SDNN',
    hrv: hrvBand, restingHr: rhrBand, sleep,
    latestHrv: latestHrv ? Number(latestHrv.value) : null,
    latestRhr: latestRhr ? Number(latestRhr.value) : null,
    dataPoints: rollingPoints, baselinePoints,
    formula: '7-day rolling Apple Health SDNN HRV vs personal baseline ± 0.5 SD',
  };
}

function classifyHealthTrend(value, baseline, higherBetter = true) {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || baseline === 0) return 'unknown';
  const ratio = value / baseline;
  if (higherBetter) return ratio >= 1.05 ? 'good' : ratio >= 0.88 ? 'near-baseline' : 'strained';
  return ratio <= 1.03 ? 'good' : ratio <= 1.1 ? 'near-baseline' : 'strained';
}

function healthBaseline(readings, days = 7) {
  return rollingAverage(readings, days);
}

module.exports = {
  HEALTH_KEYS, EMPTY_HEALTH_DATA, HEALTH_METRIC_KEY_MAP, emptyHealthData, mapHealthRows, mergeHealthData,
  localDateStr, lastNDaysReadings, latestReading, rollingAverage, healthBaseline,
  computeSleepProfile, computeReadiness, computeRecovery: computeReadiness, classifyHealthTrend,
};
