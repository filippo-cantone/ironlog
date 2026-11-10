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
      map.addLayer({
        id: 'ride-route-glow', type: 'line', source: 'ride-route',
        paint: { 'line-color': palette.cyan, 'line-width': 13, 'line-opacity': 0.18, 'line-blur': 3 },
      }, 'ride-route');
    });
    return () => { map.remove(); mapRef.current = null; routeSourceRef.current = null; };
  }, [detail?.sourceId]);

  useEffect(() => {
    if (routeSourceRef.current) routeSourceRef.current.setData(progressGeoJson(points.slice(0, Math.max(2, progressIndex + 1))));
  }, [points, progressIndex]);

  return (
    <div style={{ position: 'relative', height: 370, overflow: 'hidden', background: '#081522', borderRadius: 10, border: `1px solid ${palette.line}`, boxShadow: `0 0 24px ${palette.cyan}18 inset` }}>
      {!mapFailed && <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />}
      {mapFailed && <RouteSvg detail={detail} progressIndex={progressIndex} compact />}
      <div style={{ position: 'absolute', top: 12, left: 12, padding: '7px 11px', borderRadius: 5, background: 'rgba(7,17,29,0.9)', color: palette.cyan, fontFamily: C.fMono, fontSize: 10, letterSpacing: 1.5, boxShadow: `0 0 14px ${palette.cyan}30` }}>REAL ROUTE · {mapFailed ? 'VECTOR MODE' : 'MAP MODE'}</div>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, maxWidth: '54%' }}>
        {routeMoments(detail).map(moment => <div key={moment.label} style={{ background: 'rgba(7,17,29,0.92)', border: `1px solid ${moment.color}`, borderRadius: 7, padding: '6px 9px', color: moment.color, fontFamily: C.fMono, fontSize: 9, letterSpacing: 0.8, textAlign: 'right', boxShadow: `0 0 14px ${moment.color}25` }}><strong style={{ display: 'block', fontSize: 9 }}>{moment.label}</strong><span style={{ color: palette.text }}>{moment.value}</span></div>)}
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <span style={{ ...routeMarkerStyle(palette.teal), borderRadius: '5px 18px 18px 5px' }}>● START</span>
        <span style={{ ...routeMarkerStyle(palette.coral), borderRadius: '18px 5px 5px 18px' }}>FINISH ●</span>
      </div>
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
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (error) {
      console.warn('IronLog ride terrain unavailable:', error);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 2.4, 11);
    camera.lookAt(0, 0, 0);
    const group = new THREE.Group();
    const points = detail.points.filter(point => point.smoothedAltitude != null).slice(0, 180);
    if (!points.length) return undefined;
    const min = Math.min(...points.map(point => point.smoothedAltitude));
    const max = Math.max(...points.map(point => point.smoothedAltitude));
    const span = Math.max(1, max - min);
    const vertices = [];
    const profileVertices = [];
    points.forEach((point, index) => {
      const x = points.length > 1 ? (index / (points.length - 1) - 0.5) * 12 : 0;
      const y = ((point.smoothedAltitude - min) / span) * 3.7 - 1.35;
      vertices.push(x, -1.35, 0, x, y, 0);
      profileVertices.push(x, y, 0);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.LineBasicMaterial({ color: 0x18e0e7, transparent: true, opacity: 0.95 });
    group.add(new THREE.LineSegments(geometry, material));
    const profileGeometry = new THREE.BufferGeometry();
    profileGeometry.setAttribute('position', new THREE.Float32BufferAttribute(profileVertices, 3));
    const profileMaterial = new THREE.LineBasicMaterial({ color: 0x9dffff, transparent: true, opacity: 0.9 });
    group.add(new THREE.Line(profileGeometry, profileMaterial));
    const grid = new THREE.GridHelper(14, 14, 0x1b4b68, 0x102c40);
    grid.rotation.x = Math.PI / 2;
    grid.position.y = -1.22;
    group.add(grid);
    scene.add(group);
    let frame;
    const animate = () => { group.rotation.y = -0.22 + Math.sin(Date.now() / 6000) * 0.04; renderer.render(scene, camera); frame = requestAnimationFrame(animate); };
    animate();
    return () => { cancelAnimationFrame(frame); geometry.dispose(); material.dispose(); profileGeometry.dispose(); profileMaterial.dispose(); renderer.dispose(); };
  }, [detail]);
  return <canvas ref={canvasRef} style={{ width: '100%', height: 180, display: 'block' }} aria-label="Three dimensional elevation terrain" />;
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
  return <div style={{ flex: 1, minWidth: 104, padding: '13px 11px', borderRight: `1px solid ${palette.line}` }}><div style={{ color, fontFamily: C.fMono, fontSize: 23, fontWeight: 700, lineHeight: 1.05 }}>{value}</div><div style={{ color: palette.muted, fontFamily: C.fMono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 6 }}>{label}</div></div>;
}

