import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAiContext,
  summarizeHealthData,
  summarizeSessions,
  summarizeWatchData,
  containsPrivateRawFields,
} from '../src/domain/aiContext.js';
import {
  cacheInsight,
  getCachedInsight,
  makeDeterministicInsight,
  requestAiExplanation,
  validateAiInsight,
  isRetryableProviderStatus,
  shouldFallbackProviderError,
} from '../src/integrations/aiCoach.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.get(key) || null,
    setItem: (key, value) => data.set(key, value),
  };
}

const health = {
  hrv: [{ date: '2026-11-01', value: 22 }],
  restingHr: [{ date: '2026-11-01', value: 78 }],
  sleep: [{ date: '2026-11-01', value: 7.5 }],
  sleepDeep: [{ date: '2026-11-01', value: 1.1 }],
  sleepRem: [{ date: '2026-11-01', value: 1.6 }],
  sleepAwake: [{ date: '2026-11-01', value: 0.2 }],
};

test('AI context summarises full history without raw/private fields', () => {
  const context = buildAiContext({
    healthData: health,
    sessions: [{
      id: 'secret-session', completed: true, date: '2026-11-01', workout: 'A', notes: 'private note',
      exercises: [{ id: 'bb_flat_bench', sets: [{ weight: 20, reps: 8, rpe: 7, pain: 0, done: true, setStartedAt: 'private' }] }],
    }],
    watchData: { workouts: [{ date: '2026-11-01', avgHr: 120, samples: [{ hr: 120, t: 1 }], sampleCount: 1 }] },
    recovery: { status: 'usual', statusLabel: 'HRV within usual range', confidence: 'medium', hrvMetric: 'Apple Health SDNN', dataPoints: 7, baselinePoints: 14, hrv: { rollingMean: 22, baselineMean: 21, baselineSd: 2, lower: 20, upper: 22 }, sleep: { totalSleep: 7.5, durationStatus: 'meets the 7-hour minimum' } },
    coachRec: { label: 'Train steady', detail: 'Keep effort controlled', flags: ['watch'] },
    allExercises: { bb_flat_bench: { name: 'Bench Press' } },
    focus: 'weekly review',
    activitySummary: { points: 42, moderateMinutes: 20, vigorousMinutes: 11, strengthSessions: 2, cyclingMinutes: 35, steps: 42000, activeCalories: 1600 },
    activityGoals: { weeklyHeartPoints: 150, weeklyStrengthSessions: 3 },
    weightTrend: { count: 3, latest: 88.4, direction: 'down' },
  });
  assert.equal(context.schemaVersion, 'ironlog-ai-context-v1');
  assert.equal(context.training.count, 1);
  assert.equal(context.training.recent[0].exercises[0].name, 'Bench Press');
  assert.equal(context.watch.recent[0].sampleCount, 1);
  assert.equal(context.activity.points, 42);
  assert.equal(context.weight.direction, 'down');
  assert.equal(containsPrivateRawFields(context), false);
});

