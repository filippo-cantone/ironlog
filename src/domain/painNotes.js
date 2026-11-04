/**
 * Extract and summarise exercise discomfort notes for an explicit AI review.
 *
 * This is a triage aid, not a diagnostic engine. The local rules identify
 * repeated language and safety signals so the UI remains useful when AI is
 * disabled or unavailable.
 */

const MAX_NOTE_CHARS = 280;
const MAX_ENTRIES = 24;

const BODY_AREA_PATTERNS = [
  ['shoulder', /shoulder|rotator cuff|deltoid/i],
  ['neck', /neck|cervical/i],
  ['upper back', /upper back|between shoulder blades|thoracic/i],
  ['lower back', /lower back|low back|lumbar|disc|spine/i],
  ['hip', /hip|glute|groin/i],
  ['knee', /knee|patella/i],
  ['elbow', /elbow|tricep tendon|bicep tendon/i],
  ['wrist or hand', /wrist|hand|thumb|finger/i],
  ['ankle or foot', /ankle|foot|heel|calf/i],
  ['chest', /chest|breastbone|sternum/i],
  ['breathing or chest symptoms', /chest tightness|chest pressure|shortness of breath|breathless|difficulty breathing/i],
  ['radiating or nerve-like symptoms', /radiat|shooting|tingl|numb|pins and needles|new weakness|muscle weakness|weakness|loss of strength|loss of feeling/i],
];

const SAFETY_PATTERNS = [
  ['urgent chest or breathing symptom', /chest pain|chest pressure|chest tightness|difficulty breathing|severe breathlessness/i],
  ['neurological symptom', /new weakness|muscle weakness|weakness|loss of strength|numb|loss of feeling|pins and needles|radiat/i],
  ['bladder or bowel change', /bladder|bowel|incontinence|couldn.?t urinate|couldn.?t control/i],
  ['fainting or severe dizziness', /faint|passed out|dizzy|lightheaded/i],
];

const asNumber = value => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const cleanText = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE_CHARS);

function dateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
}

function exerciseName(exercise, allExercises) {
  return String(allExercises?.[exercise?.id]?.name || exercise?.name || exercise?.id || 'Exercise').slice(0, 90);
}

function completedSetStats(exercise) {
  const sets = (Array.isArray(exercise?.sets) ? exercise.sets : [])
    .filter(set => set?.done !== false && set?.done !== 0);
  const pains = sets.map(set => asNumber(set.pain)).filter(value => value != null);
  const rpes = sets.map(set => asNumber(set.rpe)).filter(value => value != null);
  return {
    maxPain: pains.length ? Math.max(...pains) : null,
    averageRpe: rpes.length ? Math.round((rpes.reduce((sum, value) => sum + value, 0) / rpes.length) * 10) / 10 : null,
  };
}

