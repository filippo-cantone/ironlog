import React, { useState } from '../runtime.js';
import defaultTheme from '../ui/theme.js';

const MUSCLE_FILTERS = ['All','Push','Pull','Hinge','Legs','Quads','Hamstrings','Glutes','Shoulders','Arms','Core'];
const EMPTY_FORM = { name: '', muscle: 'Arms', unit: 'kg', defaultSets: 3, defaultReps: 10, repMax: 10, cue: '' };

export default function Manage({ customExercises, setCustomExercises, workoutCustom, setWorkoutCustom, workoutHidden, setWorkoutHidden, allExercises, driveSync, onDriveSave, onDriveLoad, onCloudSync, onDemoOpen, aiEnabled, setAiEnabled, aiConsent, onAiSettings, activityGoals, setActivityGoals, data = {}, components = {}, theme: themeProps = defaultTheme }) {
  const { C, st } = themeProps;
  const {
    EXERCISES = {}, PRESET_LIBRARY = {}, IRON_EXERCISES = {}, WORKOUTS = {}, STRETCH_LIBRARY = [],
  } = data;
  const { ExerciseIcon, MuscleDiagram, YouTubeModal, StretchDemoModal } = components;
  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [addWktPicker, setAddWktPicker] = useState(null); // exId being placed into a workout
  const [expandedLib, setExpandedLib] = useState(null);  // exId currently expanded in library
  const [libDemoModal, setLibDemoModal] = useState(null); // { id, name } for in-app demo
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [wktTab, setWktTab] = useState('A');
  const [addingTo, setAddingTo] = useState(null);
  const [wktSearch, setWktSearch] = useState('');
  const [librarySubTab, setLibrarySubTab]   = useState('exercises');
  const [expandedStretch, setExpandedStretch] = useState(null);
  const [libStretchModal, setLibStretchModal] = useState(null); // stretch object for demo modal
  const [strFilter, setStrFilter]            = useState('all'); // 'all' | 'sciatica' | 'crosslegged'

  // All exercises that can be browsed/added (workout exercises + presets + user-created custom)
  const libraryEntries = [
    ...Object.entries(EXERCISES),
    ...Object.entries(PRESET_LIBRARY),
    ...Object.entries(IRON_EXERCISES),
    ...Object.entries(customExercises),
  ];

  const allInAnyWorkout = new Set(
    ['A','B','C'].flatMap(k => [...WORKOUTS[k].exercises, ...(workoutCustom[k] || [])])
  );

  const filtered = libraryEntries.filter(([, ex]) => {
    const mMatch = muscle === 'All' || ex.muscle === muscle || ex.primaryMuscle === muscle;
    const sMatch = !search.trim() || ex.name.toLowerCase().includes(search.toLowerCase());
    return mMatch && sMatch;
  });

  function addToWorkout(wKey, exId) {
    setWorkoutCustom(prev => ({ ...prev, [wKey]: [...(prev[wKey] || []), exId] }));
    setAddWktPicker(null);
    setAddingTo(null);
  }

  function removeFromWorkout(wKey, exId) {
    setWorkoutCustom(prev => ({ ...prev, [wKey]: (prev[wKey] || []).filter(id => id !== exId) }));
  }

  function saveCustom() {
    if (!form.name.trim()) return;
    const id = 'custom_' + Date.now();
    setCustomExercises(prev => ({ ...prev, [id]: {
      name: form.name.trim(), muscle: form.muscle, unit: form.unit,
      defaultSets: Number(form.defaultSets) || 3,
      defaultReps: Number(form.defaultReps) || 10,
      repMax: Number(form.repMax) || Number(form.defaultReps) || 10,
      cue: form.cue.trim(), isCustom: true,
    }}));
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  function deleteCustom(id) {
    setCustomExercises(prev => { const n = { ...prev }; delete n[id]; return n; });
    setWorkoutCustom(prev => {
      const n = { ...prev };
      Object.keys(n).forEach(k => { n[k] = (n[k] || []).filter(eid => eid !== id); });
      return n;
    });
  }

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...st.h2, marginBottom: 16 }}>Manage</div>

      {/* Sub-tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
        {[['library','Library'],['workouts','Workouts'],['goals','Goals'],['backup','Backup']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? C.amber : C.dim, color: tab === id ? '#fff' : C.muted,
            border: 'none', padding: '11px', fontFamily: C.fDisplay, fontSize: 13, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Library tab ── */}
      {tab === 'library' && (
        <div>
          {/* Exercises / Stretches sub-tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['exercises','Exercises'],['stretches','Stretches']].map(([id, label]) => (
              <button key={id}
                onClick={() => { setLibrarySubTab(id); setExpandedStretch(null); setExpandedLib(null); }}
                style={{
                  background: librarySubTab === id ? C.amber : C.dim,
                  color: librarySubTab === id ? '#fff' : C.muted,
                  border: `1px solid ${librarySubTab === id ? C.amber : C.border}`,
                  borderRadius: 20, padding: '6px 16px', fontSize: 12, fontFamily: C.fDisplay,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                }}>{label}</button>
            ))}
          </div>

          {/* ── Exercises sub-tab ── */}
          {librarySubTab === 'exercises' && (
          <div>
          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...st.inp, textAlign: 'left', padding: '10px 12px', marginBottom: 10 }}
            placeholder="Search exercises…" />

          {/* Muscle filter pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
            {MUSCLE_FILTERS.map(m => (
              <button key={m} onClick={() => setMuscle(m)} style={{
                background: muscle === m ? C.amber : C.dim,
                color: muscle === m ? '#fff' : C.muted,
                border: `1px solid ${muscle === m ? C.amber : C.border}`,
                borderRadius: 20, padding: '5px 12px', fontSize: 11, fontFamily: C.fMono,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}>{m}</button>
            ))}
          </div>

          {/* Exercise cards */}
          <div style={{ ...st.col(8), marginBottom: 20 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 24, fontSize: 13 }}>No exercises match. Try creating a custom one below.</div>
            )}
            {filtered.map(([id, ex]) => {
              const inWorkouts = ['A','B','C'].filter(k =>
                [...WORKOUTS[k].exercises, ...(workoutCustom[k] || [])].includes(id)
              );
              const isAdding = addWktPicker === id;
              const isExpanded = expandedLib === id;
              return (
                <div key={id} style={{ ...st.card(), borderColor: ex.isCustom ? C.amber + '44' : C.border, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Card header — tappable to expand/collapse */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                    onClick={() => setExpandedLib(isExpanded ? null : id)}>
                    <ExerciseIcon id={id} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{ex.name}</span>
                        {ex.isCustom && <span style={{ ...st.pill(), fontSize: 9 }}>Custom</span>}
                        <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 11, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={st.pill(C.muted)}>{ex.primaryMuscle || ex.muscle}</span>
                        {ex.secondaryMuscle && <span style={{ ...st.pill('#e8f0ff'), color: '#5b8fdc', fontSize: 9 }}>{ex.secondaryMuscle}</span>}
                        <span style={{ ...st.mono(10, C.muted) }}>{ex.defaultSets} sets · {ex.isTimed ? `${ex.defaultDuration}s` : `${ex.defaultReps}${ex.repMax && ex.repMax !== ex.defaultReps ? '–' + ex.repMax : ''} reps`} · {ex.unit}</span>
                        {ex.perSide && <span style={st.pill(C.blue)}>Per side</span>}
                      </div>
                    </div>
                    {ex.isCustom && (
                      <button onClick={e => { e.stopPropagation(); deleteCustom(id); }} style={{ background: C.red + '18', border: `1px solid ${C.red}33`, borderRadius: 4, color: C.red, padding: '4px 8px', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>✕</button>
                    )}
                  </div>

                  {/* Expanded detail — muscle diagram + cue */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                        <div onClick={() => onDemoOpen && onDemoOpen(id)} style={{ cursor: 'pointer' }}>
                          <ExerciseIcon id={id} size={96} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                        <MuscleDiagram
                          primary={ex.primary || []}
                          secondary={ex.secondary || []}
                          size="medium"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: ex.cue ? 10 : 0 }}>
                        {(ex.primaryMuscle || ex.muscle) && (
                          <span style={{ background: C.amberDim, color: C.amber, fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                            ● {ex.primaryMuscle || ex.muscle}
                          </span>
                        )}
                        {ex.secondaryMuscle && (
                          <span style={{ background: '#e8f0ff', color: '#5b8fdc', fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                            ○ {ex.secondaryMuscle}
                          </span>
                        )}
                      </div>
                      {ex.cue && (
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 6, padding: '8px 0' }}>
                          {ex.cue}
                        </div>
                      )}
                      {ex.demoId ? (
                        <button onClick={() => setLibDemoModal({ id: ex.demoId, name: ex.name })}
                          style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: C.amber, cursor: 'pointer' }}>
                          ▶ Watch demo
                        </button>
                      ) : ex.demo ? (
                        <a href={ex.demo} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: C.amber, textDecoration: 'none' }}>
                          ▶ Watch demo
                        </a>
                      ) : null}
                    </div>
                  )}

                  {/* Already-in badges */}
                  {inWorkouts.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                      {inWorkouts.map(k => (
                        <span key={k} style={{ ...st.pill(C.green), fontSize: 9 }}>In Workout {k}</span>
                      ))}
                    </div>
                  )}

                  {/* Add to workout */}
                  {isAdding ? (
                    <div>
                      <div style={{ ...st.label, marginBottom: 6, fontSize: 9 }}>Add to which workout?</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['A','B','C'].map(k => {
                          const alreadyIn = [...WORKOUTS[k].exercises, ...(workoutCustom[k] || [])].includes(id);
                          return (
                            <button key={k} onClick={() => !alreadyIn && addToWorkout(k, id)} style={{
                              flex: 1, background: alreadyIn ? C.dim : C.amber, color: alreadyIn ? C.muted : '#fff',
                              border: 'none', borderRadius: 4, padding: '8px', fontFamily: C.fDisplay,
                              fontSize: 16, fontWeight: 700, cursor: alreadyIn ? 'default' : 'pointer',
                              opacity: alreadyIn ? 0.4 : 1,
                            }}>{k}</button>
                          );
                        })}
                        <button onClick={() => setAddWktPicker(null)} style={{ ...st.btnSm(C.dim, C.muted), flex: 1 }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setAddWktPicker(id)} style={{ ...st.btnSm(), fontSize: 12, flex: 1 }}>
                        ＋ Add to Workout
                      </button>
                      {ex.demoId ? (
                        <button onClick={() => setLibDemoModal({ id: ex.demoId, name: ex.name })} style={{
                          ...st.btnSm(C.dim, C.muted), fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                        }}>
                          <span style={{ color: C.red }}>▶</span> Demo
                        </button>
                      ) : ex.demo ? (
                        <a href={ex.demo} target="_blank" rel="noopener noreferrer" style={{
                          ...st.btnSm(C.dim, C.muted), fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ color: C.red }}>▶</span> Demo
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create custom */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <div style={{ ...st.label, marginBottom: 8 }}>Can't find what you need?</div>
            <button style={{ ...st.btn(showForm ? C.dim : C.surface, showForm ? C.muted : C.amber), border: `1px solid ${showForm ? C.border : C.amber}`, marginBottom: showForm ? 12 : 0 }}
              onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}>
              {showForm ? '✕ Cancel' : '＋ Create Custom Exercise'}
            </button>
            {showForm && (
              <div style={{ ...st.card(), borderColor: C.amber + '33' }}>
                <div style={{ ...st.col(12) }}>
                  <div>
                    <div style={{ ...st.label, marginBottom: 5 }}>Exercise Name *</div>
                    <input value={form.name} onChange={e => f('name', e.target.value)}
                      style={{ ...st.inp, textAlign: 'left', padding: '10px 12px' }} placeholder="e.g. Cable Lateral Raise" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ ...st.label, marginBottom: 5 }}>Muscle Group</div>
                      <select value={form.muscle} onChange={e => f('muscle', e.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 8px' }}>
                        {['Arms','Shoulders','Push','Pull','Hinge','Legs','Glutes','Core','Balance','Other'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ ...st.label, marginBottom: 5 }}>Load Type</div>
                      <select value={form.unit} onChange={e => f('unit', e.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 8px' }}>
                        <option value="kg">Weight (kg)</option>
                        <option value="bw">Bodyweight</option>
                        <option value="band">Band</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><div style={{ ...st.label, marginBottom: 5 }}>Sets</div><input type="number" inputMode="numeric" value={form.defaultSets} onChange={e => f('defaultSets', e.target.value)} style={{ ...st.inp }} /></div>
                    <div><div style={{ ...st.label, marginBottom: 5 }}>Start Reps</div><input type="number" inputMode="numeric" value={form.defaultReps} onChange={e => f('defaultReps', e.target.value)} style={{ ...st.inp }} /></div>
                    <div><div style={{ ...st.label, marginBottom: 5 }}>Top Reps</div><input type="number" inputMode="numeric" value={form.repMax} onChange={e => f('repMax', e.target.value)} style={{ ...st.inp }} /></div>
                  </div>
                  <div>
                    <div style={{ ...st.label, marginBottom: 5 }}>Form Cue (optional)</div>
                    <input value={form.cue} onChange={e => f('cue', e.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 12px' }} placeholder="e.g. Keep elbows high throughout" />
                  </div>
                  <button style={{ ...st.btn(), opacity: form.name.trim() ? 1 : 0.4 }} onClick={saveCustom}>Save Exercise</button>
                </div>
              </div>
            )}
          </div>
          </div>
          )}

          {/* ── Stretches sub-tab ── */}
          {librarySubTab === 'stretches' && (
            <div style={{ ...st.col(8) }}>
              {/* Filter toggle — All / Sciatica / Cross-legged */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button onClick={() => setStrFilter('all')}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: `1px solid ${strFilter === 'all' ? C.border : C.dim}`,
                    background: strFilter === 'all' ? C.dim : 'transparent',
                    color: strFilter === 'all' ? '#fff' : C.muted,
                    fontFamily: C.fDisplay, fontSize: 11, cursor: 'pointer' }}>
                  All
                </button>
                <button onClick={() => setStrFilter('sciatica')}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: `1px solid ${strFilter === 'sciatica' ? '#a78bfa' : C.dim}`,
                    background: strFilter === 'sciatica' ? '#2d1b4e' : 'transparent',
                    color: strFilter === 'sciatica' ? '#a78bfa' : C.muted,
                    fontFamily: C.fDisplay, fontSize: 11, cursor: 'pointer' }}>
                  ◈ Sciatica
                </button>
                <button onClick={() => setStrFilter('crosslegged')}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: `1px solid ${strFilter === 'crosslegged' ? '#34d399' : C.dim}`,
                    background: strFilter === 'crosslegged' ? '#0a2e1e' : 'transparent',
                    color: strFilter === 'crosslegged' ? '#34d399' : C.muted,
                    fontFamily: C.fDisplay, fontSize: 11, cursor: 'pointer' }}>
                  ⊕ Cross-legged
                </button>
              </div>

              {STRETCH_LIBRARY.filter(s =>
                strFilter === 'all' ||
                (strFilter === 'sciatica'     && s.sciatica)     ||
                (strFilter === 'crosslegged'  && s.cross_legged)
              ).map((s) => {
                const isExp    = expandedStretch === s.id;
                const imgDir   = s.imageDir || 'stretches';
                const holdLabel = s.suggestedSecs
                  ? (s.bilateral ? `${s.suggestedSecs}s each side` : `${s.suggestedSecs}s`)
                  : null;
                return (
                  <div key={s.id} style={{ ...st.card(), display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Collapsed header — tappable */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                      onClick={() => setExpandedStretch(isExp ? null : s.id)}>
                      <img
                        src={`assets/icons/${imgDir}/${s.id}.png`}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'contain', background: '#EEF3FF', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                        alt={s.name}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.name}</span>
                          <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 11, flexShrink: 0 }}>{isExp ? '▲' : '▼'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ ...st.mono(11, C.muted) }}>{s.targets}</span>
                          {s.sciatica     && <span style={{ background: '#2d1b4e', color: '#a78bfa', fontSize: 9, borderRadius: 20, padding: '2px 8px', fontFamily: C.fMono, fontWeight: 700 }}>Sciatica</span>}
                          {s.cross_legged && <span style={{ background: '#0a2e1e', color: '#34d399',  fontSize: 9, borderRadius: 20, padding: '2px 8px', fontFamily: C.fMono, fontWeight: 700 }}>Cross-legged</span>}
                          {s.bilateral   && <span style={{ ...st.pill(C.amber), fontSize: 9 }}>Both sides</span>}
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExp && (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                        {/* Image(s) — dual side-by-side for stretches with id2; tappable to animate */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 14 }}
                          onClick={() => setLibStretchModal(s)} title="Tap to animate">
                          {[s.id, s.id2].filter(Boolean).map(imgId => {
                            const sz = s.id2 ? 140 : 180;
                            return (
                              <img key={imgId}
                                src={`assets/icons/${imgDir}/${imgId}.png`}
                                style={{ width: sz, height: sz, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
                                onError={e => { e.target.style.opacity = 0.2; }}
                                alt={s.name}
                              />
                            );
                          })}
                        </div>
                        {/* Muscle diagram */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                          <MuscleDiagram primary={s.primary || []} secondary={s.secondary || []} size="medium" />
                        </div>
                        {/* Muscle pills */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                          {s.primary && s.primary[0] && (
                            <span style={{ background: C.amberDim, color: C.amber, fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                              ● {s.primary[0]}
                            </span>
                          )}
                          {s.secondary && s.secondary[0] && (
                            <span style={{ background: '#e8f0ff', color: '#5b8fdc', fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                              ○ {s.secondary[0]}
                            </span>
                          )}
                        </div>
                        {/* Hold time */}
                        {holdLabel && (
                          <div style={{ textAlign: 'center', fontSize: 11, color: C.amber, fontFamily: C.fMono, marginBottom: s.cue ? 8 : 0 }}>
                            ⏱ {holdLabel}
                          </div>
                        )}
                        {/* Caution banner */}
                        {s.caution && (
                          <div style={{ background: '#3a2800', border: `1px solid ${C.amber}`, borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontFamily: C.fMono, color: C.amber, fontWeight: 700, marginBottom: 2 }}>⚠ CAUTION</div>
                            <div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, fontFamily: C.fMono }}>{s.caution}</div>
                          </div>
                        )}
                        {/* Cue text */}
                        {s.cue && (
                          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, padding: '8px 0' }}>
                            {s.cue}
                          </div>
                        )}
                        {/* Watch demo */}
                        {s.demoId && (
                          <button onClick={() => setLibStretchModal({ ...s, _ytDemo: true })}
                            style={{ background: 'none', border: 'none', padding: '4px 0 0', fontSize: 12, color: C.amber, cursor: 'pointer', fontFamily: C.fBody, textAlign: 'left' }}>
                            ▶ Watch demo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Workouts tab ── */}
      {tab === 'workouts' && (
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
            Add or remove exercises from each workout. Tap Remove to hide a built-in exercise, Restore to bring it back.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 20 }}>
            {['A','B','C'].map(k => (
              <button key={k} onClick={() => { setWktTab(k); setAddingTo(null); setWktSearch(''); }} style={{
                background: wktTab === k ? C.amber : C.dim, color: wktTab === k ? '#fff' : C.muted,
                border: 'none', borderRadius: 5, padding: '8px', fontFamily: C.fDisplay, fontSize: 18, fontWeight: 700, cursor: 'pointer',
              }}>{k}</button>
            ))}
          </div>

          {(() => {
            const key = wktTab;
            const baseIds = WORKOUTS[key].exercises;
            const extraIds = workoutCustom[key] || [];
            const inWorkout = new Set([...baseIds, ...extraIds]);
            const available = [...Object.entries(PRESET_LIBRARY), ...Object.entries(customExercises)]
              .filter(([id]) => !inWorkout.has(id))
              .filter(([, ex]) => !wktSearch || ex.name.toLowerCase().includes(wktSearch.toLowerCase()));

            return (
              <div>
                <div style={{ ...st.label, marginBottom: 4 }}>Workout {key} · {WORKOUTS[key].title}</div>
                <div style={{ ...st.col(4), marginBottom: 14 }}>
                  {baseIds.map(id => {
                    const isHidden = (workoutHidden[key] || []).includes(id);
                    return (
                      <div key={id} style={{ ...st.card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', opacity: isHidden ? 0.45 : 1 }}>
                        <div>
                          <span style={{ fontSize: 13, textDecoration: isHidden ? 'line-through' : 'none' }}>{allExercises[id]?.name || id}</span>
                          <span style={{ ...st.mono(10, C.muted), marginLeft: 8 }}>{allExercises[id]?.muscle}</span>
                        </div>
                        {isHidden ? (
                          <button onClick={() => setWorkoutHidden(prev => ({ ...prev, [key]: (prev[key] || []).filter(eid => eid !== id) }))}
                            style={{ background: C.green + '18', border: '1px solid ' + C.green + '44', borderRadius: 4, color: C.green, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Restore</button>
                        ) : (
                          <button onClick={() => setWorkoutHidden(prev => ({ ...prev, [key]: [...(prev[key] || []), id] }))}
                            style={{ background: C.red + '18', border: '1px solid ' + C.red + '44', borderRadius: 4, color: C.red, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                        )}
                      </div>
                    );
                  })}
                  {extraIds.map(id => (
                    <div key={id} style={{ ...st.card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderColor: C.amber + '44' }}>
                      <div><span style={{ fontSize: 13 }}>{allExercises[id]?.name || id}</span><span style={{ ...st.mono(10, C.muted), marginLeft: 8 }}>{allExercises[id]?.muscle}</span></div>
                      <button onClick={() => removeFromWorkout(key, id)} style={{ background: C.red + '18', border: `1px solid ${C.red}44`, borderRadius: 4, color: C.red, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                </div>

                {addingTo === key ? (
                  <div>
                    <input value={wktSearch} onChange={e => setWktSearch(e.target.value)}
                      style={{ ...st.inp, textAlign: 'left', padding: '10px 12px', marginBottom: 10 }}
                      placeholder="Search exercises…" autoFocus />
                    <div style={{ ...st.col(4), maxHeight: 340, overflowY: 'auto', marginBottom: 8 }}>
                      {available.length === 0
                        ? <div style={{ fontSize: 12, color: C.muted, padding: 16, textAlign: 'center' }}>{wktSearch ? 'No matches.' : 'All exercises already in this workout.'}</div>
                        : available.map(([id, ex]) => (
                          <button key={id} onClick={() => addToWorkout(key, id)} style={{
                            ...st.card(), width: '100%', textAlign: 'left', cursor: 'pointer',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', background: ex.isCustom ? C.amber + '0a' : C.card,
                          }}>
                            <div>
                              <div style={{ fontSize: 13 }}>{ex.name}</div>
                              <div style={{ ...st.mono(10, C.muted) }}>{ex.defaultSets}×{ex.isTimed ? ex.defaultDuration + 's' : ex.defaultReps + ' reps'} · {ex.unit}</div>
                            </div>
                            <span style={st.pill(ex.isCustom ? C.amber : C.muted)}>{ex.muscle}</span>
                          </button>
                        ))
                      }
                    </div>
                    <button style={{ ...st.ghost }} onClick={() => { setAddingTo(null); setWktSearch(''); }}>Cancel</button>
                  </div>
                ) : (
                  <button style={{ ...st.btn() }} onClick={() => setAddingTo(key)}>＋ Add Exercise to Workout {key}</button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Backup tab ── */}
      {tab === 'goals' && (
        <div>
          <div style={{ ...st.card(C.blue + '08'), borderColor: C.blue + '33', marginBottom: 16 }}>
            <div style={{ ...st.label, color: C.blue, marginBottom: 8 }}>Activity targets</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
              These targets describe activity volume. They do not override HRV readiness, pain safeguards, or medical constraints.
            </div>
          </div>
          <div style={{ ...st.card(), marginBottom: 16 }}>
            {[
              ['weeklyHeartPoints', 'Weekly heart points', '150', 'Moderate minutes count as 1; vigorous minutes count as 2.'],
              ['weeklyStrengthSessions', 'Strength sessions per week', '3', 'Completed IronLog strength sessions.'],
              ['dailySteps', 'Daily steps', '8000', 'Used for the weekly step progress view.'],
              ['weeklyCyclingMinutes', 'Cycling minutes per week', '', 'Leave blank to keep this goal disabled.'],
              ['weeklyActiveCalories', 'Active calories per week', '', 'Optional context goal; not a weight-loss prescription.'],
              ['maxHeartRate', 'Personal maximum heart rate', '', 'Optional. Needed when Watch intensity metadata is unavailable and IronLog estimates points from HR samples.'],
            ].map(([key, label, placeholder, help]) => (
              <label key={key} style={{ display: 'block', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.text }}>{label}</span>
                  <input type="number" min="0" inputMode="numeric" value={activityGoals?.[key] ?? ''} placeholder={placeholder}
                    onChange={e => { const value = e.target.value === '' ? null : Math.max(0, Number(e.target.value)); setActivityGoals?.(prev => ({ ...prev, [key]: Number.isFinite(value) ? value : null })); }}
                    style={{ ...st.inp, width: 100, textAlign: 'right', padding: '7px 8px' }} />
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 1.35 }}>{help}</div>
              </label>
            ))}
            <button onClick={() => setActivityGoals?.({ weeklyHeartPoints: 150, weeklyStrengthSessions: 3, weeklyCyclingMinutes: null, dailySteps: 8000, weeklyActiveCalories: null, maxHeartRate: null })} style={{ ...st.ghost, width: '100%', marginTop: 4 }}>Reset activity goals</button>
          </div>
        </div>
      )}

      {/* ── Backup tab ── */}
      {tab === 'backup' && (
        <div>
          <div style={{ ...st.card(C.blue + '08'), borderColor: C.blue + '33', marginBottom: 16 }}>
            <div style={{ ...st.label, color: C.blue, marginBottom: 8 }}>AI explanations</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, fontSize: 13, color: C.text }}>Explain readiness, sleep, health trends, and workout effort</div>
              <button onClick={() => { const next = !aiEnabled; setAiEnabled?.(next); onAiSettings?.({ enabled: next }); }} style={{
                border: `1px solid ${aiEnabled ? C.green : C.border}`, background: aiEnabled ? C.green + '14' : C.dim,
                color: aiEnabled ? C.green : C.muted, borderRadius: 999, padding: '6px 10px', fontFamily: C.fMono, fontSize: 10, cursor: 'pointer',
              }}>{aiEnabled ? 'On' : 'Off'}</button>
            </div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>
              {aiConsent ? 'Consent granted. Only summarised health and workout data is sent; raw exports and ECG data stay out of the AI request.' : 'AI is optional. You will be asked before the first explanation is requested.'}
            </div>
          </div>
          <div style={{ ...st.card(), marginBottom: 16 }}>
            <div style={{ ...st.label, marginBottom: 10 }}>Cloud Sync</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: driveSync?.cloudStatus === 'ok' ? C.green : driveSync?.cloudStatus === 'error' ? C.red : C.muted, fontFamily: C.fMono }}>
                {driveSync?.cloudStatus === 'ok' && `☁ Synced ${driveSync.lastCloudSync ? new Date(driveSync.lastCloudSync).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : ''}`}
                {driveSync?.cloudStatus === 'error' && '☁ Sync failed'}
                {driveSync?.cloudStatus === 'syncing' && '☁ Syncing…'}
                {(!driveSync?.cloudStatus || driveSync.cloudStatus === 'idle') && '☁ Supabase auto-sync on'}
              </span>
              <button onClick={onCloudSync} style={{ ...st.btnSm(C.dim, C.muted), fontSize: 11, marginLeft: 'auto' }}>
                Sync now
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
              Sessions and rides are backed up automatically. Use JSON backup only for manual archives or emergency restore.
            </div>
          </div>

          <div style={{ ...st.card(), marginBottom: 16 }}>
            <div style={{ ...st.label, marginBottom: 10 }}>JSON Backup & Restore</div>
            {driveSync?.status === 'error' && (
              <div style={{ fontSize: 12, color: C.red, marginBottom: 10, fontFamily: C.fMono }}>⚠ {driveSync.error}</div>
            )}
            {driveSync?.status === 'done' && driveSync.lastSync && (
              <div style={{ fontSize: 11, color: C.green, marginBottom: 10, fontFamily: C.fMono }}>
                ✓ Exported {new Date(driveSync.lastSync).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={onDriveSave} style={{ ...st.btn() }}>
                ↓ Export JSON
              </button>
              <label style={{ ...st.btn(C.dim, C.muted), textAlign: 'center', cursor: 'pointer', border: `1px solid ${C.border}` }}>
                ↑ Import JSON
                <input type="file" accept=".json" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) onDriveLoad(e.target.files[0]); e.target.value = ''; }} />
              </label>
            </div>
          </div>

          <button
            onClick={() => window.location.reload(true)}
            style={{ ...st.btn(C.dim, C.muted), width: '100%', fontSize: 12 }}
          >
            ↺ Check for updates
          </button>
        </div>
      )}
      {libDemoModal && (
        <YouTubeModal
          ytId={libDemoModal.id}
          title={libDemoModal.name}
          onClose={() => setLibDemoModal(null)}
        />
      )}
      {libStretchModal && !libStretchModal._ytDemo && (
        <StretchDemoModal stretch={libStretchModal} onClose={() => setLibStretchModal(null)} />
      )}
      {libStretchModal?.demoId && libStretchModal._ytDemo && (
        <YouTubeModal ytId={libStretchModal.demoId} title={libStretchModal.name} onClose={() => setLibStretchModal(null)} />
      )}
    </div>
  );
}

