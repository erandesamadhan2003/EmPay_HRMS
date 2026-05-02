import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Label,
  BarChart, Bar,
} from 'recharts';
import { useDashboardStats, useEmployees, useTimeOffRequests, useDashboardEmployerCost, useTimeOffRequestMutations } from '../../hooks';
import { LoadingSpinner, ErrorState } from './shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  accentGlow: 'rgba(124,58,237,0.25)', cyan: '#06B6D4',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const DashStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes dashFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    .dash-card { animation: dashFadeUp 0.5s ease-out both; transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .dash-card:hover { transform: translateY(-4px); }
    .dash-row-hover:hover { background: ${C.surfaceHover} !important; }
    .dash-btn { transition: all 0.2s ease; cursor: pointer; font-family: Poppins, sans-serif; }
    .dash-btn:hover { transform: translateY(-1px); }
    @media (max-width: 767px) { .dash-grid-4 { grid-template-columns: 1fr !important; } .dash-grid-2 { grid-template-columns: 1fr !important; } .dash-grid-60-40 { grid-template-columns: 1fr !important; } }
    @media (min-width: 768px) and (max-width: 1023px) { .dash-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } .dash-grid-2 { grid-template-columns: 1fr !important; } .dash-grid-60-40 { grid-template-columns: 1fr !important; } }
  `}} />
);

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0; const steps = 50; const inc = target / steps; const interval = duration / steps;
    const timer = setInterval(() => { start += inc; if (start >= target) { setVal(target); clearInterval(timer); } else setVal(Math.floor(start)); }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

const CSSIcon = ({ type, color, size = 24 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'users') return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (type === 'clock') return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (type === 'calendar') return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  if (type === 'dollar') return <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
  return null;
};

const Card = ({ children, style, delay = 0, hoverGlow }) => (
  <div className="dash-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, animationDelay: `${delay}ms`, ...style }}
    onMouseEnter={e => { if (hoverGlow) e.currentTarget.style.boxShadow = `0 8px 32px ${hoverGlow}`; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? `₹${(p.value/1000).toFixed(0)}K` : p.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardView() {
  const { data: dashStats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: empData } = useEmployees();
  const { data: leaveReqs } = useTimeOffRequests({ status: 'pending' });
  const { data: costData } = useDashboardEmployerCost();
  const { approveRequest, rejectRequest } = useTimeOffRequestMutations();

  const s = dashStats?.data || dashStats || {};
  const totalEmp = s.totalEmployees ?? 0;
  const presentToday = s.presentToday ?? 0;
  const pendingLeaveCount = s.pendingLeaveRequests ?? s.pendingLeaves ?? 0;
  const monthPayroll = s.thisMonthPayroll ?? costData?.data?.total ?? 0;

  const emp = useCountUp(totalEmp);
  const present = useCountUp(presentToday);
  const leaves = useCountUp(pendingLeaveCount, 800);
  const payroll = useCountUp(monthPayroll);

  const formatPayroll = (v) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  const rawEmpsList = empData?.data?.items ?? empData?.data ?? empData ?? [];
  const employees = Array.isArray(rawEmpsList) ? rawEmpsList : [];
  const recentEmployees = employees.slice(-5).reverse().map(e => ({
    name: e.name || 'Unknown',
    dept: e.profile?.department?.name || '—',
    role: e.role || '—',
    date: e.profile?.dateOfJoining ? new Date(e.profile.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    active: e.isActive,
  }));

  const rawLeavesList = leaveReqs?.data?.items ?? leaveReqs?.data ?? leaveReqs ?? [];
  const pendingLeaves = (Array.isArray(rawLeavesList) ? rawLeavesList : []).slice(0, 4).map((l, i) => {
    const nm = l.employee?.name || 'Employee';
    const ini = nm.split(' ').map(x => x[0]).join('').toUpperCase();
    const colors = [C.accent, C.teal, C.cyan, C.warning];
    return { id: l.id, name: nm, initials: ini, color: colors[i % 4], type: l.leaveType || 'Leave',
      from: l.startDate ? new Date(l.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—',
      to: l.endDate ? new Date(l.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—',
    };
  });

  const leaveData = [
    { name: 'Approved', value: s.approvedLeaves ?? 0, color: C.teal },
    { name: 'Pending', value: pendingLeaveCount, color: C.warning },
    { name: 'Rejected', value: s.rejectedLeaves ?? 0, color: C.danger },
  ];

  // Build attendance chart from employee data
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const attendanceData = s.weeklyAttendance || dayNames.map(day => ({ day, present: 0, absent: 0 }));

  // Build payroll chart from employer cost API
  const costPoints = costData?.data?.dataPoints || [];
  const payrollData = costPoints.length > 0
    ? costPoints.map(p => ({ month: p.label, payout: p.amount, deductions: Math.round(p.amount * 0.08) }))
    : [];

  const handleApprove = async (id) => { try { await approveRequest({ id, data: {} }); } catch(e) { console.error('Approve failed:', e); } };
  const handleReject = async (id) => { try { await rejectRequest({ id, data: {} }); } catch(e) { console.error('Reject failed:', e); } };

  const stats = [
    { label: 'Total Employees', value: emp, fmt: String(emp), icon: 'users', color: C.accent, glow: C.accentGlow, trend: `${totalEmp} total`, up: true },
    { label: 'Present Today', value: present, fmt: String(present), icon: 'clock', color: C.teal, glow: C.tealLight, trend: `of ${totalEmp}`, up: true },
    { label: 'Pending Leaves', value: leaves, fmt: String(leaves), icon: 'calendar', color: C.warning, glow: 'rgba(245,158,11,0.2)', trend: 'awaiting review', up: false },
    { label: 'This Month Payroll', value: payroll, fmt: formatPayroll(payroll), icon: 'dollar', color: C.cyan, glow: 'rgba(6,182,212,0.2)', trend: 'current month', up: true },
  ];

  if (statsLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (statsError) return <ErrorState message="Failed to load dashboard" onRetry={() => window.location.reload()} />;

  return (
    <>
      <DashStyles />
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>

        {/* ROW 1: Stat Cards */}
        <div className="dash-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <Card key={s.label} delay={i * 100} hoverGlow={s.glow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1 }}>{s.fmt}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CSSIcon type={s.icon} color={s.color} size={22} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 11, fontWeight: 500 }}>
                <span style={{ color: s.up ? C.success : C.warning }}>{s.up ? '↑' : '↓'}</span>
                <span style={{ color: C.muted }}>{s.trend}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* ROW 2: Attendance Chart + Leave Donut */}
        <div className="dash-grid-60-40" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
          <Card delay={400} hoverGlow={C.tealLight}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Attendance This Week</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 4 }}>Daily present vs absent count</div>
            </div>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={0.3} /><stop offset="95%" stopColor={C.teal} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gradAccent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.3} /><stop offset="95%" stopColor={C.accent} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11, fontFamily: 'Poppins' }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="present" name="Present" stroke={C.teal} fill="url(#gradTeal)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="absent" name="Absent" stroke={C.accent} fill="url(#gradAccent)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 13 }}>No attendance data available</div>}
          </Card>

          <Card delay={500} hoverGlow="rgba(245,158,11,0.15)">
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Leave Breakdown</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 4 }}>Current month status</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leaveData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {leaveData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  <Label value="Leave Status" position="center" fill={C.muted} style={{ fontFamily: 'Poppins', fontSize: 12, fontWeight: 500 }} />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 4 }}>
              {leaveData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ROW 3: Recent Employees + Pending Leaves */}
        <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <Card delay={600}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Recently Added Employees</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Poppins, sans-serif' }}>
                <thead><tr>
                  {['Name', 'Dept', 'Role', 'Joined', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {recentEmployees.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 13 }}>No employees yet</td></tr>}
                  {recentEmployees.map((emp, i) => (
                    <tr key={emp.name+i} className="dash-row-hover" style={{ background: i % 2 === 0 ? C.surface : C.surfaceHover, cursor: 'pointer', transition: 'background 0.15s' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: C.text }}>{emp.name}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: C.muted }}>{emp.dept}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: C.muted }}>{emp.role}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: C.muted }}>{emp.date}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                          background: emp.active ? C.tealLight : 'rgba(239,68,68,0.15)', color: emp.active ? C.teal : C.danger }}>
                          {emp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card delay={700}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>Pending Leave Requests</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingLeaves.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 13 }}>No pending leave requests</div>}
              {pendingLeaves.map(lv => (
                <div key={lv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = C.surfaceHover; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: `${lv.color}22`, border: `1.5px solid ${lv.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: lv.color }}>{lv.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{lv.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{lv.type} · {lv.from} – {lv.to}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="dash-btn" onClick={() => handleApprove(lv.id)} style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600 }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 12px ${C.tealLight}`} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>Approve</button>
                    <button className="dash-btn" onClick={() => handleReject(lv.id)} style={{ background: 'transparent', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ROW 4: Payroll Bar Chart */}
        <Card delay={800} hoverGlow={C.accentGlow} style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Monthly Payroll Overview</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 4 }}>Employer cost trend</div>
          </div>
          {payrollData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={payrollData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11, fontFamily: 'Poppins' }} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="payout" name="Total Payout" fill={C.accent} radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="deductions" name="Deductions" fill={C.teal} radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 13 }}>No payroll data available yet</div>}
          {payrollData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
              {[{ label: 'Total Payout', color: C.accent }, { label: 'Deductions', color: C.teal }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                  <span style={{ fontSize: 11, color: C.muted }}>{l.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
