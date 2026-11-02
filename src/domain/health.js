/** Health data contracts and cloud/local mapping helpers. */

const HEALTH_KEYS = [
  'hrv', 'restingHr', 'steps', 'activeCal', 'cardio', 'sleep', 'bloodOxygen',
  'sleepDeep', 'sleepRem', 'sleepCore', 'sleepAwake', 'sleepInBed', 'sleepEfficiency',
];

const EMPTY_HEALTH_DATA = Object.freeze(
  HEALTH_KEYS.reduce((result, key) => ({ ...result, [key]: [] }), {})
);

const HEALTH_METRIC_KEY_MAP = Object.freeze({
  hrv: 'hrv', resting_hr: 'restingHr', steps: 'steps', active_cal: 'activeCal',
  cardio: 'cardio', sleep: 'sleep', blood_oxygen: 'bloodOxygen',
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
    if (key && row?.date && Number.isFinite(value)) result[key].push({ date: row.date, value });
  });
  return result;
}

function mergeHealthData(cloud, local) {
  const cloudData = cloud || {};
  const localData = local || {};
  return HEALTH_KEYS.reduce((result, key) => {
    const cloudValues = Array.isArray(cloudData[key]) ? cloudData[key] : [];
    const localValues = Array.isArray(localData[key]) ? localData[key] : [];
    result[key] = cloudValues.length ? cloudValues : localValues;
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

function scoreComponent(value, target, spread, higherBetter = true, neutral = 75) {
  if (!Number.isFinite(value) || !Number.isFinite(target) || !Number.isFinite(spread) || spread <= 0) return neutral;
  const delta = higherBetter ? value - target : target - value;
  return Math.max(0, Math.min(100, neutral + (delta / spread) * 15));
}

function computeSleepScore(healthData) {
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
  const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const total7 = lastNDaysReadings(total, 7).map(reading => Number(reading.value)).filter(Number.isFinite);
  const deep7 = lastNDaysReadings(healthData?.sleepDeep || [], 7).map(reading => Number(reading.value)).filter(Number.isFinite);
  const rem7 = lastNDaysReadings(healthData?.sleepRem || [], 7).map(reading => Number(reading.value)).filter(Number.isFinite);
  const totalScore = scoreComponent(totalSleep, total7.length >= 3 ? average(total7) : 7.5, 1.5);
  const efficiencyScore = Number.isFinite(efficiency) ? scoreComponent(efficiency, 88, 8) : 75;
  const deepScore = Number.isFinite(deep) ? scoreComponent(deep, deep7.length >= 3 ? average(deep7) : 1.1, 0.45) : 75;
  const remScore = Number.isFinite(rem) ? scoreComponent(rem, rem7.length >= 3 ? average(rem7) : 1.5, 0.55) : 75;
  const awakeScore = Number.isFinite(awake) ? scoreComponent(awake, 0.6, 0.45, false) : 75;
  const score = Math.round(Math.max(0, Math.min(100, totalScore * 0.35 + efficiencyScore * 0.2 + deepScore * 0.2 + remScore * 0.15 + awakeScore * 0.1)));
  const label = score >= 60 ? 'Good' : score >= 38 ? 'Fair' : 'Low';
  const color = score >= 60 ? '#1f9d8a' : score >= 38 ? '#5b9df5' : '#dc5252';
  const parts = [
    Number.isFinite(totalSleep) ? `${Math.round(totalSleep * 10) / 10} h asleep` : null,
    Number.isFinite(deep) ? `${Math.round(deep * 10) / 10} h deep` : null,
    Number.isFinite(rem) ? `${Math.round(rem * 10) / 10} h REM` : null,
    Number.isFinite(awake) ? `${Math.round(awake * 10) / 10} h awake` : null,
  ].filter(Boolean);
  return {
    date, score, label, color, totalSleep, inBed, deep, rem, core, awake, efficiency,
    components: { totalScore, efficiencyScore, deepScore, remScore, awakeScore },
    summary: parts.join(' · '),
    hasStages: [deep, rem, core, awake, inBed, efficiency].some(Number.isFinite),
  };
}

function computeRecovery(healthData) {
  const hrv = healthData?.hrv || [];
  const rhr = healthData?.restingHr || [];
  const sleep = healthData?.sleep || [];
  const sleepScore = computeSleepScore(healthData);
  const todayHRV = Number(latestReading(hrv)?.value) || 0;
  const todayRHR = Number(latestReading(rhr)?.value) || 0;
  const todaySleep = Number(latestReading(sleep)?.value) || 0;
  const hrv7 = lastNDaysReadings(hrv, 7).map(reading => Number(reading.value));
  const rhr7 = lastNDaysReadings(rhr, 7).map(reading => Number(reading.value));
  if (hrv7.length < 3 || rhr7.length < 3 || !todayHRV || !todayRHR) return null;
  const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviation = (values, mean) => Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
  const meanHRV = average(hrv7); const sdHRV = deviation(hrv7, meanHRV) || meanHRV * 0.1;
  const meanRHR = average(rhr7); const sdRHR = deviation(rhr7, meanRHR) || meanRHR * 0.1;
  const zHRV = (todayHRV - meanHRV) / sdHRV;
  const zRHR = (meanRHR - todayRHR) / sdRHR;
  const hasSleep = !!sleepScore && todaySleep > 0;
  const zCombined = hasSleep
    ? zHRV * 0.4 + zRHR * 0.3 + ((sleepScore.score - 75) / 15) * 0.3
    : zHRV * 0.7 + zRHR * 0.3;
  const score = Math.round(Math.max(0, Math.min(100, 50 + zCombined * 15)));
  const color = score >= 60 ? '#1f9d8a' : score >= 38 ? '#5b9df5' : '#dc5252';
  return {
    score, color,
    label: score >= 60 ? 'Good' : score >= 38 ? 'Fair' : 'Low',
    formula: hasSleep ? (sleepScore.hasStages ? 'hrv+rhr+sleep-quality' : 'hrv+rhr+sleep-duration') : 'hrv+rhr',
    todayHRV, todayRHR, todaySleep: hasSleep ? todaySleep : null, sleepScore,
    meanHRV: Math.round(meanHRV * 10) / 10, meanRHR: Math.round(meanRHR * 10) / 10,
    zHRV: Math.round(zHRV * 10) / 10, zRHR: Math.round(zRHR * 10) / 10,
    dataPoints: Math.min(hrv7.length, rhr7.length),
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
  computeSleepScore, computeRecovery, classifyHealthTrend,
};
