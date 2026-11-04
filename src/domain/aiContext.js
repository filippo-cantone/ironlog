/**
 * Build privacy-preserving, bounded summaries for the IronLog AI layer.
 * Raw Apple Health exports, ECG records, Watch samples, exercise notes, and
 * set-level timestamps intentionally stay outside the general output. An
 * explicit symptom-note review may opt in to bounded user-written observations.
 */

const HEALTH_KEYS = [
  'hrv', 'restingHr', 'steps', 'activeCal', 'cardio', 'bloodOxygen',
  'sleep', 'sleepDeep', 'sleepRem', 'sleepCore', 'sleepAwake',
  'sleepInBed', 'sleepEfficiency', 'weight',
];

const asNumber = value => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const round = (value, digits = 1) => {
  const n = asNumber(value);
  if (n == null) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
};

function normaliseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
}

function sortReadings(readings) {
  return (Array.isArray(readings) ? readings : [])
    .map(reading => ({
      date: normaliseDate(reading?.date),
      value: asNumber(reading?.value ?? reading?.qty),
    }))
    .filter(reading => reading.date && reading.value != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function average(values) {
  const usable = values.map(asNumber).filter(value => value != null);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
}

function trendFor(values, higherIsBetter = true) {
  if (values.length < 2) return 'insufficient_data';
  const split = Math.max(1, Math.floor(values.length / 2));
  const first = average(values.slice(0, split));
  const last = average(values.slice(-split));
  if (first == null || last == null) return 'insufficient_data';
  const delta = last - first;
  const tolerance = Math.max(Math.abs(first) * 0.03, 0.1);
  if (Math.abs(delta) <= tolerance) return 'stable';
  if (higherIsBetter) return delta > 0 ? 'improving' : 'declining';
  return delta < 0 ? 'improving' : 'declining';
}

export function summarizeReadings(readings, { higherIsBetter = true, limit = 90 } = {}) {
  const rows = sortReadings(readings);
  const recent = rows.slice(-limit);
  const values = recent.map(row => row.value);
  const last7 = recent.slice(-7).map(row => row.value);
  return {
    count: rows.length,
    firstDate: rows[0]?.date || null,
    lastDate: rows[rows.length - 1]?.date || null,
    latest: recent[recent.length - 1]?.value ?? null,
    average: round(average(values), 2),
    average7: round(average(last7), 2),
    min: values.length ? round(Math.min(...values), 2) : null,
    max: values.length ? round(Math.max(...values), 2) : null,
    trend: trendFor(values, higherIsBetter),
  };
}

function sleepSummary(healthData) {
  const duration = summarizeReadings(healthData?.sleep, { limit: 30 });
  const efficiency = summarizeReadings(healthData?.sleepEfficiency, { limit: 30 });
  return {
    duration,
    efficiency,
    deep: summarizeReadings(healthData?.sleepDeep, { limit: 30 }),
    rem: summarizeReadings(healthData?.sleepRem, { limit: 30 }),
    core: summarizeReadings(healthData?.sleepCore, { limit: 30 }),
    awake: summarizeReadings(healthData?.sleepAwake, { higherIsBetter: false, limit: 30 }),
    inBed: summarizeReadings(healthData?.sleepInBed, { limit: 30 }),
  };
}

export function summarizeHealthData(healthData = {}) {
  const health = {};
  HEALTH_KEYS.forEach(key => {
    if (key.startsWith('sleep')) return;
    health[key] = summarizeReadings(healthData[key], {
      higherIsBetter: !['restingHr', 'bloodOxygen'].includes(key) || key === 'bloodOxygen',
    });
  });
  health.sleep = sleepSummary(healthData);
  return health;
}

function completedSetSummary(exercise) {
  const sets = (Array.isArray(exercise?.sets) ? exercise.sets : []).filter(set => set?.done !== false && set?.done !== 0);
  const weights = sets.map(set => asNumber(set.weight)).filter(value => value != null);
  const reps = sets.map(set => asNumber(set.reps)).filter(value => value != null);
  const rpes = sets.map(set => asNumber(set.rpe)).filter(value => value != null);
  const pains = sets.map(set => asNumber(set.pain)).filter(value => value != null);
  const volume = sets.reduce((sum, set) => sum + ((asNumber(set.weight) || 0) * (asNumber(set.reps) || 0)), 0);
  return {
    sets: sets.length,
    reps: reps.length ? Math.round(reps.reduce((sum, value) => sum + value, 0)) : 0,
    volume: round(volume, 1),
    averageRpe: round(average(rpes), 1),
    maxPain: pains.length ? Math.max(...pains) : null,
    averageWeight: round(average(weights), 1),
    maxWeight: weights.length ? round(Math.max(...weights), 1) : null,
  };
}

export function summarizeSessions(sessions, { allExercises = {}, limit = 60 } = {}) {
  const completed = (Array.isArray(sessions) ? sessions : [])
    .filter(session => session?.completed)
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const recent = completed.slice(-limit);
  const exercises = recent.flatMap(session => (Array.isArray(session.exercises) ? session.exercises : [])
    .map(exercise => ({
      id: String(exercise?.id || 'unknown'),
      name: String(allExercises?.[exercise?.id]?.name || exercise?.name || exercise?.id || 'Exercise').slice(0, 80),
      stats: completedSetSummary(exercise),
    })));
  const totals = exercises.reduce((out, exercise) => {
    out.sets += exercise.stats.sets;
    out.volume += exercise.stats.volume || 0;
    out.reps += exercise.stats.reps;
    return out;
  }, { sets: 0, volume: 0, reps: 0 });
  return {
    count: completed.length,
    firstDate: normaliseDate(completed[0]?.date),
    lastDate: normaliseDate(completed[completed.length - 1]?.date),
    totals: { ...totals, volume: round(totals.volume, 1) },
    recent: recent.map(session => ({
      date: normaliseDate(session.date),
      workout: String(session.workout || 'unknown').slice(0, 40),
      durationMinutes: asNumber(session.duration),
      energy: asNumber(session.energy),
      exercises: (Array.isArray(session.exercises) ? session.exercises : []).map(exercise => ({
        id: String(exercise?.id || 'unknown'),
        name: String(allExercises?.[exercise?.id]?.name || exercise?.name || exercise?.id || 'Exercise').slice(0, 80),
        ...completedSetSummary(exercise),
      })),
    })),
  };
}

export function summarizeWatchData(watchData = {}) {
  const workouts = Array.isArray(watchData?.workouts) ? watchData.workouts : [];
  const summaries = workouts.map(workout => ({
    date: normaliseDate(workout.date || workout.startDate || workout.start || workout.start_time),
    durationMinutes: round(
      asNumber(workout.durationMinutes ?? workout.duration ?? workout.duration_min)
        ?? (asNumber(workout.watch_duration_sec ?? workout.duration_sec) != null
          ? asNumber(workout.watch_duration_sec ?? workout.duration_sec) / 60 : null), 1,
    ),
    activeCalories: round(asNumber(workout.activeCalories ?? workout.activeCal ?? workout.active_energy_kcal ?? workout.total_energy_kcal), 1),
    averageHeartRate: round(asNumber(workout.averageHeartRate ?? workout.avgHr ?? workout.avg_heart_rate), 1),
    peakHeartRate: round(asNumber(workout.peakHeartRate ?? workout.maxHr ?? workout.max_heart_rate), 1),
    sampleCount: Array.isArray(workout.samples)
      ? workout.samples.length
      : asNumber(workout.sampleCount ?? workout.sample_count) || 0,
    matchConfidence: String(workout.matchConfidence || workout.match_confidence || workout.confidence || 'unknown').slice(0, 30),
  })).filter(row => row.date);
  const exportedSampleCount = Array.isArray(watchData?.samples) ? watchData.samples.length : 0;
  if (exportedSampleCount && summaries.every(row => !row.sampleCount) && summaries.length) {
    summaries[summaries.length - 1].sampleCount = exportedSampleCount;
  }
  return {
    count: summaries.length,
    matchedCount: summaries.filter(row => row.matchConfidence !== 'unknown').length,
    totalDurationMinutes: round(summaries.reduce((sum, row) => sum + (row.durationMinutes || 0), 0), 1),
    totalActiveCalories: round(summaries.reduce((sum, row) => sum + (row.activeCalories || 0), 0), 1),
    averageHeartRate: round(average(summaries.map(row => row.averageHeartRate)), 1),
    peakHeartRate: summaries.length ? Math.max(...summaries.map(row => row.peakHeartRate || 0)) || null : null,
    sampleCount: summaries.reduce((sum, row) => sum + (row.sampleCount || 0), 0),
    recent: summaries.slice(-30),
  };
}

function summariseSymptomReview(review) {
  if (!review || typeof review !== 'object') return null;
  return {
    schemaVersion: 'ironlog-symptom-review-v1',
    workout: String(review.workout || '').slice(0, 40),
    currentDate: String(review.currentDate || '').slice(0, 20) || null,
    noteCount: Number(review.noteCount) || 0,
    entryCount: Number(review.entryCount) || 0,
    currentEntryCount: Number(review.currentEntryCount) || 0,
    safetySignals: (review.safetySignals || []).map(value => String(value).slice(0, 80)).slice(0, 8),
    repeatedPatterns: (review.repeatedPatterns || []).slice(0, 8).map(pattern => ({
      area: String(pattern.area || '').slice(0, 80),
      mentions: Number(pattern.mentions) || 0,
      dates: (pattern.dates || []).map(value => String(value).slice(0, 20)).slice(-8),
      exercises: (pattern.exercises || []).map(value => String(value).slice(0, 90)).slice(0, 8),
      maxPain: asNumber(pattern.maxPain),
      repeated: Boolean(pattern.repeated),
    })),
    observations: (review.observations || []).slice(-24).map(observation => ({
      date: String(observation.date || '').slice(0, 20) || null,
      workout: String(observation.workout || '').slice(0, 40),
      exercise: String(observation.exercise || '').slice(0, 90),
      userText: String(observation.text || '').slice(0, 280),
      pain: asNumber(observation.pain),
      rpe: asNumber(observation.rpe),
      areas: (observation.areas || []).map(value => String(value).slice(0, 80)).slice(0, 6),
      current: Boolean(observation.current),
    })),
  };
}

function trimContext(context, maxChars) {
  let current = context;
  let serialised = JSON.stringify(current);
  while (serialised.length > maxChars && current.training?.recent?.length > 1) {
    current = {
      ...current,
      training: { ...current.training, recent: current.training.recent.slice(1) },
    };
    serialised = JSON.stringify(current);
  }
  if (serialised.length <= maxChars) return current;
  const compact = {
    schemaVersion: current.schemaVersion,
    generatedAt: current.generatedAt,
    focus: current.focus,
    training: {
      count: current.training?.count || 0,
      firstDate: current.training?.firstDate || null,
      lastDate: current.training?.lastDate || null,
      totals: current.training?.totals || { sets: 0, volume: 0, reps: 0 },
    },
    watch: {
      count: current.watch?.count || 0,
      matchedCount: current.watch?.matchedCount || 0,
      totalDurationMinutes: current.watch?.totalDurationMinutes || 0,
      totalActiveCalories: current.watch?.totalActiveCalories || 0,
      averageHeartRate: current.watch?.averageHeartRate || null,
      peakHeartRate: current.watch?.peakHeartRate || null,
      sampleCount: current.watch?.sampleCount || 0,
    },
    activity: current.activity || null,
    weight: current.weight || null,
    goalCoaching: current.goalCoaching || null,
    symptomReview: current.symptomReview ? {
      ...current.symptomReview,
      observations: (current.symptomReview.observations || []).slice(-12),
    } : null,
    rules: current.rules || {},
    truncated: true,
  };
  return JSON.stringify(compact).length <= maxChars ? compact : {
    schemaVersion: 'ironlog-ai-context-v1',
    focus: current.focus,
    truncated: true,
  };
}

export function buildAiContext({ healthData, sessions, watchData, recovery, coachRec, allExercises, focus, maxChars = 50000, activitySummary, activityGoals, sleepTimeline, weightTrend, goalCoaching, symptomReview } = {}) {
  const context = {
    schemaVersion: 'ironlog-ai-context-v1',
    generatedAt: new Date().toISOString(),
    focus: String(focus || 'general').slice(0, 60),
    health: summarizeHealthData(healthData),
    training: summarizeSessions(sessions, { allExercises }),
    watch: summarizeWatchData(watchData),
    activity: activitySummary ? {
      points: activitySummary.points || 0,
      moderateMinutes: activitySummary.moderateMinutes || 0,
      vigorousMinutes: activitySummary.vigorousMinutes || 0,
      strengthSessions: activitySummary.strengthSessions || 0,
      cyclingMinutes: activitySummary.cyclingMinutes || 0,
      steps: activitySummary.steps || 0,
      activeCalories: activitySummary.activeCalories || 0,
      goals: activityGoals || null,
    } : null,
    sleepTimeline: sleepTimeline ? {
      availableNights: sleepTimeline.availableNights || 0,
      averageAsleep: round(sleepTimeline.averageAsleep, 1),
      consistencyHours: round(sleepTimeline.consistencyHours, 1),
      nights: (sleepTimeline.nights || []).map(night => ({
        date: night.date, asleep: round(night.asleep, 1), inBed: round(night.inBed, 1),
        deep: round(night.deep, 1), rem: round(night.rem, 1), core: round(night.core, 1),
        awake: round(night.awake, 1), efficiency: round(night.efficiency, 1),
      })),
    } : null,
    weight: weightTrend ? {
      count: weightTrend.count || 0,
      latest: round(weightTrend.latest, 1),
      change: round(weightTrend.change, 1),
      recentChange: round(weightTrend.recentChange, 1),
      direction: weightTrend.direction,
    } : null,
    goalCoaching: goalCoaching ? {
      summary: String(goalCoaching.summary || '').slice(0, 240),
      positivePatterns: (goalCoaching.positivePatterns || []).slice(0, 5),
      limitingPatterns: (goalCoaching.limitingPatterns || []).slice(0, 5),
      nextFocus: String(goalCoaching.nextFocus || '').slice(0, 240),
    } : null,
    // This is intentionally opt-in. General AI explanations never receive
    // exercise notes; only the explicit end-of-workout symptom review does.
    symptomReview: summariseSymptomReview(symptomReview),
    rules: {
      recovery: recovery ? {
        status: String(recovery.status || '').slice(0, 30),
        statusLabel: String(recovery.statusLabel || '').slice(0, 80),
        confidence: String(recovery.confidence || '').slice(0, 20),
        hrvMetric: String(recovery.hrvMetric || 'Apple Health SDNN').slice(0, 40),
        dataPoints: asNumber(recovery.dataPoints),
        baselinePoints: asNumber(recovery.baselinePoints),
        hrv: recovery.hrv ? {
          rollingMean: round(recovery.hrv.rollingMean, 2),
          baselineMean: round(recovery.hrv.baselineMean, 2),
          baselineSd: round(recovery.hrv.baselineSd, 2),
          lower: round(recovery.hrv.lower, 2),
          upper: round(recovery.hrv.upper, 2),
        } : null,
        restingHrStatus: String(recovery.restingHr?.status || '').slice(0, 20),
        sleepDuration: round(recovery.sleep?.totalSleep, 2),
        sleepDurationStatus: String(recovery.sleep?.durationStatus || '').slice(0, 60),
      } : null,
      coach: coachRec ? {
        label: String(coachRec.label || '').slice(0, 50),
        detail: String(coachRec.detail || coachRec.body || '').slice(0, 240),
        flags: Array.isArray(coachRec.flags) ? coachRec.flags.map(flag => String(flag).slice(0, 40)).slice(0, 12) : [],
      } : null,
    },
  };
  return trimContext(context, maxChars);
}

export function serializeAiContext(context, maxChars = 50000) {
  const safe = trimContext(context || {}, maxChars);
  const serialised = JSON.stringify(safe);
  return serialised.length <= maxChars ? serialised : JSON.stringify({ schemaVersion: 'ironlog-ai-context-v1', truncated: true });
}

export function containsPrivateRawFields(value) {
  const forbidden = /(^|_|-)(ecg|electrocardiogram|raw|payload|samples?|notes?|timestamp|setStartedAt|setCompletedAt)(_|-|$)/i;
  const walk = node => {
    if (Array.isArray(node)) return node.some(walk);
    if (!node || typeof node !== 'object') return false;
    return Object.entries(node).some(([key, child]) => forbidden.test(key) || walk(child));
  };
  return walk(value);
}

export default buildAiContext;
