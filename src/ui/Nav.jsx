import React from '../runtime.js';
import theme from './theme.js';

const { C } = theme;

export default function Nav({ view, setView, hasActive, Icon }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: 'home' },
    { id: 'workout', label: 'Workout', icon: 'dumbbell', dot: hasActive },
    { id: 'history', label: 'Log', icon: 'clipboard-list' },
    { id: 'progress', label: 'Stats', icon: 'bar-chart-2' },
    { id: 'health', label: 'Health', icon: 'heart' },
    { id: 'rides', label: 'Rides', icon: 'bike' },
    { id: 'manage', label: 'Manage', icon: 'grid-2x2' },
  ];

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: `var(--ironlog-ride-nav-bg, ${C.surface})`, borderTop: `1px solid var(--ironlog-ride-nav-border, ${C.border})`, display: 'flex', zIndex: 200, paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setView(tab.id)} style={{
          flex: '1 1 0', minWidth: 0, background: 'none', border: 'none', padding: '9px 1px 11px',
          color: view === tab.id ? `var(--ironlog-ride-nav-active, ${C.amber})` : `var(--ironlog-ride-nav-muted, ${C.muted})`, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative',
        }}>
          {view === tab.id && <span style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: 'var(--ironlog-ride-nav-active, currentColor)', borderRadius: 2 }} />}
          <Icon name={tab.icon} size={18} />
          <span style={{ fontSize: 8, fontFamily: C.fMono, letterSpacing: 0.35, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{tab.label}</span>
          {tab.dot && <span style={{ position: 'absolute', top: 6, right: '28%', width: 5, height: 5, borderRadius: 3, background: C.amber }} />}
        </button>
      ))}
    </nav>
  );
}
