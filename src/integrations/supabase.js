/** Pure Supabase response helpers. Network client wiring stays replaceable. */

function extractRows(data = []) {
  return Array.isArray(data) ? data : [];
}

function recordValue(row) {
  return row?.data && typeof row.data === 'object' ? row.data : row;
}

function recordKey(row) {
  const value = recordValue(row);
  return value?.id != null ? String(value.id) : `${value?.date || ''}:${value?.workout || ''}`;
}

function latestTimestamp(rows = []) {
  return rows.reduce((latest, row) => {
    const value = recordValue(row);
    const candidates = [row?.updated_at, row?.created_at, value?.updatedAt, value?.completedAt, value?.date];
    const times = candidates.map(candidate => candidate ? new Date(candidate).getTime() : NaN).filter(Number.isFinite);
    return Math.max(latest, times.length ? Math.max(...times) : 0);
  }, 0);
}

function compareSyncRecords(local = [], cloud = []) {
  const localRows = extractRows(local);
  const cloudRows = extractRows(cloud);
  if (!cloudRows.length) return 'local-only';
  if (!localRows.length) return 'cloud-only';
  const localKeys = new Set(localRows.map(recordKey));
  const cloudKeys = new Set(cloudRows.map(recordKey));
  const sameKeys = localKeys.size === cloudKeys.size && [...localKeys].every(key => cloudKeys.has(key));
  if (sameKeys) return 'same';
  if (cloudRows.length > localRows.length) return 'cloud-newer';
  if (cloudRows.length < localRows.length) return 'local-newer';
  const cloudTime = latestTimestamp(cloudRows);
  const localTime = latestTimestamp(localRows);
  if (cloudTime > localTime) return 'cloud-newer';
  if (localTime > cloudTime) return 'local-newer';
  return 'conflict';
}

function shouldRestoreCloud(local = [], cloud = []) {
  const decision = compareSyncRecords(local, cloud);
  return decision === 'cloud-only' || decision === 'cloud-newer';
}

function latestById(rows = []) {
  const result = new Map();
  rows.forEach(row => {
    if (row?.id != null) result.set(String(row.id), row);
  });
  return [...result.values()];
}

function syncSummary({ localCount = 0, cloudCount = 0, restored = false, error = null } = {}) {
  return { localCount, cloudCount, restored, error: error ? String(error) : null };
}

module.exports = { extractRows, shouldRestoreCloud, compareSyncRecords, latestById, syncSummary };
