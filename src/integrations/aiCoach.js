const AI_CACHE_KEY = 'il_ai_insights';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CONFIDENCE = new Set(['high', 'medium', 'low']);
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const text = (value, fallback = '') => String(value == null ? fallback : value).trim();

export function hashRequest(value) {
  const stripVolatile = node => {
    if (Array.isArray(node)) return node.map(stripVolatile);
    if (!node || typeof node !== 'object') return node;
    return Object.fromEntries(Object.entries(node)
      .filter(([key]) => key !== 'generatedAt')
      .map(([key, child]) => [key, stripVolatile(child)]));
  };
  const input = typeof value === 'string' ? value : JSON.stringify(stripVolatile(value || {}));
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function validateAiInsight(value) {
  if (!value || typeof value !== 'object') return { ok: false, error: 'AI response was not an object.' };
  const confidence = text(value.confidence).toLowerCase();
  if (!text(value.title) || !text(value.summary) || !text(value.recommendation) || !CONFIDENCE.has(confidence)) {
    return { ok: false, error: 'AI response did not contain the required fields.' };
  }
  const evidence = Array.isArray(value.evidence) ? value.evidence : [];
  const limitations = Array.isArray(value.limitations)
    ? value.limitations
    : value.limitations ? [value.limitations] : [];
  return {
    ok: true,
    insight: {
      title: text(value.title).slice(0, 120),
      summary: text(value.summary).slice(0, 700),
      evidence: evidence.slice(0, 8).map(item => ({
        signal: text(item?.signal, 'Signal').slice(0, 80),
        value: text(item?.value, 'Not available').slice(0, 100),
        meaning: text(item?.meaning, '').slice(0, 240),
      })),
      recommendation: text(value.recommendation).slice(0, 700),
      limitations: limitations.map(item => text(item)).filter(Boolean).slice(0, 6),
      confidence,
      generatedAt: text(value.generatedAt, new Date().toISOString()),
    },
  };
}

export function isRetryableProviderStatus(status) {
  return RETRYABLE_STATUSES.has(Number(status));
}

export function shouldFallbackProviderError({ status, kind } = {}) {
  if (kind === 'timeout' || kind === 'network' || kind === 'invalid_output') return true;
  return isRetryableProviderStatus(status);
}

function readCache(storage) {
  try {
    return JSON.parse(storage?.getItem(AI_CACHE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

function writeCache(storage, cache) {
  try {
    storage?.setItem(AI_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Caching is optional and must never make the app fail.
  }
}

export function getCachedInsight(key, { storage = globalThis.localStorage, now = Date.now(), ttlMs = DEFAULT_TTL_MS } = {}) {
  const entry = readCache(storage)[key];
  if (!entry || !entry.createdAt || now - entry.createdAt > ttlMs) return null;
  const validated = validateAiInsight(entry.insight);
  return validated.ok ? { ...validated.insight, provider: entry.provider, model: entry.model, cached: true } : null;
}

export function cacheInsight(key, insight, { storage = globalThis.localStorage, now = Date.now(), provider, model } = {}) {
  const cache = readCache(storage);
  cache[key] = { createdAt: now, insight, provider: provider || null, model: model || null };
  writeCache(storage, cache);
}

export function makeDeterministicInsight({ focus = 'IronLog', rulesResult = {}, sparse = false } = {}) {
  const evidence = Array.isArray(rulesResult.evidence) ? rulesResult.evidence : [];
  const evidenceSummary = evidence.slice(0, 5)
    .map(item => `${text(item?.signal, 'Signal')}: ${text(item?.value, 'not available')} — ${text(item?.meaning)}`)
    .filter(Boolean)
    .join(' ');
  return {
    title: text(rulesResult.title, `${focus} insight`).slice(0, 120),
    summary: text(rulesResult.summary, 'IronLog could not generate an additional explanation right now.')
      .concat(evidenceSummary ? ` Evidence: ${evidenceSummary}` : '').slice(0, 700),
    evidence: evidence.slice(0, 8).map(item => ({
      signal: text(item?.signal, 'Signal'),
      value: text(item?.value, 'Available data'),
      meaning: text(item?.meaning),
    })),
    recommendation: text(rulesResult.recommendation, 'Follow the IronLog recommendation shown on screen.').slice(0, 700),
    limitations: [
      'This is IronLog’s deterministic analysis; AI explanation is unavailable or disabled.',
      ...(sparse ? ['Confidence is limited because the available history or Watch samples are sparse.'] : []),
    ],
    confidence: sparse ? 'low' : 'medium',
    generatedAt: new Date().toISOString(),
    deterministic: true,
  };
}

export function requestAiExplanation({ dbClient, payload, storage = globalThis.localStorage, now = Date.now(), cacheTtlMs = DEFAULT_TTL_MS } = {}) {
  const key = hashRequest(payload);
  const cached = getCachedInsight(key, { storage, now, ttlMs: cacheTtlMs });
  if (cached) return Promise.resolve({ status: 'cached', insight: cached, provider: cached.provider, model: cached.model });
  if (!dbClient?.functions?.invoke) return Promise.resolve({ status: 'fallback', error: 'AI service is not configured.' });
  return dbClient.functions.invoke('ironlog-ai-explain', { body: payload }).then(async ({ data, error }) => {
    if (error) {
      const response = error?.context;
      const providerStatus = Number(response?.status || error?.status) || null;
      let detail = '';
      try {
        if (response?.clone) {
          const body = await response.clone().json();
          detail = body?.error || body?.message || body?.code || '';
        }
      } catch (parseError) {
        // Supabase may expose a non-JSON response for gateway failures.
      }
      const statusText = providerStatus ? ` (${providerStatus})` : '';
      return { status: 'fallback', error: `AI service returned${statusText}: ${detail || error.message || 'unavailable.'}`, providerStatus };
    }
    if (!data?.ok) {
      const providerStatus = Number(data?.providerStatus || data?.status) || null;
      const provider = data?.provider ? ` from ${data.provider}` : '';
      const status = providerStatus ? ` (${providerStatus})` : '';
      return {
        status: 'fallback',
        error: `${data?.error || 'AI service unavailable.'}${provider}${status}`,
        providerStatus,
      };
    }
    const validated = validateAiInsight(data.insight);
    if (!validated.ok) return { status: 'fallback', error: validated.error };
    const insight = { ...validated.insight, provider: data.provider, model: data.model };
    cacheInsight(key, insight, { storage, now, provider: data.provider, model: data.model });
    return { status: 'success', insight, provider: data.provider, model: data.model };
  }).catch(error => ({ status: 'fallback', error: error?.message || 'AI service unavailable.' }));
}

export function readAiSetting({ storage = globalThis.localStorage } = {}) {
  let enabled = true;
  let consent = false;
  try {
    enabled = storage?.getItem('il_ai_enabled') !== 'false';
    consent = storage?.getItem('il_ai_consent') === 'v1';
  } catch (error) {}
  return { enabled, consent };
}

export function writeAiSetting({ enabled, consent, storage = globalThis.localStorage } = {}) {
  try {
    if (enabled != null) storage?.setItem('il_ai_enabled', String(Boolean(enabled)));
    if (consent != null) storage?.setItem('il_ai_consent', consent ? 'v1' : '');
  } catch (error) {}
}

export { AI_CACHE_KEY, DEFAULT_TTL_MS };

export default {
  requestAiExplanation,
  makeDeterministicInsight,
  readAiSetting,
  writeAiSetting,
};
