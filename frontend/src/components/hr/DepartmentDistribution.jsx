import { PieChart, Pie, Cell, Label, Tooltip, ResponsiveContainer } from 'recharts';

const C = {
  surface: '#13131A', surfaceHover: '#1A1A24',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div style={{ fontSize: 12, color: payload[0]?.payload?.color || C.text }}>
        {payload[0]?.name}: {payload[0]?.value}
      </div>
    </div>
  );
};

export default function DepartmentDistribution({ data = [] }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text }}>Department Distribution</div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 4 }}>Employee count by team</div>
      </div>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={82}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
                <Label
                  value="Departments"
                  position="center"
                  fill={C.muted}
                  style={{ fontFamily: 'Poppins', fontSize: 12, fontWeight: 500 }}
                />
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 8 }}>
            {data.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                <span style={{ fontSize: 11, color: C.muted }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 13 }}>
          No department data available
        </div>
      )}
    </div>
  );
}
