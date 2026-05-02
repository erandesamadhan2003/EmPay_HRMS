import { useState, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useDashboardStats, useDashboardEmployerCost, useDashboardWarnings, usePayruns } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../../components/admin/shared';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const fmt = v => '₹' + (v || 0).toLocaleString('en-IN');
const fmtShort = v => '₹' + ((v || 0) / 1000).toFixed(1) + 'k';

const AlertIco = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const CheckIco = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

const Styles = () => <style dangerouslySetInnerHTML={{__html:`
  @keyframes dbFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .db-card { animation: dbFade .4s ease-out both; background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px; padding: 24px; transition: transform .25s, box-shadow .25s; }
  .db-card:hover { transform: translateY(-2px); border-color: ${C.border}; }
  .db-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
  @media (max-width: 768px) { .db-layout { flex-direction: column; } .db-sidebar { width: 100% !important; } }
`}}/>;

export default function PayrollDashboard() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const { data: statsData, isLoading: isStatsLoading } = useDashboardStats();
  const { data: costDataRaw, isLoading: isCostLoading } = useDashboardEmployerCost();
  const { data: warningsData, isLoading: isWarningsLoading } = useDashboardWarnings();
  const { data: payrunsData, isLoading: isPayrunsLoading } = usePayruns({ limit: 5 });

  const stats = statsData?.data ?? statsData ?? {};
  const employerCost = Array.isArray(costDataRaw?.data) ? costDataRaw.data : Array.isArray(costDataRaw) ? costDataRaw : [];
  const warnings = Array.isArray(warningsData?.data) ? warningsData.data : Array.isArray(warningsData) ? warningsData : [];
  const recentPayruns = Array.isArray(payrunsData?.data?.items) ? payrunsData.data.items : Array.isArray(payrunsData?.data) ? payrunsData.data : [];

  const isLoading = isStatsLoading || isCostLoading || isWarningsLoading || isPayrunsLoading;

  return (
    <MainLayout role="payroll" pageTitle="Payroll Dashboard" userName={userName} userInitials={userInitials} notifCount={warnings.length}>
      <Styles />
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
        
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: C.text, margin: 0 }}>Overview</h2>
          <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 4 }}>Real-time payroll metrics and compliance alerts</p>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Aggregating payroll data..." />
        ) : (
          <>
            {/* STAT CARDS */}
            <div className="db-grid">
              <div className="db-card" style={{ animationDelay: '0ms' }}>
                <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, fontWeight: 500 }}>Active Employees</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{stats.totalEmployees || 0}</div>
              </div>
              <div className="db-card" style={{ animationDelay: '50ms' }}>
                <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, fontWeight: 500 }}>Monthly Cost (Est)</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.teal }}>{fmt(stats.estimatedMonthlyCost || stats.totalPayrollCost || 0)}</div>
              </div>
              <div className="db-card" style={{ animationDelay: '100ms' }}>
                <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, fontWeight: 500 }}>Pending Leaves</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.cyan }}>{stats.pendingLeaveRequests || 0}</div>
              </div>
              <div className="db-card" style={{ animationDelay: '150ms' }}>
                <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, fontWeight: 500 }}>Draft Payruns</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.warning }}>{recentPayruns.filter(p => p.status === 'draft').length}</div>
              </div>
            </div>

            <div className="db-layout" style={{ display: 'flex', gap: 24 }}>
              
              {/* MAIN CHART */}
              <div className="db-card" style={{ flex: 1, padding: '24px 24px 16px', animationDelay: '200ms' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 24 }}>Employer Cost Trend</div>
                <div style={{ width: '100%', height: 320 }}>
                  {employerCost.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={employerCost} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.teal} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                        <XAxis dataKey="month" stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
                          itemStyle={{ color: C.teal, fontWeight: 600 }}
                          formatter={(value) => [fmt(value), 'Total Cost']}
                        />
                        <Area type="monotone" dataKey="totalCost" stroke={C.teal} strokeWidth={3} fillOpacity={1} fill="url(#costGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13 }}>
                      No payroll cost data available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* SIDEBAR WIDGETS */}
              <div className="db-sidebar" style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* WARNINGS */}
                <div className="db-card" style={{ padding: 20, animationDelay: '250ms' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.warning}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertIco />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Compliance Alerts</div>
                  </div>
                  {warnings.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 13, background: C.bg, padding: '12px 16px', borderRadius: 10 }}>
                      <CheckIco /> No active warnings
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {warnings.map((w, i) => (
                        <div key={i} style={{ background: C.bg, borderLeft: `3px solid ${C.warning}`, padding: '10px 14px', borderRadius: '0 8px 8px 0', fontSize: 13, color: C.text }}>
                          <span style={{ fontWeight: 600, color: C.warning }}>Warning: </span>{w.message || w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RECENT PAYRUNS */}
                <div className="db-card" style={{ padding: 20, animationDelay: '300ms' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>Recent Payruns</div>
                  {recentPayruns.length === 0 ? (
                    <div style={{ color: C.muted, fontSize: 13, background: C.bg, padding: '12px 16px', borderRadius: 10 }}>No payruns generated yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {recentPayruns.slice(0, 4).map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, padding: '12px 14px', borderRadius: 10 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{new Date(p.periodStart || p.period_start).toLocaleString('en-IN', { month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmt(p.totalNet || p.total_net)}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: p.status === 'paid' ? `${C.teal}15` : `${C.warning}15`, color: p.status === 'paid' ? C.teal : C.warning, textTransform: 'capitalize' }}>
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </MainLayout>
  );
}
