import test from 'node:test';
import assert from 'node:assert/strict';
import progression from '../src/domain/progression.js';
import session from '../src/domain/session.js';
import health from '../src/domain/health.js';
import store from '../src/storage/localStore.js';
import supabase from '../src/integrations/supabase.js';
import charts from '../src/ui/charts/metrics.js';
import workoutData from '../src/data/workouts.js';

const { detectPRs, checkOverloadNudges } = progression;
const { migrateSession, withSetStarted, withSetCompleted } = session;
const { mapHealthRows, mergeHealthData, computeSleepScore, classifyHealthTrend } = health;
const { safeParse, validateBackup } = store;
const { shouldRestoreCloud } = supabase;
const { smoothLinePath, metricStatusColor } = charts;

const exercises = { bench: { name: 'Bench', unit: 'kg', defaultReps: 8, repMax: 10 } };

test('progression ignores incomplete sets and gates pain/RPE', () => {
  const session = { exercises: [{ id: 'bench', sets: [{ weight: 20, reps: 10, done: true }, { weight: 30, reps: 10, done: false }] }] };
  assert.deepEqual(detectPRs(session, [], exercises), [{ name: 'Bench', weight: 20 }]);
  assert.deepEqual(checkOverloadNudges({ exercises: [{ id: 'bench', sets: [{ reps: 10, done: true, pain: 0, rpe: 7 }] }] }, exercises), ['Bench']);
  assert.deepEqual(checkOverloadNudges({ exercises: [{ id: 'bench', sets: [{ reps: 10, done: true, pain: 3, rpe: 7 }] }] }, exercises), []);
});

test('session migration creates resumable metadata and preserves set timing', () => {
  const old = { id: '1', workout: 'A', exercises: [{ id: 'bench', sets: [{ weight: 10, reps: 8, done: false }] }] };
  const migrated = migrateSession(old);
  const started = withSetStarted(migrated, 0, 0, '2026-11-02T01:00:00.000Z');
  const completed = withSetCompleted(started, 0, 0, '2026-11-02T01:01:00.000Z');
  assert.equal(completed.currentExerciseIndex, 0);
  assert.equal(completed.exercises[0].sets[0].setStartedAt, '2026-11-02T01:00:00.000Z');
  assert.equal(completed.exercises[0].sets[0].setCompletedAt, '2026-11-02T01:01:00.000Z');
  assert.equal(completed.exercises[0].sets[0].done, true);
});

test('health mapping preserves cardio and merges cloud over local when present', () => {
  const cloud = mapHealthRows([{ metric: 'cardio', date: '2026-11-02', value: 42 }]);
  const merged = mergeHealthData(cloud, { cardio: [{ date: '2026-11-01', value: 40 }] });
  assert.deepEqual(merged.cardio, [{ date: '2026-11-02', value: 42 }]);
});

test('sleep score uses duration, efficiency, stages, and awake time', () => {
  const data = {
    sleep: [{ date: '2026-11-02', value: 7.9 }],
    sleepInBed: [{ date: '2026-11-02', value: 8.1 }],
    sleepDeep: [{ date: '2026-11-02', value: 1.1 }],
    sleepRem: [{ date: '2026-11-02', value: 1.7 }],
    sleepCore: [{ date: '2026-11-02', value: 5.1 }],
    sleepAwake: [{ date: '2026-11-02', value: 0.1 }],
    sleepEfficiency: [{ date: '2026-11-02', value: 98 }],
  };
  const score = computeSleepScore(data);
  assert.equal(score.totalSleep, 7.9);
  assert.equal(score.efficiency, 98);
  assert.equal(score.deep, 1.1);
  assert.equal(score.rem, 1.7);
  assert.equal(score.awake, 0.1);
  assert.equal(score.hasStages, true);
  assert.ok(score.score >= 60);
  assert.equal(classifyHealthTrend(17, 20, true), 'strained');
  assert.equal(classifyHealthTrend(82, 80, false), 'good');
});

test('storage helpers reject malformed data without throwing', () => {
  assert.deepEqual(safeParse('{bad json', []), []);
  assert.throws(() => validateBackup({ sessions: {} }), /sessions must be an array/);
  assert.equal(shouldRestoreCloud([1], [1, 2]), true);
});

test('chart primitives produce smooth paths and meaningful status colours', () => {
  const C = { blue: '#blue', green: '#green', amber: '#amber', purple: '#purple', red: '#red' };
  const path = smoothLinePath([{ x: 0, y: 10 }, { x: 10, y: 0 }, { x: 20, y: 10 }]);
  assert.match(path, /^M0\.0,10\.0 C/);
  assert.equal(metricStatusColor({ key: 'hrv', higherBetter: true }, 70, 100, C), '#red');
  assert.equal(metricStatusColor({ key: 'hrv', higherBetter: true }, 100, 100, C), '#green');
});

test('workout catalogue exposes the full A/B/C split and selectable Iron Series days', () => {
  assert.deepEqual(Object.keys(workoutData.WORKOUTS), ['A', 'B', 'C']);
  assert.equal(workoutData.IRON_WORKOUTS.length, 30);
  assert.equal(workoutData.IRON_WORKOUTS.find(day => day.day === 17)?.title, 'Complete Upper Body');
  assert.ok(workoutData.IRON_WORKOUTS.find(day => day.day === 17)?.exercises.length > 0);
});
