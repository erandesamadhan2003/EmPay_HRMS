import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth, useTimeOffRequests } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../admin/shared';

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
    @keyframes dashFadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseGlow {
      0% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(20, 184, 166, 0); }
      100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
    }
    .dash-card {
      animation: dashFadeUp 0.5s ease-out both;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .dash-card:hover {
      transform: translateY(-4px);
    }
    .check-in-btn {
      transition: all 0.3s ease;
    }
    .check-in-btn.active {
      animation: pulseGlow 2s infinite;
    }
    @media (max-width: 767px) {
      .dash-grid-3 { grid-template-columns: 1fr !important; }
      .dash-grid-2 { grid-template-columns: 1fr !important; }
    }
  `}} />
);

const CSSIcon = ({ type, color, size = 24 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'clock') return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (type === 'calendar') return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  if (type === 'sun') return <svg {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  if (type === 'check') return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  return null;
};

const ATT_DATA = [
  { day: 'Mon', hours: 8.5 }, { day: 'Tue', hours: 7.8 },
  { day: 'Wed', hours: 8.2 }, { day: 'Thu', hours: 9.1 },
  { day: 'Fri', hours: 8.0 }, { day: 'Sat', hours: 0 }, { day: 'Sun', hours: 0 }
];

export default function EmployeeDashboardView() {
  const { user } = useAuth();
  const { data: reqData, isLoading: reqLoading } = useTimeOffRequests();
  
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rawReqs = Array.isArray(reqData?.data) ? reqData.data : (Array.isArray(reqData) ? reqData : []);
  const myLeaves = rawReqs.filter(r => r.employeeId === user?.id || r.user_id === user?.id).slice(0, 3);

  const toggleCheckIn = () => {
    setIsCheckedIn(!isCheckedIn);
  };

  const statCards = [
    { label: 'Annual Leaves', value: '12', subtitle: 'Remaining this year', icon: 'sun', color: C.teal },
    { label: 'Sick Leaves', value: '4', subtitle: 'Remaining this year', icon: 'calendar', color: C.danger },
    { label: 'Avg Working Hours', value: '8.2h', subtitle: 'This week', icon: 'clock', color: C.cyan }
  ];

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      <DashStyles />

      <div className="dash-card" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Employee'}! 👋
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0, fontWeight: 300 }}>
            Here is what's happening today.
          </p>
        </div>
        <div style={{ fontSize: 13, color: C.muted, background: C.surface, padding: '8px 16px', borderRadius: 20, border: `1px solid ${C.border}` }}>
          {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="dash-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        
        <div className="dash-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ fontSize: 14, color: C.muted, fontWeight: 500, margin: '0 0 16px' }}>Current Status</h3>
          <button 
            onClick={toggleCheckIn}
            className={`check-in-btn ${isCheckedIn ? 'active' : ''}`}
            style={{ 
              width: 120, height: 120, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: isCheckedIn ? C.teal : C.surfaceHover,
              border: `2px solid ${isCheckedIn ? C.teal : C.border}`,
              color: isCheckedIn ? '#fff' : C.text,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
            <CSSIcon type="clock" color={isCheckedIn ? '#fff' : C.teal} size={32} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{isCheckedIn ? 'Check Out' : 'Check In'}</span>
          </button>
          <div style={{ marginTop: 16, fontSize: 12, color: isCheckedIn ? C.teal : C.muted, fontWeight: 500 }}>
            {isCheckedIn ? `Checked in at ${currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'You are currently clocked out'}
          </div>
        </div>

        {statCards.map((s, i) => (
          <div key={s.label} className="dash-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, animationDelay: `${(i+1)*100}ms`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${s.color}15`, position: 'absolute', top: -10, right: -10 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CSSIcon type={s.icon} color={s.color} size={20} />
              </div>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{s.label}</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        
        <div className="dash-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, animationDelay: '400ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>My Working Hours</h3>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, background: C.surfaceHover, color: C.muted }}>This Week</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ATT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHrs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="day" stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 8 }}
                  itemStyle={{ color: C.text, fontSize: 12 }}
                  labelStyle={{ color: C.muted, fontSize: 11, marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="hours" stroke={C.accent} strokeWidth={3} fillOpacity={1} fill="url(#colorHrs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, animationDelay: '500ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>Recent Leave Requests</h3>
            <button style={{ background: 'transparent', border: 'none', color: C.teal, fontSize: 12, cursor: 'pointer' }}>View All</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reqLoading ? <LoadingSpinner message="" /> : 
             myLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>No recent leave requests.</div>
            ) : (
              myLeaves.map(leave => (
                <div key={leave._id || leave.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4 }}>{leave.leaveType || leave.type}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {new Date(leave.startDate || leave.fromDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - {new Date(leave.endDate || leave.toDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase',
                    background: leave.status === 'approved' ? `${C.teal}22` : leave.status === 'rejected' ? `${C.danger}22` : `${C.warning}22`,
                    color: leave.status === 'approved' ? C.teal : leave.status === 'rejected' ? C.danger : C.warning 
                  }}>
                    {leave.status || 'Pending'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
