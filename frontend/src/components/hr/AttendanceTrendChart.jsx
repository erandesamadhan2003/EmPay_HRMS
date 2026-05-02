import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  primary: '#14B8A6',
  muted: '#94A3B8',
  border: '#334155',
  text: '#F8FAFC',
};

export default function AttendanceTrendChart({ data }) {
  return (
    <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '24px', height: '360px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '600', color: C.text }}>30-Day Attendance Trend</h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={C.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
            <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text }}
              itemStyle={{ color: C.primary }}
              formatter={(value) => [`${value}%`, 'Attendance']}
            />
            <Area type="monotone" dataKey="percent" stroke={C.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorPercent)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
