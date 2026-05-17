import React, { useState, useMemo } from 'react';
import { useSuperadminPlatformActivity } from '../../hooks/superadmin';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  cyan: '#06B6D4', cyanLight: 'rgba(6,182,212,0.15)',
  warning: '#F59E0B', warningLight: 'rgba(245,158,11,0.15)',
  danger: '#EF4444', dangerLight: 'rgba(239,68,68,0.15)',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const getDotColor = (action) => {
  const act = action.toLowerCase();
  if (act.includes('login')) return C.teal;
  if (act.includes('company')) return C.violet;
  if (act.includes('settings')) return C.warning;
  if (act.includes('security') || act.includes('password')) return C.danger;
  return C.violet;
};

export const ActivityLogTab = () => {
  const [limit, setLimit] = useState(10);
  const { data: apiData, loading, refetch } = useSuperadminPlatformActivity(limit);
  const activities = apiData?.data || [];

  if (loading && limit === 10) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: '60px', borderRadius: '12px', animation: 'sa-shimmer 2s infinite linear', backgroundColor: C.surface, backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%' }} />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted }}>
        No recent activity recorded.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '6px', top: '8px', bottom: '8px', width: '2px', background: C.border }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {activities.map((act, i) => {
          const dotColor = getDotColor(act.action);
          return (
            <div key={act.id || i} style={{ position: 'relative', paddingLeft: '32px' }}>
              <div style={{
                position: 'absolute', left: '0', top: '4px', width: '14px', height: '14px',
                borderRadius: '50%', background: dotColor, border: `4px solid ${C.surface}`,
                zIndex: 1
              }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{act.action}</div>
                  <div style={{ fontSize: '13px', color: C.muted, marginTop: '4px', lineHeight: 1.5 }}>{act.description}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'monospace', background: C.bg, padding: '2px 6px', borderRadius: '4px' }}>IP: {act.ip}</div>
                    <div style={{ fontSize: '11px', color: C.muted, padding: '2px 0' }}>{act.userAgent}</div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: C.muted, whiteSpace: 'nowrap', textAlign: 'right' }}>
                  {act.timestamp}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button
          onClick={() => setLimit(prev => prev + 10)}
          disabled={loading}
          style={{ padding: '8px 24px', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => !loading && (e.currentTarget.style.color = C.teal, e.currentTarget.style.borderColor = C.teal)}
          onMouseLeave={e => !loading && (e.currentTarget.style.color = C.muted, e.currentTarget.style.borderColor = C.border)}
        >
          {loading ? 'Loading...' : 'Load More Activity'}
        </button>
      </div>
    </div>
  );
};
