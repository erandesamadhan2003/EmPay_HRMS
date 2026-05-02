const C = {
  surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  accent: '#7C3AED',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const th = {
  textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600,
  color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: `1px solid ${C.border}`, fontFamily: 'Poppins, sans-serif',
  whiteSpace: 'nowrap',
};
const td = {
  padding: '10px 14px', fontSize: 13, color: C.text,
  borderBottom: `1px solid ${C.border}`, fontFamily: 'Poppins, sans-serif',
  whiteSpace: 'nowrap',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function NewEmployeesTable({ employees = [], onViewAll }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text }}>Recently Joined Employees</div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 4, marginBottom: 16 }}>
          New hires this month
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              {['Name', 'Login ID', 'Department', 'Role', 'Join Date', 'Status'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>
                  No new employees this month
                </td>
              </tr>
            )}
            {employees.map((emp, i) => {
              const initials = emp.name
                ? emp.name.split(' ').map((w) => w[0]).join('').toUpperCase()
                : '?';

              return (
                <tr
                  key={emp.id || i}
                  className="hr-table-row"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : C.surfaceHover,
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${C.teal}08`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : C.surfaceHover; }}
                >
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: `${C.accent}18`, border: `1.5px solid ${C.accent}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: C.accent, flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <span style={{ fontWeight: 500 }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{emp.loginId}</td>
                  <td style={{ ...td, color: C.muted, fontSize: 12 }}>{emp.department}</td>
                  <td style={{ ...td, color: C.muted, fontSize: 12 }}>{emp.role}</td>
                  <td style={{ ...td, color: C.muted, fontSize: 12 }}>{fmtDate(emp.joinDate)}</td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: 10, fontWeight: 600,
                      background: emp.isActive !== false ? C.tealLight : 'rgba(239,68,68,0.15)',
                      color: emp.isActive !== false ? C.teal : '#EF4444',
                    }}>
                      {emp.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onViewAll}
          style={{
            background: 'transparent', border: 'none', color: C.teal,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
        >
          View All Employees →
        </button>
      </div>
    </div>
  );
}
