/** Shared visual tokens. Keep these framework-free so screens can migrate independently. */

const C = {
  bg: '#f6f9fc', surface: '#ffffff', card: '#ffffff', border: '#d9e4ef',
  amber: '#5b9df5', amberDim: '#dcecff', red: '#dc5252', green: '#1f9d8a',
  blue: '#5b9df5', purple: '#7c6ee6', text: '#17212b', muted: '#6b7788', dim: '#eaf1f8',
  fDisplay: "'Barlow Condensed', sans-serif",
  fMono: "'JetBrains Mono', monospace",
  fBody: "'Barlow', sans-serif",
};

const st = {
  screen: { minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.fBody, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' },
  card: bg => ({ background: bg || C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }),
  h1: { fontFamily: C.fDisplay, fontSize: 34, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: 0, lineHeight: 1 },
  h2: { fontFamily: C.fDisplay, fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: 0 },
  label: { fontSize: 10, fontFamily: C.fMono, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  mono: (size = 14, color = C.text) => ({ fontFamily: C.fMono, fontSize: size, color }),
  inp: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontFamily: C.fMono, fontSize: 15, padding: '8px 0', width: '100%', boxSizing: 'border-box', textAlign: 'center', WebkitAppearance: 'none' },
  btn: (bg = C.amber, color = '#fff') => ({ background: bg, color, border: 'none', borderRadius: 10, padding: '12px 20px', fontFamily: C.fDisplay, fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', width: '100%' }),
  btnSm: (bg = C.amber, color = '#fff') => ({ background: bg, color, border: 'none', borderRadius: 4, padding: '8px 14px', fontFamily: C.fDisplay, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }),
  ghost: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 5, padding: '10px 20px', fontFamily: C.fDisplay, fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', width: '100%' },
  pill: (color = C.amber) => ({ background: color + '20', color, border: `1px solid ${color}40`, borderRadius: 20, padding: '2px 9px', fontSize: 10, fontFamily: C.fMono, letterSpacing: 0.8 }),
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  col: (gap = 8) => ({ display: 'flex', flexDirection: 'column', gap }),
};

const dash = {
  page: { padding: '14px 16px 8px', maxWidth: 430, margin: '0 auto' },
  card: (extra = {}) => ({ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 10px 26px rgba(32, 55, 85, 0.07)', padding: 13, ...extra }),
  label: { fontFamily: C.fBody, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7 },
  h: { fontFamily: C.fDisplay, fontSize: 27, fontWeight: 800, color: '#0d1838', lineHeight: 0.95, letterSpacing: 0 },
  body: { fontFamily: C.fBody, fontSize: 13, color: '#526078', lineHeight: 1.25 },
  chip: (color = C.blue) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: '#1d2b45', fontFamily: C.fBody, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }),
  iconBox: (color = C.blue) => ({ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
};

module.exports = { C, st, dash };
