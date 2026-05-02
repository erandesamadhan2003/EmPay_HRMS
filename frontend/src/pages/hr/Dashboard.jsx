import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import WeeklyAttendanceChart from '../../components/hr/WeeklyAttendanceChart';
import DepartmentDistribution from '../../components/hr/DepartmentDistribution';
import RecentActivity from '../../components/hr/RecentActivity';
import PendingLeaveRequests from '../../components/hr/PendingLeaveRequests';
import NewEmployeesTable from '../../components/hr/NewEmployeesTable';
import { useDashboardStats, useEmployees, useDepartments, useAllAttendance, useTimeOffRequests } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../../components/admin/shared';

/* ─── Color System ─── */
const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  accentGlow: 'rgba(124,58,237,0.25)', cyan: '#06B6D4',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const DEPT_COLORS = [C.teal, C.accent, C.cyan, C.warning, C.success, '#EC4899', '#8B5CF6', '#F97316'];

/* ─── Global Styles (injected once) ─── */
const DashStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes hrFadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes hrShimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .hr-stat-card {
      animation: hrFadeUp 0.5s ease-out both;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .hr-stat-card:hover { transform: translateY(-4px); }
    .hr-section {
      animation: hrFadeUp 0.5s ease-out both;
    }
    @media (max-width: 767px) {
      .hr-grid-4  { grid-template-columns: 1fr !important; }
      .hr-grid-60 { grid-template-columns: 1fr !important; }
      .hr-grid-50 { grid-template-columns: 1fr !important; }
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .hr-grid-4  { grid-template-columns: repeat(2, 1fr) !important; }
      .hr-grid-60 { grid-template-columns: 1fr !important; }
      .hr-grid-50 { grid-template-columns: 1fr !important; }
    }
  ` }} />
);

/* ─── SVG Icons (CSS drawn) ─── */
const CSSIcon = ({ type, color, size = 22 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'users')     return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (type === 'clock')     return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (type === 'calendar')  return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  if (type === 'user-plus') return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
  return null;
};

/* ─── Count-Up Hook ─── */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let current = 0;
    const steps = 50;
    const inc = target / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(current));
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

/* ═══════════════════════════════════════════════ */
/*                  HR DASHBOARD                   */
/* ═══════════════════════════════════════════════ */

export default function Dashboard() {
  /* ─── User context from localStorage ─── */
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'HR Officer';
  const userInitials = userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  /* ─── API Data ─── */
  const { data: dashStats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: empData } = useEmployees();
  const { data: deptData } = useDepartments();
  const { data: attData } = useAllAttendance();
  const { data: leaveData } = useTimeOffRequests({ status: 'pending' });

  /* ─── Derived Stats ─── */
  const s = dashStats?.data || {};
  const totalEmp = s.totalEmployees ?? 0;
  const presentToday = s.presentToday ?? 0;
  const onLeaveToday = s.onLeaveToday ?? 0;

  // Count new employees this month
  const rawEmps = empData?.data?.items ?? empData?.data ?? [];
  const employees = Array.isArray(rawEmps) ? rawEmps : [];
  const now = new Date();
  const thisMonthEmps = employees.filter((e) => {
    const jd = e.profile?.dateOfJoining || e.createdAt;
    if (!jd) return false;
    const d = new Date(jd);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const newThisMonth = thisMonthEmps.length;

  /* ─── Animated values ─── */
  const aTotal = useCountUp(totalEmp);
  const aPresent = useCountUp(presentToday);
  const aLeave = useCountUp(onLeaveToday, 800);
  const aNew = useCountUp(newThisMonth, 600);

  /* ─── Stat card config ─── */
  const statCards = [
    { label: 'Total Employees', value: aTotal, icon: 'users', color: C.teal, glow: C.tealLight, trend: `${totalEmp} total`, up: true },
    { label: 'Present Today', value: aPresent, icon: 'clock', color: C.cyan, glow: 'rgba(6,182,212,0.2)', trend: `of ${totalEmp}`, up: true },
    { label: 'On Leave Today', value: aLeave, icon: 'calendar', color: C.warning, glow: 'rgba(245,158,11,0.2)', trend: 'on leave', up: false },
    { label: 'New This Month', value: aNew, icon: 'user-plus', color: C.accent, glow: C.accentGlow, trend: 'this month', up: true },
  ];

  /* ─── Attendance chart data (weekly) ─── */
  const rawAtt = attData?.data?.items ?? attData?.data ?? [];
  const attRecords = Array.isArray(rawAtt) ? rawAtt : [];
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startOfWeek = new Date(now);
    const dayOff = now.getDay() === 0 ? 6 : now.getDay() - 1;
    startOfWeek.setDate(now.getDate() - dayOff);
    startOfWeek.setHours(0, 0, 0, 0);

    return days.map((day, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayRecords = attRecords.filter((r) => {
        const rd = r.date ? new Date(r.date).toISOString().slice(0, 10) : null;
        return rd === dateStr;
      });
      return {
        day,
        present: dayRecords.filter((r) => r.status === 'present').length,
        absent: dayRecords.filter((r) => r.status === 'absent' || r.status === 'on_leave').length,
      };
    });
  }, [attRecords]);

  /* ─── Department distribution ─── */
  const rawDepts = deptData?.data?.items ?? deptData?.data ?? [];
  const deptList = Array.isArray(rawDepts) ? rawDepts : [];
  const deptDistribution = useMemo(() => {
    if (deptList.length > 0) {
      return deptList.map((d, i) => ({
        name: d.name || 'Unknown',
        value: d.employeeCount ?? employees.filter((e) => e.profile?.department?.id === d.id).length,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
      }));
    }
    // Build from employee data if no departments endpoint
    const map = {};
    employees.forEach((e) => {
      const dept = e.profile?.department?.name || 'Unassigned';
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], i) => ({
      name, value, color: DEPT_COLORS[i % DEPT_COLORS.length],
    }));
  }, [deptList, employees]);

  /* ─── Recent activity (from attendance + leave records) ─── */
  const activityItems = useMemo(() => {
    const items = [];

    // Latest attendance
    attRecords.slice(-5).reverse().forEach((r) => {
      const emp = employees.find((e) => e.id === (r.userId || r.user_id));
      items.push({
        name: emp?.name || r.userName || 'Employee',
        action: 'marked attendance',
        time: r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Today',
      });
    });

    // Latest leave requests
    const rawLeaves = leaveData?.data?.items ?? leaveData?.data ?? [];
    const leaves = Array.isArray(rawLeaves) ? rawLeaves : [];
    leaves.slice(0, 3).forEach((l) => {
      items.push({
        name: l.employee?.name || 'Employee',
        action: `applied for ${l.leaveType || 'leave'}`,
        time: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recently',
      });
    });

    return items.slice(0, 5);
  }, [attRecords, employees, leaveData]);

  /* ─── Pending leaves ─── */
  const pendingLeaves = useMemo(() => {
    const rawLeaves = leaveData?.data?.items ?? leaveData?.data ?? [];
    const leaves = Array.isArray(rawLeaves) ? rawLeaves : [];
    return leaves.slice(0, 4).map((l) => ({
      id: l.id,
      name: l.employee?.name || 'Employee',
      leaveType: l.leaveType || 'Leave',
      from: l.startDate,
      to: l.endDate,
      days: l.daysRequested || 1,
    }));
  }, [leaveData]);

  /* ─── New employees table ─── */
  const newEmployeesData = useMemo(() => {
    return (thisMonthEmps.length > 0 ? thisMonthEmps : employees.slice(-4).reverse()).map((e) => ({
      id: e.id,
      name: e.name || 'Unknown',
      loginId: e.loginId || e.profile?.loginId || '—',
      department: e.profile?.department?.name || '—',
      role: e.role || 'employee',
      joinDate: e.profile?.dateOfJoining || e.createdAt,
      isActive: e.isActive,
    }));
  }, [thisMonthEmps, employees]);

  /* ─── Loading / Error ─── */
  if (statsLoading) return (
    <MainLayout role="hr" pageTitle="Dashboard" userName={userName} userInitials={userInitials} notifCount={0}>
      <LoadingSpinner message="Loading HR dashboard..." />
    </MainLayout>
  );
  if (statsError) return (
    <MainLayout role="hr" pageTitle="Dashboard" userName={userName} userInitials={userInitials} notifCount={0}>
      <ErrorState message="Failed to load dashboard" onRetry={() => window.location.reload()} />
    </MainLayout>
  );

  return (
    <MainLayout role="hr" pageTitle="Dashboard" userName={userName} userInitials={userInitials} notifCount={0}>
      <DashStyles />
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>

        {/* ═══ ROW 1: Stat Cards ═══ */}
        <div
          className="hr-grid-4"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}
        >
          {statCards.map((card, i) => (
            <div
              key={card.label}
              className="hr-stat-card"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 24,
                animationDelay: `${i * 100}ms`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 32px ${card.glow}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 8 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                    {card.value}
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${card.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CSSIcon type={card.icon} color={card.color} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 11, fontWeight: 500 }}>
                <span style={{ color: card.up ? C.success : C.warning }}>
                  {card.up ? '↑' : '↓'}
                </span>
                <span style={{ color: C.muted }}>{card.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ ROW 2: Attendance Chart + Dept Donut ═══ */}
        <div
          className="hr-grid-60 hr-section"
          style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr',
            gap: 20, marginBottom: 24, animationDelay: '400ms',
          }}
        >
          <WeeklyAttendanceChart data={weeklyData} />
          <DepartmentDistribution data={deptDistribution} />
        </div>

        {/* ═══ ROW 3: Activity + Leave Requests ═══ */}
        <div
          className="hr-grid-50 hr-section"
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 20, marginBottom: 24, animationDelay: '500ms',
          }}
        >
          <RecentActivity items={activityItems} />
          <PendingLeaveRequests
            requests={pendingLeaves}
            onViewAll={() => { /* navigate to leave management */ }}
          />
        </div>

        {/* ═══ ROW 4: New Employees Table ═══ */}
        <div className="hr-section" style={{ animationDelay: '600ms', marginBottom: 8 }}>
          <NewEmployeesTable
            employees={newEmployeesData}
            onViewAll={() => { /* navigate to employee management */ }}
          />
        </div>
      </div>
    </MainLayout>
  );
}
