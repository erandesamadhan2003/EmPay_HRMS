import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  useAuth, useCheckInPolicy, useAttendanceMutations,
  useMyTimeOffAllocations, useMyAttendance, useMyTimeOffRequests
} from '../../hooks';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#0D9488', accentLight: 'rgba(13,148,136,0.15)',
  cyan: '#06B6D4', teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const DashStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes dashFadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseGlow {
      0% { box-shadow: 0 0 0 0 rgba(20,184,166,0.4); }
      70% { box-shadow: 0 0 0 15px rgba(20,184,166,0); }
      100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
    }
    .dash-card { animation: dashFadeUp 0.5s ease-out both; transition: transform 0.25s, box-shadow 0.25s; }
    .dash-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    .check-in-btn { transition: all 0.3s ease; }
    .check-in-btn.active { animation: pulseGlow 2s infinite; }
    @media (max-width: 767px) {
      .dash-grid-4 { grid-template-columns: 1fr 1fr !important; }
      .dash-grid-2 { grid-template-columns: 1fr !important; }
    }
  `}} />
);

const Icon = ({ type, color = C.teal, size = 20 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'clock') return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (type === 'calendar') return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  if (type === 'sun') return <svg {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>;
  if (type === 'dollar') return <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
  if (type === 'arrow') return <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
  if (type === 'user') return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  return null;
};

const statusColor = (s) => ({
  approved: C.teal, rejected: C.danger, cancelled: C.muted
}[s] || C.warning);

const leaveTypeLabel = (lt) => ({
  annual_leave: 'Annual Leave', sick_leave: 'Sick Leave',
  personal_leave: 'Personal Leave', emergency_leave: 'Emergency Leave',
  paid_time_off: 'Paid Time Off', unpaid_leave: 'Unpaid Leave',
}[lt] || lt || '—');

export default function EmployeeDashboardView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: policyData } = useCheckInPolicy();
  const { checkIn, checkOut, isCheckingIn, isCheckingOut } = useAttendanceMutations();

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedInTime, setCheckedInTime] = useState(null);
  const [geoError, setGeoError] = useState(null);

  const policy = policyData?.data ?? policyData ?? {};

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── My leave requests ──────────────────────────────────────────────────
  const { data: reqData, isLoading: reqLoading } = useMyTimeOffRequests();
  const rawReqs = reqData?.data?.items ?? reqData?.data ?? reqData ?? [];
  const myLeaves = (Array.isArray(rawReqs) ? rawReqs : []).slice(0, 4);

  // ── Leave allocations ──────────────────────────────────────────────────
  const { data: allocData } = useMyTimeOffAllocations();
  const rawAllocs = allocData?.data ?? allocData ?? [];
  const allocs = Array.isArray(rawAllocs) ? rawAllocs : [];

  const getLeaveRemaining = (keyword) => {
    const alloc = allocs.find(a => {
      const lt = (a.leaveType || a.leave_type || '').toLowerCase().replace(/[_ ]+/g, '');
      return lt.includes(keyword.replace(/[_ ]+/g, ''));
    });
    if (!alloc) return 0;
    return Math.max(0, Number(alloc.allocatedDays ?? alloc.allocated_days ?? 0) - Number(alloc.usedDays ?? alloc.used_days ?? 0));
  };

  const annualRemaining  = getLeaveRemaining('annual') || getLeaveRemaining('paidtime');
  const sickRemaining    = getLeaveRemaining('sick');
  const totalAllocated   = allocs.reduce((s, a) => s + Number(a.allocatedDays ?? a.allocated_days ?? 0), 0);
  const totalUsed        = allocs.reduce((s, a) => s + Number(a.usedDays ?? a.used_days ?? 0), 0);

  // ── Attendance chart ───────────────────────────────────────────────────
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { data: attData } = useMyAttendance({ month: monthStr });
  const rawRecords = attData?.data?.items ?? attData?.data ?? attData ?? [];
  const records = Array.isArray(rawRecords) ? rawRecords : [];

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const rec = records.find(r => r.date && (r.date.startsWith ? r.date.startsWith(dateStr) : String(r.date).startsWith(dateStr)));
    let hours = 0;
    if (rec?.checkIn && rec?.checkOut) {
      hours = (new Date(rec.checkOut) - new Date(rec.checkIn)) / 3600000;
    } else if (rec?.status === 'present') {
      hours = 8;
    }
    return { day: dayName, hours: Math.round(hours * 10) / 10 };
  });
  const avgHours = (chartData.reduce((s, d) => s + d.hours, 0) / 7).toFixed(1);
  const presentDays = records.filter(r => r.status === 'present').length;

  // ── Check in / out ─────────────────────────────────────────────────────
  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const toggleCheckIn = async () => {
    if (isCheckedIn) {
      try { await checkOut(); setIsCheckedIn(false); setCheckedInTime(null); } catch (e) { console.error(e); }
    } else {
      setGeoError(null);
      const doCheckIn = async (coords) => {
        try {
          await checkIn(coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined);
          setIsCheckedIn(true);
          setCheckedInTime(new Date());
        } catch (e) { setGeoError(e?.response?.data?.message || 'Check-in failed'); }
      };
      if (policy.geofenceRequired) {
        if (!navigator.geolocation) { setGeoError('Geolocation not supported.'); return; }
        navigator.geolocation.getCurrentPosition(async pos => {
          const d = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, policy.officeLatitude, policy.officeLongitude);
          if (d > (policy.radiusMeters || 100)) { setGeoError(`You are ${Math.round(d)}m away. Must be within ${policy.radiusMeters || 100}m.`); return; }
          await doCheckIn(pos.coords);
        }, () => setGeoError('Allow location access to check in.'));
      } else { await doCheckIn(); }
    }
  };

  // ── Stat cards ──────────────────────────────────────────────────────────
  const stats = [
    { label: 'Annual Leave Left', value: annualRemaining, subtitle: 'days remaining', color: C.teal, icon: 'sun' },
    { label: 'Sick Leave Left',   value: sickRemaining,   subtitle: 'days remaining', color: C.danger,  icon: 'calendar' },
    { label: 'Avg Daily Hours',   value: `${avgHours}h`,  subtitle: 'past 7 days',    color: C.cyan,    icon: 'clock' },
    { label: 'Present This Month',value: presentDays,     subtitle: `of ${records.filter(r=>r.status!=='weekend').length} working days`, color: C.success, icon: 'user' },
  ];

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
      <DashStyles />

      {/* Header */}
      <div className="dash-card" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Employee'}! 👋
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            <span style={{ marginLeft: 12, fontFamily: 'monospace', color: C.teal }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </p>
        </div>
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'My Leaves',   path: '/employee/my-leaves',   color: C.teal },
            { label: 'Apply Leave', path: '/employee/apply-leave',  color: C.warning },
            { label: 'Payslips',    path: '/employee/payslips',     color: C.cyan },
            { label: 'Attendance',  path: '/employee/attendance',   color: C.success },
          ].map(a => (
            <button key={a.path} onClick={() => navigate(a.path)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}40`,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>{a.label}</button>
          ))}
        </div>
      </div>

      {/* Top Row: Check-In + Stats */}
      <div className="dash-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {/* Check-In Card */}
        <div className="dash-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 1 }}>Attendance</h3>
          <button
            onClick={toggleCheckIn}
            disabled={isCheckingIn || isCheckingOut}
            className={`check-in-btn ${isCheckedIn ? 'active' : ''}`}
            style={{
              width: 96, height: 96, borderRadius: '50%', border: `2px solid ${isCheckedIn ? C.teal : C.border}`,
              background: isCheckedIn ? `${C.teal}22` : C.surfaceHover,
              color: C.text, cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: (isCheckingIn || isCheckingOut) ? 0.7 : 1,
            }}>
            <Icon type="clock" color={isCheckedIn ? C.teal : C.muted} size={28} />
            <span style={{ fontSize: 11, fontWeight: 600, color: isCheckedIn ? C.teal : C.muted }}>
              {isCheckingIn ? 'In…' : isCheckingOut ? 'Out…' : isCheckedIn ? 'Check Out' : 'Check In'}
            </span>
          </button>
          <div style={{ marginTop: 12, fontSize: 11, color: isCheckedIn ? C.teal : C.muted }}>
            {isCheckedIn && checkedInTime
              ? `Since ${checkedInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Not clocked in'}
          </div>
          {geoError && <div style={{ marginTop: 10, fontSize: 10, color: C.danger, background: `${C.danger}15`, padding: '5px 10px', borderRadius: 8 }}>{geoError}</div>}
        </div>

        {/* Stat Cards */}
        {stats.map((s, i) => (
          <div key={s.label} className="dash-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 22, animationDelay: `${(i+1)*80}ms`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -12, right: -12, width: 64, height: 64, borderRadius: '50%', background: `${s.color}12` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon type={s.icon} color={s.color} size={18} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{s.label}</div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{s.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Bottom Row: Chart + Leave Summary */}
      <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
        {/* Working Hours Chart */}
        <div className="dash-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, animationDelay: '400ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>Working Hours — Last 7 Days</h3>
            <button onClick={() => navigate('/employee/attendance')} style={{ background: 'none', border: 'none', color: C.teal, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <Icon type="arrow" color={C.teal} size={13} />
            </button>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHrs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.accent} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="day" stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: C.text }}
                  labelStyle={{ color: C.muted }}
                  formatter={(v) => [`${v}h`, 'Hours']}
                />
                <Area type="monotone" dataKey="hours" stroke={C.accent} strokeWidth={2.5} fillOpacity={1} fill="url(#colorHrs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <div><div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Avg Daily</div><div style={{ fontSize: 18, fontWeight: 700, color: C.teal }}>{avgHours}h</div></div>
            <div><div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Total</div><div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{chartData.reduce((s,d)=>s+d.hours,0).toFixed(1)}h</div></div>
            <div><div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Days Present</div><div style={{ fontSize: 18, fontWeight: 700, color: C.success }}>{chartData.filter(d=>d.hours>0).length}/7</div></div>
          </div>
        </div>

        {/* Leave Requests Panel */}
        <div className="dash-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, animationDelay: '500ms', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>Leave Requests</h3>
            <button
              onClick={() => navigate('/employee/my-leaves')}
              style={{ background: 'none', border: 'none', color: C.teal, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              View All <Icon type="arrow" color={C.teal} size={13} />
            </button>
          </div>

          {/* Leave balance summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.teal }}>{totalAllocated}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Total Allocated</div>
            </div>
            <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.warning }}>{totalUsed}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Used This Year</div>
            </div>
          </div>

          {/* Recent requests */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reqLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>Loading...</div>
            ) : myLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>No leave requests yet.</div>
            ) : myLeaves.map(leave => (
              <div key={leave.id || leave._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 2 }}>
                    {leaveTypeLabel(leave.leaveType || leave.type)}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted }}>
                    {leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    {' → '}
                    {leave.endDate ? new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    {leave.daysRequested ? ` · ${leave.daysRequested}d` : ''}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 12, textTransform: 'uppercase',
                  background: `${statusColor(leave.status)}22`, color: statusColor(leave.status),
                }}>
                  {leave.status || 'pending'}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/employee/apply-leave')} style={{
            marginTop: 14, width: '100%', padding: '10px', borderRadius: 10, border: 'none',
            background: `${C.teal}22`, color: C.teal, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Apply for Leave
          </button>
        </div>
      </div>
    </div>
  );
}
