import React from '../runtime.js';
import theme from '../ui/theme.js';

const { C, st } = theme;

export default function PreStartScreen({ selectedWorkout, coachRec, preStartSwaps, setPreStartSwaps, allExercises, sessions, workoutCustom = {}, workoutHidden = {}, setActiveSession, setView, workouts, buildSession, Icon }) {
  const workout = workouts[selectedWorkout];
  const extraIds = workoutCustom[selectedWorkout] || [];
  const hiddenIds = new Set(workoutHidden[selectedWorkout] || []);
  const exerciseCount = [...workout.exercises, ...extraIds].filter(id => !hiddenIds.has(id)).length;

  function handleStartSession() {
    const session = buildSession(selectedWorkout, sessions, allExercises, workoutCustom, workoutHidden, preStartSwaps);
    setActiveSession(session);
    setPreStartSwaps({});
    setView('workout');
  }

  function toggleSwap(flag) {
    setPreStartSwaps(previous => {
      if (previous[flag.exerciseId]) {
        const next = { ...previous };
        delete next[flag.exerciseId];
        return next;
      }
      return { ...previous, [flag.exerciseId]: flag.swapId };
    });
  }

  return (
    <div style={{ padding: '16px 16px 100px', minHeight: '100vh', background: C.bg }}>
      <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: C.fMono, padding: 0, marginBottom: 20, display: 'block' }}>← Back</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ fontSize: 52, fontFamily: C.fDisplay, fontWeight: 700, color: C.amber, lineHeight: 1, flexShrink: 0 }}>{selectedWorkout}</div>
        <div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 20, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{workout.title}</div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: C.fMono, marginTop: 3 }}>{exerciseCount} exercises</div>
        </div>
      </div>

      {coachRec.flags.length === 0 ? (
        <div style={{ ...st.card(), borderLeft: `3px solid ${C.green}`, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 18 }}>✓</span><div>
            <div style={{ fontFamily: C.fDisplay, fontSize: 14, textTransform: 'uppercase', color: C.green, letterSpacing: 1, marginBottom: 4 }}>All clear</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Good recovery since last session. No modifications needed.</div>
          </div></div>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...st.label, marginBottom: 10 }}>Today's adjustments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coachRec.flags.map(flag => {
              const isSwapped = !!preStartSwaps[flag.exerciseId];
              const swapDef = isSwapped ? allExercises[flag.swapId] : null;
              return <div key={flag.exerciseId} style={{ ...st.card(), borderLeft: `3px solid ${isSwapped ? C.blue : C.amber}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: C.fDisplay, textTransform: 'uppercase', marginBottom: 8 }}>{flag.exerciseName}</div>
                {isSwapped ? <div><div style={{ fontSize: 13, color: C.blue, marginBottom: 8 }}>⇄ Swapped → {swapDef?.name || flag.swap}</div><button onClick={() => toggleSwap(flag)} style={{ ...st.btnSm(C.dim, C.muted), fontSize: 11 }}>↩ Undo swap</button></div> :
                  <div><div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, marginBottom: flag.swapId ? 10 : 0 }}>⚠️ {flag.modification}</div>{flag.swapId && <button onClick={() => toggleSwap(flag)} style={{ ...st.btnSm(C.dim, C.muted), fontSize: 12 }}>⇄ Swap it out → {flag.swap}</button>}</div>}
              </div>;
            })}
          </div>
        </div>
      )}

      <button style={{ ...st.btn(), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }} onClick={handleStartSession}><Icon name="play" size={16} /> Start Session</button>
    </div>
  );
}
