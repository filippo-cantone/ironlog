/** Browser backup helpers. Data validation remains in localStore.js. */

function createBackup(data = {}, now = new Date()) {
  return {
    version: 2,
    exportedAt: now.toISOString(),
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    rides: Array.isArray(data.rides) ? data.rides : [],
    customExercises: data.customExercises || {},
    workoutCustom: data.workoutCustom || {},
  };
}

function downloadBackup(data, { documentRef = globalThis.document, urlRef = globalThis.URL, now = new Date() } = {}) {
  const payload = JSON.stringify(createBackup(data, now), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = urlRef.createObjectURL(blob);
  const anchor = documentRef.createElement('a');
  anchor.href = url;
  anchor.download = `IronLog-backup-${now.toISOString().slice(0, 10)}.json`;
  anchor.click();
  urlRef.revokeObjectURL(url);
}

function readBackup(file, FileReaderCtor = globalThis.FileReader) {
  return new Promise((resolve, reject) => {
    if (!file || !FileReaderCtor) return reject(new Error('No backup file was provided.'));
    const reader = new FileReaderCtor();
    reader.onload = event => {
      try { resolve(JSON.parse(event.target.result)); }
      catch { reject(new Error('File is not valid JSON.')); }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}

module.exports = { createBackup, downloadBackup, readBackup };
