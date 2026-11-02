import React, { useState } from '../runtime.js';
import defaultTheme from '../ui/theme.js';

export default function Dashboard({ sessions, rides, setView, activeSession, selectedWorkout, setSelectedWorkout, allExercises = {}, workoutCustom = {}, workoutHidden = {}, driveSync, onCloudSync, updateAvailable, onWarmupOpen, onDemoOpen, coachRec, showWhy, setShowWhy, healthData, watchData, activitySummary, onAiExplain, helpers = {}, components = {}, theme: themeProps = defaultTheme }) {
  const { C, st, dash } = themeProps;
  const {
    computeRecovery, computeFatigue, computeTrainingLoad, computeTrendInsight,
    summarizeWatchEffort, timeGreeting, weekStart, weekMondayStart, workoutDisplay, fmtDate,
  } = helpers;
  const {
    Icon, ReadinessSummaryCard, ReadinessInsightModal, HomeMetricInsightModal,
    WatchEffortInsightModal, SleepInsightModal, TrendInsightModal, DailySignalsStrip,
    RecoveryTrendCard, ThisWeekSummaryCard, WeeklyHeatmap, RecentWorkoutsSection,
  } = components;
  const [showReadinessInsight, setShowReadinessInsight] = useState(false);
  const [homeInsight, setHomeInsight] = useState(null);
  const [trendDays, setTrendDays] = useState(7);

  // Recovery computations (only when health data present)
  const hd = healthData || {};
  const hasHealthData = (hd.hrv?.length || hd.restingHr?.length || 0) > 0;
  const recovery  = hasHealthData ? computeRecovery(hd) : null;
  const fatigue   = hasHealthData ? computeFatigue(hd, sessions) : null;
  const trainLoad = computeTrainingLoad(sessions, hd.activeCal || []);
  const insight   = hasHealthData ? computeTrendInsight(hd) : null;
  const watchSummary = summarizeWatchEffort(watchData);

  // Training recommendation — HRV-led protocol plus transparent workload/safety context.
  const trainingRec = (r, f) => {
    if (!r) return { label: 'Scheduled', color: C.blue, detail: 'Log workouts to get a recommendation.' };
    if (r.status === 'insufficient') return { label: 'Build baseline', color: C.blue, detail: 'Keep exporting consistent Apple Health readings before using HRV to change training.' };
    const highFatigue = f && f.level >= 60;
    const modFatigue  = f && f.level >= 30;
    if (r.status === 'suppressed') return { label: 'Train lighter', color: C.red, detail: 'Your HRV trend is meaningfully below your personal range. Reduce planned intensity or volume; do not automatically cancel movement.' };
    if (r.restingHr?.status === 'elevated') return { label: 'Use a cautious plan', color: C.amber, detail: 'HRV is not suppressed, but resting HR is elevated. Keep the warm-up controlled and avoid maximal effort.' };
    if (highFatigue || watchSummary.hasRecentHard) return { label: 'Moderate today', color: C.amber, detail: watchSummary.hasRecentHard ? 'HRV is not suppressed, but recent Watch effort was high. Keep effort controlled.' : 'HRV is not suppressed, but recent load is high. Consider a lighter session.' };
    if (modFatigue) return { label: 'Good to train', color: C.green, detail: 'HRV is within or above your usual range. Keep effort controlled.' };
    return { label: 'Good to train', color: C.green, detail: 'HRV is within or above your usual range. Follow the planned session and use your warm-up, RPE, and pain signals.' };
  };
  const rec = trainingRec(recovery, fatigue);

  // Metric strip data — icons use Lucide names
  const hMetrics = [
    { key: 'hrv',       title: 'HRV',        unit: 'ms',    color: C.green, data: hd.hrv,       higherBetter: true,  icon: 'activity' },
    { key: 'restingHr', title: 'Resting HR',  unit: 'bpm',   color: C.red,   data: hd.restingHr, higherBetter: false, icon: 'heart'    },
    { key: 'steps',     title: 'Steps',       unit: '',      color: C.blue,  data: hd.steps,     target: 8000,        icon: 'footprints' },
    { key: 'activeCal', title: 'Active Cal',  unit: 'kcal',  color: C.amber, data: hd.activeCal,                      icon: 'flame'    },
  ];
  const ws = weekStart();
  const weekSessions = sessions.filter(s => new Date(s.date) >= ws);
  const weekRides = rides.filter(r => new Date(r.date) >= ws);
  // Week strip: Mon–Sun cells
  const mondayStart = weekMondayStart();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayStart);
    d.setDate(mondayStart.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const sess = sessions.find(s => s.completed && s.date?.slice(0, 10) === dateStr);
    const ride = rides.find(r => r.date?.slice(0, 10) === dateStr);
    const isToday = dateStr === new Date().toISOString().slice(0, 10);
    return { d, dateStr, sess, ride, isToday, dayLetter: ['M','T','W','T','F','S','S'][i] };
  });
  const recent = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  const lastSyncTime = driveSync?.lastCloudSync
    ? new Date(driveSync.lastCloudSync).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    : 'not yet';
  const cloudLabel = driveSync?.cloudStatus === 'syncing'
    ? 'Supabase syncing...'
    : driveSync?.cloudStatus === 'error'
      ? 'Supabase sync failed'
      : `Supabase auto-sync on · Last synced ${lastSyncTime}`;

  return (
    <div style={dash.page}>

      {/* ── Greeting header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 28, fontWeight: 800, color: '#0d1838', lineHeight: 0.95 }}>
            {timeGreeting()}, Phill
          </div>
          <div style={{ fontFamily: C.fBody, fontSize: 13, color: C.muted, marginTop: 5 }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={() => window.location.reload(true)}
          title={updateAvailable ? 'Update available' : 'Check for updates'}
          style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: 'pointer',
            color: updateAvailable ? C.blue : '#0d1838', fontSize: 18, boxShadow: '0 8px 20px rgba(32,55,85,.08)', position: 'relative',
            animation: updateAvailable ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
          ↺
          {updateAvailable && <span style={{ position: 'absolute', right: 7, top: 7, width: 6, height: 6, borderRadius: '50%', background: C.blue }} />}
        </button>
        {updateAvailable && <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>}
      </div>

      <ReadinessSummaryCard
        recovery={recovery}
        fatigue={fatigue}
        healthData={hd}
        watchSummary={watchSummary}
        setView={setView}
        onSeeWhy={() => setShowReadinessInsight(true)}
        onWatchTap={() => setHomeInsight({ type: 'watch' })}
        onMetricTap={metric => setHomeInsight({ type: 'metric', metric })}
        onSleepTap={() => setHomeInsight({ type: 'sleep' })}
      />
      {showReadinessInsight && (
        <ReadinessInsightModal
          recovery={recovery}
          fatigue={fatigue}
          healthData={hd}
          watchSummary={watchSummary}
          onClose={() => setShowReadinessInsight(false)}
          onAiExplain={onAiExplain}
        />
      )}
      {homeInsight?.type === 'metric' && (
        <HomeMetricInsightModal metric={homeInsight.metric} healthData={hd} onClose={() => setHomeInsight(null)} onAiExplain={onAiExplain} />
      )}
      {homeInsight?.type === 'watch' && (
        <WatchEffortInsightModal watchSummary={watchSummary} onClose={() => setHomeInsight(null)} onAiExplain={onAiExplain} />
      )}
      {homeInsight?.type === 'sleep' && (
        <SleepInsightModal healthData={hd} onClose={() => setHomeInsight(null)} onAiExplain={onAiExplain} />
      )}
      {homeInsight?.type === 'trend' && (
        <TrendInsightModal healthData={hd} trendDays={trendDays} onClose={() => setHomeInsight(null)} onAiExplain={onAiExplain} />
      )}
      {hasHealthData && <DailySignalsStrip healthData={hd} onMetricTap={metric => setHomeInsight({ type: 'metric', metric })} />}
      {hasHealthData && (hd.hrv?.length > 1 || hd.restingHr?.length > 1) && (
        <RecoveryTrendCard healthData={hd} trendDays={trendDays} setTrendDays={setTrendDays} onTrendTap={() => setHomeInsight({ type: 'trend' })} />
      )}
      {/* 7-day week strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
        {weekDays.map(({ dayLetter, sess, ride, isToday, dateStr }) => (
          <div key={dateStr} style={{
            ...st.card(),
            padding: '8px 4px',
            textAlign: 'center',
            borderColor: isToday ? C.amber : C.border,
            background: isToday ? C.amberDim : C.card,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <div style={{ ...st.label, fontSize: 9 }}>{dayLetter}</div>
            {sess ? (
              <div style={{ fontSize: 11, fontFamily: C.fDisplay, color: C.amber, lineHeight: 1 }}>{workoutDisplay(sess).badge}✓</div>
            ) : ride ? (
              <div style={{ fontSize: 12, lineHeight: 1 }}>🚴</div>
            ) : (
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1 }}>–</div>
            )}
          </div>
        ))}
      </div>
      {activitySummary && <ActivityBalanceCard summary={activitySummary} onOpen={() => setView('health')} theme={themeProps} />}
      <ThisWeekSummaryCard sessions={sessions} rides={rides} watchSummary={watchSummary} />

      {/* ── Weekly Activity + Recent Workouts side by side ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 auto', width: 'calc(45% - 4px)' }}>
          <WeeklyHeatmap sessions={sessions} rides={rides} healthData={hd} />
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <RecentWorkoutsSection sessions={sessions} rides={rides} setView={setView} />
        </div>
      </div>

      {/* Cloud sync status */}
      {driveSync && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 16,
        }}>
          <Icon name={driveSync.cloudStatus === 'error' ? 'alert-circle' : 'check-circle'} size={16} color={driveSync.cloudStatus === 'error' ? C.red : C.green} />
          <span style={{ flex: 1, fontSize: 13, color: C.muted, minWidth: 0 }}>
            {cloudLabel}
          </span>
          <button onClick={onCloudSync} style={{ ...st.btnSm(C.dim, C.muted), padding: '4px 10px', fontSize: 11, flexShrink: 0 }}>
            Sync now
          </button>
        </div>
      )}

      {/* Recent sessions */}
      {recent.length > 0 && (
        <>
          <div style={{ ...st.label, marginBottom: 8 }}>Recent</div>
          <div style={{ ...st.col() }}>
            {recent.map(sess => {
              const display = workoutDisplay(sess);
              return (
                <div key={sess.id} style={{ ...st.card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
                  <div style={{ ...st.row }}>
                    <span style={{ fontFamily: C.fDisplay, fontSize: 26, color: C.amber, minWidth: 22 }}>{display.badge}</span>
                    <div>
                      <div style={{ fontSize: 13, fontFamily: C.fDisplay, textTransform: 'uppercase', letterSpacing: 0.5 }}>{display.title}</div>
                      {display.subtitle && <div style={{ fontSize: 11, color: C.muted }}>{display.subtitle}</div>}
                      <div style={{ ...st.mono(11, C.muted) }}>{fmtDate(sess.date)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {sess.duration && <div style={{ ...st.mono(12, C.muted) }}>{sess.duration}min</div>}
                    {sess.energy && <div style={{ fontSize: 16 }}>{['😴','😕','😐','💪','🔥'][sess.energy - 1]}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ActivityBalanceCard({ summary, onOpen, theme: themeProps }) {
  const { C, dash } = themeProps;
  const goal = summary.goals || {};
  const rows = [
    ['Heart points', summary.points, goal.weeklyHeartPoints, C.blue],
    ['Strength sessions', summary.strengthSessions, goal.weeklyStrengthSessions, C.green],
    ['Cycling minutes', summary.cyclingMinutes, goal.weeklyCyclingMinutes, C.amber],
  ].filter(row => row[2] != null);
  return (
    <button onClick={onOpen} style={{ ...dash.card({ marginBottom: 10 }), width: '100%', textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ ...dash.label, color: '#0d1838' }}>Activity balance</div>
        <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted }}>Not readiness</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(rows.length, 3)}, 1fr)`, gap: 8, marginTop: 10 }}>
        {rows.map(([label, value, target, color]) => {
          const percent = Math.min(100, Math.round((value / target) * 100));
          return <div key={label} style={{ minWidth: 0 }}>
            <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
            <div style={{ marginTop: 3, fontFamily: C.fDisplay, fontSize: 20, fontWeight: 800, color: '#0d1838' }}>{value}<span style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted }}> / {target}</span></div>
            <div style={{ height: 5, borderRadius: 5, background: C.dim, marginTop: 4 }}><div style={{ width: `${percent}%`, height: '100%', borderRadius: 5, background: color }} /></div>
          </div>;
        })}
      </div>
      <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, marginTop: 8 }}>Tap for goals, sleep timeline, and body trends</div>
    </button>
  );
}

