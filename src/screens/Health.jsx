import React, { useState } from '../runtime.js';
import theme from '../ui/theme.js';

const { C, st } = theme;

// HEALTH VIEW
// ═══════════════════════════════════════════════════════════════════════
export default function HealthView({ sessions, allExercises, healthData, setHealthData, Icon, onHealthPush, helpers, components }) {
  const {
    HEALTH_METRICS, healthWeeklyVolume, healthVolumeByGroup, healthConsistency, healthRecentPRs,
    healthRPETrend, healthWorkoutCorrelation, readinessFactors, localDateStr, lastNDaysReadings,
    hrvStatus, healthSevenDayTrend, normaliseHealthReadings, mergeHealthReadings, parseHealthAutoExport,
  } = helpers;
  const {
    HealthSectionHeader, HealthInsightCard, HealthFactorGrid, SleepBreakdownCard, HealthMetricPanel,
  } = components;
  const pushHealthMetrics = onHealthPush;
  const [importMetric, setImportMetric] = useState(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState('');

  const completed   = sessions.filter(s => s.completed);
  const weeklyVol   = healthWeeklyVolume(sessions);
  const groupVol    = healthVolumeByGroup(sessions);
  const consistency = healthConsistency(sessions);
  const recentPRs   = healthRecentPRs(sessions, allExercises);
  const rpeTrend    = healthRPETrend(sessions);
  const maxWeekVol  = Math.max(...weeklyVol.map(w => w.volume), 1);
  const hrvCorrelation = healthWorkoutCorrelation(sessions, healthData.hrv || []);
  const readiness = readinessFactors(healthData, sessions);

  const rpeW = 280, rpeH = 56;
  const rpeMin = 4, rpeMax = 10;
  const rpePts = rpeTrend.map((d, i) => {
    const x = rpeTrend.length < 2 ? rpeW / 2 : (i / (rpeTrend.length - 1)) * rpeW;
    const y = rpeH - ((d.avgRpe - rpeMin) / (rpeMax - rpeMin)) * rpeH;
    return `${x},${Math.max(0, Math.min(rpeH, y))}`;
  });
  const rpePath = rpePts.length >= 2 ? `M${rpePts.join('L')}` : null;

  const sectionHeader = (label, icon) => <HealthSectionHeader label={label} icon={icon} />;

  function openImport(metric) {
    setImportMetric(metric);
    setImportText('');
    setImportError('');
    setImportResult('');
  }

  function confirmImport() {
    try {
      const parsed = JSON.parse(importText);
      const incoming = normaliseHealthReadings(parsed);
      setHealthData(prev => ({ ...prev, [importMetric.key]: mergeHealthReadings(prev[importMetric.key], incoming) }));
      setImportResult(`${incoming.length} readings imported`);
      setImportError('');
      setImportText('');
    } catch (e) {
      setImportError(e.message || 'Could not import this JSON.');
      setImportResult('');
    }
  }

  function confirmBulkImport() {
    try {
      const parsed = JSON.parse(bulkText);
      const bulk = parseHealthAutoExport(parsed);
      if (!bulk) throw new Error('Not a Health Auto Export JSON file. Expected {"data":{"metrics":[...]}}.');
      const counts = {};
      let merged;
      setHealthData(prev => {
        const next = { ...prev };
        Object.entries(bulk).forEach(([key, entries]) => {
          next[key] = mergeHealthReadings(prev[key], entries);
          counts[key] = entries.length;
        });
        merged = next;
        return next;
      });
      // Push to Supabase so it auto-loads next time (fire and forget)
      if (merged) pushHealthMetrics(merged);
      const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ');
      setBulkResult(`Imported: ${summary} — synced to cloud`);
      setBulkError('');
      setBulkText('');
    } catch (e) {
      setBulkError(e.message || 'Could not parse this file.');
      setBulkResult('');
    }
  }

  const renderTraining = () => !completed.length ? (
    <div style={{ ...st.card(), marginBottom: 16, textAlign: 'center', color: C.muted }}>
      <div style={{ fontFamily: C.fDisplay, fontSize: 15, fontWeight: 700, textTransform: 'uppercase' }}>No training data yet</div>
      <div style={{ fontSize: 12, marginTop: 6 }}>Complete your first session to see training stats here.</div>
    </div>
  ) : (
    <>
      <div style={{ ...st.card(), marginBottom: 16 }}>
        {sectionHeader('Weekly Volume', 'bar-chart-2')}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, marginBottom: 8 }}>
          {weeklyVol.map((w, i) => {
            const pct = maxWeekVol > 0 ? w.volume / maxWeekVol : 0;
            const barH = Math.max(pct * 64, w.volume > 0 ? 4 : 0);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                <div style={{
                  width: '100%', height: barH,
                  background: w.isCurrent ? C.amber : C.amber + '55',
                  borderRadius: '3px 3px 0 0',
                  outline: w.isCurrent ? `2px solid ${C.amber}` : 'none',
                  outlineOffset: 1,
                }} />
                <span style={{ fontFamily: C.fMono, fontSize: 8, color: w.isCurrent ? C.amber : C.muted,
                  textTransform: 'uppercase' }}>{w.label}</span>
              </div>
            );
          })}
        </div>
        {(() => {
          const curr = weeklyVol[weeklyVol.length - 1].volume;
          const prev = weeklyVol.slice(0, -1).filter(w => w.volume > 0);
          const prevAvg = prev.length ? Math.round(prev.reduce((s, w) => s + w.volume, 0) / prev.length) : 0;
          const pct = prevAvg > 0 ? Math.round(((curr - prevAvg) / prevAvg) * 100) : null;
          return (
            <div style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted }}>
              This week: <span style={{ color: C.text }}>{curr.toLocaleString()} kg·reps</span>
              {pct !== null && (
                <span>{'  '}<span style={{ color: pct >= 0 ? C.green : C.red }}>
                  {pct >= 0 ? 'up ' : 'down '}{Math.abs(pct)}% vs avg
                </span></span>
              )}
            </div>
          );
        })()}
      </div>

      {groupVol.length > 0 && (
        <div style={{ ...st.card(), marginBottom: 16 }}>
          {sectionHeader('This Week by Type', 'dumbbell')}
          {groupVol.map(g => (
            <div key={g.key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted }}>{g.label}</span>
                <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.text }}>{g.volume.toLocaleString()}</span>
              </div>
              <div style={{ height: 6, background: C.dim, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((g.volume / groupVol[0].volume) * 100)}%`,
                  background: g.color,
                  borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...st.card(), marginBottom: 16 }}>
        {sectionHeader('Consistency', 'calendar')}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
          {[
            [consistency.streak, 'Streak', C.amber],
            [consistency.totalThisMonth, 'Sessions 28 days', C.text],
            [Math.round((consistency.totalThisMonth / 4) * 10) / 10, 'Per week', C.text],
          ].map(([value, label, color]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: C.fDisplay, fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, textTransform: 'uppercase', marginTop: 4, lineHeight: 1.4 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ fontFamily: C.fMono, fontSize: 8, color: C.muted,
              textAlign: 'center', paddingBottom: 2 }}>{d}</div>
          ))}
          {consistency.days.map((d, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              borderRadius: 3,
              background: d.trained ? C.amber : C.dim,
              outline: d.isToday ? `2px solid ${C.amber}` : 'none',
              outlineOffset: 1,
              opacity: d.trained ? 1 : 0.5,
            }} />
          ))}
        </div>
      </div>

      {recentPRs.length > 0 && (
        <div style={{ ...st.card(), marginBottom: 16 }}>
          {sectionHeader('Recent PRs', 'trophy')}
          {recentPRs.map((pr, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', paddingBottom: 8, marginBottom: 8,
              borderBottom: i < recentPRs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div>
                <div style={{ fontFamily: C.fBody, fontSize: 13, color: C.text }}>{pr.name}</div>
                <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>{pr.date.slice(0, 10)}</div>
              </div>
              <div style={{ fontFamily: C.fDisplay, fontSize: 18, fontWeight: 700, color: C.amber }}>
                {pr.weight}<span style={{ fontSize: 11, color: C.muted, fontFamily: C.fMono }}> kg</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {rpeTrend.length >= 2 && (
        <div style={{ ...st.card(), marginBottom: 16 }}>
          {sectionHeader('Effort Trend', 'flame')}
          <svg width="100%" viewBox={`0 0 ${rpeW} ${rpeH + 20}`} style={{ width: '100%', height: rpeH + 20, display: 'block', overflow: 'visible' }}>
            {[6, 7, 8].map(v => {
              const y = rpeH - ((v - rpeMin) / (rpeMax - rpeMin)) * rpeH;
              return (
                <g key={v}>
                  <line x1={0} y1={y} x2={rpeW} y2={y}
                    stroke={C.border} strokeWidth={1} strokeDasharray="3,3" />
                  <text x={2} y={y - 2} fill={C.muted} fontSize={8} fontFamily={C.fMono}>{v}</text>
                </g>
              );
            })}
            {rpePath && (
              <path d={rpePath} fill="none" stroke={C.amber} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" />
            )}
            {rpeTrend.map((d, i) => {
              const x = rpeTrend.length < 2 ? rpeW / 2 : (i / (rpeTrend.length - 1)) * rpeW;
              const y = rpeH - ((d.avgRpe - rpeMin) / (rpeMax - rpeMin)) * rpeH;
              const cy = Math.max(0, Math.min(rpeH, y));
              const col = d.avgRpe >= 9 ? C.red : d.avgRpe >= 7 ? C.amber : C.green;
              return (
                <g key={i}>
                  <circle cx={x} cy={cy} r={4} fill={col} />
                  <text x={x} y={rpeH + 14} textAnchor="middle" fill={C.muted}
                    fontSize={8} fontFamily={C.fMono}>{d.label}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 4, textAlign: 'center' }}>
            Avg RPE per session · last {rpeTrend.length} sessions
          </div>
        </div>
      )}
    </>
  );

  // Trained dates set for workout markers on charts
  const trainedDates = new Set(
    sessions.filter(s => s.completed).map(s => s.date ? localDateStr(new Date(s.date)) : null).filter(Boolean)
  );

  const metricPanels = {};
  HEALTH_METRICS.forEach(metric => {
    const readings = healthData[metric.key] || [];
    const chartData = metric.sparse ? readings.slice(-12) : lastNDaysReadings(readings, metric.days);
    const latest = readings[readings.length - 1];

    // Per-metric annotations
    let annotation = null;
    if (metric.key === 'hrv' && latest) {
      const avg = readings.length ? readings.reduce((s, r) => s + Number(r.value), 0) / readings.length : null;
      const status = hrvStatus(Number(latest.value), avg);
      if (status) annotation = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{ ...st.pill(status.color), fontSize: 11, fontWeight: 700 }}>{status.label}</span>
          <span style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>
            {Number(latest.value) > avg ? '+' : ''}{Math.round((Number(latest.value) - avg) * 10) / 10} ms vs avg
          </span>
        </div>
      );
    }
    if (metric.key === 'restingHr') {
      const trend = healthSevenDayTrend(readings);
      if (trend != null) {
        const improving = trend < 0; // lower HR = better
        annotation = (
          <div style={{ fontFamily: C.fMono, fontSize: 11, color: improving ? C.green : C.amber, marginTop: 8 }}>
            {improving ? '↓' : '↑'} {Math.abs(trend)} bpm this week — {improving ? 'improving ✓' : 'trending up'}
          </div>
        );
      }
    }
    if (metric.key === 'steps' && metric.target) {
      const recent = lastNDaysReadings(readings, metric.days);
      const hit = recent.filter(r => Number(r.value) >= metric.target).length;
      annotation = (
        <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 8 }}>
          {hit} / {recent.length} days hit {metric.target.toLocaleString()} target
          {recent.length > 0 && <span style={{ color: hit / recent.length >= 0.7 ? C.green : C.amber }}>{' '}({Math.round(hit / recent.length * 100)}%)</span>}
        </div>
      );
    }
    if (metric.key === 'activeCal') {
      const recent = lastNDaysReadings(readings, 7);
      if (recent.length) {
        const avg = Math.round(recent.reduce((s, r) => s + Number(r.value), 0) / recent.length);
        annotation = (
          <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 8 }}>
            7-day avg: <span style={{ color: C.text }}>{avg.toLocaleString()} kcal</span>
          </div>
        );
      }
    }

    metricPanels[metric.key] = (
      <HealthMetricPanel
        key={metric.key}
        metric={metric}
        readings={readings}
        chartData={chartData}
        latest={latest}
        trainedDates={trainedDates}
        annotation={annotation}
        onImport={openImport}
      />
    );
  });

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <div style={{ fontFamily: C.fDisplay, fontSize: 22, fontWeight: 900, letterSpacing: 2,
        textTransform: 'uppercase', color: C.text, marginBottom: 20 }}>
        Health
      </div>

      {sectionHeader('Readiness Breakdown', 'activity')}
      <HealthInsightCard
        title={readiness.recovery ? `${readiness.recovery.score}% · ${readiness.recovery.label}` : 'Health data needed'}
        subtitle={readiness.summary}
        tone={readiness.recovery?.color || C.amber}
      >
        <HealthFactorGrid factors={readiness.factors} />
      </HealthInsightCard>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Sleep', 'moon')}
        <SleepBreakdownCard healthData={healthData} />
      </div>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Cardiovascular', 'heart')}
        <HealthInsightCard
          title="Recovery signals"
          subtitle="HRV and resting heart rate are the main daily nervous-system signals. Blood oxygen and cardio fitness are useful context, but they should not be treated as diagnoses."
          tone={C.green}
        />
        {metricPanels.hrv}
        {metricPanels.restingHr}
        {metricPanels.bloodOxygen}
        {metricPanels.cardio}
        {hrvCorrelation && (
          <div style={{ ...st.card(), marginBottom: 16, borderColor: hrvCorrelation.pct >= 0 ? C.green + '55' : C.amber + '55' }}>
            {sectionHeader('Workout Correlation', 'activity')}
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.45 }}>
              Your HRV was <span style={{ color: hrvCorrelation.pct >= 0 ? C.green : C.amber, fontWeight: 700 }}>
                {Math.abs(hrvCorrelation.pct)}% {hrvCorrelation.pct >= 0 ? 'higher' : 'lower'}
              </span> on workout days this month.
            </div>
            <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 8 }}>
              Workout avg {hrvCorrelation.workoutAvg} ms · Rest avg {hrvCorrelation.restAvg} ms
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Movement & Energy', 'footprints')}
        <HealthInsightCard
          title="Daily movement"
          subtitle="Steps and active calories support weight loss and general fitness. IronLog treats very high activity as extra load only when recovery is also under pressure."
          tone={C.blue}
        />
        {metricPanels.steps}
        {metricPanels.activeCal}
      </div>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Training Response', 'dumbbell')}
        {renderTraining()}
      </div>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Data Tools', 'upload')}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <button onClick={() => { setBulkImportOpen(true); setBulkText(''); setBulkError(''); setBulkResult(''); }}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, fontFamily: C.fMono, cursor: 'pointer', textDecoration: 'underline' }}>
            Manual import (Health Auto Export JSON)
          </button>
        </div>
      </div>

      {bulkImportOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(23,33,43,0.45)', zIndex: 500,
          display: 'flex', alignItems: 'flex-end', padding: 14 }}>
          <div style={{ ...st.card(), width: '100%', maxWidth: 560, margin: '0 auto 10px', boxShadow: '0 18px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: C.fDisplay, fontSize: 18, fontWeight: 800, color: C.text, textTransform: 'uppercase' }}>
                  Health Auto Export
                </div>
                <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>HRV · Resting HR · Sleep · Steps · Active Cal · SpO2</div>
              </div>
              <button onClick={() => setBulkImportOpen(false)} style={{ background: C.dim, border: 'none', borderRadius: 6, width: 34, height: 34, color: C.text, cursor: 'pointer' }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 8 }}>
              Open the <strong style={{ color: C.text }}>Health Auto Export</strong> app, export last 30 days as JSON, then paste the full file contents here.
            </div>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8}
              placeholder='{"data":{"metrics":[{"name":"heart_rate_variability",...}]}}'
              style={{ ...st.inp, textAlign: 'left', padding: 12, resize: 'vertical', lineHeight: 1.4, fontSize: 12 }} />
            {bulkError  && <div style={{ color: C.red,   fontSize: 12, marginTop: 8 }}>{bulkError}</div>}
            {bulkResult && <div style={{ color: C.green, fontSize: 12, marginTop: 8 }}>{bulkResult}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <button onClick={() => setBulkImportOpen(false)} style={{ ...st.ghost }}>Done</button>
              <button onClick={confirmBulkImport} disabled={!bulkText.trim()} style={{ ...st.btn(), opacity: bulkText.trim() ? 1 : 0.45 }}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {importMetric && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(23,33,43,0.45)', zIndex: 500,
          display: 'flex', alignItems: 'flex-end', padding: 14 }}>
          <div style={{ ...st.card(), width: '100%', maxWidth: 560, margin: '0 auto 10px', boxShadow: '0 18px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: C.fDisplay, fontSize: 18, fontWeight: 800, color: C.text, textTransform: 'uppercase' }}>
                  Import {importMetric.title}
                </div>
                <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>{importMetric.storage}</div>
              </div>
              <button onClick={() => setImportMetric(null)} style={{ background: C.dim, border: 'none', borderRadius: 6, width: 34, height: 34, color: C.text, cursor: 'pointer' }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 8 }}>
              Paste either <span style={{ fontFamily: C.fMono }}>[{'{'}date,value{'}'}]</span> JSON or the Shortcuts blob format with newline-separated dates and values.
            </div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={8}
              placeholder='{"dates":"2026-05-06\n2026-05-07","values":"19.05\n22.54"}'
              style={{ ...st.inp, textAlign: 'left', padding: 12, resize: 'vertical', lineHeight: 1.4, fontSize: 12 }} />
            {importError && <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>{importError}</div>}
            {importResult && <div style={{ color: C.green, fontSize: 12, marginTop: 8 }}>{importResult}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <button onClick={() => setImportMetric(null)} style={{ ...st.ghost }}>Done</button>
              <button onClick={confirmImport} disabled={!importText.trim()} style={{ ...st.btn(), opacity: importText.trim() ? 1 : 0.45 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════