function routeDistance(detail, index) {
  const point = detail?.points?.[Math.max(0, index)] || detail?.points?.at(-1);
  return point?.distanceKm == null ? null : Number(point.distanceKm).toFixed(1);
}

function routeMoments(detail) {
  return [
    detail?.strongestClimbIndex >= 0 && { label: 'STRONGEST CLIMB', value: `+${detail.strongestClimbGain ?? '—'} m · ${routeDistance(detail, detail.strongestClimbIndex)} km`, color: palette.amber },
    detail?.peakHeartIndex >= 0 && { label: 'PEAK HEART RATE', value: `${detail.peakHeartRate ?? '—'} bpm · ${routeDistance(detail, detail.peakHeartIndex)} km`, color: palette.coral },
    detail?.recoveryIndex >= 0 && { label: 'RECOVERY POINT', value: `HR settled · ${routeDistance(detail, detail.recoveryIndex)} km`, color: palette.teal },
  ].filter(Boolean);
}

function RouteProfile({ detail }) {
  const points = detail?.points || [];
  const altitudePoints = points.filter(point => point.smoothedAltitude != null);
  if (altitudePoints.length < 2) return null;
  const width = 1000;
  const height = 300;
  const plotLeft = 72;
  const plotRight = 950;
  const plotTop = 46;
  const plotBottom = 205;
  const maxDistance = Math.max(0.01, points.at(-1)?.distanceKm || detail.distance || 1);
  const altValues = altitudePoints.map(point => point.smoothedAltitude);
  const minAlt = Math.min(...altValues);
  const maxAlt = Math.max(...altValues);
  const altSpan = Math.max(1, maxAlt - minAlt);
  const x = point => plotLeft + (Number(point.distanceKm || 0) / maxDistance) * (plotRight - plotLeft);
  const y = point => plotBottom - ((Number(point.smoothedAltitude) - minAlt) / altSpan) * (plotBottom - plotTop);
  const elevationPath = altitudePoints.map((point, index) => `${index ? 'L' : 'M'}${x(point).toFixed(1)},${y(point).toFixed(1)}`).join(' ');
  const areaPath = `${elevationPath} L${x(altitudePoints.at(-1)).toFixed(1)},${plotBottom} L${x(altitudePoints[0]).toFixed(1)},${plotBottom} Z`;
  const marker = (index, label, color, yOffset = 25) => {
    const point = points[index];
    if (!point) return null;
    const markerX = x(point);
    return <g key={`${label}-${index}`}><line x1={markerX} x2={markerX} y1={plotTop - 3} y2={plotBottom + 18} stroke={color} strokeDasharray="4 7" opacity="0.7" /><circle cx={markerX} cy={y(point)} r="7" fill={color} stroke="#d9ffff" strokeWidth="3" /><rect x={Math.max(plotLeft, Math.min(plotRight - 155, markerX - 70))} y={yOffset} width="150" height="25" rx="6" fill="#07111d" stroke={color} strokeWidth="1.5" /><text x={Math.max(plotLeft + 8, Math.min(plotRight - 147, markerX - 62))} y={yOffset + 16} fill={color} fontFamily="JetBrains Mono" fontSize="10" letterSpacing="1">{label}</text></g>;
  };
  return (
    <div style={{ ...panelStyle, marginTop: 10, padding: '16px 10px 10px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 10px 8px' }}><div style={eyebrowStyle}>RIDE PROFILE</div><div style={{ color: palette.muted, fontFamily: C.fMono, fontSize: 10 }}>0–{Number(detail.distance || maxDistance).toFixed(2)} KM</div></div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', width: '100%', height: 'auto', minHeight: 210 }} role="img" aria-label="Elevation profile and heart rate effort ribbon">
        <defs><linearGradient id="ride-elevation-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={palette.cyan} stopOpacity="0.55" /><stop offset="1" stopColor={palette.cyan} stopOpacity="0.04" /></linearGradient></defs>
        {[plotTop, plotTop + 53, plotTop + 106, plotBottom].map(lineY => <line key={lineY} x1={plotLeft} x2={plotRight} y1={lineY} y2={lineY} stroke={palette.line} strokeDasharray="5 10" />)}
        <text x="14" y="52" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="11">{Math.round(maxAlt)} m</text>
        <text x="14" y="208" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="11">{Math.round(minAlt)} m</text>
        <text x="20" y="27" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="11" letterSpacing="1">ELEVATION (M)</text>
        <path d={areaPath} fill="url(#ride-elevation-fill)" />
        <path d={elevationPath} fill="none" stroke={palette.cyan} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {marker(detail.strongestClimbIndex, 'CLIMB', palette.amber, 7)}
        {marker(detail.peakHeartIndex, 'PEAK HR', palette.coral, 37)}
        {marker(detail.recoveryIndex, 'RECOVERY', palette.teal, 67)}
        {points.map((point, index) => <rect key={`ribbon-${index}`} x={x(point)} y="232" width={Math.max(1.2, (plotRight - plotLeft) / Math.max(1, points.length)) + 0.8} height="18" rx="2" fill={effortColor(point.effort)} opacity="0.95" />)}
        <text x="20" y="246" fill={palette.text} fontFamily="JetBrains Mono" fontSize="11">HEART RATE</text>
        <text x={plotLeft} y="280" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="11">0 km</text>
        <text x={(plotLeft + plotRight) / 2 - 18} y="280" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="11">{(Number(detail.distance || maxDistance) / 2).toFixed(1)} km</text>
        <text x={plotRight - 36} y="280" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="11">{Number(detail.distance || maxDistance).toFixed(1)} km</text>
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '5px 10px 0', color: palette.muted, fontFamily: C.fMono, fontSize: 9 }}>
        {['easy', 'steady', 'moderate', 'hard'].map(item => <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: '50%', background: effortColor(item), display: 'inline-block' }} />{item}</span>)}
      </div>
    </div>
  );
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
  const strongestClimbGain = detail?.strongestClimbGain ?? detail?.ascent ?? null;
  const rideStory = strongestClimbGain > 0
    ? `Your strongest rise added ${strongestClimbGain} m of elevation. Heart rate peaked at ${detail?.peakHeartRate ?? '—'} bpm.`
    : `This was a mostly level route. Your peak heart rate reached ${detail?.peakHeartRate ?? '—'} bpm across the ride.`;
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
          {tab === 'map' && <div style={{ ...panelStyle, padding: 8 }}><RideMap detail={detail} progressIndex={progressIndex} /><div style={{ margin: '5px -1px -5px', borderTop: `1px solid ${palette.line}` }}><ThreeTerrain detail={detail} /></div></div>}
          {tab === 'map' && <RouteProfile detail={detail} />}

          <div style={{ ...panelStyle, display: 'flex', overflowX: 'auto', padding: 0, marginTop: 10 }}>
            <Metric value={`${finite(detail.distance, finite(ride.distance)).toFixed(2)} km`} label="Distance" />
            <Metric value={`${Math.round(finite(detail.duration, ride.duration))} min`} label="Duration" color={palette.blue} />
            <Metric value={`${Math.round(finite(detail.activeCalories, ride.activeCalories))} kcal`} label="Energy" color={palette.amber} />
            <Metric value={`${Math.round(finite(detail.averageHeartRate, ride.averageHeartRate))} bpm`} label="Avg HR" color={palette.teal} />
            <Metric value={`${Math.round(finite(detail.peakHeartRate, ride.peakHeartRate))} bpm`} label="Peak HR" color={palette.coral} />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ color: palette.text, fontFamily: C.fDisplay, fontSize: 23, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>EXPLORE THE RIDE</div>
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto', background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 10, padding: 4 }}>
              {['map', 'effort', 'elevation', 'speed'].map(item => <button key={item} onClick={() => setTab(item)} style={{ flex: 1, minWidth: 82, border: 0, borderRadius: 7, padding: '11px 8px', background: tab === item ? palette.cyan : 'transparent', color: tab === item ? palette.bg : palette.muted, fontFamily: C.fMono, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer', boxShadow: tab === item ? `0 0 18px ${palette.cyan}70` : 'none' }}>{item}</button>)}
            </div>
          </div>

          {tab === 'effort' && <div style={{ ...panelStyle, marginTop: 10 }}><ProfileChart points={detail.points} field="heartRate" color={palette.coral} label="Heart rate" units="bpm" /><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 10px 10px' }}>{['easy', 'steady', 'moderate', 'hard'].map(item => <span key={item} style={{ ...pillStyle(effortColor(item)), textTransform: 'capitalize' }}>{item}</span>)}</div></div>}
          {tab === 'elevation' && <div style={{ ...panelStyle, marginTop: 10 }}><ProfileChart points={detail.points} field="smoothedAltitude" color={palette.amber} label="Elevation" units="m" />{statLine('Ascent', `+${detail.ascent ?? '—'} m`, palette.amber)}{statLine('Descent', `−${detail.descent ?? '—'} m`, palette.blue)}</div>}
          {tab === 'speed' && <div style={{ ...panelStyle, marginTop: 10 }}><ProfileChart points={detail.points} field="speed" color={palette.blue} label="Speed" units="m/s" />{statLine('Fastest sampled speed', detail.maxSpeedKmh != null ? `${detail.maxSpeedKmh} km/h` : 'Unavailable', palette.blue)}</div>}

          <div style={{ ...panelStyle, marginTop: 10 }}>
            <div style={eyebrowStyle}>RIDE SIGNAL</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
              <div><div style={{ color: palette.amber, fontSize: 19, fontFamily: C.fMono }}>+{detail.ascent ?? '—'}m</div><div style={{ color: palette.muted, fontSize: 10 }}>ASCENT</div></div>
              <div><div style={{ color: palette.cyan, fontSize: 19, fontFamily: C.fMono }}>{detail.routePointCount}</div><div style={{ color: palette.muted, fontSize: 10 }}>GPS POINTS</div></div>
              <div><div style={{ color: detail.confidence === 'good' ? palette.teal : palette.amber, fontSize: 19, fontFamily: C.fMono, textTransform: 'capitalize' }}>{detail.confidence}</div><div style={{ color: palette.muted, fontSize: 10 }}>DATA QUALITY</div></div>
            </div>
            <p style={{ color: palette.text, lineHeight: 1.45, margin: '14px 0 0' }}>Your route data combines GPS position, altitude, speed, and heart-rate timing. Elevation totals are estimates because GPS altitude can be noisy.</p>
          </div>

          <div style={{ ...panelStyle, marginTop: 10, background: `linear-gradient(115deg, ${palette.panelRaised}, ${palette.panel})`, borderColor: `${palette.amber}80` }}>
            <div style={{ color: palette.amber, fontFamily: C.fMono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>SESSION HIGHLIGHTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
              <div><div style={{ color: palette.amber, fontFamily: C.fMono, fontSize: 16 }}>+{strongestClimbGain ?? '—'} m</div><div style={{ color: palette.muted, fontFamily: C.fMono, fontSize: 9, textTransform: 'uppercase' }}>Strongest climb</div></div>
              <div><div style={{ color: palette.coral, fontFamily: C.fMono, fontSize: 16 }}>{detail.peakHeartRate ?? '—'} bpm</div><div style={{ color: palette.muted, fontFamily: C.fMono, fontSize: 9, textTransform: 'uppercase' }}>Peak effort</div></div>
              <div><div style={{ color: palette.blue, fontFamily: C.fMono, fontSize: 16 }}>{detail.maxSpeedKmh ?? '—'} km/h</div><div style={{ color: palette.muted, fontFamily: C.fMono, fontSize: 9, textTransform: 'uppercase' }}>Fastest sample</div></div>
            </div>
          </div>

          <div style={{ ...panelStyle, marginTop: 10, borderColor: `${palette.amber}90`, background: `linear-gradient(110deg, ${palette.panelRaised}, ${palette.panel})`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: palette.amber, fontSize: 27, lineHeight: 1 }}>★</div>
            <div style={{ color: palette.text, fontSize: 15, lineHeight: 1.35, fontStyle: 'italic' }}>{rideStory}</div>
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
const routeMarkerStyle = color => ({ padding: '6px 10px', background: 'rgba(7,17,29,0.92)', border: `1px solid ${color}`, color, fontFamily: C.fMono, fontSize: 10, letterSpacing: 1, boxShadow: `0 0 12px ${color}40` });
const buttonStyle = (background, color) => ({ background, color, border: 0, borderRadius: 7, padding: '11px 14px', fontFamily: C.fMono, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' });
const statLine = (label, value, color) => <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${palette.line}`, padding: '10px 0 0', marginTop: 5, color: palette.muted, fontFamily: C.fMono, fontSize: 11 }}><span>{label}</span><strong style={{ color }}>{value}</strong></div>;
