/**
 * Session data contracts and migration helpers.
 * These functions are deliberately framework-free so they can be tested
 * without rendering the app.
 */

const SESSION_SCHEMA_VERSION = 2;

const PHASES = new Set(['energy', 'warmup_setup', 'warmup_active', 'workout', 'finisher']);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normaliseSet(set = {}) {
  const value = asObject(set);
  return {
    ...value,
    weight: value.weight ?? '',
    reps: value.reps ?? '',
    duration: value.duration ?? '',
    rpe: value.rpe ?? null,
    pain: value.pain ?? null,
    done: value.done === true,
    setStartedAt: value.setStartedAt || null,
    setCompletedAt: value.setCompletedAt || null,
  };
}

function normaliseExercise(exercise = {}) {
  const value = asObject(exercise);
  return {
    ...value,
    id: typeof value.id === 'string' ? value.id : '',
    sets: Array.isArray(value.sets) ? value.sets.map(normaliseSet) : [],
    notes: typeof value.notes === 'string' ? value.notes : '',
  };
}

/** Convert older saved sessions to the current shape without losing fields. */
function migrateSession(input) {
  const value = asObject(input);
  const exercises = Array.isArray(value.exercises) ? value.exercises.map(normaliseExercise) : [];
  const firstIncomplete = exercises.findIndex(ex => ex.sets.some(set => !set.done));
  const fallbackIndex = firstIncomplete >= 0 ? firstIncomplete : 0;
  const phase = value.phase === 'warmup' ? 'warmup_setup' : value.phase;

  return {
    ...value,
    id: String(value.id || Date.now()),
    workout: typeof value.workout === 'string' ? value.workout : 'A',
    date: value.date || new Date().toISOString(),
    startTime: Number.isFinite(Number(value.startTime)) ? Number(value.startTime) : Date.now(),
    completed: value.completed === true,
    phase: PHASES.has(phase) ? phase : (value.completed ? 'workout' : 'energy'),
    currentExerciseIndex: Number.isInteger(value.currentExerciseIndex)
      ? Math.max(0, Math.min(value.currentExerciseIndex, Math.max(0, exercises.length - 1)))
      : fallbackIndex,
    exercises,
    notes: typeof value.notes === 'string' ? value.notes : '',
    schemaVersion: SESSION_SCHEMA_VERSION,
  };
}

function migrateSessions(value) {
  return Array.isArray(value) ? value.map(migrateSession) : [];
}

function resumeState(session) {
  const migrated = migrateSession(session);
  return {
    session: migrated,
    phase: migrated.phase,
    exerciseIndex: migrated.currentExerciseIndex,
    elapsedSeconds: Math.max(0, Math.floor((Date.now() - migrated.startTime) / 1000)),
  };
}

function withExerciseIndex(session, index) {
  const migrated = migrateSession(session);
  return { ...migrated, currentExerciseIndex: Math.max(0, Number(index) || 0) };
}

function withPhase(session, phase) {
  const migrated = migrateSession(session);
  return { ...migrated, phase: PHASES.has(phase) ? phase : migrated.phase };
}

function withSetStarted(session, exerciseIndex, setIndex, timestamp = new Date().toISOString()) {
  const migrated = migrateSession(session);
  return {
    ...migrated,
    exercises: migrated.exercises.map((exercise, ei) => ei !== exerciseIndex ? exercise : {
      ...exercise,
      exerciseStartedAt: exercise.exerciseStartedAt || timestamp,
      sets: exercise.sets.map((set, si) => si !== setIndex || set.setStartedAt ? set : { ...set, setStartedAt: timestamp, done: false, setCompletedAt: null }),
    }),
  };
}

function withSetCompleted(session, exerciseIndex, setIndex, timestamp = new Date().toISOString()) {
  const migrated = migrateSession(session);
  return {
    ...migrated,
    exercises: migrated.exercises.map((exercise, ei) => ei !== exerciseIndex ? exercise : {
      ...exercise,
      sets: exercise.sets.map((set, si) => si !== setIndex ? set : {
        ...set,
        setStartedAt: set.setStartedAt || timestamp,
        setCompletedAt: set.setCompletedAt || timestamp,
        done: true,
      }),
    }),
  };
}

module.exports = { SESSION_SCHEMA_VERSION, migrateSession, migrateSessions, resumeState, withExerciseIndex, withPhase, withSetStarted, withSetCompleted };
