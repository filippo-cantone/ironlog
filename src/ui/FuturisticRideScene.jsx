import React, { useEffect, useRef } from '../runtime.js';
import theme from './theme.js';
import rideReplay from '../domain/rideReplay.js';

const { C } = theme;
const { projectRoutePoints, routeMarkerIndexes } = rideReplay;

const palette = {
  bg: '#07111d', panel: '#0d1b2b', line: '#1b4b68', text: '#f2f7ff', muted: '#8ea8bb',
  cyan: '#18e0e7', blue: '#4a9dff', teal: '#1fc8aa', amber: '#ffb52e', coral: '#ff6f61',
};

const effortColor = effort => ({ easy: palette.teal, steady: palette.blue, moderate: palette.amber, hard: palette.coral }[effort] || palette.blue);

function routeDistance(detail, index) {
  const point = detail?.points?.[Math.max(0, index)] || detail?.points?.at(-1);
  return point?.distanceKm == null ? null : Number(point.distanceKm).toFixed(1);
}

function moments(detail) {
  return [
    detail?.strongestClimbIndex >= 0 && { key: 'climb', index: detail.strongestClimbIndex, label: 'STRONGEST CLIMB', value: `+${detail.strongestClimbGain ?? '—'} m · ${routeDistance(detail, detail.strongestClimbIndex)} km`, color: palette.amber },
    detail?.peakHeartIndex >= 0 && { key: 'heart', index: detail.peakHeartIndex, label: 'PEAK HEART RATE', value: `${detail.peakHeartRate ?? '—'} bpm · ${routeDistance(detail, detail.peakHeartIndex)} km`, color: palette.coral },
    detail?.recoveryIndex >= 0 && { key: 'recovery', index: detail.recoveryIndex, label: 'RECOVERY POINT', value: `HR settled · ${routeDistance(detail, detail.recoveryIndex)} km`, color: palette.teal },
    detail?.fastestIndex >= 0 && detail?.maxSpeedKmh != null && { key: 'speed', index: detail.fastestIndex, label: 'FASTEST SECTION', value: `${detail.maxSpeedKmh} km/h · ${routeDistance(detail, detail.fastestIndex)} km`, color: palette.blue },
  ].filter(Boolean);
}

function TerrainCanvas({ detail, height = 310 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const THREE = window.THREE;
    const canvas = canvasRef.current;
    if (!THREE || !canvas || !detail?.points?.length) return undefined;
    const width = canvas.clientWidth || 600;
    const canvasHeight = canvas.clientHeight || height;
    const points = detail.points.filter(point => point.smoothedAltitude != null).slice(0, 180);
    if (!points.length) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (error) {
      console.warn('IronLog futuristic terrain unavailable:', error);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, canvasHeight, false);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / canvasHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 11);
    camera.lookAt(0, 0, 0);
    const group = new THREE.Group();
    const min = Math.min(...points.map(point => point.smoothedAltitude));
    const max = Math.max(...points.map(point => point.smoothedAltitude));
    const span = Math.max(1, max - min);
    const vertices = [];
    const profile = [];
    points.forEach((point, index) => {
      const x = points.length > 1 ? (index / (points.length - 1) - 0.5) * 12 : 0;
      const y = ((point.smoothedAltitude - min) / span) * 3.7 - 1.35;
      vertices.push(x, -1.35, 0, x, y, 0);
      profile.push(x, y, 0);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.LineBasicMaterial({ color: 0x18e0e7, transparent: true, opacity: 0.9 });
    group.add(new THREE.LineSegments(geometry, material));
    const profileGeometry = new THREE.BufferGeometry();
    profileGeometry.setAttribute('position', new THREE.Float32BufferAttribute(profile, 3));
    const profileMaterial = new THREE.LineBasicMaterial({ color: 0x9dffff, transparent: true, opacity: 0.88 });
    group.add(new THREE.Line(profileGeometry, profileMaterial));
    const grid = new THREE.GridHelper(14, 14, 0x1b4b68, 0x102c40);
    grid.rotation.x = Math.PI / 2;
    grid.position.y = -1.22;
    group.add(grid);
    scene.add(group);
    let frame;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const animate = () => {
      if (!reduceMotion) group.rotation.y = -0.22 + Math.sin(Date.now() / 6000) * 0.04;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      geometry.dispose(); material.dispose(); profileGeometry.dispose(); profileMaterial.dispose(); renderer.dispose();
    };
  }, [detail, height]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height, display: 'block', opacity: 0.9 }} aria-label="Three dimensional elevation terrain" />;
}

