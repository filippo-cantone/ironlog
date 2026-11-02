/**
 * Activity and goal calculations.
 *
 * These points describe movement volume and intensity. They are deliberately
 * separate from the HRV-led readiness protocol and never decide whether a
 * workout is medically appropriate.
 */

const DEFAULT_ACTIVITY_GOALS = Object.freeze({
  weeklyHeartPoints: 150,
  weeklyStrengthSessions: 3,
  weeklyCyclingMinutes: null,
  dailySteps: 8000,
  weeklyActiveCalories: null,
  maxHeartRate: null,
});

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

const dateOnly = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
};

function normaliseGoals(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const numberOrNull = key => {
    const number = asNumber(source[key]);
    return number != null && number >= 0 ? number : DEFAULT_ACTIVITY_GOALS[key];
  };
  return {
    weeklyHeartPoints: numberOrNull('weeklyHeartPoints'),
    weeklyStrengthSessions: numberOrNull('weeklyStrengthSessions'),
    weeklyCyclingMinutes: numberOrNull('weeklyCyclingMinutes'),
    dailySteps: numberOrNull('dailySteps'),
    weeklyActiveCalories: numberOrNull('weeklyActiveCalories'),
    maxHeartRate: numberOrNull('maxHeartRate'),
  };
}

function classifyIntensity(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value >= 2 ? 'vigorous' : value > 0 ? 'moderate' : null;
  const label = String(value).toLowerCase();
  if (/vigorous|high|hard|intense|very/.test(label)) return 'vigorous';
  if (/moderate|medium|brisk|active/.test(label)) return 'moderate';
  return null;
}

function workoutDurationMinutes(workout) {
  const minutes = asNumber(workout?.durationMinutes ?? workout?.duration_min);
  const seconds = asNumber(workout?.durationSec ?? workout?.duration_sec ?? workout?.watch_duration_sec);
  return minutes ?? (seconds != null ? seconds / 60 : 0);
}

function workoutIntensity(workout) {
  return workout?.intensity ?? workout?.intensityLevel ?? workout?.intensity_level ?? workout?.effort;
}

function sampleHeartRate(sample) {
  return asNumber(sample?.heartRate ?? sample?.heart_rate ?? sample?.bpm ?? sample?.qty ?? sample?.value);
}

function sampleMinute(sample) {
  const raw = sample?.sample_at ?? sample?.sampleAt ?? sample?.timestamp ?? sample?.date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? String(raw).slice(0, 16) : Math.floor(date.getTime() / 60000);
}

function calculateActivityPoints({ workout, intensity, heartRateSamples = [], maxHeartRate } = {}) {
  const duration = Math.max(0, workoutDurationMinutes(workout));
  const explicit = classifyIntensity(intensity ?? workoutIntensity(workout));
  if (explicit) {
    const moderateMinutes = explicit === 'moderate' ? Math.round(duration) : 0;
    const vigorousMinutes = explicit === 'vigorous' ? Math.round(duration) : 0;
    return {
      points: moderateMinutes + vigorousMinutes * 2,
      moderateMinutes,
      vigorousMinutes,
      source: 'watch_intensity',
      quality: 'measured',
      sampleCount: 0,
      label: explicit === 'vigorous' ? 'Vigorous · measured' : 'Moderate · measured',
    };
  }

  const maxHr = asNumber(maxHeartRate);
  const samples = (Array.isArray(heartRateSamples) ? heartRateSamples : [])
    .map(sample => ({ hr: sampleHeartRate(sample), minute: sampleMinute(sample) }))
    .filter(sample => sample.hr != null);
  if (!maxHr || !samples.length) {
    return {
      points: 0, moderateMinutes: 0, vigorousMinutes: 0,
      source: 'none', quality: 'insufficient', sampleCount: samples.length,
      label: 'Intensity unavailable',
    };
  }
  const unique = new Map();
  samples.forEach(sample => unique.set(sample.minute ?? unique.size, sample.hr));
  let moderateMinutes = 0;
  let vigorousMinutes = 0;
  unique.forEach(hr => {
    if (hr >= maxHr * 0.7) vigorousMinutes += 1;
    else if (hr >= maxHr * 0.5) moderateMinutes += 1;
  });
  const quality = unique.size >= Math.max(3, Math.round(duration * 0.5)) ? 'good'
    : unique.size >= 2 ? 'sparse' : 'insufficient';
  return {
    points: moderateMinutes + vigorousMinutes * 2,
    moderateMinutes,
    vigorousMinutes,
    source: 'heart_rate_estimate',
    quality,
    sampleCount: unique.size,
    label: `Estimated from HR · ${quality} sample`,
  };
}

function workoutLooksLikeCycling(workout) {
  const label = String(workout?.name ?? workout?.workout ?? workout?.activity ?? '').toLowerCase();
  return /cycl|bike|ride/.test(label);
}

