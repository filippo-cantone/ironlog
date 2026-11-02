/** Shared chart geometry and metric-status colouring. */

function smoothLinePath(points, tension = 0.9) {
  if (!points?.length) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  const c = tension / 6;
  return points.map((p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const p0 = points[i - 2] || points[i - 1];
    const p1 = points[i - 1];
    const p2 = p;
    const p3 = points[i + 1] || p2;
    const cp1x = p1.x + (p2.x - p0.x) * c;
    const cp1y = p1.y + (p2.y - p0.y) * c;
    const cp2x = p2.x - (p3.x - p1.x) * c;
    const cp2y = p2.y - (p3.y - p1.y) * c;
    return `C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }).join(' ');
}

function chartColorKey(C) {
  return [
    { label: 'Good / normal', color: C.green },
    { label: 'Near baseline', color: '#45a8f5' },
    { label: 'Caution', color: '#f4d735' },
    { label: 'Elevated caution', color: '#ff9f1c' },
    { label: 'High strain', color: C.red },
  ];
}

function metricChartColorKey(metric, C) {
  if (metric?.key === 'activeCal') {
    return [
      { label: 'Low movement', color: '#45a8f5' },
      { label: 'Usual activity', color: C.green },
      { label: 'Active day', color: C.amber },
      { label: 'Very active', color: C.purple },
    ];
  }
  return chartColorKey(C);
}

function metricStatusColor(metric, value, baseline, C) {
  if (!Number.isFinite(value) || !baseline) return metric?.color || C.blue;
  if (metric?.key === 'activeCal') {
    if (value < baseline * 0.75) return '#45a8f5';
    if (value <= baseline * 1.15) return C.green;
    if (value <= baseline * 1.45) return C.amber;
    return C.purple;
  }
  if (metric?.key === 'steps' && metric?.target) {
    if (value >= metric.target) return C.green;
    if (value >= metric.target * 0.8) return '#45a8f5';
    if (value >= metric.target * 0.6) return '#f4d735';
    if (value >= metric.target * 0.35) return '#ff9f1c';
    return C.red;
  }
  if (metric?.higherBetter === true) {
    if (value >= baseline * 0.97) return C.green;
    if (value >= baseline * 0.9) return '#45a8f5';
    if (value >= baseline * 0.84) return '#f4d735';
    if (value >= baseline * 0.78) return '#ff9f1c';
    return C.red;
  }
  if (metric?.higherBetter === false) {
    if (value <= baseline * 1.03) return C.green;
    if (value <= baseline * 1.07) return '#45a8f5';
    if (value <= baseline * 1.1) return '#f4d735';
    if (value <= baseline * 1.15) return '#ff9f1c';
    return C.red;
  }
  if (value <= baseline * 1.08) return C.green;
  if (value <= baseline * 1.15) return '#45a8f5';
  if (value <= baseline * 1.25) return '#f4d735';
  if (value <= baseline * 1.4) return '#ff9f1c';
  return C.red;
}

function gradientStopsForPoints(points, metric, baseline, fallbackColor, C) {
  const safePoints = points || [];
  if (safePoints.length < 2) return [{ offset: '0%', color: fallbackColor || metric?.color || C.blue }];
  return safePoints.map((point, index) => ({
    offset: `${Math.round((index / (safePoints.length - 1)) * 100)}%`,
    color: metricStatusColor(metric, point.value, baseline, C),
  }));
}

module.exports = { smoothLinePath, chartColorKey, metricChartColorKey, metricStatusColor, gradientStopsForPoints };
