import React, { useState, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useFetch } from '../../hooks/useFetch';
import { useMutation } from '../../hooks/useMutation';
import { StatCard } from '../../components/superadmin/StatCard';
import { GrowthChart } from '../../components/superadmin/GrowthChart';
import { CompanyRequestCard } from '../../components/superadmin/CompanyRequestCard';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  accent: '#7C3AED', cyan: '#06B6D4', cyanLight: 'rgba(6,182,212,0.15)',
  warning: '#F59E0B', danger: '#EF4444', dangerLight: 'rgba(239,68,68,0.15)',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const DashboardStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes sa-fade-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes sa-pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
    @keyframes sa-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .sa-fade-up { animation: sa-fade-up 0.5s ease-out forwards; }
    .sa-stagger-1 { animation-delay: 0.1s; }
    .sa-stagger-2 { animation-delay: 0.2s; }
    .sa-stagger-3 { animation-delay: 0.3s; }
    .sa-stagger-4 { animation-delay: 0.4s; }
    
    .sa-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .sa-grid-2-65 { display: grid; grid-template-columns: 65% 35%; gap: 24px; }
    .sa-grid-2-50 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    
    @media (max-width: 1024px) {
      .sa-grid-4 { grid-template-columns: repeat(2, 1fr); }
      .sa-grid-2-65, .sa-grid-2-50 { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .sa-grid-4 { grid-template-columns: 1fr; }
    }
  ` }} />
);

export default function Dashboard() {
  const { data: statsData, loading: statsLoading } = useFetch('/superadmin/dashboard/stats');
  const { data: healthData, loading: healthLoading } = useFetch('/superadmin/analytics/health');
  const { data: growthData, loading: growthLoading, error: growthError, refetch: refetchGrowth } = useFetch('/superadmin/analytics/growth');
  const { data: reqsData, loading: reqsLoading, refetch: refetchReqs } = useFetch('/company-requests?status=pending&limit=4');
  const { data: actData, loading: actLoading } = useFetch('/superadmin/activity?limit=6');
  const { data: statusData, loading: statusLoading } = useFetch('/superadmin/analytics/by-status');

  const { mutate: approveReq } = useMutation('POST');
  const { mutate: rejectReq } = useMutation('POST');

  const [optimisticReqs, setOptimisticReqs] = useState(null);

  const stats = statsData?.data || { totalCompanies: 0, activeCompanies: 0, pendingRequests: 0, totalUsers: 0 };
  const health = healthData?.data || { uptime: '0%', avgResponseTime: '0ms', totalApiCalls: '0', errorRate: '0%' };
  const requests = optimisticReqs || reqsData?.data?.items || [];
  const activities = actData?.data || [];
  const byStatus = statusData?.data || { active: 0, pending: 0, suspended: 0, rejected: 0 };

  const handleApprove = async (id) => {
    setOptimisticReqs(requests.filter(r => r.id !== id));
    try {
      await approveReq(`/company-requests/${id}/approve`, {});
      refetchReqs();
    } catch(e) {
      setOptimisticReqs(null); // revert on error
    }
  };

  const handleReject = async (id) => {
    setOptimisticReqs(requests.filter(r => r.id !== id));
    try {
      await rejectReq(`/company-requests/${id}/reject`, {});
      refetchReqs();
    } catch(e) {
      setOptimisticReqs(null);
    }
  };

  const statusChartData = useMemo(() => [
    { name: 'Active', value: byStatus.active, color: C.teal },
    { name: 'Pending', value: byStatus.pending, color: C.warning },
    { name: 'Suspended', value: byStatus.suspended, color: C.violet },
    { name: 'Rejected', value: byStatus.rejected, color: C.danger }
  ], [byStatus]);

  return (
    <MainLayout role="superadmin" pageTitle="Dashboard">
      <DashboardStyles />
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: '"Poppins", sans-serif' }}>
        
        {/* ROW 1: STATS */}
        <div className="sa-grid-4" style={{ marginBottom: '24px' }}>
          <div className="sa-stagger-1"><StatCard loading={statsLoading} title="Total Companies" value={stats.totalCompanies} subtitle={stats.trends?.companies} trendUp={stats.trendUp?.companies} color="violet" icon="building" /></div>
          <div className="sa-stagger-2"><StatCard loading={statsLoading} title="Active Companies" value={stats.activeCompanies} subtitle={stats.trends?.active} trendUp={stats.trendUp?.active} color="teal" icon="activity" /></div>
          <div className="sa-stagger-3"><StatCard loading={statsLoading} title="Pending Requests" value={stats.pendingRequests} subtitle={stats.trends?.pending} trendUp={stats.trendUp?.pending} color="warning" icon="bell" /></div>
          <div className="sa-stagger-4"><StatCard loading={statsLoading} title="Total Users" value={stats.totalUsers} subtitle={stats.trends?.users} trendUp={stats.trendUp?.users} color="cyan" icon="users" /></div>
        </div>

        {/* ROW 2: GROWTH & HEALTH */}
        <div className="sa-grid-2-65 sa-fade-up sa-stagger-2" style={{ marginBottom: '24px' }}>
          <GrowthChart apiData={growthData} loading={growthLoading} error={growthError} refetch={refetchGrowth} />
          
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600, color: C.text }}>Platform Health</h3>
            
            {healthLoading ? (
               <div style={{ flex: 1, animation: 'sa-shimmer 2s infinite linear', backgroundColor: C.surface, backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%', borderRadius: '12px' }}></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1 }}>
                <div style={{ background: C.bg, borderRadius: '12px', padding: '16px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Uptime</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: C.teal }}>{health.uptime}</div>
                </div>
                <div style={{ background: C.bg, borderRadius: '12px', padding: '16px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Avg Response</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: C.cyan }}>{health.avgResponseTime}</div>
                </div>
                <div style={{ background: C.bg, borderRadius: '12px', padding: '16px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>API Calls</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: C.violet }}>{health.totalApiCalls}</div>
                </div>
                <div style={{ background: C.bg, borderRadius: '12px', padding: '16px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Error Rate</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: parseFloat(health.errorRate) > 1 ? C.danger : C.teal }}>{health.errorRate}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: REQUESTS & ACTIVITY */}
        <div className="sa-grid-2-50 sa-fade-up sa-stagger-3" style={{ marginBottom: '24px' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.text }}>Pending Requests</h3>
                <span style={{ padding: '2px 8px', borderRadius: '12px', background: C.warningLight, color: C.warning, fontSize: '12px', fontWeight: 600 }}>{requests.length}</span>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: C.teal, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>View All →</button>
            </div>
            
            {reqsLoading ? (
              <div style={{ height: '240px', animation: 'sa-shimmer 2s infinite linear', backgroundColor: C.surface, backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%', borderRadius: '12px' }}></div>
            ) : requests.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: C.teal }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}></div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>No pending requests</div>
                <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>You're all caught up!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {requests.map(req => (
                  <CompanyRequestCard key={req.id} request={req} onApprove={handleApprove} onReject={handleReject} compact={true} />
                ))}
              </div>
            )}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600, color: C.text }}>Recent Activity</h3>
            
            {actLoading ? (
              <div style={{ height: '240px', animation: 'sa-shimmer 2s infinite linear', backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%', borderRadius: '12px' }}></div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '2px', background: C.border }}></div>
                {activities.map((act, i) => {
                  let dotColor = C.teal;
                  if (act.type === 'rejected') dotColor = C.danger;
                  if (act.type === 'registered') dotColor = C.violet;
                  if (act.type === 'suspended') dotColor = C.warning;
                  
                  return (
                    <div key={act.id || i} style={{ position: 'relative', marginBottom: i === activities.length - 1 ? 0 : '24px' }}>
                      <div style={{ position: 'absolute', left: '-29px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: dotColor, border: `3px solid ${C.surface}` }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '14px', color: C.text, fontWeight: 500 }}>{act.action}</div>
                          <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>by {act.by}</div>
                        </div>
                        <div style={{ fontSize: '11px', color: C.muted, whiteSpace: 'nowrap', marginLeft: '12px' }}>{act.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ROW 4: BY STATUS */}
        <div className="sa-fade-up sa-stagger-4" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600, color: C.text }}>Companies by Status</h3>
          
          {statusLoading ? (
            <div style={{ height: '240px', animation: 'sa-shimmer 2s infinite linear', backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%', borderRadius: '12px' }}></div>
          ) : (
            <div className="sa-grid-2-50">
              <div style={{ height: '240px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusChartData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {statusChartData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.muted }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid stroke={C.border} strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip cursor={{ fill: C.surfaceHover }} contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
}
