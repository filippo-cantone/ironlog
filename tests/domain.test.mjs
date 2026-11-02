import test from 'node:test';
import assert from 'node:assert/strict';
import progression from '../src/domain/progression.js';
import session from '../src/domain/session.js';
import health from '../src/domain/health.js';
import store from '../src/storage/localStore.js';
import supabase from '../src/integrations/supabase.js';
import charts from '../src/ui/charts/metrics.js';
import workoutData from '../src/data/workouts.js';
import importExport from '../src/storage/importExport.js';
import activity from '../src/domain/activity.js';

const { detectPRs, checkOverloadNudges } = progression;
const { migrateSession, withSetStarted, withSetCompleted } = session;
const { mapHealthRows, mergeHealthData, computeSleepProfile, computeReadiness, classifyHealthTrend } = health;
const { safeParse, validateBackup } = store;
const { shouldRestoreCloud, compareSyncRecords } = supabase;
const { smoothLinePath, metricStatusColor } = charts;
const {
  DEFAULT_ACTIVITY_GOALS, normaliseGoals, calculateActivityPoints,
  summarizeWeeklyActivity, buildSleepTimeline, calculateWeightTrend, buildGoalCoaching,
} = activity;

const exercises = { bench: { name: 'Bench', unit: 'kg', defaultReps: 8, repMax: 10 } };

test('progression ignores incomplete sets and gates pain/RPE', () => {
  const session = { exercises: [{ id: 'bench', sets: [{ weight: 20, reps: 10, done: true }, { weight: 30, reps: 10, done: false }] }] };
  assert.deepEqual(detectPRs(session, [], exercises), [{ name: 'Bench', weight: 20 }]);
  assert.deepEqual(checkOverloadNudges({ exercises: [{ id: 'bench', sets: [{ reps: 10, done: true, pain: 0, rpe: 7 }] }] }, exercises), ['Bench']);
  assert.deepEqual(checkOverloadNudges({ exercises: [{ id: 'bench', sets: [{ reps: 10, done: true, pain: 3, rpe: 7 }] }] }, exercises), []);
});

test('session migration creates resumable metadata and preserves set timing', () => {
  const old = {
    id: '1', workout: 'A', phase: 'workout',
    exercises: [
      { id: 'bench', sets: [{ weight: 10, reps: 8, done: true }] },
      { id: 'row', sets: [{ weight: 8, reps: 8, done: false }] },
    ],
  };
  const migrated = migrateSession(old);
  assert.equal(migrated.currentExerciseIndex, 1);
  const started = withSetStarted(migrated, 0, 0, '2026-11-02T01:00:00.000Z');
  const completed = withSetCompleted(started, 0, 0, '2026-11-02T01:01:00.000Z');
  assert.equal(completed.currentExerciseIndex, 1);
  assert.equal(completed.exercises[0].sets[0].setStartedAt, '2026-11-02T01:00:00.000Z');
  assert.equal(completed.exercises[0].sets[0].setCompletedAt, '2026-11-02T01:01:00.000Z');
  assert.equal(completed.exercises[0].sets[0].done, true);
});

test('health mapping preserves cardio and merges cloud over local when present', () => {
  const cloud = mapHealthRows([
    { metric: 'cardio', date: '2026-11-02', value: 42 },
    { metric: 'hrv', date: '2026-11-02', value: 31 },
    { metric: 'resting_hr', date: '2026-11-02', value: 76 },
    { metric: 'blood_oxygen', date: '2026-11-02', value: 97 },
    { metric: 'sleep', date: '2026-11-02', value: 7.8 },
    { metric: 'sleep_deep', date: '2026-11-02', value: 1.2 },
  ]);
  const merged = mergeHealthData(cloud, { cardio: [{ date: '2026-11-01', value: 40 }] });
  assert.deepEqual(merged.cardio, [{ date: '2026-11-02', value: 42 }]);
  assert.deepEqual(merged.hrv, [{ date: '2026-11-02', value: 31 }]);
  assert.deepEqual(merged.restingHr, [{ date: '2026-11-02', value: 76 }]);
  assert.deepEqual(merged.bloodOxygen, [{ date: '2026-11-02', value: 97 }]);
  assert.deepEqual(merged.sleep, [{ date: '2026-11-02', value: 7.8 }]);
  assert.deepEqual(merged.sleepDeep, [{ date: '2026-11-02', value: 1.2 }]);
});

test('sleep profile reports duration, efficiency, stages, and awake time without inventing a score', () => {
  const data = {
    sleep: [{ date: '2026-11-02', value: 7.9 }],
    sleepInBed: [{ date: '2026-11-02', value: 8.1 }],
    sleepDeep: [{ date: '2026-11-02', value: 1.1 }],
    sleepRem: [{ date: '2026-11-02', value: 1.7 }],
    sleepCore: [{ date: '2026-11-02', value: 5.1 }],
    sleepAwake: [{ date: '2026-11-02', value: 0.1 }],
    sleepEfficiency: [{ date: '2026-11-02', value: 98 }],
  };
  const profile = computeSleepProfile(data);
  assert.equal(profile.totalSleep, 7.9);
  assert.equal(profile.efficiency, 98);
  assert.equal(profile.deep, 1.1);
  assert.equal(profile.rem, 1.7);
  assert.equal(profile.awake, 0.1);
  assert.equal(profile.hasStages, true);
  assert.equal(profile.durationStatus, 'meets the 7-hour minimum');
  assert.equal(profile.score, undefined);
  assert.equal(classifyHealthTrend(17, 20, true), 'strained');
  assert.equal(classifyHealthTrend(82, 80, false), 'good');
});