function findWatchWorkout(session, watchData = {}) {
  const matches = Array.isArray(watchData.matches) ? watchData.matches : [];
  const workouts = Array.isArray(watchData.workouts) ? watchData.workouts : [];
  const match = matches.find(row => String(row.session_id ?? row.sessionId ?? '') === String(session?.id ?? ''));
  const sourceId = match?.source_id ?? match?.apple_workout_id ?? match?.workout_id;
  if (sourceId) return workouts.find(workout => String(workout.source_id ?? workout.id) === String(sourceId)) || null;
  const sessionTime = new Date(session?.startTime || session?.date || 0).getTime();
  if (!Number.isFinite(sessionTime)) return null;
  return workouts
    .map(workout => ({ workout, distance: Math.abs(new Date(workout.start_at || workout.start || workout.date || 0).getTime() - sessionTime) }))
    .filter(row => Number.isFinite(row.distance) && row.distance <= 3 * 60 * 60 * 1000)
    .sort((a, b) => a.distance - b.distance)[0]?.workout || null;
}

function sessionActivitySummary(session, watchData = {}, goals = DEFAULT_ACTIVITY_GOALS) {
  const workout = findWatchWorkout(session, watchData);
  if (!workout) return {
    points: 0, moderateMinutes: 0, vigorousMinutes: 0, activeCalories: 0,
    source: 'none', quality: 'unavailable', sampleCount: 0, watchWorkout: null,
    label: 'No Apple Watch workout matched',
  };
  const sourceId = workout.source_id ?? workout.id;
  const samples = (watchData.samples || []).filter(sample => {
    const sampleWorkoutId = sample.workout_id ?? sample.source_id ?? sample.apple_workout_id;
    return !sampleWorkoutId || !sourceId || String(sampleWorkoutId) === String(sourceId);
  });
  const points = calculateActivityPoints({ workout, heartRateSamples: samples, maxHeartRate: goals.maxHeartRate });
  return {
    ...points,
    activeCalories: round(workout.active_energy_kcal ?? workout.activeCalories ?? workout.activeCal ?? 0, 1) || 0,
    averageHeartRate: round(workout.avg_heart_rate ?? workout.averageHeartRate, 1),
    peakHeartRate: round(workout.max_heart_rate ?? workout.peakHeartRate, 1),
    durationMinutes: round(workoutDurationMinutes(workout), 1),
    watchWorkout: workout,
  };
}

function weekStart(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

function summarizeWeeklyActivity({ sessions = [], rides = [], watchData = {}, healthData = {}, goals = DEFAULT_ACTIVITY_GOALS, now = new Date() } = {}) {
  const safeGoals = normaliseGoals(goals);
  const start = weekStart(now);
  const currentSessions = sessions.filter(session => session?.completed && new Date(session.date || 0) >= start);
  const summaries = currentSessions.map(session => sessionActivitySummary(session, watchData, safeGoals));
  const watchWorkouts = (watchData.workouts || []).filter(workout => new Date(workout.start_at || workout.start || workout.date || 0) >= start);
  const rideMinutes = rides.filter(ride => new Date(ride.date || 0) >= start)
    .reduce((sum, ride) => sum + (asNumber(ride.duration) || asNumber(ride.durationMinutes) || 0), 0)
    + watchWorkouts.filter(workoutLooksLikeCycling).reduce((sum, workout) => sum + workoutDurationMinutes(workout), 0);
  const stepRows = (healthData.steps || []).filter(row => new Date(`${row.date}T00:00:00`) >= start);
  const calorieRows = (healthData.activeCal || []).filter(row => new Date(`${row.date}T00:00:00`) >= start);
  const steps = stepRows.reduce((sum, row) => sum + (asNumber(row.value) || 0), 0);
  const activeCalories = calorieRows.reduce((sum, row) => sum + (asNumber(row.value) || 0), 0);
  const points = summaries.reduce((sum, row) => sum + row.points, 0)
    + watchWorkouts.filter(workout => !summaries.some(row => row.watchWorkout === workout)).reduce((sum, workout) => sum + calculateActivityPoints({ workout, maxHeartRate: safeGoals.maxHeartRate }).points, 0);
  const moderateMinutes = summaries.reduce((sum, row) => sum + row.moderateMinutes, 0);
  const vigorousMinutes = summaries.reduce((sum, row) => sum + row.vigorousMinutes, 0);
  const stepDays = stepRows.filter(row => asNumber(row.value) >= safeGoals.dailySteps).length;
  return {
    weekStart: start.toISOString().slice(0, 10),
    points, moderateMinutes, vigorousMinutes, strengthSessions: currentSessions.length,
    cyclingMinutes: Math.round(rideMinutes), steps: Math.round(steps), activeCalories: Math.round(activeCalories),
    stepDays, sessionSummaries: summaries, watchWorkoutCount: watchWorkouts.length,
    goals: safeGoals,
    progress: {
      points: safeGoals.weeklyHeartPoints ? points / safeGoals.weeklyHeartPoints : null,
      strength: safeGoals.weeklyStrengthSessions ? currentSessions.length / safeGoals.weeklyStrengthSessions : null,
      cycling: safeGoals.weeklyCyclingMinutes ? rideMinutes / safeGoals.weeklyCyclingMinutes : null,
    },
  };
}

function buildSleepTimeline(healthData = {}, { days = 7, now = new Date() } = {}) {
  const end = new Date(now); end.setHours(0, 0, 0, 0);
  const localKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date(end); date.setDate(end.getDate() - (days - 1 - index));
    return localKey(date);
  });
  const valueFor = (key, date) => (healthData[key] || []).find(row => row.date === date)?.value;
  const nights = dates.map(date => {
    const asleep = asNumber(valueFor('sleep', date));
    const inBed = asNumber(valueFor('sleepInBed', date));
    const awake = asNumber(valueFor('sleepAwake', date));
    return {
      date, asleep, inBed, awake,
      deep: asNumber(valueFor('sleepDeep', date)), rem: asNumber(valueFor('sleepRem', date)), core: asNumber(valueFor('sleepCore', date)),
      efficiency: asNumber(valueFor('sleepEfficiency', date)) ?? (asleep != null && inBed > 0 ? (asleep / inBed) * 100 : null),
      bedtime: healthData.sleep?.find(row => row.date === date)?.startAt || null,
      wakeTime: healthData.sleep?.find(row => row.date === date)?.endAt || null,
    };
  });
  const durations = nights.map(night => night.asleep).filter(value => value != null);
  const average = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;
  const consistency = durations.length >= 2 ? Math.max(...durations) - Math.min(...durations) : null;
  return { nights, averageAsleep: round(average, 1), consistencyHours: round(consistency, 1), availableNights: durations.length };
}