function Callout({ point, label, value, color, dx = 0, dy = -88 }) {
  if (!point) return null;
  const x = Math.max(22, Math.min(784, point.x + dx));
  const y = Math.max(48, Math.min(360, point.y + dy));
  return <g>
    <line x1={point.x} y1={point.y} x2={x + 88} y2={y + 48} stroke={color} strokeWidth="2" strokeDasharray="5 6" opacity="0.82" />
    <circle cx={point.x} cy={point.y} r="8" fill={color} stroke="#d9ffff" strokeWidth="3" />
    <rect x={x} y={y} width="198" height="58" rx="9" fill="#07111d" stroke={color} strokeWidth="2" />
    <circle cx={x + 18} cy={y + 18} r="6" fill={color} opacity="0.95" />
    <text x={x + 31} y={y + 21} fill={color} fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" letterSpacing="0.8">{label}</text>
    <text x={x + 13} y={y + 43} fill={palette.text} fontFamily="JetBrains Mono" fontSize="10">{value}</text>
  </g>;
}

export default function FuturisticRideScene({ detail, progressIndex, onRealMap }) {
  const points = detail?.points || [];
  const projected = projectRoutePoints(points);
  if (!projected.some(Boolean) || points.length < 2) return <div style={{ minHeight: 430, display: 'grid', placeItems: 'center', color: palette.muted }}>GPS route unavailable</div>;
  const visible = points.slice(0, Math.max(2, Math.min(points.length, progressIndex + 1)));
  const fullPath = projected.filter(Boolean).map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const visiblePath = projected.slice(0, visible.length).filter(Boolean).map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const altitude = points.filter(point => point.smoothedAltitude != null);
  const minAltitude = altitude.length ? Math.min(...altitude.map(point => point.smoothedAltitude)) : 0;
  const maxAltitude = altitude.length ? Math.max(...altitude.map(point => point.smoothedAltitude)) : 1;
  const altitudeSpan = Math.max(1, maxAltitude - minAltitude);
  const terrain = altitude.length > 1 ? altitude.slice(0, 90).map((point, index) => {
    const x = 42 + (index / Math.max(1, altitude.length - 1)) * 916;
    const y = 152 - ((point.smoothedAltitude - minAltitude) / altitudeSpan) * 92;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') : '42,168 220,128 430,150 650,108 958,150';
  const markerIndexes = routeMarkerIndexes(points);
  const byKey = key => moments(detail).find(moment => moment.key === key);

  return (
    <div style={{ position: 'relative', minHeight: 690, overflow: 'hidden', borderRadius: 10, border: `1px solid ${palette.line}`, background: 'radial-gradient(circle at 50% 14%, #16445b 0%, #071522 46%, #030810 100%)', boxShadow: `0 0 40px ${palette.cyan}25 inset` }}>
      <TerrainCanvas detail={detail} />
      <svg viewBox="0 0 1000 560" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} role="img" aria-label="Futuristic route replay scene using the real GPS route">
        <defs>
          <linearGradient id="scene-ground" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0e3546" stopOpacity="0.18" /><stop offset="1" stopColor="#02070d" stopOpacity="0.9" /></linearGradient>
          <filter id="scene-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="scene-soft-glow"><feGaussianBlur stdDeviation="12" /></filter>
          <pattern id="scene-grid" width="54" height="32" patternUnits="userSpaceOnUse"><path d="M54 0H0V32" fill="none" stroke="#16445c" strokeWidth="1" opacity="0.48" /></pattern>
        </defs>
        <rect width="1000" height="560" fill="url(#scene-ground)" />
        <polyline points={terrain} fill="none" stroke="#19c9d6" strokeWidth="18" opacity="0.08" filter="url(#scene-soft-glow)" />
        <polyline points={terrain} fill="none" stroke="#2ce4ec" strokeWidth="2" opacity="0.72" />
        {[18, 34, 52, 72].map(offset => <polyline key={offset} points={terrain.split(' ').map(pair => { const [x, y] = pair.split(',').map(Number); return `${x},${y + offset}`; }).join(' ')} fill="none" stroke="#1d6079" strokeWidth="1" opacity="0.64" />)}
        <rect x="0" y="218" width="1000" height="342" fill="url(#scene-grid)" opacity="0.9" />
        <path d="M780 198 C730 252 820 291 754 345 S735 445 812 560 L1000 560 L1000 205 Z" fill="#0d4053" opacity="0.48" />
        <path d="M802 198 C762 262 844 290 776 355 S765 445 840 560" fill="none" stroke="#28cfe0" strokeWidth="3" opacity="0.5" />
        {Array.from({ length: 56 }, (_, index) => { const x = 18 + ((index * 83) % 950); const y = 238 + ((index * 47) % 218); const buildingHeight = 10 + ((index * 19) % 54); const width = 8 + (index % 5) * 4; return <g key={index}><rect x={x} y={y - buildingHeight} width={width} height={buildingHeight} fill={index % 3 === 0 ? '#14526a' : '#0c3043'} opacity="0.78" /><line x1={x + 2} x2={x + width - 2} y1={y - buildingHeight + 5} y2={y - buildingHeight + 5} stroke={index % 4 === 0 ? '#23bdcf' : '#1b5870'} strokeWidth="1" opacity="0.62" /></g>; })}
        {[0, 1, 2, 3, 4].map(index => <path key={`road-${index}`} d={`M ${index * 245 - 80} 540 C ${index * 245 + 70} 482 ${index * 245 + 125} 410 ${index * 245 + 260} 330`} fill="none" stroke={index % 2 ? '#1b5b70' : '#16455b'} strokeWidth="5" opacity="0.48" />)}
        {[0, 1, 2].map(index => <path key={`horizon-${index}`} d={`M 0 ${310 + index * 48} H 1000`} fill="none" stroke="#1b5b70" strokeWidth="1" opacity="0.6" />)}
        <polyline points={fullPath} fill="none" stroke="#0bdde9" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity="0.16" filter="url(#scene-soft-glow)" />
        {visible.slice(1).map((point, index) => {
          const previous = projected[index]; const current = projected[index + 1]; if (!previous || !current) return null;
          return <g key={`segment-${index}`}><line x1={previous.x} y1={previous.y} x2={current.x} y2={current.y} stroke={effortColor(point.effort)} strokeWidth="10" strokeLinecap="round" opacity="0.96" filter="url(#scene-glow)" /><line x1={previous.x} y1={previous.y} x2={current.x} y2={current.y} stroke={effortColor(point.effort)} strokeWidth="4" strokeLinecap="round" /></g>;
        })}
        <polyline points={visiblePath} fill="none" stroke="#e8ffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />
        {markerIndexes.map(index => { const point = projected[index]; return point ? <g key={`km-${index}`}><circle cx={point.x} cy={point.y} r="5" fill={palette.cyan} stroke="#d9ffff" strokeWidth="2" /><rect x={point.x - 25} y={point.y - 35} width="50" height="22" rx="11" fill="#07111d" stroke={palette.cyan} /><text x={point.x} y={point.y - 20} textAnchor="middle" fill={palette.text} fontFamily="JetBrains Mono" fontSize="10">{Math.round(points[index].distanceKm)} km</text></g> : null; })}
        {projected[0] && <g><circle cx={projected[0].x} cy={projected[0].y} r="12" fill={palette.teal} stroke="#e8ffff" strokeWidth="3" /><rect x={Math.max(20, projected[0].x - 56)} y={projected[0].y - 55} width="112" height="28" rx="6" fill="#07111d" stroke={palette.teal} strokeWidth="2" /><text x={projected[0].x} y={projected[0].y - 36} textAnchor="middle" fill={palette.text} fontFamily="Barlow Condensed" fontSize="16" fontWeight="700">START</text></g>}
        {projected.at(-1) && <g><circle cx={projected.at(-1).x} cy={projected.at(-1).y} r="12" fill={palette.coral} stroke="#fff1e9" strokeWidth="3" /><rect x={Math.max(20, projected.at(-1).x - 56)} y={projected.at(-1).y - 55} width="112" height="28" rx="6" fill="#07111d" stroke={palette.coral} strokeWidth="2" /><text x={projected.at(-1).x} y={projected.at(-1).y - 36} textAnchor="middle" fill={palette.text} fontFamily="Barlow Condensed" fontSize="16" fontWeight="700">FINISH</text></g>}
        {byKey('climb') && <Callout point={projected[detail.strongestClimbIndex]} label="STRONGEST CLIMB" value={byKey('climb').value} color={palette.amber} dx={-108} dy={-98} />}
        {byKey('heart') && <Callout point={projected[detail.peakHeartIndex]} label="PEAK HEART RATE" value={byKey('heart').value} color={palette.coral} dx={-6} dy={-124} />}
        {byKey('recovery') && <Callout point={projected[detail.recoveryIndex]} label="RECOVERY POINT" value={byKey('recovery').value} color={palette.teal} dx={-32} dy={-78} />}
        {byKey('speed') && <Callout point={projected[detail.fastestIndex]} label="FASTEST SECTION" value={byKey('speed').value} color={palette.blue} dx={-152} dy={42} />}
        <text x="34" y="34" fill={palette.muted} fontFamily="Barlow" fontSize="15" letterSpacing="2">ELEVATION</text><text x="34" y="53" fill={palette.muted} fontFamily="Barlow" fontSize="15" letterSpacing="2">CONTOUR</text>
        <g transform="translate(926 44)"><circle r="28" fill="#07111d" stroke={palette.cyan} strokeWidth="2" /><text y="-7" textAnchor="middle" fill={palette.text} fontFamily="JetBrains Mono" fontSize="12">N</text><text y="15" textAnchor="middle" fill={palette.cyan} fontSize="24">▲</text></g>
        <g transform="translate(28 510)"><line x1="0" x2="118" y1="0" y2="0" stroke={palette.text} strokeWidth="2" /><line x1="0" x2="0" y1="-7" y2="7" stroke={palette.text} /><line x1="59" x2="59" y1="-7" y2="7" stroke={palette.text} /><line x1="118" x2="118" y1="-7" y2="7" stroke={palette.text} /><text x="0" y="22" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="10">0</text><text x="60" y="22" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="10">1</text><text x="118" y="22" textAnchor="end" fill={palette.muted} fontFamily="JetBrains Mono" fontSize="10">2 km</text></g>
        <g transform="translate(775 488)"><rect width="195" height="60" rx="8" fill="#07111d" stroke={palette.line} /><line x1="15" x2="42" y1="17" y2="17" stroke={palette.cyan} strokeWidth="4" /><text x="52" y="21" fill={palette.text} fontFamily="JetBrains Mono" fontSize="10">Route</text><line x1="15" x2="42" y1="34" y2="34" stroke={palette.amber} strokeWidth="4" /><text x="52" y="38" fill={palette.text} fontFamily="JetBrains Mono" fontSize="10">Climb</text><line x1="15" x2="42" y1="51" y2="51" stroke={palette.coral} strokeWidth="4" /><text x="52" y="55" fill={palette.text} fontFamily="JetBrains Mono" fontSize="10">Highest HR</text></g>
      </svg>
      <div style={{ position: 'absolute', top: 12, left: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(7,17,29,0.9)', color: palette.cyan, fontFamily: C.fMono, fontSize: 10, letterSpacing: 1.5 }}>REAL ROUTE · FUTURE SCENE</div>
      <button onClick={onRealMap} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(7,17,29,0.92)', border: `1px solid ${palette.cyan}`, borderRadius: 16, color: palette.cyan, padding: '7px 11px', fontFamily: C.fMono, fontSize: 9, textTransform: 'uppercase', cursor: 'pointer' }}>Real map</button>
    </div>
  );
}
