import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', teal: '#14B8A6',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function WeeklyAttendanceChart({ data = [] }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text }}>Attendance This Week</div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 4 }}>Live tracking</div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="hrGradTeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hrGradAccent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: C.muted, fontSize: 11, fontFamily: 'Poppins' }}
              axisLine={{ stroke: C.border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: C.muted, fontSize: 11, fontFamily: 'Poppins' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="present" name="Present" stroke={C.teal} fill="url(#hrGradTeal)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="absent" name="Absent" stroke={C.accent} fill="url(#hrGradAccent)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 13 }}>
          No attendance data for this week
        </div>
      )}
    </div>
  );
}
