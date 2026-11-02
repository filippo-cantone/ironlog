import React, { useState } from '../runtime.js';
import theme from '../ui/theme.js';

const { C, st } = theme;

// HISTORY
// ═══════════════════════════════════════════════════════════════════════
function WatchEffortTimeline({ review, selectedExercise, onSelectExercise, deps }) {
  const samples = review?.hrSamples || [];
  const window = review?.window;
  if (!window || samples.length < 2) return null;
  const W = 360, H = 132, p = { top: 18, right: 12, bottom: 22, left: 34 };
  const innerW = W - p.left - p.right;
  const innerH = H - p.top - p.bottom;
  const hrs = samples.map(s => s.hr).filter(Number.isFinite);
  const min = Math.max(50, Math.floor((Math.min(...hrs) - 8) / 5) * 5);
  const max = Math.ceil((Math.max(...hrs) + 8) / 5) * 5;
  const span = max === min ? 1 : max - min;
  const xOf = t => p.left + ((t - window.start) / Math.max(1, window.end - window.start)) * innerW;
  const yOf = hr => p.top + innerH - ((hr - min) / span) * innerH;
  const points = samples
    .filter(s => Number.isFinite(s.hr) && Number.isFinite(s.t))
    .map(s => ({ x: xOf(s.t), y: yOf(s.hr), hr: s.hr, t: s.t }));
  const path = deps.smoothLinePath(points, 0.85);
  const ticks = [min, Math.round((min + max) / 2), max];
  const startLabel = new Date(window.start).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const endLabel = new Date(window.end).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const selected = selectedExercise != null ? review.exerciseStats[selectedExercise] : null;
  const selectedBand = selected?.window ? {
    x1: Math.max(p.left, Math.min(W - p.right, xOf(selected.window.start))),
    x2: Math.max(p.left, Math.min(W - p.right, xOf(selected.window.end))),
  } : null;
  const labelX = selectedBand ? Math.max(80, Math.min(W - 92, (selectedBand.x1 + selectedBand.x2) / 2)) : 0;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 8px 6px', marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', margin: '0 0 4px 4px' }}>
        <div style={{ ...st.label, fontSize: 9 }}>Heart rate timeline</div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fMono }}>Tap bands</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={p.left} x2={W - p.right} y1={yOf(t)} y2={yOf(t)} stroke={C.border} strokeDasharray="4 5" />
            <text x={p.left - 6} y={yOf(t) + 3} textAnchor="end" fill={C.muted} fontSize="9" fontFamily={C.fMono}>{t}</text>
          </g>
        ))}
        {review.exerciseStats.map((ex, i) => {
          if (!ex.window) return null;
          const x1 = Math.max(p.left, Math.min(W - p.right, xOf(ex.window.start)));
          const x2 = Math.max(p.left, Math.min(W - p.right, xOf(ex.window.end)));
          const color = i % 2 ? C.blue : C.green;
          return (
            <g key={ex.name + i} onClick={() => onSelectExercise?.(i)} style={{ cursor: 'pointer', pointerEvents: 'all' }}>
              <rect x={x1} y={p.top} width={Math.max(2, x2 - x1)} height={innerH}
                fill={color} opacity={selectedExercise === i ? '0.18' : '0.07'} rx="3" />
              <rect x={Math.max(p.left, x1 - 6)} y={p.top - 4} width={Math.max(14, x2 - x1 + 12)} height={innerH + 8}
                fill="rgba(255,255,255,0.001)" rx="5" style={{ pointerEvents: 'all' }}>
                <title>{ex.name} · {ex.avgHr ? `Avg ${ex.avgHr} bpm` : 'No HR sample'}</title>
              </rect>
            </g>
          );
        })}
        <path d={path} fill="none" stroke={C.blue} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.18" />
        <path d={path} fill="none" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((pt, i) => i % Math.max(1, Math.floor(points.length / 8)) === 0 || i === points.length - 1 ? (
          <circle key={i} cx={pt.x} cy={pt.y} r="3.2" fill={pt.hr >= 145 ? C.red : pt.hr >= 130 ? C.amber : C.green} stroke={C.card} strokeWidth="1.5" />
        ) : null)}
        <text x={p.left} y={H - 5} textAnchor="start" fill={C.muted} fontSize="9" fontFamily={C.fMono}>{startLabel}</text>
        <text x={W - p.right} y={H - 5} textAnchor="end" fill={C.muted} fontSize="9" fontFamily={C.fMono}>{endLabel}</text>
        <text x={p.left} y={11} fill={C.muted} fontSize="9" fontFamily={C.fMono}>bpm</text>
        {selected && selectedBand && (
          <g>
            <line x1={(selectedBand.x1 + selectedBand.x2) / 2} x2={(selectedBand.x1 + selectedBand.x2) / 2}
              y1={p.top} y2={H - p.bottom} stroke={selected.effort.color} strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x={labelX - 78} y={p.top + 4} width="156" height="28" rx="7"
              fill={C.card} stroke={selected.effort.color} strokeWidth="1.2" />
            <text x={labelX} y={p.top + 16} textAnchor="middle" fill={C.text} fontSize="9" fontFamily={C.fMono} fontWeight="700">
              {selected.name.length > 22 ? `${selected.name.slice(0, 20)}…` : selected.name}
            </text>
            <text x={labelX} y={p.top + 27} textAnchor="middle" fill={C.muted} fontSize="8" fontFamily={C.fMono}>
              {selected.avgHr ? `Avg ${selected.avgHr} · Peak ${selected.maxHr} bpm` : selected.confidence.label}
            </text>
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '2px 0 0 2px', WebkitOverflowScrolling: 'touch' }}>
        {review.exerciseStats.map((ex, i) => (
          <button key={ex.name + i} onClick={() => onSelectExercise?.(i)} style={{
            border: `1px solid ${selectedExercise === i ? ex.effort.color : C.border}`,
            background: selectedExercise === i ? ex.effort.color + '14' : C.bg,
            color: selectedExercise === i ? ex.effort.color : C.muted,
            borderRadius: 999,
            padding: '4px 8px',
            fontFamily: C.fMono,
            fontSize: 9,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}>
            {i + 1}. {ex.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExerciseEffortLineChart({ ex, deps }) {
  const samples = ex?.hrSamples || [];
  const window = ex?.window;
  if (!window || samples.length < 2) return (
    <div style={{ background: C.bg, borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
      Not enough heart-rate samples to draw an exercise graph yet.
    </div>
  );
  const W = 340, H = 142, p = { top: 18, right: 12, bottom: 28, left: 34 };
  const innerW = W - p.left - p.right;
  const innerH = H - p.top - p.bottom;
  const hrs = samples.map(s => s.hr).filter(Number.isFinite);
  const min = Math.max(50, Math.floor((Math.min(...hrs) - 6) / 5) * 5);
  const max = Math.ceil((Math.max(...hrs) + 6) / 5) * 5;
  const span = max === min ? 1 : max - min;
  const xOf = t => p.left + ((t - window.start) / Math.max(1, window.end - window.start)) * innerW;
  const yOf = hr => p.top + innerH - ((hr - min) / span) * innerH;
  const points = samples.map(s => ({ x: xOf(s.t), y: yOf(s.hr), hr: s.hr, t: s.t }));
  const path = deps.smoothLinePath(points, 0.9);
  const ticks = [min, Math.round((min + max) / 2), max];
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 7px 5px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, margin: '0 2px 2px' }}>
        <div style={{ ...st.label, fontSize: 8 }}>Exercise HR + set windows</div>
        <div style={{ fontSize: 9, color: C.muted, fontFamily: C.fMono }}>{ex.confidence.label}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={p.left} x2={W - p.right} y1={yOf(t)} y2={yOf(t)} stroke={C.border} strokeDasharray="4 5" />
            <text x={p.left - 6} y={yOf(t) + 3} textAnchor="end" fill={C.muted} fontSize="8" fontFamily={C.fMono}>{t}</text>
          </g>
        ))}
        {ex.setStats.map(row => {
          const win = deps.setWindowMs(row.set);
          if (!win) return null;
          const x1 = Math.max(p.left, Math.min(W - p.right, xOf(win.start)));
          const x2 = Math.max(p.left, Math.min(W - p.right, xOf(win.end)));
          return (
            <g key={row.setNo}>
              <rect x={x1} y={p.top} width={Math.max(3, x2 - x1)} height={innerH} rx="3"
                fill={row.confidence.key === 'none' ? C.muted : row.effort.color} opacity="0.12" />
              <line x1={x1} x2={x1} y1={p.top} y2={p.top + innerH} stroke={C.border} strokeWidth="1" />
              <text x={Math.max(p.left + 8, Math.min(W - p.right - 8, (x1 + x2) / 2))} y={H - 9}
                textAnchor="middle" fill={row.effort.color} fontSize="8" fontFamily={C.fMono}>S{row.setNo}</text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.16" />
        <path d={path} fill="none" stroke={ex.effort.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill={pt.hr >= 145 ? C.red : pt.hr >= 130 ? C.amber : C.green} stroke={C.card} strokeWidth="1.4" />
        ))}
        <text x={p.left} y={11} fill={C.muted} fontSize="8" fontFamily={C.fMono}>bpm</text>
        <text x={p.left} y={H - 9} textAnchor="start" fill={C.muted} fontSize="8" fontFamily={C.fMono}>sets</text>
      </svg>
    </div>
  );
}

function WorkoutEffortReview({ session, watchData, allExercises = {}, deps, onAiExplain }) {
  const [openExercise, setOpenExercise] = useState(null);
  const [selectedTimelineExercise, setSelectedTimelineExercise] = useState(null);
  const review = deps.sessionEffortReview(session, watchData, allExercises);
  if (!review.matched && !review.hrSamples.length) {
    return (
      <div style={{ ...st.card(C.dim), marginBottom: 12, padding: 12 }}>
        <div style={{ ...st.label, color: C.muted, marginBottom: 5 }}>Watch effort</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
          No matched Apple Watch workout has been found for this session yet. Export workouts after training to unlock effort review here.
        </div>
      </div>
    );
  }
  const summary = [
    ['Duration', review.durationMin ? `${review.durationMin} min` : '—'],
    ['Active', review.activeKcal ? `${review.activeKcal} kcal` : '—'],
    ['Avg HR', review.avgHr ? `${review.avgHr} bpm` : '—'],
    ['Peak HR', review.maxHr ? `${review.maxHr} bpm` : '—'],
  ];
  const insight = review.hardest
    ? `${review.hardest.name} created the highest Watch effort in this session (${review.hardest.maxHr || review.hardest.avgHr} bpm peak/avg signal).`
    : 'Watch samples are matched to this workout. More timestamped sets will make exercise-level insight stronger.';
  return (
    <div style={{ ...st.card(C.blue + '08'), borderColor: C.blue + '33', marginBottom: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ ...st.label, color: C.blue, marginBottom: 3 }}>Workout effort review</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.35 }}>
            Matched to Apple Watch · {review.confidence.label.toLowerCase()}
          </div>
        </div>
        {review.intensity && <span style={st.pill(C.amber)}>Intensity {Math.round(review.intensity * 10) / 10}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {summary.map(([label, value]) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 5px', minWidth: 0 }}>
            <div style={{ ...st.label, fontSize: 7, marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: C.fMono, fontSize: 11, color: C.text, whiteSpace: 'nowrap' }}>{value}</div>
          </div>
        ))}
      </div>

      <WatchEffortTimeline
        deps={deps}
        review={review}
        selectedExercise={selectedTimelineExercise}
        onSelectExercise={i => {
          setSelectedTimelineExercise(i);
          setOpenExercise(i);
        }}
      />

      <div style={{ marginTop: 10, fontSize: 12, color: C.text, lineHeight: 1.4 }}>
        <span style={{ color: C.green, marginRight: 5 }}>✓</span>{insight}
      </div>
      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginTop: 5 }}>
        Set values use minute-level Apple Watch samples, so short sets are estimates and carry a confidence label.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={() => onAiExplain?.({
          mode: 'workout_explanation', focus: 'workout effort',
          rulesResult: {
            title: 'Workout effort', summary: insight,
            recommendation: 'Use this effort signal with RPE, pain, recovery, and progression rules before changing load.',
            evidence: summary.map(([label, value]) => ({ signal: label, value, meaning: 'Matched Apple Watch session summary.' })),
          },
        })} style={{ border: `1px solid ${C.blue}55`, background: 'transparent', color: C.blue, borderRadius: 7, padding: '7px 10px', fontFamily: C.fMono, fontSize: 10, cursor: 'pointer' }}>
          ✦ Explain with AI
        </button>
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {review.exerciseStats.map((ex, i) => {
          const isOpen = openExercise === i;
          return (
            <div key={`${ex.name}-${i}`} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, overflow: 'hidden' }}>
              <button onClick={() => setOpenExercise(isOpen ? null : i)} style={{
                width: '100%', border: 'none', background: 'transparent', padding: 10, textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', cursor: 'pointer',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: C.fDisplay, fontSize: 15, color: C.text, textTransform: 'uppercase', lineHeight: 1 }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    {ex.avgHr ? `Avg ${ex.avgHr} · Peak ${ex.maxHr} bpm` : 'No exercise-level Watch sample'}
                    {ex.kcal ? ` · ${ex.kcal} kcal` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={st.pill(ex.effort.color)}>{ex.effort.label}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '9px 10px 10px' }}>
                  <ExerciseEffortLineChart ex={ex} deps={deps} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                    {[
                      ['Volume', ex.volume ? `${Math.round(ex.volume)}kg` : '—'],
                      ['RPE', ex.avgRpe || '—'],
                      ['Pain', ex.pain ?? '—'],
                      ['Sample', ex.confidence.label],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: C.dim, borderRadius: 7, padding: '7px 4px' }}>
                        <div style={{ ...st.label, fontSize: 7, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontFamily: C.fMono, fontSize: 10, color: label === 'Sample' ? ex.confidence.color : C.text }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {ex.setStats.map(row => {
                      const set = row.set;
                      const load = set.duration ? `${set.duration}s`
                        : set.weight || set.reps ? `${set.weight || 'BW'}kg × ${set.reps || '—'}` : '—';
                      return (
                        <div key={row.setNo} style={{ display: 'grid', gridTemplateColumns: '26px 1fr 1fr', gap: 6, alignItems: 'center',
                          background: C.bg, borderRadius: 7, padding: '7px 8px' }}>
                          <div style={{ ...st.mono(11, C.muted) }}>S{row.setNo}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.text }}>{load}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>
                              {row.durationSec ? `${row.durationSec}s` : 'no timer'}{set.rpe ? ` · RPE ${set.rpe}` : ''}{set.pain != null ? ` · pain ${set.pain}` : ''}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 0 }}>
                            <div style={{ fontFamily: C.fMono, fontSize: 10, color: row.effort.color }}>
                              {row.avgHr ? `${row.avgHr}/${row.maxHr} bpm` : row.confidence.label}
                            </div>
                            <div style={{ fontSize: 10, color: C.muted }}>
                              {row.kcal ? `${row.kcal} kcal · ` : ''}{row.sampleCount} sample{row.sampleCount === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function History({ sessions, setSessions, allExercises = {}, watchData, onAiExplain, helpers = {} }) {
  const deps = helpers;
  const { WORKOUTS, getIronWorkout, fmtDate } = deps;
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // sess.id pending delete
  const [editingId, setEditingId] = useState(null);   // sess.id being edited, or null
  const [draft, setDraft] = useState(null);            // deep copy of session under edit
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  function deleteSession(id) {
    setSessions(p => {
      const next = p.filter(s => s.id !== id);
      localStorage.setItem('il_sessions', JSON.stringify(next));
      return next;
    });
    setExpanded(null);
    setConfirmDelete(null);
  }

  function startEdit(sess) {
    setEditingId(sess.id);
    setDraft(JSON.parse(JSON.stringify(sess)));
    setConfirmDelete(null); // clear any pending delete
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    setSessions(prev => {
      const next = prev.map(s => s.id === editingId ? draft : s);
      localStorage.setItem('il_sessions', JSON.stringify(next));
      return next;
    });
    setEditingId(null);
    setDraft(null);
  }

  function updateSet(exIdx, setIdx, field, value) {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.exercises[exIdx].sets[setIdx][field] = value;
      return next;
    });
  }

  function updateNotes(exIdx, value) {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.exercises[exIdx].notes = value;
      return next;
    });
  }

  function deleteSet(exIdx, setIdx) {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.exercises[exIdx].sets.splice(setIdx, 1);
      return next;
    });
  }

  function addSet(exIdx) {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const sets = next.exercises[exIdx].sets;
      const last = sets[sets.length - 1] || {};
      sets.push({ ...last, rpe: null, pain: null, done: true });
      return next;
    });
  }

  if (!sessions.length) return (
    <div style={{ padding: 16, textAlign: 'center', color: C.muted, paddingTop: 64 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>◫</div>
      <div style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase', color: C.muted }}>No sessions yet</div>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...st.h2, marginBottom: 16 }}>Session Log</div>
      <div style={{ ...st.col() }}>
        {sorted.map(sess => {
          const isIron = sess.workout?.startsWith('IRON_');
          const ironDay = isIron ? parseInt(sess.workout.split('_')[1], 10) : null;
          const ironWkt = isIron ? getIronWorkout(ironDay) : null;
          const workoutTitle = isIron
            ? `Iron Series — Day ${ironDay}`
            : WORKOUTS[sess.workout]?.title || sess.workout;

          return (
          <div key={sess.id} style={{ ...st.card(), overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === sess.id ? null : sess.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isIron ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      background: C.dim, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: '3px 8px',
                      fontFamily: C.fCond, fontSize: 13, fontWeight: 700, color: C.text,
                    }}>
                      🔩 {ironDay}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>{ironWkt?.title}</div>
                  </div>
                ) : (
                  <span style={{ fontFamily: C.fDisplay, fontSize: 34, color: C.amber, lineHeight: 1 }}>{sess.workout}</span>
                )}
                <div>
                  <div style={{ fontFamily: C.fDisplay, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>{workoutTitle}</div>
                  <div style={{ ...st.mono(11, C.muted) }}>{fmtDate(sess.date)}</div>
                </div>
              </div>
              <div style={{ ...st.row, gap: 6 }}>
                {sess.energy && <span style={{ fontSize: 14 }}>{['😴','😕','😐','💪','🔥'][sess.energy - 1]}</span>}
                {sess.duration && <span style={st.pill(C.muted)}>⏱ {sess.duration}min</span>}
                {!sess.duration && !sess.completed && <span style={st.pill(C.muted)}>in progress</span>}
                <span style={{ color: C.muted, fontSize: 12 }}>{expanded === sess.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === sess.id && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                {editingId !== sess.id && sess.completed && (
                  <WorkoutEffortReview session={sess} watchData={watchData} allExercises={allExercises} deps={deps} onAiExplain={onAiExplain} />
                )}
                {(editingId === sess.id ? draft.exercises : sess.exercises)?.map((ex, exIdx) => {
                  const def = allExercises[ex.id];
                  const isEditing = editingId === sess.id;
                  const isTimed = !!def?.isTimed;
                  const isBW = def?.unit === 'bw' || def?.unit === 'band';
                  const isPullup = !!def?.pullupTracking;
                  const loadLabel = def?.unit === 'band' ? 'BAND' : 'BW';

                  return (
                    <div key={ex.id} style={{ marginBottom: isEditing ? 14 : 10 }}>
                      <div style={{ ...st.label, marginBottom: 4 }}>{def?.name}</div>

                      {isEditing ? (
                        /* ── EDIT MODE ── */
                        <div>
                          {ex.sets.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, background: C.dim, borderRadius: 6, padding: '6px 8px' }}>
                              {/* Set number */}
                              <span style={{ ...st.mono(11, C.muted), width: 20, textAlign: 'center', flexShrink: 0 }}>S{i + 1}</span>

                              {/* Pullup mode selector */}
                              {isPullup && (
                                <select value={s.mode || 'bw'} onChange={e => updateSet(exIdx, i, 'mode', e.target.value)}
                                  style={{ ...st.inp, fontSize: 11, flex: '0 0 68px' }}>
                                  <option value="bw">BW</option>
                                  <option value="band">Band</option>
                                  <option value="neg">Neg</option>
                                </select>
                              )}

                              {/* Weight / Duration / BW label */}
                              {isTimed ? (
                                <input type="number" inputMode="numeric" value={s.duration ?? ''}
                                  onChange={e => updateSet(exIdx, i, 'duration', e.target.value)}
                                  style={{ ...st.inp, flex: 1 }} placeholder="sec" />
                              ) : isPullup && (s.mode || 'bw') === 'band' ? (
                                <input type="text" value={s.band || ''}
                                  onChange={e => updateSet(exIdx, i, 'band', e.target.value)}
                                  style={{ ...st.inp, flex: 1, fontSize: 12 }} placeholder="band" />
                              ) : isPullup && (s.mode || 'bw') === 'neg' ? (
                                <input type="number" inputMode="numeric" value={s.duration ?? ''}
                                  onChange={e => updateSet(exIdx, i, 'duration', e.target.value)}
                                  style={{ ...st.inp, flex: 1 }} placeholder="sec" />
                              ) : isBW ? (
                                <div style={{ ...st.inp, flex: 1, color: C.muted, fontSize: 10, lineHeight: '34px', border: `1px solid ${C.border}` }}>{loadLabel}</div>
                              ) : (
                                <input type="number" inputMode="decimal" value={s.weight ?? ''}
                                  onChange={e => updateSet(exIdx, i, 'weight', e.target.value)}
                                  style={{ ...st.inp, flex: 1 }} placeholder="kg" />
                              )}

                              {/* Reps (hidden for pure timed) */}
                              {!isTimed && (
                                <input type="number" inputMode="numeric" value={s.reps ?? ''}
                                  onChange={e => updateSet(exIdx, i, 'reps', e.target.value)}
                                  style={{ ...st.inp, flex: 1 }} placeholder="reps" />
                              )}

                              {/* RPE */}
                              <select value={s.rpe ?? ''} onChange={e => updateSet(exIdx, i, 'rpe', e.target.value ? +e.target.value : null)}
                                style={{ ...st.inp, flex: '0 0 52px', fontSize: 12 }}>
                                <option value=''>RPE</option>
                                {[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>

                              {/* Pain */}
                              <select value={s.pain ?? ''} onChange={e => updateSet(exIdx, i, 'pain', e.target.value !== '' ? +e.target.value : null)}
                                style={{ ...st.inp, flex: '0 0 52px', fontSize: 12 }}>
                                <option value=''>Pain</option>
                                {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>

                              {/* Delete set */}
                              <button onClick={() => deleteSet(exIdx, i)}
                                style={{ background: 'none', border: 'none', color: C.muted, fontSize: 15, cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}>
                                🗑
                              </button>
                            </div>
                          ))}

                          {/* Add set */}
                          <button onClick={() => addSet(exIdx)}
                            style={{ background: 'none', border: `1px dashed ${C.border}`, color: C.muted, borderRadius: 4, fontSize: 11, padding: '5px 12px', width: '100%', cursor: 'pointer', marginTop: 2 }}>
                            + Add set
                          </button>

                          {/* Exercise notes */}
                          <input type="text" value={ex.notes || ''} onChange={e => updateNotes(exIdx, e.target.value)}
                            placeholder="Exercise notes…"
                            style={{ ...st.inp, marginTop: 6, fontSize: 12, textAlign: 'left', padding: '7px 10px' }} />
                        </div>
                      ) : (
                        /* ── READ MODE (unchanged) ── */
                        <div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {ex.sets.map((s, i) => {
                              const display = def?.isTimed ? `${s.duration}s`
                                : def?.pullupTracking
                                  ? s.mode === 'band' ? `${s.reps}r (${s.band || 'band'})`
                                    : s.mode === 'neg' ? `${s.reps}×${s.duration||'?'}s neg`
                                    : `${s.reps} reps`
                                : def?.unit === 'bw' || def?.unit === 'band' ? `${s.reps} reps`
                                : `${s.weight}kg × ${s.reps}`;
                              return (
                                <span key={i} style={{ ...st.pill(s.done ? C.text : C.muted), fontSize: 11 }}>
                                  {display}{s.rpe ? ` r${s.rpe}` : ''}
                                </span>
                              );
                            })}
                          </div>
                          {ex.notes && (
                            <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 4 }}>
                              {'\uD83D\uDCDD'} {ex.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {sess.notes && <div style={{ marginTop: 8, fontSize: 13, color: C.muted, fontStyle: 'italic', borderTop: `1px solid ${C.dim}`, paddingTop: 8 }}>"{sess.notes}"</div>}
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.dim}`, paddingTop: 10 }}>
                  {editingId === sess.id ? (
                    /* Edit mode footer: Save full-width, Cancel below */
                    <div>
                      <button onClick={saveEdit} style={{ ...st.btn(), marginBottom: 8 }}>
                        ✓ Save changes
                      </button>
                      <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 12, display: 'block', width: '100%', textAlign: 'center', padding: '4px 0' }}>
                        Cancel
                      </button>
                    </div>
                  ) : confirmDelete === sess.id ? (
                    /* Delete confirmation */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>Delete this session?</span>
                      <button onClick={() => deleteSession(sess.id)} style={{ ...st.btnSm('#d9534f'), padding: '5px 12px', fontSize: 12 }}>Delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ ...st.btnSm(), padding: '5px 12px', fontSize: 12 }}>Cancel</button>
                    </div>
                  ) : (
                    /* Read mode footer: Edit left, Delete right — never adjacent */
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={() => { startEdit(sess); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.amber, fontSize: 12, padding: 0 }}>
                        ✏ Edit
                      </button>
                      <button onClick={() => setConfirmDelete(sess.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 12, padding: 0, opacity: 0.7 }}>
                        🗑 Delete session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════


