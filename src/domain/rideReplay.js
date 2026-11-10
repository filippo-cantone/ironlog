/**
 * Pure route analytics for Apple Watch cycling rides.
 *
 * GPS route data stays local to the ride detail view. This module only
 * transforms the selected route into bounded, display-ready summaries.
 */

const EARTH_RADIUS_KM = 6371;

const asNumber = value => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const round = (value, digits = 1) => {
  const number = asNumber(value);
  if (number == null) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
};

function timestampMs(value) {
  if (value == null || value === '') return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function normaliseRoutePoints(rawPoints = []) {
  return (Array.isArray(rawPoints) ? rawPoints : [])
    .map(point => {
      const latitude = asNumber(point?.latitude ?? point?.lat);
      const longitude = asNumber(point?.longitude ?? point?.lon ?? point?.lng);
      if (latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
      return {
        latitude,
        longitude,
        altitude: asNumber(point?.altitude ?? point?.elevation),
        speed: asNumber(point?.speed),
        timestamp: point?.timestamp ?? point?.date ?? null,
        horizontalAccuracy: asNumber(point?.horizontalAccuracy ?? point?.horizontal_accuracy),
        verticalAccuracy: asNumber(point?.verticalAccuracy ?? point?.vertical_accuracy),
      };
    })
    .filter(Boolean);
}

function haversineKm(first, second) {
  if (!first || !second) return 0;
  const toRadians = value => value * Math.PI / 180;
  const lat1 = toRadians(Number(first.latitude));
  const lat2 = toRadians(Number(second.latitude));
  const deltaLat = lat2 - lat1;
  const deltaLon = toRadians(Number(second.longitude) - Number(first.longitude));
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

function withCumulativeDistance(points = []) {
  let cumulative = 0;
  return points.map((point, index) => {
    if (index > 0) cumulative += haversineKm(points[index - 1], point);
    return { ...point, distanceKm: round(cumulative, 3) };
  });
}

function smoothAltitude(points = [], windowSize = 5) {
  const half = Math.floor(windowSize / 2);
  return points.map((point, index) => {
    if (point.altitude == null) return point;
    const values = points
      .slice(Math.max(0, index - half), Math.min(points.length, index + half + 1))
      .map(item => item.altitude)
      .filter(value => value != null)
      .sort((a, b) => a - b);
    const median = values.length ? values[Math.floor(values.length / 2)] : point.altitude;
    return { ...point, smoothedAltitude: round(median, 1) };
  });
}

function downsampleRoutePoints(points = [], maxPoints = 900) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points;
  const indexes = new Set([0, points.length - 1]);
  const stride = (points.length - 1) / (maxPoints - 1);
  for (let index = 1; index < maxPoints - 1; index += 1) indexes.add(Math.round(index * stride));

  // Preserve the route's most informative vertical and speed landmarks.
  const ranked = points.map((point, index) => ({
    index,
    score: Math.abs(Number(point.smoothedAltitude ?? point.altitude ?? 0))
      + Math.abs(Number(point.speed ?? 0)) * 2,
  })).sort((a, b) => b.score - a.score);
  ranked.slice(0, Math.max(0, maxPoints - indexes.size)).forEach(item => indexes.add(item.index));
  return [...indexes].sort((a, b) => a - b).slice(0, maxPoints).map(index => points[index]);
}

function normaliseSamples(samples = [], types = []) {
  const wanted = new Set(types.map(type => String(type).toLowerCase()));
  return (Array.isArray(samples) ? samples : [])
    .filter(sample => !wanted.size || wanted.has(String(sample?.sample_type ?? sample?.type ?? '').toLowerCase()))
    .map(sample => ({
      timestamp: sample?.sample_at ?? sample?.sampleAt ?? sample?.timestamp ?? sample?.date ?? null,
      timeMs: timestampMs(sample?.sample_at ?? sample?.sampleAt ?? sample?.timestamp ?? sample?.date),
      value: asNumber(sample?.value ?? sample?.qty ?? sample?.heart_rate ?? sample?.heartRate ?? sample?.bpm),
      unit: sample?.unit ?? null,
    }))
    .filter(sample => sample.timeMs != null && sample.value != null)
    .sort((a, b) => a.timeMs - b.timeMs);
}

function nearestSample(samples, timeMs, maxGapMs = 90000) {
  if (!samples.length || timeMs == null) return null;
  let best = null;
  samples.forEach(sample => {
    const gap = Math.abs(sample.timeMs - timeMs);
    if (gap <= maxGapMs && (!best || gap < best.gap)) best = { sample, gap };
  });
  return best?.sample || null;
}

function attachHeartRate(points, heartRateSamples) {
  return points.map(point => {
    const sample = nearestSample(heartRateSamples, timestampMs(point.timestamp));
    return sample ? { ...point, heartRate: round(sample.value, 1) } : point;
  });
}

function classifyEffort(heartRate, averageHeartRate, peakHeartRate) {
  if (heartRate == null) return 'unknown';
  const average = asNumber(averageHeartRate);
  const peak = asNumber(peakHeartRate);
  if (average == null || peak == null || peak <= average) return 'steady';
  const position = (heartRate - average) / Math.max(1, peak - average);
  if (position >= 0.72) return 'hard';
  if (position >= 0.28) return 'moderate';
  return 'easy';
}

function buildGeoJsonSegments(points = []) {
  const features = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const point = points[index];
    features.push({
      type: 'Feature',
      properties: { effort: point.effort || 'steady', index },
      geometry: { type: 'LineString', coordinates: [[previous.longitude, previous.latitude], [point.longitude, point.latitude]] },
    });
  }
  return { type: 'FeatureCollection', features };
}

function routeConfidence(points, heartRateSamples) {
  const altitudeCount = points.filter(point => point.altitude != null).length;
  const coverage = points.length ? altitudeCount / points.length : 0;
  if (points.length >= 100 && coverage >= 0.8 && heartRateSamples.length >= 10) return 'good';
  if (points.length >= 20 && (coverage >= 0.5 || heartRateSamples.length >= 3)) return 'limited';
  return 'sparse';
}

function strongestClimb(points = []) {
  if (points.length < 3) return { index: -1, gain: 0, distanceKm: 0 };
  const windowSize = Math.max(3, Math.round(points.length / 40));
  let best = { index: -1, gain: 0, distanceKm: 0 };
  for (let index = windowSize; index < points.length; index += 1) {
    const start = points[index - windowSize];
    const end = points[index];
    if (start.smoothedAltitude == null || end.smoothedAltitude == null) continue;
    const gain = end.smoothedAltitude - start.smoothedAltitude;
    if (gain > best.gain) best = { index, gain, distanceKm: Math.max(0, end.distanceKm - start.distanceKm) };
  }
  return { index: best.index, gain: round(best.gain, 0), distanceKm: round(best.distanceKm, 2) };
}

function recoveryPoint(points = [], averageHeartRate = null, peakHeartIndex = -1) {
  const average = asNumber(averageHeartRate);
  if (average == null || peakHeartIndex < 0) return -1;
  const afterPeak = points.slice(peakHeartIndex + 1);
  const recovered = afterPeak.find(point => point.heartRate != null && point.heartRate <= average);
  return recovered ? points.indexOf(recovered) : -1;
}

function buildRouteAnalytics({ points: rawPoints = [], heartRateSamples = [], energySamples = [], averageHeartRate = null, peakHeartRate = null, distance = null, duration = null } = {}) {
  const base = withCumulativeDistance(normaliseRoutePoints(rawPoints));
  const smoothed = smoothAltitude(base);
  const hrSamples = normaliseSamples(heartRateSamples, ['heart_rate', 'heart rate', 'heartrate']);
  const energy = normaliseSamples(energySamples, ['active_energy', 'active energy', 'energy']);
  const enriched = attachHeartRate(smoothed, hrSamples).map(point => ({
    ...point,
    effort: classifyEffort(point.heartRate, averageHeartRate, peakHeartRate),
  }));
  const renderPoints = downsampleRoutePoints(enriched);
  let ascent = 0;
  let descent = 0;
  for (let index = 1; index < enriched.length; index += 1) {
    const previous = enriched[index - 1].smoothedAltitude;
    const current = enriched[index].smoothedAltitude;
    if (previous == null || current == null) continue;
    const change = current - previous;
    if (change >= 2) ascent += change;
    if (change <= -2) descent += Math.abs(change);
  }
  const altitudeValues = enriched.map(point => point.smoothedAltitude).filter(value => value != null);
  const speedValues = enriched.map(point => point.speed).filter(value => value != null);
  const heartRates = enriched.map(point => point.heartRate).filter(value => value != null);
  const actualDistance = asNumber(distance) ?? enriched.at(-1)?.distanceKm ?? 0;
  const maxHeartRateValue = asNumber(peakHeartRate) ?? (heartRates.length ? Math.max(...heartRates) : null);
  const peakHeartIndex = maxHeartRateValue == null ? -1 : enriched.findIndex(point => point.heartRate === maxHeartRateValue);
  const maxSpeed = speedValues.length ? Math.max(...speedValues) : null;
  const fastestIndex = maxSpeed == null ? -1 : enriched.findIndex(point => point.speed === maxSpeed);
  const climb = strongestClimb(enriched);
  const recoveryIndex = recoveryPoint(enriched, averageHeartRate, peakHeartIndex);
  const maxAltitude = altitudeValues.length ? Math.max(...altitudeValues) : null;
  const minAltitude = altitudeValues.length ? Math.min(...altitudeValues) : null;
  const replayPoints = renderPoints.map(point => ({
    ...point,
    normalizedDistance: actualDistance > 0 ? Math.min(1, point.distanceKm / actualDistance) : 0,
  }));
  return {
    points: replayPoints,
    geoJson: buildGeoJsonSegments(replayPoints),
    elevation: replayPoints.map(point => ({ distanceKm: point.distanceKm, altitude: point.smoothedAltitude })),
    heartRate: replayPoints.map(point => ({ distanceKm: point.distanceKm, value: point.heartRate })),
    energy: energy.map(sample => ({ timestamp: sample.timestamp, value: sample.value })),
    distance: round(actualDistance, 2),
    duration: asNumber(duration),
    ascent: round(ascent, 0),
    descent: round(descent, 0),
    minAltitude: round(minAltitude, 0),
    maxAltitude: round(maxAltitude, 0),
    averageHeartRate: round(averageHeartRate ?? (heartRates.length ? heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length : null), 0),
    peakHeartRate: round(maxHeartRateValue, 0),
    maxSpeedKmh: maxSpeed == null ? null : round(maxSpeed * 3.6, 1),
    peakHeartIndex,
    fastestIndex,
    strongestClimbIndex: climb.index,
    strongestClimbGain: climb.gain,
    strongestClimbDistanceKm: climb.distanceKm,
    recoveryIndex,
    confidence: routeConfidence(enriched, hrSamples),
    routePointCount: enriched.length,
    heartRateSampleCount: hrSamples.length,
    hasAltitude: altitudeValues.length > 0,
  };
}

module.exports = {
  asNumber,
  haversineKm,
  normaliseRoutePoints,
  withCumulativeDistance,
  smoothAltitude,
  downsampleRoutePoints,
  normaliseSamples,
  nearestSample,
  buildGeoJsonSegments,
  strongestClimb,
  recoveryPoint,
  buildRouteAnalytics,
};
