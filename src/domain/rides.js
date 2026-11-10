/**
 * Apple Watch cycling normalisation for the Rides tab.
 *
 * Apple Health can expose the same workout through more than one source. The
 * app keeps one canonical cycling ride per time window and marks it clearly as
 * Apple-sourced so it cannot be counted again as a manual ride.
 */

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

function localDateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function workoutSourceId(workout) {
  return String(workout?.source_id ?? workout?.sourceId ?? workout?.id ?? '');
}

function workoutLabel(workout) {
  return String(workout?.name ?? workout?.workout ?? workout?.activity ?? '').trim();
}

function isAppleCyclingWorkout(workout) {
  return /cycl|bike|ride/i.test(workoutLabel(workout));
}

function workoutStartMs(workout) {
  const value = workout?.start_at ?? workout?.startAt ?? workout?.start ?? workout?.date;
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : null;
}

function workoutEndMs(workout) {
  const value = workout?.end_at ?? workout?.endAt ?? workout?.end;
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : null;
}

function workoutDurationMinutes(workout) {
  const seconds = asNumber(workout?.duration_sec ?? workout?.durationSec ?? workout?.watch_duration_sec);
  if (seconds != null) return seconds / 60;
  const start = workoutStartMs(workout);
  const end = workoutEndMs(workout);
  return start != null && end != null && end >= start ? (end - start) / 60000 : null;
}

function distanceValue(candidate) {
  if (candidate == null) return null;
  if (typeof candidate === 'object') {
    const value = asNumber(candidate.qty ?? candidate.value ?? candidate.amount ?? candidate.distance);
    if (value == null) return null;
    const units = String(candidate.units ?? candidate.unit ?? '').toLowerCase();
    if (/^m(etre|eter)?s?$/.test(units) || units === 'meter') return value / 1000;
    if (/mi/.test(units)) return value * 1.609344;
    return value;
  }
  return asNumber(candidate);
}

function extractDistanceKm(workout) {
  const candidates = [
    workout?.distance_km,
    workout?.distanceKm,
    workout?.cycling_distance_km,
    workout?.cyclingDistanceKm,
    workout?.distance,
    workout?.cycling_distance,
    workout?.cyclingDistance,
    workout?.raw?.distance,
    workout?.raw?.cyclingDistance,
  ];
  for (const candidate of candidates) {
    const value = distanceValue(candidate);
    if (value != null && value >= 0) return round(value, 2);
  }
  return null;
}

function workoutCompleteness(workout) {
  const fields = [
    workoutDurationMinutes(workout),
    extractDistanceKm(workout),
    asNumber(workout?.active_energy_kcal ?? workout?.activeCalories ?? workout?.activeCal),
    asNumber(workout?.avg_heart_rate ?? workout?.averageHeartRate),
    asNumber(workout?.max_heart_rate ?? workout?.peakHeartRate),
    asNumber(workout?.intensity),
    asNumber(workout?.route_point_count ?? workout?.routePointCount) > 0 ? 1 : null,
  ];
  return fields.filter(value => value != null).length;
}

function equivalentCyclingWorkout(first, second) {
  const firstStart = workoutStartMs(first);
  const secondStart = workoutStartMs(second);
  if (firstStart == null || secondStart == null) return false;
  if (Math.abs(firstStart - secondStart) > 2 * 60 * 1000) return false;

  const firstEnd = workoutEndMs(first);
  const secondEnd = workoutEndMs(second);
  if (firstEnd != null && secondEnd != null && Math.abs(firstEnd - secondEnd) > 2 * 60 * 1000) return false;
  return true;
}

function dedupeAppleCyclingWorkouts(workouts = []) {
  const nonCycling = [];
  const cycling = [];
  (Array.isArray(workouts) ? workouts : []).forEach(workout => {
    if (isAppleCyclingWorkout(workout)) cycling.push(workout);
    else nonCycling.push(workout);
  });

  const canonical = [];
  cycling.forEach(workout => {
    const duplicateIndex = canonical.findIndex(existing => equivalentCyclingWorkout(existing, workout));
    if (duplicateIndex < 0) {
      canonical.push(workout);
      return;
    }
    const existing = canonical[duplicateIndex];
    const winner = workoutCompleteness(workout) > workoutCompleteness(existing) ? workout : existing;
    const duplicateSourceIds = [
      ...(existing?.duplicate_source_ids || []),
      workoutSourceId(existing),
      ...(workout?.duplicate_source_ids || []),
      workoutSourceId(workout),
    ].filter(Boolean).filter((sourceId, index, all) => all.indexOf(sourceId) === index);
    canonical[duplicateIndex] = duplicateSourceIds.length > 1
      ? { ...winner, duplicate_source_ids: duplicateSourceIds }
      : winner;
  });

  return [...nonCycling, ...canonical].sort((a, b) => (workoutStartMs(b) || 0) - (workoutStartMs(a) || 0));
}

function rideTypeForWorkout(workout) {
  const intensity = asNumber(workout?.intensity);
  if (intensity != null && intensity >= 8) return 'hard';
  if (intensity != null && intensity <= 3) return 'easy';
  return 'moderate';
}