function calculateWeightTrend(readings = []) {
  const rows = readings.filter(row => row?.date && asNumber(row.value) != null).sort((a, b) => a.date.localeCompare(b.date));
  const latest = rows[rows.length - 1] || null;
  const previous = rows.length > 1 ? rows[rows.length - 2] : null;
  const first = rows[0] || null;
  return {
    count: rows.length, latest: latest ? round(latest.value, 1) : null, latestDate: latest?.date || null,
    change: latest && first ? round(latest.value - first.value, 1) : null,
    recentChange: latest && previous ? round(latest.value - previous.value, 1) : null,
    direction: !latest || !previous ? 'insufficient_data' : latest.value < previous.value ? 'down' : latest.value > previous.value ? 'up' : 'stable',
    readings: rows.slice(-30),
  };
}

function buildGoalCoaching({ activitySummary = {}, readiness = null, sessions = [], goals = DEFAULT_ACTIVITY_GOALS } = {}) {
  const safeGoals = normaliseGoals(goals);
  const positivePatterns = [];
  const limitingPatterns = [];
  if (activitySummary.strengthSessions >= safeGoals.weeklyStrengthSessions) positivePatterns.push(`Strength goal reached: ${activitySummary.strengthSessions} sessions.`);
  else limitingPatterns.push(`${Math.max(0, safeGoals.weeklyStrengthSessions - activitySummary.strengthSessions)} more strength session${safeGoals.weeklyStrengthSessions - activitySummary.strengthSessions === 1 ? '' : 's'} would reach the weekly goal.`);
  if (activitySummary.points >= safeGoals.weeklyHeartPoints) positivePatterns.push(`Activity target reached: ${activitySummary.points} points.`);
  else limitingPatterns.push(`${Math.max(0, safeGoals.weeklyHeartPoints - activitySummary.points)} activity points remain.`);
  if (safeGoals.weeklyCyclingMinutes != null && activitySummary.cyclingMinutes >= safeGoals.weeklyCyclingMinutes) positivePatterns.push('Cycling minutes are on target.');
  if (safeGoals.weeklyCyclingMinutes != null && activitySummary.cyclingMinutes < safeGoals.weeklyCyclingMinutes) limitingPatterns.push(`${Math.max(0, safeGoals.weeklyCyclingMinutes - activitySummary.cyclingMinutes)} cycling minutes remain.`);
  if (readiness?.status === 'suppressed') limitingPatterns.unshift('HRV is meaningfully suppressed, so recovery rules take priority over goal completion.');
  const painSessions = sessions.filter(session => session?.completed).filter(session => (session.exercises || []).some(exercise => (exercise.sets || []).some(set => asNumber(set.pain) >= 3)));
  if (painSessions.length) limitingPatterns.unshift('Pain has been recorded at or above 3; keep safety gates ahead of activity targets.');
  const summary = readiness?.status === 'suppressed'
    ? 'Your activity goals are useful context, but today’s recovery signal takes priority.'
    : positivePatterns.length && !limitingPatterns.length
      ? 'You are on track with your current activity goals. Keep them steady.'
      : 'Keep the focus on the next useful goal, while respecting recovery and pain signals.';
  return { summary, positivePatterns, limitingPatterns, nextFocus: readiness?.status === 'suppressed' ? 'Recover first; resume the goal when HRV returns to its usual range.' : 'Maintain the current targets and review the balance at the end of the week.' };
}

module.exports = {
  DEFAULT_ACTIVITY_GOALS,
  normaliseGoals,
  calculateActivityPoints,
  sessionActivitySummary,
  summarizeWeeklyActivity,
  buildSleepTimeline,
  calculateWeightTrend,
  buildGoalCoaching,
};
