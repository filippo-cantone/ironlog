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

module.exports = { HEALTH_KEYS, EMPTY_HEALTH_DATA, HEALTH_METRIC_KEY_MAP, emptyHealthData, mapHealthRows, mergeHealthData };
