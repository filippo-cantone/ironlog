/** Validated localStorage access. Browser APIs are injected for testability. */

const BACKUP_SCHEMA_VERSION = 3;

function safeParse(raw, fallback = null) {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function loadValue(key, fallback = null, storage = globalThis.localStorage) {
  try { return safeParse(storage?.getItem(key), fallback); } catch { return fallback; }
}

function saveValue(key, value, storage = globalThis.localStorage) {
  try { storage?.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

function loadArray(key, storage = globalThis.localStorage) {
  const value = loadValue(key, [], storage);
  return Array.isArray(value) ? value : [];
}

function loadObject(key, fallback = {}, storage = globalThis.localStorage) {
  const value = loadValue(key, fallback, storage);
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid backup: expected an object.');
  if (data.version !== undefined && (!Number.isInteger(data.version) || data.version < 1 || data.version > BACKUP_SCHEMA_VERSION)) {
    throw new Error(`Invalid backup: unsupported version ${data.version}.`);
  }
  if (data.sessions !== undefined && !Array.isArray(data.sessions)) throw new Error('Invalid backup: sessions must be an array.');
  if (data.rides !== undefined && !Array.isArray(data.rides)) throw new Error('Invalid backup: rides must be an array.');
  if (data.customExercises !== undefined && (!data.customExercises || typeof data.customExercises !== 'object' || Array.isArray(data.customExercises))) {
    throw new Error('Invalid backup: customExercises must be an object.');
  }
  if (data.activityGoals !== undefined && (!data.activityGoals || typeof data.activityGoals !== 'object' || Array.isArray(data.activityGoals))) {
    throw new Error('Invalid backup: activityGoals must be an object.');
  }
  if (data.healthData !== undefined && (!data.healthData || typeof data.healthData !== 'object' || Array.isArray(data.healthData))) {
    throw new Error('Invalid backup: healthData must be an object.');
  }
  for (const key of ['workoutCustom', 'workoutHidden']) {
    if (data[key] !== undefined && (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key]))) {
      throw new Error(`Invalid backup: ${key} must be an object.`);
    }
  }
  if (data.sessions?.some(session => !session || typeof session !== 'object' || Array.isArray(session))) {
    throw new Error('Invalid backup: each session must be an object.');
  }
  return { ...data, schemaVersion: BACKUP_SCHEMA_VERSION };
}

module.exports = { BACKUP_SCHEMA_VERSION, safeParse, loadValue, saveValue, loadArray, loadObject, validateBackup };
