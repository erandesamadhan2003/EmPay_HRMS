import React, { useState, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import AttendanceHeatmap from '../../components/hr/AttendanceHeatmap';
import AttendanceTrendChart from '../../components/hr/AttendanceTrendChart';
import { useAllAttendance, useEmployees, useDepartments } from '../../hooks';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  primary: '#14B8A6',
  primaryHover: '#0D9488',
  secondary: '#8B5CF6',
  secondaryHover: '#7C3AED',
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  warning: '#F59E0B',
  info: '#06B6D4',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#334155',
  font: '"Poppins", sans-serif'
};

export default function AttendanceMonitor() {
  const [deptFilter, setDeptFilter] = useState('All');
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const formattedMonth = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { data: empData, isLoading: empLoading } = useEmployees();
  const { data: attData, isLoading: attLoading } = useAllAttendance({ month: formattedMonth });
  const { data: deptData } = useDepartments();

  const rawApiEmps = empData?.data?.items ?? empData?.data ?? empData ?? [];
  const apiEmps = Array.isArray(rawApiEmps) ? rawApiEmps : [];

  const rawAttRecords = attData?.data?.items ?? attData?.data ?? attData ?? [];
  const attRecords = Array.isArray(rawAttRecords) ? rawAttRecords : [];

  const rawDeptList = deptData?.data?.items ?? deptData?.data ?? deptData ?? [];
  const apiDepts = (Array.isArray(rawDeptList) ? rawDeptList : []).map(d => d.name).filter(Boolean);
  const deptOptions = ['All', ...new Set([...apiDepts, ...apiEmps.map(e => e.profile?.department?.name).filter(Boolean)])];

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const attMap = useMemo(() => {
    const m = {};
    attRecords.forEach(r => {
      const uid = r.userId || r.user_id || r.user?.id;
      if (!uid) return;
      if (!m[uid]) m[uid] = {};
      const dateStr = r.date ? new Date(r.date).toISOString().slice(0,10) : null;
      if (dateStr) {
        m[uid][dateStr] = r.status || 'absent';
      }
    });
    return m;
  }, [attRecords]);

  const employees = useMemo(() => {
    return apiEmps.map((e, idx) => {
      const uid = e.id;
      const nm = e.name || 'Unknown';
      const userAtt = attMap[uid] || {};
      const attendance = {};

      for (let i = 1; i <= daysInMonth; i++) {
        const dt = new Date(year, month, i, 12, 0, 0); // avoid tz offset issues
        const dow = dt.getDay();
        const dateStr = dt.toISOString().slice(0, 10);
        
        if (dow === 0 || dow === 6) {
          attendance[i] = 'weekend';
        } else if (userAtt[dateStr]) {
          const st = userAtt[dateStr];
          if (st === 'present') attendance[i] = 'present';
          else if (st === 'on_leave') attendance[i] = 'leave';
          else attendance[i] = 'absent';
        } else {
          if (dt > new Date()) {
            attendance[i] = 'weekend';
          } else {
            attendance[i] = 'absent';
          }
        }
      }

      return {
        id: uid || idx + 1,
        name: nm,
        department: e.profile?.department?.name || 'Unassigned',
        role: e.profile?.job_title || 'Employee',
        attendance
      };
    });
  }, [apiEmps, attMap, year, month, daysInMonth]);

  const filteredEmployees = employees.filter(e => deptFilter === 'All' || e.department === deptFilter);

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();
  const targetDay = isCurrentMonth ? new Date().getDate() : daysInMonth;

  let presentToday = 0;
  let absentToday = 0;
  let leaveToday = 0;
  let totalPresent = 0;
  let totalWorkingDays = 0;

  filteredEmployees.forEach(emp => {
    if (emp.attendance[targetDay] === 'present') presentToday++;
    if (emp.attendance[targetDay] === 'absent') absentToday++;
    if (emp.attendance[targetDay] === 'leave') leaveToday++;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dt = new Date(year, month, i);
      if (dt <= new Date()) {
        const val = emp.attendance[i];
        if (val === 'present') totalPresent++;
        if (val !== 'weekend' && val !== 'holiday') totalWorkingDays++;
      }
    }
  });

  const avgAttendance = totalWorkingDays > 0 ? ((totalPresent / totalWorkingDays) * 100).toFixed(1) : 0;

  const trendData = useMemo(() => {
    const data = [];
    const monthName = currentDate.toLocaleString('default', { month: 'short' });
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dt = new Date(year, month, i);
      if (dt > new Date()) break;
      
      const dow = dt.getDay();
      if (dow === 0 || dow === 6) continue;

      let dailyPresent = 0;
      let dailyTotal = 0;
      filteredEmployees.forEach(emp => {
        const val = emp.attendance[i];
        if (val === 'present') dailyPresent++;
        if (val !== 'weekend' && val !== 'holiday') dailyTotal++;
      });
      
      const percent = dailyTotal > 0 ? Math.round((dailyPresent / dailyTotal) * 100) : 0;
      data.push({ date: `${monthName} ${i}`, percent });
    }
    return data;
  }, [filteredEmployees, year, month, daysInMonth, currentDate]);

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (empLoading || attLoading) {
    return (
      <MainLayout role="hr" pageTitle="Attendance Monitor">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: C.muted, fontFamily: C.font }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div>Loading Attendance Data...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="hr" pageTitle="Attendance Monitor">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div style={{ padding: '24px', fontFamily: C.font, color: C.text, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Attendance Monitor</h1>
            <div style={{ fontSize: '14px', color: C.muted, marginTop: '4px' }}>Real-time overview of employee presence</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: C.surface, borderRadius: '8px', border: `1px solid ${C.border}`, padding: '4px' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <div style={{ padding: '0 16px', fontWeight: '500', fontSize: '14px', minWidth: '100px', textAlign: 'center' }}>{monthNames[month]} {year}</div>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <select 
              value={deptFilter} 
              onChange={e => setDeptFilter(e.target.value)}
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '10px 16px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: C.font, cursor: 'pointer' }}
            >
              {deptOptions.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
              ))}
            </select>

            <button style={{ 
              padding: '10px 16px', background: 'transparent', border: `1px solid ${C.primary}`, color: C.primary, 
              borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${C.primary}10`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Present Today</div>
                <div style={{ color: C.text, fontSize: '28px', fontWeight: '600' }}>{presentToday}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${C.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
            </div>
          </div>
          
          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Absent Today</div>
                <div style={{ color: C.text, fontSize: '28px', fontWeight: '600' }}>{absentToday}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${C.danger}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.danger }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </div>
            </div>
          </div>

          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>On Leave</div>
                <div style={{ color: C.text, fontSize: '28px', fontWeight: '600' }}>{leaveToday}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${C.warning}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.warning }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.24l-3.42 3.42"></path></svg>
              </div>
            </div>
          </div>

          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Avg Attendance %</div>
                <div style={{ color: C.text, fontSize: '28px', fontWeight: '600' }}>{avgAttendance}%</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${C.secondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {employees.length > 0 && <AttendanceHeatmap employees={filteredEmployees} />}

        {trendData.length > 0 && <AttendanceTrendChart data={trendData} />}

      </div>
    </MainLayout>
  );
}