function appleWorkoutToRide(workout) {
  const sourceId = workoutSourceId(workout);
  if (!sourceId || !isAppleCyclingWorkout(workout)) return null;
  const duration = workoutDurationMinutes(workout);
  if (duration == null || duration <= 0) return null;
  const activeCalories = round(workout?.active_energy_kcal ?? workout?.activeCalories ?? workout?.activeCal, 1);
  const averageHeartRate = round(workout?.avg_heart_rate ?? workout?.averageHeartRate, 1);
  const peakHeartRate = round(workout?.max_heart_rate ?? workout?.peakHeartRate, 1);
  const distance = extractDistanceKm(workout);
  const label = workoutLabel(workout) || 'Cycling';
  const details = [
    'Apple Watch',
    activeCalories != null ? `${Math.round(activeCalories)} kcal` : null,
    averageHeartRate != null ? `${Math.round(averageHeartRate)} avg bpm` : null,
    peakHeartRate != null ? `${Math.round(peakHeartRate)} peak bpm` : null,
  ].filter(Boolean).join(' · ');

  return {
    id: `apple-ride-${sourceId}`,
    source: 'apple_health',
    sourceId,
    date: workout?.start_at ?? workout?.startAt ?? workout?.start ?? new Date().toISOString(),
    localDate: workout?.local_date ?? localDateKey(workout?.start_at),
    duration: Math.max(1, Math.round(duration)),
    distance,
    effort: null,
    type: rideTypeForWorkout(workout),
    notes: `${label} · ${details}`,
    activeCalories,
    averageHeartRate,
    peakHeartRate,
    watchIntensity: asNumber(workout?.intensity),
    duplicateSourceIds: workout?.duplicate_source_ids || [],
  };
}

function ridesEquivalent(first, second) {
  if (!first || !second) return false;
  return Number(first.duration) === Number(second.duration)
    && (first.distance == null ? second.distance == null : Math.abs(Number(first.distance) - Number(second.distance)) < 0.01)
    && (first.activeCalories == null ? second.activeCalories == null : Math.abs(Number(first.activeCalories) - Number(second.activeCalories)) < 0.1)
    && (first.averageHeartRate == null ? second.averageHeartRate == null : Math.abs(Number(first.averageHeartRate) - Number(second.averageHeartRate)) < 0.1)
    && (first.peakHeartRate == null ? second.peakHeartRate == null : Math.abs(Number(first.peakHeartRate) - Number(second.peakHeartRate)) < 0.1);
}

function manualRideMatchesAppleWorkout(ride, appleRide) {
  if (!ride || !appleRide || ride.source === 'apple_health') return false;
  const rideDate = localDateKey(ride.date);
  const appleDate = appleRide.localDate || localDateKey(appleRide.date);
  if (!rideDate || !appleDate || rideDate !== appleDate) return false;

  const durationDifference = Math.abs((Number(ride.duration) || 0) - (Number(appleRide.duration) || 0));
  if (ride.distance != null && appleRide.distance != null) {
    const distanceDifference = Math.abs(Number(ride.distance) - Number(appleRide.distance));
    return distanceDifference <= Math.max(1.25, Number(appleRide.distance) * 0.1) && durationDifference <= 8;
  }
  return durationDifference <= 6;
}

function syncAppleCyclingRides(existingRides = [], workouts = []) {
  const rawCycling = (Array.isArray(workouts) ? workouts : []).filter(isAppleCyclingWorkout);
  const canonicalWorkouts = dedupeAppleCyclingWorkouts(rawCycling);
  const managedSourceIds = new Set(rawCycling.map(workoutSourceId).filter(Boolean));
  const appleRides = canonicalWorkouts.map(appleWorkoutToRide).filter(Boolean);
  const removed = [];
  const kept = [];

  (Array.isArray(existingRides) ? existingRides : []).forEach(ride => {
    const sourceId = String(ride?.sourceId ?? ride?.source_id ?? '');
    if (ride?.source === 'apple_health' && managedSourceIds.has(sourceId)) {
      // The canonical Apple ride is re-added below. Do not report the old
      // record as deleted, otherwise a routine refresh would delete the cloud
      // row even when its data has not changed.
      return;
    }
    if (appleRides.some(appleRide => manualRideMatchesAppleWorkout(ride, appleRide))) {
      removed.push(ride);
      return;
    }
    kept.push(ride);
  });

  const added = [];
  appleRides.forEach(appleRide => {
    const existing = (existingRides || []).find(ride => String(ride?.sourceId ?? ride?.source_id ?? '') === appleRide.sourceId && ride?.source === 'apple_health');
    if (!existing || !ridesEquivalent(existing, appleRide)) added.push(appleRide);
    kept.push(appleRide);
  });

  const deduped = [];
  const seenIds = new Set();
  [...kept].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).forEach(ride => {
    const id = String(ride?.id ?? '');
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);
    deduped.push(ride);
  });
  return { rides: deduped, added, removed, appleRides };
}

module.exports = {
  asNumber,
  extractDistanceKm,
  isAppleCyclingWorkout,
  dedupeAppleCyclingWorkouts,
  appleWorkoutToRide,
  manualRideMatchesAppleWorkout,
  syncAppleCyclingRides,
};
