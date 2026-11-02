import React, { useState, useEffect, useRef, useCallback } from '../runtime.js';
import defaultTheme from '../ui/theme.js';

export default function ActiveWorkout({ sessions, activeSession, setActiveSession, onComplete, setView, selectedWorkout, setSelectedWorkout, allExercises = {}, workoutCustom = {}, workoutHidden = {}, onDemoOpen, onWarmupOpen, coachRec, showWhy, setShowWhy, recovery, watchData, helpers = {}, components = {}, data = {}, theme: themeProps = defaultTheme }) {
  const { C, st } = themeProps;
  const { EXERCISES = {}, WORKOUTS = {} } = data;
  const {
    buildSession, getIronWorkout, getLastLogged, findLastExerciseEntry, recommendExerciseProgression,
    detectPRs, checkOverloadNudges, fmtTimer, resetWarmupConfig,
  } = helpers;
  const {
    SetRow, WorkoutPlanCard, StretchRoutineCard, WarmupSetup, WarmupPicker, WarmupActive,
    ExerciseInsightModal, YouTubeModal, ExerciseIcon, MuscleDiagram,
  } = components;
  const nextWkt = selectedWorkout;
  const [session, setSession] = useState(activeSession || null);
  const [phase, setPhase] = useState(() => {
    const p = activeSession?.phase || (activeSession ? 'workout' : 'energy');
    // Backward compat: sessions stored before this feature used phase:'warmup'
    return p === 'warmup' ? 'warmup_setup' : p;
  });
  const [exIdx, setExIdx] = useState(() => {
    if (!activeSession?.exercises) return 0;
    const firstIncomplete = activeSession.exercises.findIndex(
      ex => ex.sets && ex.sets.some(s => !s.done)
    );
    return firstIncomplete >= 0 ? firstIncomplete : 0;
  });
  const [restSecs, setRestSecs] = useState(30);
  const [restActive, setRestActive] = useState(false);
  const [elapsed, setElapsed] = useState(
    session?.startTime ? Math.floor((Date.now() - session.startTime) / 1000) : 0
  );
  const [prs, setPRs] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [showAddEx, setShowAddEx] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const [showExerciseInsight, setShowExerciseInsight] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(null); // null = no picker; 0–7 = slot being edited
  const [workoutDemoModal, setWorkoutDemoModal] = useState(null); // { id, name } for in-app demo

  const elapsedRef = useRef(null);
  const restRef = useRef(null);

  useEffect(() => {
    const origin = session?.startTime || Date.now();
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - origin) / 1000));
    }, 1000);
    return () => clearInterval(elapsedRef.current);
  }, []);

  useEffect(() => {
    if (!restActive) { clearTimeout(restRef.current); return; }
    if (restSecs <= 0) { setRestActive(false); return; }
    restRef.current = setTimeout(() => setRestSecs(s => s - 1), 1000);
    return () => clearTimeout(restRef.current);
  }, [restActive, restSecs]);

  useEffect(() => { setShowDiagram(false); setShowExerciseInsight(false); }, [exIdx]);

  // Persist the current exercise explicitly so a reload resumes where the user was,
  // even when an earlier exercise still has an intentionally incomplete set.
  useEffect(() => {
    if (!session || session.currentExerciseIndex === exIdx) return;
    const updated = { ...session, currentExerciseIndex: exIdx };
    setSession(updated);
    setActiveSession(updated);
  }, [exIdx]);

  function startRest(s = 30) { setRestSecs(s); setRestActive(true); }
  function stopRest() { setRestActive(false); setRestSecs(30); }

  function stampExerciseStart(prev, eIdx, nowIso) {
    if (!prev?.exercises?.[eIdx]) return prev;
    return {
      ...prev,
      exercises: prev.exercises.map((ex, ei) => ei !== eIdx || ex.exerciseStartedAt ? ex : { ...ex, exerciseStartedAt: nowIso }),
    };
  }

  function withExerciseCompletion(prev, eIdx, nowIso) {
    const ex = prev?.exercises?.[eIdx];
    if (!ex) return prev;
    const allDone = (ex.sets || []).every(set => set.done || set.setCompletedAt);
    if (!allDone || ex.exerciseCompletedAt) return prev;
    return {
      ...prev,
      exercises: prev.exercises.map((item, ei) => ei !== eIdx ? item : { ...item, exerciseCompletedAt: nowIso }),
    };
  }

  function estimatedSetStartIso(set, def, completedAtMs) {
    const durationSec = Number(set?.duration) || Number(def?.defaultDuration) || 45;
    return new Date(completedAtMs - Math.max(20, Math.min(120, durationSec)) * 1000).toISOString();
  }

  function startSession(energy) {
    // If activeSession was pre-built by the pre-start screen (has exercises), preserve it.
    // Only add the energy level and advance to warmup — do not rebuild.
    const base = (activeSession?.exercises?.length > 0)
      ? activeSession
      : buildSession(nextWkt, sessions, allExercises, workoutCustom, workoutHidden);
    const isIron = base.workout?.startsWith('IRON_');
    const nextPhase = isIron ? 'workout' : 'warmup_setup';
    const s = { ...base, energy, phase: nextPhase };
    setSession(s);
    setActiveSession(s);
    setPhase(nextPhase);
  }

  function cancelSession() {
    setActiveSession(null);
    setConfirmCancel(false);
    setView('dashboard');
  }

  function updateSet(eIdx, sIdx, field, val) {
    setSession(prev => {
      const nowIso = new Date().toISOString();
      const started = stampExerciseStart(prev, eIdx, nowIso);
      const updated = {
        ...started,
        exercises: started.exercises.map((ex, ei) => ei !== eIdx ? ex : {
          ...ex,
          sets: ex.sets.map((s, si) => {
            if (si !== sIdx) return s;
            return { ...s, [field]: val };
          }),
        }),
      };
      setActiveSession(updated);
      return updated;
    });
  }

  function startSet(eIdx, sIdx) {
    setSession(prev => {
      const nowIso = new Date().toISOString();
      const started = stampExerciseStart(prev, eIdx, nowIso);
      const updated = {
        ...started,
        exercises: started.exercises.map((ex, ei) => ei !== eIdx ? ex : {
          ...ex,
          sets: ex.sets.map((set, si) => si !== sIdx ? set : {
            ...set,
            setStartedAt: set.setStartedAt || nowIso,
            setCompletedAt: null,
            done: false,
          }),
        }),
      };
      setActiveSession(updated);
      return updated;
    });
  }

  function doneSet(eIdx, sIdx) {
    setSession(prev => {
      const completedAtMs = Date.now();
      const nowIso = new Date(completedAtMs).toISOString();
      const ex = prev?.exercises?.[eIdx];
      const set = ex?.sets?.[sIdx];
      const exerciseDef = allExercises[ex?.id] || EXERCISES[ex?.id] || {};
      const fallbackStartIso = set?.setStartedAt || estimatedSetStartIso(set, exerciseDef, completedAtMs);
      const started = stampExerciseStart(prev, eIdx, fallbackStartIso);
      const marked = {
        ...started,
        exercises: started.exercises.map((ex, ei) => ei !== eIdx ? ex : {
          ...ex,
          sets: ex.sets.map((set, si) => si !== sIdx ? set : {
            ...set,
            setStartedAt: set.setStartedAt || fallbackStartIso,
            setCompletedAt: set.setCompletedAt || nowIso,
            done: true,
          }),
        }),
      };
      const completed = withExerciseCompletion(marked, eIdx, nowIso);
      setActiveSession(completed);
      return completed;
    });
    startRest(30);
  }

  function addSet(eIdx) {
    setSession(prev => {
      const ex = prev.exercises[eIdx];
      const last = ex.sets[ex.sets.length - 1];
      const newSet = { ...last, done: false, rpe: null, pain: null, setStartedAt: null, setCompletedAt: null };
      const updated = {
        ...prev,
        exercises: prev.exercises.map((e, i) => i !== eIdx ? e : { ...e, sets: [...e.sets, newSet] }),
      };
      setActiveSession(updated);
      return updated;
    });
  }

  function updateExNotes(eIdx, notes) {
    setSession(prev => {
      const updated = {
        ...prev,
        exercises: prev.exercises.map((e, i) => i !== eIdx ? e : { ...e, notes }),
      };
      setActiveSession(updated);
      return updated;
    });
  }

  function completeWorkout() {
    const nowIso = new Date().toISOString();
    const completed = {
      ...session,
      completed: true,
      completedAt: nowIso,
      duration: Math.round(elapsed / 60),
      exercises: (session.exercises || []).map(ex => {
        const allDone = (ex.sets || []).every(set => set.done);
        return allDone && !ex.exerciseCompletedAt ? { ...ex, exerciseCompletedAt: nowIso } : ex;
      }),
    };
    setPRs(detectPRs(completed, sessions, allExercises));
    setNudges(checkOverloadNudges(completed, allExercises));
    onComplete(completed);
    setPhase('done');
  }

  if (session && (!Array.isArray(session.exercises) || session.exercises.length === 0)) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <div style={{ fontFamily: C.fDisplay, fontSize: 18, color: C.amber, letterSpacing: 1, textAlign: 'center' }}>SESSION DATA CORRUPTED</div>
        <div style={{ fontFamily: C.fMono, fontSize: 13, color: C.muted, textAlign: 'center' }}>The active session could not be loaded. Your completed sessions are safe.</div>
        <button style={st.btn(C.red || '#e05c5c')} onClick={() => { setActiveSession(null); setSession(null); setPhase('energy'); }}>
          Clear Session &amp; Start Fresh
        </button>
      </div>
    );
  }

  // ── Energy ──────────────────────────────────────────────────────────
  if (phase === 'energy') {
    const workoutKey = session?.workout || activeSession?.workout || nextWkt;
    const isIron = workoutKey?.startsWith('IRON_');
    const ironDay = isIron ? parseInt(workoutKey.split('_')[1], 10) : null;
    const title = isIron ? getIronWorkout(ironDay).title : WORKOUTS[workoutKey].title;
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: C.fMono, padding: 0 }}>back to Home</button>
        </div>
        <div style={{ ...st.label, marginBottom: 4 }}>{isIron ? `Iron Series · Day ${ironDay}` : `Workout ${nextWkt}`}</div>
        <div style={{ fontFamily: C.fDisplay, fontSize: 26, textTransform: 'uppercase', marginBottom: 24 }}>{title}</div>
        {!isIron && (
          <>
            <WorkoutPlanCard
              sessions={sessions}
              activeSession={activeSession}
              selectedWorkout={selectedWorkout}
              setSelectedWorkout={setSelectedWorkout}
              allExercises={allExercises}
              workoutCustom={workoutCustom}
              workoutHidden={workoutHidden}
              coachRec={coachRec}
              showWhy={showWhy}
              setShowWhy={setShowWhy}
              setView={setView}
              onWarmupOpen={onWarmupOpen}
              onDemoOpen={onDemoOpen}
            />
            <StretchRoutineCard setView={setView} />
          </>
        )}
        <div style={{ ...st.card(), marginBottom: 16 }}>
          <div style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1, color: C.muted, marginBottom: 16 }}>Energy level today?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['😴','Low'],['😕','Tired'],['😐','OK'],['💪','Good'],['🔥','Great']].map(([emoji, label], i) => (
              <button key={i} onClick={() => startSession(i + 1)} style={{
                flex: 1, background: C.dim, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: '12px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span style={{ fontSize: 9, fontFamily: C.fMono, color: C.muted, textTransform: 'uppercase' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <button style={{ ...st.ghost }} onClick={() => startSession(3)}>Skip</button>
      </div>
    );
  }

  // ── Warmup setup ──────────────────────────────────────────────────
  if (phase === 'warmup_setup' && pickerSlot !== null) {
    return (
      <WarmupPicker
        workout={session?.workout || nextWkt}
        slotIndex={pickerSlot}
        onSelect={() => setPickerSlot(null)}
        onBack={() => setPickerSlot(null)}
      />
    );
  }

  if (phase === 'warmup_setup') {
    return (
      <WarmupSetup
        workout={session?.workout || nextWkt}
        onChangeSlot={i => setPickerSlot(i)}
        onBegin={() => {
          setPhase('warmup_active');
          setActiveSession(s => s ? { ...s, phase: 'warmup_active' } : s);
        }}
        onSkip={() => {
          setPhase('workout');
          setActiveSession(s => s ? { ...s, phase: 'workout' } : s);
        }}
        onReset={() => {
          resetWarmupConfig(session?.workout || nextWkt);
          setPickerSlot(null); // force re-render — WarmupSetup re-reads config on each render
        }}
      />
    );
  }

  // ── Warmup active ─────────────────────────────────────────────────
  if (phase === 'warmup_active') {
    return (
      <WarmupActive
        workout={session?.workout || nextWkt}
        onComplete={() => {
          setPhase('workout');
          setActiveSession(s => s ? { ...s, phase: 'workout' } : s);
        }}
      />
    );
  }

  // ── Workout ──────────────────────────────────────────────────────────
  if (phase === 'workout' && session) {
    const exId = session.exercises[exIdx]?.id;
    const def = allExercises[exId] || EXERCISES[exId] || {};
    const exData = session.exercises[exIdx];
    if (!exData) {
      return (
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <div style={{ fontFamily: C.fDisplay, fontSize: 18, color: C.amber, letterSpacing: 1, textAlign: 'center' }}>EXERCISE NOT FOUND</div>
          <div style={{ fontFamily: C.fMono, fontSize: 13, color: C.muted, textAlign: 'center' }}>Could not load exercise data. Try going back to the first exercise.</div>
          <button style={st.btn()} onClick={() => setExIdx(0)}>Go to First Exercise</button>
          <button style={st.ghost} onClick={() => { setActiveSession(null); setSession(null); setPhase('energy'); }}>Cancel Session</button>
        </div>
      );
    }

    const primaryMuscle = def.primaryMuscle || def.muscle;
    const secondaryMuscle = def.secondaryMuscle;
    const doneSetsCount = exData.sets.filter(s => s.done).length;
    const allExDone = exData.sets.every(s => s.done);
    const sessionExIds = new Set(session.exercises.map(e => e.id));
    const availableToAdd = Object.entries(allExercises).filter(([id, def]) => !sessionExIds.has(id) && !def.gymOnly);
    const previousEntry = findLastExerciseEntry(sessions, exId);
    const progression = recommendExerciseProgression(previousEntry, def, recovery, watchData);
    const effort = progression.effort;

    return (
      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...st.label, marginBottom: 3 }}>
              {session.workout} · {exIdx + 1} / {session.exercises.length} · {doneSetsCount}/{exData.sets.length} sets
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <ExerciseIcon id={exId} size={44} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: C.fDisplay, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2, color: C.text }}>{def.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {primaryMuscle && (
                    <span style={{ background: C.amberDim, color: C.amber, fontSize: 10, borderRadius: 20, padding: '2px 8px', fontFamily: C.fMono }}>
                      {primaryMuscle}
                    </span>
                  )}
                  {secondaryMuscle && (
                    <span style={{ background: C.dim, color: C.muted, fontSize: 10, borderRadius: 20, padding: '2px 8px', fontFamily: C.fMono }}>
                      {secondaryMuscle}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 80 }}>
            {restActive ? (
              <div>
                <div style={{ ...st.mono(9, C.muted) }}>REST</div>
                <div style={{ fontFamily: C.fMono, fontSize: 22, color: C.amber, lineHeight: 1 }}>{fmtTimer(restSecs)}</div>
                <button onClick={stopRest} style={{ ...st.btnSm(C.dim, C.muted), padding: '2px 6px', fontSize: 10, marginTop: 2 }}>Skip</button>
              </div>
            ) : (
              <div style={{ fontFamily: C.fMono, fontSize: 18, color: C.muted }}>{fmtTimer(elapsed)}</div>
            )}
            <button onClick={() => setConfirmCancel(true)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 10, fontFamily: C.fMono, marginTop: 6, padding: 0, textDecoration: 'underline', display: 'block' }}>Cancel</button>
          </div>
        </div>

        {/* Tags + cue */}
        <div style={{ ...st.row, flexWrap: 'wrap', marginBottom: 8, gap: 4 }}>
          {def.perSide && <span style={st.pill(C.blue)}>Per side</span>}
          {def.repMax && <span style={st.pill(C.purple)}>{def.repMax === def.defaultReps ? `${def.defaultReps} reps` : `${def.defaultReps}–${def.repMax} reps`}</span>}
        </div>
        <div style={{ ...st.card(), padding: '10px 12px', borderLeft: `2px solid ${C.amber}`, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: (def.demoId || def.demo) ? 10 : 0 }}>{def.cue}</div>
            {def.demoId ? (
              <button onClick={() => setWorkoutDemoModal({ id: def.demoId, name: def.name })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: C.dim, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '6px 12px', fontSize: 11, fontFamily: C.fMono,
                color: C.text, cursor: 'pointer', letterSpacing: 0.8, textTransform: 'uppercase',
              }}>
                <span style={{ color: C.red, fontSize: 13 }}>▶</span> Watch Demo
              </button>
            ) : def.demo ? (
              <a href={def.demo} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: C.dim, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '6px 12px', fontSize: 11, fontFamily: C.fMono,
                color: C.text, textDecoration: 'none', letterSpacing: 0.8, textTransform: 'uppercase',
              }}>
                <span style={{ color: C.red, fontSize: 13 }}>▶</span> Watch Demo
              </a>
            ) : null}
            {workoutDemoModal && (
              <YouTubeModal
                ytId={workoutDemoModal.id}
                title={workoutDemoModal.name}
                onClose={() => setWorkoutDemoModal(null)}
              />
            )}
          </div>
          <div onClick={() => onDemoOpen && onDemoOpen(exId)} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <ExerciseIcon id={exId} size={96} />
          </div>
        </div>

        {/* Muscle diagram (collapsible) */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setShowDiagram(v => !v)}
            style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}
          >
            <span style={{ ...st.label, fontSize: 9 }}>MUSCLES</span>
            {!showDiagram && primaryMuscle && (
              <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted }}>{primaryMuscle}</span>
            )}
            <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted, marginLeft: 'auto' }}>
              {showDiagram ? '▲ Hide' : '▼ Show'}
            </span>
          </button>
          {showDiagram && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <MuscleDiagram
                primary={def.primary || []}
                secondary={def.secondary || []}
                size="medium"
              />
            </div>
          )}
        </div>

        {/* Exercise effort recommendation */}
        <div style={{ ...st.card(progression.tone + '10'), borderLeft: `2px solid ${progression.tone}`, marginBottom: 14, padding: '10px 12px' }}>
          <div style={{ ...st.label, color: progression.tone, fontSize: 9, marginBottom: 5 }}>NEXT TIME</div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 16, color: C.text, lineHeight: 1.1, marginBottom: 4 }}>{progression.title}</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{progression.body}</div>
          {effort?.status === 'ok' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <span style={st.pill(progression.tone)}>{effort.label}</span>
              <span style={st.pill(C.muted)}>Avg {effort.avgHr} bpm</span>
              <span style={st.pill(C.muted)}>Peak {effort.maxHr} bpm</span>
              <span style={st.pill(C.muted)}>{effort.confidence} confidence</span>
            </div>
          )}
          {effort?.status !== 'ok' && previousEntry?.exercise && (
            <div style={{ ...st.mono(10, C.muted), marginTop: 7 }}>
              Watch effort will appear here after this exercise has timestamped sets and the matching Watch export is available.
            </div>
          )}
          <button onClick={() => setShowExerciseInsight(true)} style={{ ...st.ghost, marginTop: 10, padding: '8px 10px', fontSize: 11 }}>
            View insight
          </button>
        </div>

        {showExerciseInsight && (
          <ExerciseInsightModal
            exId={exId}
            def={def}
            sessions={sessions}
            recovery={recovery}
            watchData={watchData}
            onClose={() => setShowExerciseInsight(false)}
          />
        )}

        {/* Pull-up progress card */}
        {def.pullupTracking && (() => {
          const allSets = sessions.flatMap(s => (s.exercises || []).find(e => e.id === exId)?.sets || []);
          const unassistedSets = allSets.filter(s => s.done && (!s.mode || s.mode === 'bw') && Number(s.reps) > 0);
          const bestReps = unassistedSets.length > 0 ? Math.max(...unassistedSets.map(s => Number(s.reps))) : 0;
          const totalSessions = sessions.filter(s => (s.exercises || []).some(e => e.id === exId)).length;
          return (
            <div style={{ ...st.card(), padding: '10px 14px', borderLeft: `2px solid ${C.blue}`, marginBottom: 14 }}>
              <div style={{ ...st.label, fontSize: 9, color: C.blue, marginBottom: 6 }}>PULL-UP PROGRESS</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: C.fMono, fontSize: 22, color: bestReps > 0 ? C.green : C.muted, lineHeight: 1 }}>{bestReps}</div>
                  <div style={{ ...st.label, fontSize: 9, marginTop: 2 }}>best unassisted</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: C.fMono, fontSize: 22, color: C.muted, lineHeight: 1 }}>{totalSessions}</div>
                  <div style={{ ...st.label, fontSize: 9, marginTop: 2 }}>sessions logged</div>
                </div>
                <div style={{ flex: 1, fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                  {bestReps === 0
                    ? 'No unassisted reps yet — band assist or negatives to build strength.'
                    : bestReps < 3
                    ? 'Getting there — keep adding reps before dropping the band.'
                    : bestReps < 6
                    ? 'Good base — try adding one more rep each session.'
                    : '💪 Strong — work toward sets of 8+ unassisted.'}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Caution banner */}
        {def.caution && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: C.amber + '18', border: `1px solid ${C.amber}66`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, fontFamily: C.fMono }}>{def.caution}</div>
          </div>
        )}
        {/* Coach modification note (ephemeral — from coachRec props, not stored in session) */}
        {coachRec?.flags?.find(f => f.exerciseId === exId)?.modification && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: C.amber + '18', border: `1px solid ${C.amber}66`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>🤖</span>
            <div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, fontFamily: C.fMono }}>
              Coach: {coachRec.flags.find(f => f.exerciseId === exId).modification}
            </div>
          </div>
        )}

        {/* Previous session notes reminder */}
        {(() => {
          const lastNotes = getLastLogged(sessions, exId)?.notes;
          return lastNotes ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: C.dim, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.muted}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>📝</span>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, fontFamily: C.fMono }}>{lastNotes}</div>
            </div>
          ) : null;
        })()}

        {/* Sets */}
        <div style={{ ...st.col(6), marginBottom: 10 }}>
          {exData.sets.map((set, si) => (
            <SetRow key={si} num={si + 1} set={set} def={def}
              onUpdate={(f, v) => updateSet(exIdx, si, f, v)}
              onStart={() => startSet(exIdx, si)}
              nowMs={session.startTime ? session.startTime + elapsed * 1000 : Date.now()}
              onDone={() => doneSet(exIdx, si)} />
          ))}
        </div>

        {/* Add set */}
        <button style={{ ...st.ghost, marginBottom: 12, fontSize: 12 }} onClick={() => addSet(exIdx)}>+ Add Set</button>

        {/* Rest timer shortcuts */}
        <div style={{ ...st.row, justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          <span style={{ ...st.label, fontSize: 9 }}>Rest:</span>
          {[30, 60, 120].map(t => (
            <button key={t} onClick={() => startRest(t)} style={{ ...st.btnSm(C.dim, C.muted), fontSize: 11, padding: '6px 10px' }}>{t}s</button>
          ))}
        </div>

        {/* Overload nudge for this exercise */}
        {allExDone && def.repMax && def.unit === 'kg' &&
          def.repMax > (def.defaultReps || 0) &&
          exData.sets.filter(s => s.done).every(s => Number(s.reps) >= def.repMax) &&
          !exData.sets.filter(s => s.done).some(s => Number(s.pain) >= 3) &&
          (() => {
            const rpes = exData.sets.filter(s => s.done).map(s => Number(s.rpe)).filter(v => !isNaN(v) && v > 0);
            return rpes.length === 0 || rpes.reduce((a,b)=>a+b,0)/rpes.length <= 8;
          })() && (
          <div style={{ ...st.card(C.amber + '10'), borderColor: C.amber + '44', marginBottom: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: C.amber }}>
              ◈ All sets at top of rep range — consider adding load next session
            </div>
          </div>
        )}

        {/* Exercise notes */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...st.label, marginBottom: 5 }}>Exercise notes</div>
          <textarea
            value={exData.notes || ''}
            onChange={e => updateExNotes(exIdx, e.target.value)}
            placeholder="e.g. shoulder felt tight, went lighter than planned…"
            style={{
              ...st.inp, textAlign: 'left', padding: '10px 12px',
              minHeight: 64, resize: 'none', fontSize: 12,
              lineHeight: 1.5, fontFamily: C.fBody,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {exIdx > 0 && <button style={{ ...st.ghost, flex: '0 0 80px' }} onClick={() => setExIdx(i => i - 1)}>‹</button>}
          {exIdx < session.exercises.length - 1 ? (
            <button style={{ ...st.btn(), flex: 1 }} onClick={() => setExIdx(i => i + 1)}>Next ›</button>
          ) : (
            <button style={{ ...st.btn(C.green), flex: 1 }} onClick={() => {
              if (session.workout?.startsWith('IRON_')) {
                completeWorkout();
              } else {
                setPhase('finisher');
                setActiveSession(s => s ? { ...s, phase: 'finisher' } : s);
              }
            }}>
              {session.workout?.startsWith('IRON_') ? 'Complete Session ✓' : 'Finisher ›'}
            </button>
          )}
        </div>

        {/* Exercise list mini-nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 14, justifyContent: 'center' }}>
          {session.exercises.map((ex, i) => {
            const done = ex.sets.every(s => s.done);
            const isCustom = !EXERCISES[ex.id];
            return (
              <button key={ex.id + i} onClick={() => { setExIdx(i); setShowAddEx(false); }} style={{
                width: 28, height: 28, borderRadius: 14,
                background: done ? C.green + '22' : i === exIdx ? C.amber : C.dim,
                border: `1px solid ${done ? C.green + '44' : i === exIdx ? C.amber : isCustom ? C.amber + '44' : C.border}`,
                color: done ? C.green : i === exIdx ? '#fff' : C.muted,
                fontFamily: C.fMono, fontSize: 10, cursor: 'pointer',
              }}>{i + 1}</button>
            );
          })}
        </div>

        {/* Mid-session add exercise */}
        <div style={{ marginTop: 14 }}>
          <button style={{ ...st.ghost, fontSize: 12 }} onClick={() => setShowAddEx(!showAddEx)}>
            {showAddEx ? '✕ Cancel' : '＋ Add Exercise to Session'}
          </button>
          {showAddEx && (
            <div style={{ marginTop: 8 }}>
              <div style={{ ...st.label, marginBottom: 8 }}>Select exercise</div>
              <div style={{ ...st.col(4), maxHeight: 280, overflowY: 'auto' }}>
                {availableToAdd.length === 0
                  ? <div style={{ fontSize: 12, color: C.muted, padding: 12, textAlign: 'center' }}>All exercises already in this session.</div>
                  : availableToAdd.map(([id, ex]) => (
                    <button key={id} onClick={() => {
                      const def = allExercises[id];
                      const last = getLastLogged(sessions, id);
                      const numSets = def.defaultSets || 3;
                      const sets = Array.from({ length: numSets }, (_, i) => {
                        const ls = last?.sets?.[i] || last?.sets?.[0];
                        return { weight: ls?.weight ?? '', reps: ls?.reps ?? (def.defaultReps || ''), duration: ls?.duration ?? (def.defaultDuration || ''), rpe: null, pain: null, done: false };
                      });
                      setSession(prev => {
                        const updated = { ...prev, exercises: [...prev.exercises, { id, sets }] };
                        setActiveSession(updated);
                        return updated;
                      });
                      setExIdx(session.exercises.length);
                      setShowAddEx(false);
                    }} style={{
                      ...st.card(), width: '100%', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: ex.isCustom ? C.amber + '0a' : C.card,
                    }}>
                      <span style={{ fontSize: 13 }}>{ex.name}</span>
                      <span style={st.pill(ex.isCustom ? C.amber : C.muted)}>{ex.muscle}</span>
                    </button>
                  ))
                }
              </div>
            </div>
          )}
        </div>
        {confirmCancel && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
            <div style={{ ...st.card(), margin: 24, padding: 24, maxWidth: 320 }}>
              <div style={{ fontFamily: C.fDisplay, fontSize: 18, textTransform: 'uppercase', marginBottom: 8 }}>Cancel Session?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Progress will not be saved.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...st.btn(C.red), flex: 1 }} onClick={cancelSession}>Yes, Cancel</button>
                <button style={{ ...st.ghost, flex: 1 }} onClick={() => setConfirmCancel(false)}>Keep Going</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Finisher ─────────────────────────────────────────────────────────
  if (phase === 'finisher' && session) {
    const wkt = WORKOUTS[session.workout];
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={st.h2}>Finisher</div>
          <div style={{ ...st.mono(16, C.muted) }}>{fmtTimer(elapsed)}</div>
        </div>
        <div style={{ ...st.label, marginBottom: 16 }}>Cool-down · {session.workout}</div>
        <div style={{ ...st.col(), marginBottom: 20 }}>
          {wkt.finisher.map((item, i) => (
            <div key={i} style={{ ...st.card(), display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'center' }}>
              <img src={`assets/icons/warmup/${item.id}.png`} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'contain', background: '#EEF3FF', flexShrink: 0, cursor: 'pointer' }} onError={e => { e.target.style.display = 'none'; }} onClick={() => onWarmupOpen && onWarmupOpen(item)} />
              <div style={{ color: C.amber, fontFamily: C.fMono, minWidth: 18 }}>{i + 1}</div>
              <div style={{ fontSize: 13 }}>{item.text}</div>
            </div>
          ))}
        </div>
        <div style={{ ...st.label, marginBottom: 6 }}>Session notes (optional)</div>
        <textarea
          style={{ ...st.inp, textAlign: 'left', minHeight: 72, resize: 'vertical', marginBottom: 16, fontSize: 13, padding: 10 }}
          placeholder="How did it feel? Any niggles or things to note..."
          value={session.notes}
          onChange={e => {
            const notes = e.target.value;
            setSession(p => ({ ...p, notes }));
            setActiveSession(p => p ? { ...p, notes } : p);
          }}
        />
        <button style={{ ...st.btn(C.green) }} onClick={completeWorkout}>Complete Session ✓</button>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>💪</div>
        <div style={{ ...st.h1, marginBottom: 6 }}>Session Complete</div>
        <div style={{ ...st.label, marginBottom: 24 }}>Workout {session?.workout} · {session?.duration} min</div>

        {prs.length > 0 && (
          <div style={{ ...st.card(C.green + '10'), borderColor: C.green + '44', marginBottom: 16, textAlign: 'left' }}>
            <div style={{ ...st.label, color: C.green, marginBottom: 8 }}>🏆 New Personal Records</div>
            {prs.map((pr, i) => (
              <div key={i} style={{ fontSize: 13, color: C.green, fontFamily: C.fMono }}>{pr.name} — {pr.weight}kg</div>
            ))}
          </div>
        )}

        {nudges.length > 0 && (
          <div style={{ ...st.card(C.amber + '10'), borderColor: C.amber + '44', marginBottom: 16, textAlign: 'left' }}>
            <div style={{ ...st.label, color: C.amber, marginBottom: 8 }}>◈ Progressive Overload</div>
            {nudges.map((n, i) => (
              <div key={i} style={{ fontSize: 12, color: C.amber, marginBottom: 2 }}>{n} — ready to increase load</div>
            ))}
          </div>
        )}

        <button style={{ ...st.btn(), marginBottom: 8 }} onClick={() => setView('dashboard')}>Back to Home</button>
        <button style={{ ...st.ghost }} onClick={() => setView('progress')}>View Progress Charts</button>
      </div>
    );
  }

  return null;
}
