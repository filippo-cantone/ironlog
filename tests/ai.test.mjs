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
    recovery: { score: 64, label: 'Good', z: 0.9 },
    coachRec: { label: 'Train steady', detail: 'Keep effort controlled', flags: ['watch'] },
    allExercises: { bb_flat_bench: { name: 'Bench Press' } },
    focus: 'weekly review',
  });
  assert.equal(context.schemaVersion, 'ironlog-ai-context-v1');
  assert.equal(context.training.count, 1);
  assert.equal(context.training.recent[0].exercises[0].name, 'Bench Press');
  assert.equal(context.watch.recent[0].sampleCount, 1);
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

test('provider fallback policy retries transient failures, never auth errors', () => {
  assert.equal(isRetryableProviderStatus(429), true);
  assert.equal(isRetryableProviderStatus(503), true);
  assert.equal(isRetryableProviderStatus(401), false);
  assert.equal(shouldFallbackProviderError({ kind: 'timeout' }), true);
  assert.equal(shouldFallbackProviderError({ status: 400 }), false);
  assert.equal(shouldFallbackProviderError({ status: 401 }), false);
});
