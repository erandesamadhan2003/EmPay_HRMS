const C = {
  surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  accent: '#7C3AED', cyan: '#06B6D4', warning: '#F59E0B',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const ICON_COLORS = [C.teal, C.accent, C.cyan, C.warning, C.teal];

export default function RecentActivity({ items = [] }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 500, color: C.text, marginBottom: 20 }}>
        Recent Activity
      </div>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical timeline line */}
        <div style={{
          position: 'absolute', left: 9, top: 4, bottom: 4, width: 2,
          background: `linear-gradient(180deg, ${C.teal}, ${C.accent}40)`,
          borderRadius: 1,
        }} />

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 13, paddingLeft: 0 }}>
            No recent activity
          </div>
        )}

        {items.map((item, i) => {
          const initials = item.name
            ? item.name.split(' ').map((w) => w[0]).join('').toUpperCase()
            : '?';
          const dotColor = ICON_COLORS[i % ICON_COLORS.length];

          return (
            <div
              key={i}
              className="hr-timeline-item"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                marginBottom: i < items.length - 1 ? 20 : 0,
                position: 'relative',
                animation: `hrFadeUp 0.4s ease-out ${i * 80}ms both`,
              }}
            >
              {/* Dot on the timeline */}
              <div style={{
                position: 'absolute', left: -24, top: 6,
                width: 12, height: 12, borderRadius: '50%',
                background: dotColor, border: `2px solid ${C.surface}`,
                boxShadow: `0 0 0 3px ${dotColor}30`,
                zIndex: 2,
              }} />

              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: `${dotColor}18`, border: `1.5px solid ${dotColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: dotColor,
              }}>
                {initials}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 400, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span> {item.action}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{item.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
