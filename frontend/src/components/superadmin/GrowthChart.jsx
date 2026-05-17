import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', cyan: '#06B6D4',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

export const GrowthChart = ({ apiData, loading: externalLoading, error: externalError, refetch: externalRefetch }) => {
  const [tab, setTab] = useState('Companies');

  const loading = externalLoading;

  // Provide fallback data if API is not ready or errors out
  const data = useMemo(() => {
    if (Array.isArray(apiData)) return apiData;
    if (apiData?.data && Array.isArray(apiData.data)) return apiData.data;
    return [];
  }, [apiData]);

  const avgUsers = useMemo(() => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, curr) => acc + (curr.activeUsers || 0), 0);
    return Math.round(sum / data.length);
  }, [data]);

  if (loading) {
    return (
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px',
        padding: '24px', height: '340px',
        animation: 'sa-shimmer 2s infinite linear',
        backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`,
        backgroundSize: '200% 100%'
      }}></div>
    );
  }

  if (externalError && !apiData) {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', height: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.muted, fontSize: '14px', marginBottom: '12px' }}>Failed to load growth data</p>
        <button onClick={externalRefetch} style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, color: C.text, padding: '6px 16px', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', height: '340px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.text }}>Platform Growth</h3>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['Companies', 'Users'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'transparent',
                border: 'none',
                color: tab === t ? C.teal : C.muted,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
                borderBottom: tab === t ? `2px solid ${C.teal}` : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, width: '100%', height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {tab === 'Companies' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text }}
                itemStyle={{ color: C.teal, fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="newCompanies"
                name="New Companies"
                stroke={C.teal}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCompanies)"
                isAnimationActive={true}
                dot={{ fill: C.teal, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: C.teal, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text }}
                itemStyle={{ color: C.violet, fontWeight: 600 }}
              />
              <ReferenceLine y={avgUsers} stroke={C.cyan} strokeDasharray="4 4" label={{ value: 'AVG', fill: C.cyan, fontSize: 10, position: 'insideTopLeft' }} />
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke={C.violet}
                strokeWidth={3}
                isAnimationActive={true}
                dot={{ fill: C.violet, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: C.violet, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
