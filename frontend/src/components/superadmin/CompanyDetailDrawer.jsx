import React, { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  cyan: '#06B6D4', cyanLight: 'rgba(6,182,212,0.15)',
  warning: '#F59E0B', warningLight: 'rgba(245,158,11,0.15)',
  danger: '#EF4444', dangerLight: 'rgba(239,68,68,0.15)',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

export const CompanyDetailDrawer = ({ companyId, isOpen, onClose, onSuspend, onActivate }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [suspendConfirm, setSuspendConfirm] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { data: apiData, loading: apiLoading, refetch } = useFetch(companyId ? `/superadmin/companies/${companyId}` : null, [companyId]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSuspendConfirm(false);
        setSuspendReason('');
        setActiveTab('Overview');
      }, 300); // Reset after close animation
    }
  }, [isOpen]);

  // Fallback data
  const data = apiData || (companyId ? {
    id: companyId, name: 'TechFlow Solutions', adminName: 'Sarah Jenkins', adminEmail: 'sarah@techflow.io',
    industry: 'Technology', city: 'San Francisco', employeeCount: 150, status: 'active',
    approvedOn: 'Oct 12, 2025', plan: 'pro',
    stats: { totalEmployees: 150, attendanceRate: '94%', payrollsGenerated: 45, leavesThisMonth: 12 },
    recentActivity: [
      { action: 'Payroll #45 Processed', timestamp: '2 hours ago' },
      { action: 'New Employee Onboarded', timestamp: '1 day ago' },
      { action: 'Attendance Rules Updated', timestamp: '3 days ago' },
      { action: 'Plan Upgraded to Pro', timestamp: '1 week ago' }
    ],
    modules: [
      { name: 'Attendance Management', enabled: true },
      { name: 'Leave Management', enabled: true },
      { name: 'Payroll Processing', enabled: true },
      { name: 'Analytics Dashboard', enabled: true },
      { name: 'Face Authentication', enabled: false }
    ],
    chartData: [
      { month: 'Jan', value: 85 }, { month: 'Feb', value: 95 },
      { month: 'Mar', value: 120 }, { month: 'Apr', value: 150 }
    ]
  } : null);

  const handleSuspend = async () => {
    if (!suspendReason.trim()) return;
    setActionLoading(true);
    await onSuspend(companyId, suspendReason);
    setActionLoading(false);
    setSuspendConfirm(false);
    setSuspendReason('');
    refetch(); // Optimistic or actual refetch
  };

  const handleActivate = async () => {
    setActionLoading(true);
    await onActivate(companyId);
    setActionLoading(false);
    refetch();
  };

  if (!isOpen && !companyId) return null;

  return (
    <>
      <style>{`
        @keyframes sa-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes sa-fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* OVERLAY */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, animation: 'sa-fade-in 0.2s ease' }}
        />
      )}

      {/* DRAWER */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '540px',
        background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 1001,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column', fontFamily: '"Poppins", sans-serif'
      }}>
        {apiLoading && !data ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ height: '60px', borderRadius: '12px', animation: 'sa-shimmer 2s infinite linear', backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%' }} />
             <div style={{ height: '200px', borderRadius: '12px', animation: 'sa-shimmer 2s infinite linear', backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%' }} />
          </div>
        ) : data ? (
          <>
            {/* HEADER */}
            <div style={{ padding: '24px', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
              <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: C.violetLight, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700 }}>
                  {getInitials(data.name)}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 600, color: C.text }}>{data.name}</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', background: data.status === 'active' ? C.tealLight : C.dangerLight, color: data.status === 'active' ? C.teal : C.danger, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                      {data.status}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', background: data.plan === 'pro' ? C.cyanLight : (data.plan === 'enterprise' ? C.violetLight : 'transparent'), color: data.plan === 'pro' ? C.cyan : (data.plan === 'enterprise' ? C.violet : C.muted), border: data.plan === 'free' ? `1px solid ${C.border}` : 'none', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                      {data.plan || 'Free'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 16px' }}>
              {['Overview', 'Stats', 'Activity', 'Modules'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                    color: activeTab === tab ? C.teal : C.muted,
                    borderBottom: activeTab === tab ? `2px solid ${C.teal}` : '2px solid transparent'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {activeTab === 'Overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Info Grid */}
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: C.text, margin: '0 0 16px 0' }}>Company Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ background: C.bg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', marginBottom: '4px' }}>Admin Name</div>
                        <div style={{ fontSize: '14px', color: C.text }}>{data.adminName}</div>
                      </div>
                      <div style={{ background: C.bg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', marginBottom: '4px' }}>Admin Email</div>
                        <div style={{ fontSize: '14px', color: C.text, wordBreak: 'break-all' }}>{data.adminEmail}</div>
                      </div>
                      <div style={{ background: C.bg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', marginBottom: '4px' }}>Industry</div>
                        <div style={{ fontSize: '14px', color: C.text }}>{data.industry || 'N/A'}</div>
                      </div>
                      <div style={{ background: C.bg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', marginBottom: '4px' }}>City</div>
                        <div style={{ fontSize: '14px', color: C.text }}>{data.city || 'N/A'}</div>
                      </div>
                      <div style={{ background: C.bg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', marginBottom: '4px' }}>Employees</div>
                        <div style={{ fontSize: '14px', color: C.text }}>{data.employeeCount || 0}</div>
                      </div>
                      <div style={{ background: C.bg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', marginBottom: '4px' }}>Approved On</div>
                        <div style={{ fontSize: '14px', color: C.text }}>{data.approvedOn || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: C.text, margin: '0 0 16px 0' }}>Super Admin Actions</h3>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
                      {data.status === 'active' ? (
                        <div>
                          <div style={{ fontSize: '13px', color: C.text, marginBottom: '16px' }}>
                            Suspending this company will immediately revoke access for all its employees and admins.
                          </div>
                          {!suspendConfirm ? (
                            <button 
                              onClick={() => setSuspendConfirm(true)}
                              style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${C.warning}`, color: C.warning, borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Suspend Company
                            </button>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'sa-fade-in 0.2s' }}>
                              <textarea 
                                value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                                placeholder="Reason for suspension (required)"
                                style={{ width: '100%', height: '80px', padding: '12px', background: C.surface, border: `1px solid ${C.warning}`, borderRadius: '8px', color: C.text, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                              />
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                  onClick={handleSuspend} disabled={!suspendReason.trim() || actionLoading}
                                  style={{ flex: 1, padding: '10px', background: C.warning, border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: (!suspendReason.trim() || actionLoading) ? 'not-allowed' : 'pointer', opacity: (!suspendReason.trim() || actionLoading) ? 0.6 : 1 }}
                                >
                                  {actionLoading ? 'Suspending...' : 'Confirm Suspend'}
                                </button>
                                <button 
                                  onClick={() => setSuspendConfirm(false)} disabled={actionLoading}
                                  style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}
                                >Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '13px', color: C.text, marginBottom: '16px' }}>
                            This company is currently suspended. Activating will restore full platform access.
                          </div>
                          <button 
                            onClick={handleActivate} disabled={actionLoading}
                            style={{ padding: '8px 16px', background: C.teal, border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}
                          >
                            {actionLoading ? 'Activating...' : 'Activate Company'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Total Employees</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: C.violet }}>{data.stats?.totalEmployees || 0}</div>
                    </div>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Attendance Rate</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: C.teal }}>{data.stats?.attendanceRate || '0%'}</div>
                    </div>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Payrolls Generated</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: C.cyan }}>{data.stats?.payrollsGenerated || 0}</div>
                    </div>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Leaves This Month</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: C.warning }}>{data.stats?.leavesThisMonth || 0}</div>
                    </div>
                  </div>
                  
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: C.text, margin: '0 0 16px 0' }}>Activity Trend</h3>
                    <div style={{ height: '160px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chartData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                          <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: C.surfaceHover }} contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text }} />
                          <Bar dataKey="value" fill={C.teal} radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Activity' && (
                <div style={{ position: 'relative', paddingLeft: '20px', marginLeft: '8px' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: C.border }} />
                  {(data.recentActivity || []).map((act, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: '24px' }}>
                      <div style={{ position: 'absolute', left: '-25px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: C.teal, border: `3px solid ${C.surface}` }} />
                      <div style={{ fontSize: '13px', color: C.text, fontWeight: 500 }}>{act.action}</div>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{act.timestamp}</div>
                    </div>
                  ))}
                  {(!data.recentActivity || data.recentActivity.length === 0) && (
                    <div style={{ fontSize: '13px', color: C.muted }}>No recent activity.</div>
                  )}
                </div>
              )}

              {activeTab === 'Modules' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', color: C.muted, marginBottom: '8px' }}>Super Admin view only. Modules are managed by the company's subscription plan.</div>
                  {(data.modules || []).map((mod, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: '14px', color: C.text, fontWeight: 500 }}>{mod.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '12px', color: mod.enabled ? C.teal : C.muted }}>{mod.enabled ? 'Enabled' : 'Disabled'}</div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: mod.enabled ? C.teal : C.border }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </>
        ) : null}
      </div>
    </>
  );
};
