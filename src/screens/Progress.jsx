import React, { useState } from '../runtime.js';
import theme from '../ui/theme.js';

const { C, st } = theme;

export default function Progress({ sessions, allExercises = {}, workouts = {}, formatDate, Chart }) {
  const workoutGroups = ['A', 'B', 'C'].map(key => {
    const workout = workouts[key] || { title: key, exercises: [] };
    const shortTitle = key === 'A' ? 'Push' : key === 'B' ? 'Pull' : 'Legs + Core';
    const ids = workout.exercises
      .filter(id => allExercises[id])
      .sort((a, b) => (allExercises[a]?.name || a).localeCompare(allExercises[b]?.name || b));
    return { key, label: `Workout ${key} — ${shortTitle}`, ids };
  });
  const workoutExIds = new Set(['A', 'B', 'C'].flatMap(key => (workouts[key]?.exercises || [])));
  const otherIds = Object.keys(allExercises)
    .filter(id => !workoutExIds.has(id))
    .sort((a, b) => (allExercises[a]?.name || a).localeCompare(allExercises[b]?.name || b));
  const firstId = workoutGroups[0]?.ids[0] || Object.keys(allExercises)[0];
  const [selEx, setSelEx] = useState(firstId);
  const def = allExercises[selEx];
  const data = (sessions || [])
    .filter(session => session.exercises?.some(exercise => exercise.id === selEx))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(session => {
      const exercise = session.exercises.find(item => item.id === selEx);
      if (!exercise) return null;
      const weights = exercise.sets.map(set => Number(set.weight) || 0);
      const reps = exercise.sets.map(set => Number(set.reps) || 0);
      const volume = exercise.sets.reduce((total, set) => total + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
      const maxRPE = Math.max(...exercise.sets.map(set => Number(set.rpe) || 0).filter(Boolean));
      return { date: formatDate(session.date), weight: def?.unit === 'kg' ? (Math.max(...weights) || null) : null, reps: Math.max(...reps) || null, volume: volume || null, rpe: maxRPE || null };
    }).filter(Boolean);

  if (!(sessions || []).length) return (
    <div style={{ padding: 16, textAlign: 'center', color: C.muted, paddingTop: 64 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>▲</div>
      <div style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase' }}>No data yet</div>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...st.h2, marginBottom: 16 }}>Progress</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ ...st.label, marginBottom: 6 }}>Exercise</div>
        <select value={selEx} onChange={event => setSelEx(event.target.value)} style={{ ...st.inp, textAlign: 'left', fontSize: 14, padding: '10px 12px' }}>
          {workoutGroups.map(({ key, label, ids }) => (
            <optgroup key={key} label={label}>{ids.map(id => <option key={id} value={id}>{allExercises[id]?.name || id}</option>)}</optgroup>
          ))}
          {otherIds.length > 0 && <optgroup label="Other">{otherIds.map(id => <option key={id} value={id}>{allExercises[id]?.name || id}</option>)}</optgroup>}
        </select>
      </div>
      {data.length < 2 ? (
        <div style={{ ...st.card(), textAlign: 'center', color: C.muted, padding: 32, fontSize: 13 }}>Need at least 2 sessions with this exercise to show a trend.</div>
      ) : (
        <div style={{ ...st.col(12) }}>
          {def?.unit === 'kg' && <div style={{ ...st.card() }}><div style={{ ...st.label, marginBottom: 8 }}>Top Set Weight (kg)</div><Chart data={data} dataKey="weight" color={C.amber} height={160} /></div>}
          {(def?.unit === 'bw' || def?.unit === 'band') && <div style={{ ...st.card() }}><div style={{ ...st.label, marginBottom: 8 }}>Top Set Reps</div><Chart data={data} dataKey="reps" color={C.green} height={160} /></div>}
          {def?.unit === 'kg' && data.some(item => item.volume) && <div style={{ ...st.card() }}><div style={{ ...st.label, marginBottom: 8 }}>Session Volume (kg total)</div><Chart data={data} dataKey="volume" color={C.blue} height={140} /></div>}
          {data.some(item => item.rpe) && <div style={{ ...st.card() }}><div style={{ ...st.label, marginBottom: 8 }}>Session RPE</div><Chart data={data} dataKey="rpe" color={C.purple} height={130} domain={[5, 10]} /></div>}
        </div>
      )}
    </div>
  );
}
