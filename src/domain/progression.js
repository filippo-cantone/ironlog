/** Progression rules. No React or storage dependencies. */

function detectPRs(newSession, previousSessions = [], allExercises = {}) {
  const prs = [];
  (newSession?.exercises || []).forEach(exercise => {
    const def = allExercises[exercise.id];
    if (!def || def.unit !== 'kg') return;
    const completedSets = (exercise.sets || []).filter(set => set.done);
    const newMax = Math.max(0, ...completedSets.map(set => Number(set.weight) || 0));
    if (!newMax) return;
    const previousMax = previousSessions.reduce((max, session) => {
      const previousExercise = session?.exercises?.find(item => item.id === exercise.id);
      const previousSets = previousExercise?.sets?.filter(set => set.done) || [];
      return Math.max(max, ...previousSets.map(set => Number(set.weight) || 0));
    }, 0);
    if (newMax > previousMax) prs.push({ name: def.name, weight: newMax });
  });
  return prs;
}

function checkOverloadNudges(session, allExercises = {}) {
  const nudges = [];
  (session?.exercises || []).forEach(exercise => {
    const def = allExercises[exercise.id];
    if (!def || !def.repMax || def.unit === 'bw' || def.unit === 'band') return;
    if (!def.defaultReps || def.repMax <= def.defaultReps) return;
    const doneSets = (exercise.sets || []).filter(set => set.done);
    if (!doneSets.length || !doneSets.every(set => Number(set.reps) >= def.repMax)) return;
    if (doneSets.some(set => Number(set.pain) >= 3)) return;
    const rpe = doneSets.map(set => Number(set.rpe)).filter(value => Number.isFinite(value) && value > 0);
    if (rpe.length && rpe.reduce((sum, value) => sum + value, 0) / rpe.length > 8) return;
    nudges.push(def.name);
  });
  return nudges;
}

module.exports = { detectPRs, checkOverloadNudges };