function labelsForText(text) {
  return BODY_AREA_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function safetySignalsForText(text) {
  return SAFETY_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function collectEntries(sessions, allExercises) {
  const rows = [];
  (Array.isArray(sessions) ? sessions : []).forEach(session => {
    (Array.isArray(session?.exercises) ? session.exercises : []).forEach(exercise => {
      const note = cleanText(exercise?.notes);
      const stats = completedSetStats(exercise);
      if (!note && (stats.maxPain == null || stats.maxPain < 1)) return;
      const text = note || `Pain score reached ${stats.maxPain}/10.`;
      rows.push({
        date: dateOnly(session.date || session.completedAt),
        workout: String(session.workout || '').slice(0, 40),
        exerciseId: String(exercise?.id || '').slice(0, 80),
        exercise: exerciseName(exercise, allExercises),
        text,
        pain: stats.maxPain,
        rpe: stats.averageRpe,
        areas: labelsForText(text),
        safetySignals: safetySignalsForText(text),
      });
    });
  });
  return rows.slice(-MAX_ENTRIES);
}

function buildPatterns(entries) {
  const groups = new Map();
  entries.forEach(entry => {
    entry.areas.forEach(area => {
      const current = groups.get(area) || { area, mentions: 0, dates: new Set(), exercises: new Set(), maxPain: null };
      current.mentions += 1;
      if (entry.date) current.dates.add(entry.date);
      current.exercises.add(entry.exercise);
      current.maxPain = Math.max(current.maxPain ?? 0, entry.pain ?? 0);
      groups.set(area, current);
    });
  });
  return [...groups.values()].map(group => ({
    area: group.area,
    mentions: group.mentions,
    dates: [...group.dates].slice(-8),
    exercises: [...group.exercises].slice(0, 8),
    maxPain: group.maxPain || null,
    repeated: group.dates.size >= 2 || group.mentions >= 2,
  })).sort((a, b) => Number(b.repeated) - Number(a.repeated) || b.mentions - a.mentions);
}

export function buildPainNoteReview({ currentSession, sessions = [], allExercises = {} } = {}) {
  const combined = [...(Array.isArray(sessions) ? sessions : [])];
  if (currentSession && !combined.some(session => session?.id && session.id === currentSession.id)) combined.push(currentSession);
  const entries = collectEntries(combined.filter(session => session?.completed), allExercises);
  const currentDate = dateOnly(currentSession?.date || currentSession?.completedAt);
  const currentEntries = entries.filter(entry => entry.date === currentDate);
  const currentSignals = currentEntries.flatMap(entry => entry.safetySignals);
  const safetySignals = [...new Set(entries.flatMap(entry => entry.safetySignals))];
  const patterns = buildPatterns(entries);
  const repeatedPatterns = patterns.filter(pattern => pattern.repeated);
  const painEntries = currentEntries.filter(entry => (entry.pain ?? 0) >= 2);
  const hasCurrentSignals = currentEntries.length > 0;
  const hasHistory = entries.length > currentEntries.length;
  let localRecommendation = 'No discomfort note or meaningful pain signal was recorded in this workout.';
  if (currentSignals.length) {
    localRecommendation = 'Stop the movement if the symptom is still present. Chest or breathing symptoms, new weakness or numbness, fainting, or bladder/bowel changes need urgent medical assessment rather than an AI interpretation.';
  } else if (repeatedPatterns.length || painEntries.length) {
    localRecommendation = 'Do not progress the affected movement yet. Keep the next exposure pain-free and arrange a physiotherapist or clinician review if the pattern returns, persists, or limits normal movement.';
  } else if (hasCurrentSignals) {
    localRecommendation = 'Use the note as a monitoring signal: repeat only a pain-free range and avoid increasing load until the movement feels consistently comfortable.';
  }
  return {
    schemaVersion: 'ironlog-symptom-review-v1',
    workout: String(currentSession?.workout || '').slice(0, 40),
    currentDate,
    noteCount: entries.filter(entry => entry.text && !entry.text.startsWith('Pain score reached')).length,
    entryCount: entries.length,
    currentEntryCount: currentEntries.length,
    hasCurrentSignals,
    hasHistory,
    safetySignals,
    repeatedPatterns,
    localRecommendation,
    observations: entries.map(entry => ({
      date: entry.date,
      workout: entry.workout,
      exercise: entry.exercise,
      text: entry.text,
      pain: entry.pain,
      rpe: entry.rpe,
      areas: entry.areas,
      current: entry.date === currentDate,
    })),
  };
}

export function hasPainReviewSignals(review) {
  return Boolean(review?.hasCurrentSignals || review?.repeatedPatterns?.length || review?.safetySignals?.length);
}

export function shouldPromptPainReview(review) {
  return Boolean(review?.hasCurrentSignals);
}

export function symptomReviewRules(review) {
  const repeated = review?.repeatedPatterns || [];
  const safety = review?.safetySignals || [];
  const title = safety.length ? 'Safety check for exercise symptoms' : repeated.length ? 'Repeated discomfort pattern' : 'Exercise note review';
  const summary = safety.length
    ? 'Some words in the workout notes describe symptoms that should be assessed by a health professional rather than diagnosed by IronLog.'
    : repeated.length
      ? `IronLog found repeated references involving ${repeated.slice(0, 3).map(pattern => pattern.area).join(', ')}.`
      : 'IronLog found a new exercise discomfort note or pain signal and will keep the interpretation cautious.';
  return {
    title,
    summary,
    recommendation: review?.localRecommendation || 'Use the note as context and do not let AI override pain or medical-safety rules.',
    evidence: [
      ...(review?.currentEntryCount ? [{ signal: 'Current workout', value: `${review.currentEntryCount} exercise signal${review.currentEntryCount === 1 ? '' : 's'}`, meaning: 'The current workout contains a note or logged pain score that needs context.' }] : []),
      ...repeated.slice(0, 4).map(pattern => ({ signal: pattern.area, value: `${pattern.mentions} mention${pattern.mentions === 1 ? '' : 's'}`, meaning: `Appears across ${pattern.exercises.join(', ')}${pattern.maxPain ? `; highest logged pain was ${pattern.maxPain}/10` : ''}.` })),
      ...(safety.length ? [{ signal: 'Safety language', value: safety.join(', '), meaning: 'These terms are not a diagnosis, but they warrant stopping and seeking appropriate medical advice if current.' }] : []),
    ],
  };
}

export default { buildPainNoteReview, hasPainReviewSignals, shouldPromptPainReview, symptomReviewRules };