test('readiness uses an Apple SDNN HRV baseline band and reports sparse data honestly', () => {
  const baseline = Array.from({ length: 14 }, (_, index) => ({
    date: `2026-10-${String(index + 1).padStart(2, '0')}`,
    value: index % 2 ? 31 : 29,
  }));
  const rolling = Array.from({ length: 7 }, (_, index) => ({
    date: `2026-11-${String(index + 1).padStart(2, '0')}`,
    value: 20,
  }));
  const readiness = computeReadiness({ hrv: [...baseline, ...rolling] });
  assert.equal(readiness.hrvMetric, 'Apple Health SDNN');
  assert.equal(readiness.status, 'suppressed');
  assert.equal(readiness.score, undefined);
  assert.equal(computeReadiness({ hrv: rolling }).status, 'insufficient');
});

test('storage helpers reject malformed data without throwing', () => {
  assert.deepEqual(safeParse('{bad json', []), []);
  assert.throws(() => validateBackup({ sessions: {} }), /sessions must be an array/);
  assert.equal(shouldRestoreCloud([{ id: 'a' }], [{ id: 'a' }, { id: 'b' }]), true);
  assert.equal(compareSyncRecords([{ id: 'a', date: '2026-11-01' }], [{ id: 'b', updated_at: '2026-11-02' }]), 'cloud-newer');
  assert.equal(shouldRestoreCloud([{ id: 'a', date: '2026-11-01' }], [{ id: 'b', updated_at: '2026-11-02' }]), true);
  assert.equal(compareSyncRecords([{ id: 'a', date: '2026-11-03' }], [{ id: 'b', updated_at: '2026-11-02' }]), 'local-newer');
  assert.throws(() => validateBackup({ version: 99 }), /unsupported version/);
  assert.throws(() => validateBackup({ sessions: [null] }), /each session/);
  assert.equal(importExport.createBackup({ sessions: null }).sessions.length, 0);
  const backup = importExport.createBackup({ activityGoals: { weeklyHeartPoints: 150 }, healthData: { weight: [] } });
  assert.equal(backup.version, 3);
  assert.equal(validateBackup(backup).activityGoals.weeklyHeartPoints, 150);
  assert.throws(() => validateBackup({ activityGoals: [] }), /activityGoals must be an object/);
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

test('activity points use measured Watch intensity before HR estimates', () => {
  const measured = calculateActivityPoints({ workout: { durationMinutes: 30, intensity: 'moderate' }, maxHeartRate: 170 });
  assert.equal(measured.points, 30);
  assert.equal(measured.quality, 'measured');
  const estimated = calculateActivityPoints({
    workout: { durationMinutes: 4 }, maxHeartRate: 170,
    heartRateSamples: [
      { sample_at: '2026-11-02T08:00:00Z', heart_rate: 90 },
      { sample_at: '2026-11-02T08:01:00Z', heart_rate: 125 },
      { sample_at: '2026-11-02T08:02:00Z', heart_rate: 125 },
    ],
  });
  assert.equal(estimated.points, 5);
  assert.equal(estimated.source, 'heart_rate_estimate');
});

test('strength effort does not become aerobic points without Watch intensity or HR samples', () => {
  const summary = summarizeWeeklyActivity({
    now: new Date('2026-11-02T12:00:00Z'),
    sessions: [{ id: 's1', completed: true, date: '2026-11-02T08:00:00Z', workout: 'A' }],
    goals: DEFAULT_ACTIVITY_GOALS,
  });
  assert.equal(summary.strengthSessions, 1);
  assert.equal(summary.points, 0);
});

test('sleep timeline and weight trend handle sparse health data', () => {
  const sleep = buildSleepTimeline({ sleep: [{ date: '2026-11-02', value: 7.5 }], sleepDeep: [{ date: '2026-11-02', value: 1.2 }] }, { now: new Date('2026-11-02T23:00:00+11:00') });
  assert.equal(sleep.availableNights, 1);
  assert.equal(sleep.nights.at(-1).deep, 1.2);
  const weight = calculateWeightTrend([{ date: '2026-11-01', value: 90 }, { date: '2026-11-02', value: 89.4 }]);
  assert.equal(weight.direction, 'down');
  assert.equal(weight.recentChange, -0.6);
});

test('goal coaching keeps suppressed HRV and pain ahead of activity goals', () => {
  const goals = normaliseGoals({ weeklyStrengthSessions: 3 });
  const coaching = buildGoalCoaching({
    goals,
    activitySummary: { points: 150, strengthSessions: 3, cyclingMinutes: 0 },
    readiness: { status: 'suppressed' },
    sessions: [{ completed: true, exercises: [{ sets: [{ pain: 4 }] }] }],
  });
  assert.match(coaching.summary, /recovery signal takes priority/);
  assert.equal(coaching.limitingPatterns.some(item => item.includes('HRV')), true);
});
