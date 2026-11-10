import React, { useState } from '../runtime.js';
import theme from '../ui/theme.js';
import RideDetail from './RideDetail.jsx';

const { C, st } = theme;

export default function Rides({ rides = [], setRides, onCloudSave, onLoadRideDetail }) {
  const [open, setOpen] = useState(false);
  const [dur, setDur] = useState('');
  const [dist, setDist] = useState('');
  const [rpe, setRpe] = useState('');
  const [type, setType] = useState('moderate');
  const [notes, setNotes] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function openRide(ride) {
    setSelectedRide(ride);
    setSelectedDetail(null);
    if (!ride?.sourceId && !ride?.source_id) return;
    setDetailLoading(true);
    try {
      const detail = await onLoadRideDetail?.(ride);
      setSelectedDetail(detail || { ok: false, error: 'Ride detail could not be loaded.' });
    } finally {
      setDetailLoading(false);
    }
  }

  function log() {
    if (!dur) return;
    const ride = { id: Date.now().toString(), date: new Date().toISOString(), duration: +dur, distance: dist ? +dist : null, effort: rpe ? +rpe : null, type, notes };
    setRides(previous => [...previous, ride]);
    onCloudSave?.(ride);
    setOpen(false); setDur(''); setDist(''); setRpe(''); setType('moderate'); setNotes('');
  }

  const typeColor = { easy: C.green, moderate: C.amber, hard: C.blue, hilly: C.amber, recovery: C.green, intervals: C.blue, sprinkles: C.blue, tempo: C.amber, long: C.green };
  const sorted = [...rides].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (selectedRide) {
    return <RideDetail ride={selectedRide} rides={rides} detail={selectedDetail} loading={detailLoading} onBack={() => { setSelectedRide(null); setSelectedDetail(null); }} onLoad={onLoadRideDetail} />;
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={st.h2}>Rides</div>
        <button style={{ ...st.btnSm(), padding: '8px 14px' }} onClick={() => setOpen(!open)}>+ Log Ride</button>
      </div>

      {open && (
        <div style={{ ...st.card(), marginBottom: 16 }}>
          <div style={{ ...st.col(12) }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ ...st.label, marginBottom: 5 }}>Duration (min)</div>
                <input type="number" inputMode="numeric" value={dur} onChange={event => setDur(event.target.value)} style={{ ...st.inp }} placeholder="e.g. 45" />
              </div>
              <div>
                <div style={{ ...st.label, marginBottom: 5 }}>Distance (km)</div>
                <input type="number" inputMode="decimal" value={dist} onChange={event => setDist(event.target.value)} style={{ ...st.inp }} placeholder="e.g. 18.5" />
              </div>
            </div>
            <div>
              <div style={{ ...st.label, marginBottom: 5 }}>Ride type</div>
              <select value={type} onChange={event => setType(event.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 12px' }}>
                <option value="easy">Easy — felt easy, could talk</option>
                <option value="moderate">Moderate — working steadily</option>
                <option value="hard">Hard — really pushed it</option>
                <option value="hilly">Hilly — lots of climbing</option>
                <option value="recovery">Recovery — very easy spin</option>
              </select>
            </div>
            <div>
              <div style={{ ...st.label, marginBottom: 5 }}>Effort (1–10)</div>
              <input type="number" inputMode="numeric" min="1" max="10" value={rpe} onChange={event => setRpe(event.target.value)} style={{ ...st.inp }} placeholder="e.g. 5" />
            </div>
            <div>
              <div style={{ ...st.label, marginBottom: 5 }}>Notes</div>
              <input type="text" value={notes} onChange={event => setNotes(event.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 12px' }} placeholder="How was it?" />
            </div>
            <button style={{ ...st.btn() }} onClick={log}>Save Ride</button>
          </div>
        </div>
      )}

      <div style={{ ...st.card(), marginBottom: 16, padding: '12px 14px' }}>
        <div style={{ ...st.label, marginBottom: 8 }}>Programme Guide</div>
        {[
          { phase: 'Wks 1–2', text: '2 rides/week · 20–30 min · keep it easy, conversational pace' },
          { phase: 'Wks 3–4', text: '2–3/week · 25–40 min · mostly easy, occasionally moderate effort' },
          { phase: 'Wk 5+', text: '3/week · mix of easy, moderate, and one harder or hilly ride' },
        ].map((row, index) => (
          <div key={index} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 0', borderBottom: index < 2 ? `1px solid ${C.dim}` : 'none' }}>
            <span style={{ fontFamily: C.fMono, color: C.amber, minWidth: 56 }}>{row.phase}</span>
            <span style={{ color: C.muted }}>{row.text}</span>
          </div>
        ))}
      </div>

      {!rides.length ? (
        <div style={{ textAlign: 'center', color: C.muted, paddingTop: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>○</div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 14, textTransform: 'uppercase' }}>No rides logged yet</div>
        </div>
      ) : (
        <div style={{ ...st.col() }}>
          {sorted.map(ride => (
            <div key={ride.id} onClick={() => openRide(ride)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openRide(ride); }} role="button" tabIndex={0} style={{ ...st.card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', cursor: 'pointer' }}>
              <div>
                <div style={{ ...st.row, marginBottom: 4 }}>
                  <span style={st.pill(typeColor[ride.type] || C.muted)}>{ride.type}</span>
                  {ride.source === 'apple_health' && <span style={st.pill(C.green)}>Apple Watch</span>}
                  {ride.effort && <span style={{ ...st.mono(11, C.muted) }}>RPE {ride.effort}</span>}
                </div>
                {ride.notes && <div style={{ fontSize: 12, color: C.muted }}>{ride.notes}</div>}
                {ride.source === 'apple_health' && (
                  <div style={{ ...st.mono(10, C.muted), marginTop: 3 }}>
                    {[ride.activeCalories != null ? `${Math.round(ride.activeCalories)} kcal` : null,
                      ride.averageHeartRate != null ? `${Math.round(ride.averageHeartRate)} avg bpm` : null,
                      ride.peakHeartRate != null ? `${Math.round(ride.peakHeartRate)} peak bpm` : null]
                      .filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {ride.distance != null && <div style={{ fontFamily: C.fMono, fontSize: 22, color: C.amber, lineHeight: 1 }}>{ride.distance}<span style={{ fontSize: 11, color: C.muted }}>km</span></div>}
                <div style={{ fontFamily: C.fMono, fontSize: ride.distance != null ? 15 : 22, color: C.text, lineHeight: 1.4 }}>{ride.duration}<span style={{ fontSize: 11, color: C.muted }}>min</span></div>
                <div style={{ ...st.mono(10, C.muted) }}>{new Date(ride.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
