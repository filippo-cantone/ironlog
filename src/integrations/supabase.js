/** Pure Supabase response helpers. Network client wiring stays replaceable. */

function extractRows(data = []) {
  return Array.isArray(data) ? data : [];
}

function shouldRestoreCloud(local = [], cloud = []) {
  return Array.isArray(cloud) && cloud.length > local.length;
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

module.exports = { extractRows, shouldRestoreCloud, latestById, syncSummary };
