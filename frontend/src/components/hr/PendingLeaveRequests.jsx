const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const TYPE_COLORS = {
  'Annual Leave': C.teal,
  'Sick Leave': C.danger,
  'Personal Leave': C.accent,
  'Emergency Leave': C.warning,
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

export default function PendingLeaveRequests({ requests = [], onViewAll }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 500, color: C.text, marginBottom: 16 }}>
        Pending Leave Requests
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {requests.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 13 }}>
            No pending requests
          </div>
        )}

        {requests.map((r, i) => {
          const initials = r.name ? r.name.split(' ').map((w) => w[0]).join('').toUpperCase() : '?';
          const typeColor = TYPE_COLORS[r.leaveType] || C.muted;

          return (
            <div
              key={r.id || i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 12,
                transition: 'all 0.2s', cursor: 'pointer',
                animation: `hrFadeUp 0.4s ease-out ${i * 80}ms both`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = C.surfaceHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `${typeColor}18`, border: `1.5px solid ${typeColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: typeColor,
              }}>
                {initials}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: typeColor,
                    background: `${typeColor}18`, padding: '2px 8px', borderRadius: 10,
                  }}>
                    {r.leaveType}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    {fmtDate(r.from)} — {fmtDate(r.to)}
                  </span>
                </div>
              </div>

              {/* Days badge */}
              <div style={{
                fontSize: 11, fontWeight: 700, color: C.teal,
                background: C.tealLight, padding: '4px 10px', borderRadius: 8,
                flexShrink: 0,
              }}>
                {r.days}d
              </div>

              {/* Status pill */}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(245,158,11,0.15)', color: C.warning, flexShrink: 0,
              }}>
                Pending
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
          Approval handled by Payroll Officer
        </span>
        <button
          onClick={onViewAll}
          style={{
            background: 'transparent', border: `1px solid ${C.teal}`,
            borderRadius: 8, padding: '6px 16px', color: C.teal,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.tealLight; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}
        >
          View All Requests
        </button>
      </div>
    </div>
  );
}