test('AI context remains bounded for long histories', () => {
  const sessions = Array.from({ length: 200 }, (_, index) => ({
    completed: true, date: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`, workout: 'A',
    exercises: [{ id: 'ex', sets: [{ weight: 20, reps: 10, done: true }] }],
  }));
  const context = buildAiContext({ healthData: {}, sessions, watchData: {}, allExercises: {}, maxChars: 2000 });
  assert.ok(JSON.stringify(context).length <= 2200);
  assert.equal(context.truncated, true);
});

test('symptom-note context is opt-in and bounded to explicit observations', () => {
  const context = buildAiContext({
    healthData: { hrv: [{ date: '2026-11-04', value: 22 }] },
    sessions: [],
    allExercises: {},
    symptomReview: {
      workout: 'A', currentDate: '2026-11-04', noteCount: 1, entryCount: 1, currentEntryCount: 1,
      safetySignals: [], repeatedPatterns: [],
      observations: [{ date: '2026-11-04', workout: 'A', exercise: 'DB Press', text: 'shoulder felt tight', pain: 2, rpe: 7, areas: ['shoulder'], current: true }],
    },
    focus: 'exercise discomfort',
    maxChars: 5000,
  });
  assert.equal(context.symptomReview.observations[0].userText, 'shoulder felt tight');
  assert.equal(containsPrivateRawFields(context), false);
  assert.ok(JSON.stringify(context).length <= 5000);
});

test('health, session, and Watch summaries retain useful aggregates', () => {
  assert.equal(summarizeHealthData(health).hrv.latest, 22);
  assert.equal(summarizeSessions([{ completed: true, date: '2026-11-01', exercises: [{ id: 'x', sets: [{ weight: 10, reps: 5, done: true }] }] }]).totals.volume, 50);
  assert.equal(summarizeWatchData({ workouts: [{ start_time: '2026-11-01T08:00:00Z', watch_duration_sec: 1800, active_energy_kcal: 200, avg_heart_rate: 121, max_heart_rate: 145, sample_count: 30 }] }).sampleCount, 30);
});

test('AI response schema validation and deterministic fallback are safe', () => {
  assert.equal(validateAiInsight({ title: 'x', summary: 'y', recommendation: 'z', confidence: 'high' }).ok, true);
  assert.equal(validateAiInsight({ title: 'x', summary: 'y', recommendation: 'z', confidence: 'certain' }).ok, false);
  const fallback = makeDeterministicInsight({ focus: 'sleep', rulesResult: { summary: 'Sleep is fair', recommendation: 'Train steadily' }, sparse: true });
  assert.equal(fallback.deterministic, true);
  assert.equal(fallback.confidence, 'low');
});

test('AI cache reuses fresh insights and expires old entries', () => {
  const storage = memoryStorage();
  const insight = { title: 'Test', summary: 'Summary', evidence: [], recommendation: 'Keep going', limitations: [], confidence: 'medium', generatedAt: new Date().toISOString() };
  cacheInsight('key', insight, { storage, now: 1000, provider: 'groq', model: 'test' });
  assert.equal(getCachedInsight('key', { storage, now: 1001 }).provider, 'groq');
  assert.equal(getCachedInsight('key', { storage, now: 1001 + 8 * 24 * 60 * 60 * 1000 }), null);
});

test('AI client falls back cleanly on service failure and accepts valid responses', async () => {
  const storage = memoryStorage();
  const fallback = await requestAiExplanation({ dbClient: null, payload: { mode: 'metric_explanation' }, storage });
  assert.equal(fallback.status, 'fallback');
  const dbClient = { functions: { invoke: async () => ({ data: { ok: true, provider: 'groq', model: 'test', insight: {
    title: 'Good', summary: 'A summary', evidence: [], recommendation: 'Stay steady', limitations: [], confidence: 'high', generatedAt: new Date().toISOString(),
  } }, error: null }) } };
  const success = await requestAiExplanation({ dbClient, payload: { mode: 'metric_explanation', context: {}, rulesResult: {} }, storage });
  assert.equal(success.status, 'success');
  assert.equal(success.provider, 'groq');
  const cached = await requestAiExplanation({ dbClient: { functions: { invoke: async () => { throw new Error('should use cache'); } } }, payload: { mode: 'metric_explanation', context: {}, rulesResult: {} }, storage });
  assert.equal(cached.status, 'cached');
});

test('AI client preserves Edge Function status and response detail', async () => {
  const storage = memoryStorage();
  const response = {
    status: 503,
    clone: () => ({ json: async () => ({ code: 'AI_UNAVAILABLE', error: 'AI providers are temporarily unavailable.' }) }),
  };
  const result = await requestAiExplanation({
    dbClient: { functions: { invoke: async () => ({ data: null, error: { message: 'Edge Function returned a non-2xx status code', context: response } }) } },
    payload: { mode: 'weekly_review', context: {}, rulesResult: {} },
    storage,
  });
  assert.equal(result.status, 'fallback');
  assert.equal(result.providerStatus, 503);
  assert.match(result.error, /503/);
  assert.match(result.error, /temporarily unavailable/);
});

test('AI client identifies provider authentication failures without hiding deterministic fallback', async () => {
  const storage = memoryStorage();
  const result = await requestAiExplanation({
    dbClient: { functions: { invoke: async () => ({ data: { ok: false, error: 'AI provider rejected the request.', provider: 'groq', providerStatus: 401 }, error: null }) } },
    payload: { mode: 'weekly_review', context: {}, rulesResult: {} },
    storage,
  });
  assert.equal(result.status, 'fallback');
  assert.equal(result.providerStatus, 401);
  assert.match(result.error, /groq/);
  assert.match(result.error, /401/);
});

test('provider fallback policy retries transient failures, never auth errors', () => {
  assert.equal(isRetryableProviderStatus(429), true);
  assert.equal(isRetryableProviderStatus(503), true);
  assert.equal(isRetryableProviderStatus(401), false);
  assert.equal(shouldFallbackProviderError({ kind: 'timeout' }), true);
  assert.equal(shouldFallbackProviderError({ status: 400 }), false);
  assert.equal(shouldFallbackProviderError({ status: 401 }), false);
});
