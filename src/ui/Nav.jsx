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
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 200, paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setView(tab.id)} style={{
          flex: 1, background: 'none', border: 'none', padding: '10px 4px 12px',
          color: view === tab.id ? C.amber : C.muted, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative',
        }}>
          {view === tab.id && <span style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: C.amber, borderRadius: 2 }} />}
          <Icon name={tab.icon} size={20} />
          <span style={{ fontSize: 9, fontFamily: C.fMono, letterSpacing: 0.8, textTransform: 'uppercase' }}>{tab.label}</span>
          {tab.dot && <span style={{ position: 'absolute', top: 6, right: '28%', width: 5, height: 5, borderRadius: 3, background: C.amber }} />}
        </button>
      ))}
    </nav>
  );
}
