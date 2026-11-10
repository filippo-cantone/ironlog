import React, { useEffect, useRef, useState } from '../runtime.js';
import theme from '../ui/theme.js';

const { C } = theme;

const palette = {
  bg: '#07111d', panel: '#0d1b2b', panelRaised: '#12273a', line: '#1b4b68',
  text: '#f2f7ff', muted: '#8ea8bb', cyan: '#18e0e7', blue: '#4a9dff',
  teal: '#1fc8aa', amber: '#ffb52e', coral: '#ff6f61', purple: '#a687ff',
};

const effortColor = effort => ({ easy: palette.teal, steady: palette.blue, moderate: palette.amber, hard: palette.coral }[effort] || palette.blue);

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function formatDate(value) {
  if (!value) return 'Apple Watch ride';
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatClock(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

function routeBounds(points) {
  const valid = (points || []).filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  if (!valid.length) return null;
  return {
    minLat: Math.min(...valid.map(point => point.latitude)), maxLat: Math.max(...valid.map(point => point.latitude)),
    minLon: Math.min(...valid.map(point => point.longitude)), maxLon: Math.max(...valid.map(point => point.longitude)),
  };
}

function progressGeoJson(points = []) {
  return {
    type: 'FeatureCollection',
    features: points.slice(1).map((point, index) => ({
      type: 'Feature',
      properties: { effort: point.effort || 'steady', index },
      geometry: { type: 'LineString', coordinates: [[points[index].longitude, points[index].latitude], [point.longitude, point.latitude]] },
    })),
  };
}

function RouteSvg({ detail, progressIndex, compact = false }) {
  const points = detail?.points || [];
  const bounds = routeBounds(points);
  if (!bounds || points.length < 2) return <div style={{ color: palette.muted, padding: 24, textAlign: 'center' }}>GPS route unavailable</div>;
  const width = 1000;
  const height = compact ? 300 : 380;
  const latSpan = Math.max(0.00001, bounds.maxLat - bounds.minLat);
  const lonSpan = Math.max(0.00001, bounds.maxLon - bounds.minLon);
  const scale = Math.min((width - 90) / lonSpan, (height - 80) / latSpan);
  const offsetX = (width - lonSpan * scale) / 2;
  const offsetY = (height - latSpan * scale) / 2;
  const visible = points.slice(0, Math.max(2, Math.min(points.length, progressIndex + 1)));
  const xy = point => `${offsetX + (point.longitude - bounds.minLon) * scale},${height - offsetY - (point.latitude - bounds.minLat) * scale}`;
  const fullPath = points.map(xy).join(' ');
  const visiblePath = visible.map(xy).join(' ');
  const start = xy(points[0]);
  const finish = xy(points[points.length - 1]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="GPS route fallback map">
      <defs>
        <pattern id="ride-grid" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M 46 0 L 0 0 0 46" fill="none" stroke="#17415a" strokeWidth="1" opacity="0.55" /></pattern>
        <filter id="ride-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width={width} height={height} fill="#081522" />
      <rect width={width} height={height} fill="url(#ride-grid)" />
      <path d={`M ${width * 0.05} ${height * 0.76} C ${width * 0.28} ${height * 0.62}, ${width * 0.4} ${height * 0.86}, ${width * 0.62} ${height * 0.62} S ${width * 0.87} ${height * 0.38}, ${width * 0.98} ${height * 0.5}`} fill="none" stroke="#163a4c" strokeWidth="34" opacity="0.45" />
      <polyline points={fullPath} fill="none" stroke="#0c6c83" strokeWidth="14" opacity="0.25" />
      <polyline points={visiblePath} fill="none" stroke={palette.cyan} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#ride-glow)" />
      <polyline points={visiblePath} fill="none" stroke="#d9ffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={start.split(',')[0]} cy={start.split(',')[1]} r="11" fill={palette.teal} stroke="#d9ffff" strokeWidth="4" />
      <circle cx={finish.split(',')[0]} cy={finish.split(',')[1]} r="11" fill={palette.coral} stroke="#fff1e9" strokeWidth="4" />
      <text x="42" y="42" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="18" letterSpacing="2">ROUTE VIEW · OFFLINE FALLBACK</text>
    </svg>
  );
}

function RideMap({ detail, progressIndex }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const routeSourceRef = useRef(null);
  const [mapFailed, setMapFailed] = useState(false);
  const points = detail?.points || [];

  useEffect(() => {
    if (!containerRef.current || points.length < 2 || !window.maplibregl) {
      setMapFailed(true);
      return undefined;
    }
    const bounds = routeBounds(points);
    const map = new window.maplibregl.Map({
      container: containerRef.current,
      center: [(bounds.minLon + bounds.maxLon) / 2, (bounds.minLat + bounds.maxLat) / 2],
      zoom: 11,
      pitch: 48,
      bearing: -12,
      attributionControl: true,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.75, 'raster-contrast': 0.2, 'raster-brightness-min': 0.05, 'raster-brightness-max': 0.48 } }],
      },
    });
    mapRef.current = map;
    map.on('error', () => setMapFailed(true));
    map.on('load', () => {
      map.fitBounds([[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]], { padding: 42, maxZoom: 14, duration: 0 });
      map.addSource('ride-route', { type: 'geojson', data: progressGeoJson(points) });
      routeSourceRef.current = map.getSource('ride-route');
      map.addLayer({
        id: 'ride-route', type: 'line', source: 'ride-route',
        paint: { 'line-color': ['match', ['get', 'effort'], 'hard', palette.coral, 'moderate', palette.amber, 'easy', palette.teal, palette.cyan], 'line-width': 5, 'line-opacity': 0.95 },
      });
    });
    return () => { map.remove(); mapRef.current = null; routeSourceRef.current = null; };
  }, [detail?.sourceId]);

  useEffect(() => {
    if (routeSourceRef.current) routeSourceRef.current.setData(progressGeoJson(points.slice(0, Math.max(2, progressIndex + 1))));
  }, [points, progressIndex]);

  return (
    <div style={{ position: 'relative', height: 300, overflow: 'hidden', background: '#081522', borderRadius: 10, border: `1px solid ${palette.line}` }}>
      {!mapFailed && <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />}
      {mapFailed && <RouteSvg detail={detail} progressIndex={progressIndex} compact />}
      <div style={{ position: 'absolute', top: 12, left: 12, padding: '5px 9px', borderRadius: 4, background: 'rgba(7,17,29,0.85)', color: palette.cyan, fontFamily: C.fMono, fontSize: 9, letterSpacing: 1 }}>REAL ROUTE · {mapFailed ? 'VECTOR MODE' : 'MAP MODE'}</div>
    </div>
  );
}

function ThreeTerrain({ detail }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const THREE = window.THREE;
    const canvas = canvasRef.current;
    if (!THREE || !canvas || !detail?.points?.length) return undefined;
    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || 150;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 7, 13);
    camera.lookAt(0, 0, 0);
    const group = new THREE.Group();
    const points = detail.points.filter(point => point.smoothedAltitude != null).slice(0, 180);
    const min = Math.min(...points.map(point => point.smoothedAltitude));
    const max = Math.max(...points.map(point => point.smoothedAltitude));
    const span = Math.max(1, max - min);
    const vertices = [];
    points.forEach((point, index) => {
      const x = points.length > 1 ? (index / (points.length - 1) - 0.5) * 12 : 0;
      const z = ((point.smoothedAltitude - min) / span - 0.5) * 3;
      vertices.push(x, -1.2, z, x, 0.0, z);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.LineBasicMaterial({ color: 0x18e0e7, transparent: true, opacity: 0.95 });
    group.add(new THREE.LineSegments(geometry, material));
    const grid = new THREE.GridHelper(14, 14, 0x1b4b68, 0x102c40);
    grid.rotation.x = Math.PI / 2;
    grid.position.y = -1.22;
    group.add(grid);
    scene.add(group);
    let frame;
    const animate = () => { group.rotation.y = -0.22 + Math.sin(Date.now() / 6000) * 0.04; renderer.render(scene, camera); frame = requestAnimationFrame(animate); };
    animate();
    return () => { cancelAnimationFrame(frame); geometry.dispose(); material.dispose(); renderer.dispose(); };
  }, [detail]);
  return <canvas ref={canvasRef} style={{ width: '100%', height: 150, display: 'block' }} aria-label="Three dimensional elevation terrain" />;
}

function ProfileChart({ points = [], field, color, label, units = '' }) {
  const valid = points.filter(point => point[field] != null);
  if (valid.length < 2) return <div style={{ color: palette.muted, padding: 16 }}>Not enough {label.toLowerCase()} samples.</div>;
  const values = valid.map(point => Number(point[field]));
  const min = Math.min(...values); const max = Math.max(...values); const span = Math.max(1, max - min);
  const xy = point => `${20 + (point.distanceKm / Math.max(0.01, points.at(-1)?.distanceKm || 1)) * 460},${110 - ((Number(point[field]) - min) / span) * 82}`;
  const path = valid.map(xy).join(' ');
  return (
    <div style={{ padding: '10px 10px 2px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: palette.muted, fontFamily: C.fMono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}><span>{label}</span><span>{Math.round(min)}–{Math.round(max)} {units}</span></div>
      <svg viewBox="0 0 500 130" style={{ width: '100%', height: 130, display: 'block' }} role="img" aria-label={`${label} chart`}>
        <path d="M20 110 H480 M20 69 H480 M20 28 H480" stroke="#1b4b68" strokeDasharray="4 8" fill="none" />
        <polyline points={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="20" y="127" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="9">0 km</text>
        <text x="428" y="127" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="9">{Math.round(points.at(-1)?.distanceKm || 0)} km</text>
      </svg>
    </div>
  );
}

function Metric({ value, label, color = palette.cyan }) {
  return <div style={{ flex: 1, minWidth: 90, padding: '10px 9px', borderRight: `1px solid ${palette.line}` }}><div style={{ color, fontFamily: C.fMono, fontSize: 20, fontWeight: 700 }}>{value}</div><div style={{ color: palette.muted, fontFamily: C.fMono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>{label}</div></div>;
}

export default function RideDetail({ ride, detail, loading, onBack, onLoad }) {
  const [tab, setTab] = useState('map');
  const [progressIndex, setProgressIndex] = useState(() => Math.max(1, (detail?.points?.length || 2) - 1));
  const [playing, setPlaying] = useState(false);
  const maxIndex = Math.max(1, (detail?.points?.length || 2) - 1);

  useEffect(() => {
    setProgressIndex(maxIndex);
    setPlaying(false);
  }, [detail?.sourceId, maxIndex]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setProgressIndex(index => {
        if (index >= maxIndex) { setPlaying(false); return maxIndex; }
        return Math.min(maxIndex, index + Math.max(1, Math.round(maxIndex / 160)));
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, maxIndex]);

  const currentPoint = detail?.points?.[Math.min(progressIndex, maxIndex)] || detail?.points?.at(-1);
  const isManual = !ride?.sourceId && !ride?.source_id;
  if (loading) return <div style={{ minHeight: '80vh', background: palette.bg, color: palette.cyan, padding: 24, fontFamily: C.fMono, letterSpacing: 1 }}>LOADING RIDE ROUTE…</div>;

  return (
    <div style={{ minHeight: '100vh', background: palette.bg, color: palette.text, padding: '14px 12px 100px', fontFamily: C.fBody }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 0, color: palette.muted, fontFamily: C.fMono, fontSize: 11, letterSpacing: 1, padding: '4px 0 14px', cursor: 'pointer' }}>← BACK TO RIDES</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div><div style={{ color: palette.cyan, fontFamily: C.fMono, fontSize: 10, letterSpacing: 2 }}>RIDE COMPLETE</div><h1 style={{ margin: '3px 0 4px', fontFamily: C.fDisplay, fontSize: 34, textTransform: 'uppercase', lineHeight: 0.95 }}>{ride?.type === 'moderate' ? 'Outdoor cycling' : `${ride?.type || 'Cycling'} ride`}</h1><div style={{ color: palette.muted, fontSize: 13 }}>{formatDate(ride?.date)} {ride?.date && `· ${formatClock(ride.date)}`}</div></div>
        <div style={{ ...pillStyle(palette.blue), whiteSpace: 'nowrap' }}>{ride?.source === 'apple_health' ? 'Apple Watch' : 'Manual ride'}</div>
      </div>

      {isManual ? (
        <div style={panelStyle}><div style={eyebrowStyle}>NO GPS ROUTE</div><p style={{ color: palette.muted, lineHeight: 1.5, margin: '8px 0 0' }}>This manually logged ride has summary data but no Apple Watch route to replay.</p></div>
      ) : detail?.ok === false ? (
        <div style={panelStyle}><div style={eyebrowStyle}>ROUTE UNAVAILABLE</div><p style={{ color: palette.muted, lineHeight: 1.5, margin: '8px 0 0' }}>{detail.error || 'The Apple Watch route could not be loaded.'}</p></div>
      ) : detail ? (
        <>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 10, padding: 5, marginBottom: 10 }}>
            {['map', 'effort', 'elevation', 'speed'].map(item => <button key={item} onClick={() => setTab(item)} style={{ flex: 1, minWidth: 75, border: 0, borderRadius: 7, padding: '9px 7px', background: tab === item ? palette.cyan : 'transparent', color: tab === item ? palette.bg : palette.muted, fontFamily: C.fMono, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>{item}</button>)}
          </div>
          {tab === 'map' && <div style={{ ...panelStyle, padding: 8 }}><RideMap detail={detail} progressIndex={progressIndex} /><ThreeTerrain detail={detail} /></div>}
          {tab === 'effort' && <div style={panelStyle}><ProfileChart points={detail.points} field="heartRate" color={palette.coral} label="Heart rate" units="bpm" /><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 10px 10px' }}>{['easy', 'steady', 'moderate', 'hard'].map(item => <span key={item} style={{ ...pillStyle(effortColor(item)), textTransform: 'capitalize' }}>{item}</span>)}</div></div>}
          {tab === 'elevation' && <div style={panelStyle}><ProfileChart points={detail.points} field="smoothedAltitude" color={palette.amber} label="Elevation" units="m" /><div style={statLine('Ascent', `+${detail.ascent ?? '—'} m`, palette.amber)} /><div style={statLine('Descent', `−${detail.descent ?? '—'} m`, palette.blue)} /></div>}
          {tab === 'speed' && <div style={panelStyle}><ProfileChart points={detail.points} field="speed" color={palette.blue} label="Speed" units="m/s" /><div style={statLine('Fastest sampled speed', detail.maxSpeedKmh != null ? `${detail.maxSpeedKmh} km/h` : 'Unavailable', palette.blue)} /></div>}

          <div style={{ ...panelStyle, display: 'flex', overflowX: 'auto', padding: 0, marginTop: 10 }}>
            <Metric value={`${finite(detail.distance, finite(ride.distance)).toFixed(2)} km`} label="Distance" />
            <Metric value={`${Math.round(finite(detail.duration, ride.duration))} min`} label="Duration" color={palette.blue} />
            <Metric value={`${Math.round(finite(detail.activeCalories, ride.activeCalories))} kcal`} label="Energy" color={palette.amber} />
            <Metric value={`${Math.round(finite(detail.averageHeartRate, ride.averageHeartRate))} bpm`} label="Avg HR" color={palette.teal} />
            <Metric value={`${Math.round(finite(detail.peakHeartRate, ride.peakHeartRate))} bpm`} label="Peak HR" color={palette.coral} />
          </div>

          <div style={{ ...panelStyle, marginTop: 10 }}>
            <div style={eyebrowStyle}>RIDE SIGNAL</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
              <div><div style={{ color: palette.amber, fontSize: 19, fontFamily: C.fMono }}>+{detail.ascent ?? '—'}m</div><div style={{ color: palette.muted, fontSize: 10 }}>ASCENT</div></div>
              <div><div style={{ color: palette.cyan, fontSize: 19, fontFamily: C.fMono }}>{detail.routePointCount}</div><div style={{ color: palette.muted, fontSize: 10 }}>GPS POINTS</div></div>
              <div><div style={{ color: detail.confidence === 'good' ? palette.teal : palette.amber, fontSize: 19, fontFamily: C.fMono, textTransform: 'capitalize' }}>{detail.confidence}</div><div style={{ color: palette.muted, fontSize: 10 }}>DATA QUALITY</div></div>
            </div>
            <p style={{ color: palette.text, lineHeight: 1.45, margin: '14px 0 0' }}>Your route data combines GPS position, altitude, speed, and heart-rate timing. Elevation totals are estimates because GPS altitude can be noisy.</p>
          </div>

          <div style={{ ...panelStyle, marginTop: 10 }}>
            <div style={eyebrowStyle}>REPLAY ROUTE</div>
            <div style={{ color: palette.muted, fontFamily: C.fMono, fontSize: 10, margin: '7px 0 10px' }}>{Math.round((currentPoint?.normalizedDistance || 1) * finite(detail.distance, ride.distance))} km / {finite(detail.distance, ride.distance).toFixed(2)} km</div>
            <input aria-label="Replay route position" type="range" min="1" max={maxIndex} value={Math.min(maxIndex, progressIndex)} onChange={event => { setPlaying(false); setProgressIndex(Number(event.target.value)); }} style={{ width: '100%', accentColor: palette.cyan }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => { setProgressIndex(1); setPlaying(true); }} style={{ ...buttonStyle(palette.cyan, palette.bg), flex: 1 }}>{playing ? 'Pause replay' : 'Replay route'}</button>
              <button onClick={() => { setPlaying(false); setProgressIndex(maxIndex); }} style={{ ...buttonStyle('transparent', palette.text), border: `1px solid ${palette.line}` }}>Reset</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const panelStyle = { background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 10, padding: 14 };
const eyebrowStyle = { color: palette.cyan, fontFamily: C.fMono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' };
const pillStyle = color => ({ display: 'inline-flex', alignItems: 'center', border: `1px solid ${color}80`, background: `${color}20`, color, borderRadius: 16, padding: '5px 9px', fontFamily: C.fMono, fontSize: 10 });
const buttonStyle = (background, color) => ({ background, color, border: 0, borderRadius: 7, padding: '11px 14px', fontFamily: C.fMono, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' });
const statLine = (label, value, color) => <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${palette.line}`, padding: '10px 0 0', marginTop: 5, color: palette.muted, fontFamily: C.fMono, fontSize: 11 }}><span>{label}</span><strong style={{ color }}>{value}</strong></div>;
