import React from 'react';
import { useEmployees, useAllAttendance, useMyTimeOffAllocations } from '../../hooks';

export default function ProfileWidgets({ user, C }) {
  const { data: attData } = useAllAttendance();
  const { data: allocData } = useMyTimeOffAllocations();
  const { data: empData } = useEmployees();

  // calculate attendance
  const rawAtt = attData?.data?.items ?? attData?.data ?? [];
  const myAtt = Array.isArray(rawAtt) ? rawAtt.filter(a => a.userId === user?.id || a.user_id === user?.id) : [];
  const now = new Date();
  const thisMonthAtt = myAtt.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const presentCount = thisMonthAtt.filter(a => a.status === 'present').length;
  const absentCount = thisMonthAtt.filter(a => a.status === 'absent').length;
  const leaveCount = thisMonthAtt.filter(a => a.status === 'on_leave').length;
  const totalDays = presentCount + absentCount + leaveCount || 1;
  const attPct = totalDays > 1 ? Math.round((presentCount / totalDays) * 100) : 0;

  // calculate leaves
  const rawAllocs = allocData?.data?.items ?? allocData?.data ?? [];
  const myAllocs = Array.isArray(rawAllocs) ? rawAllocs : [];
  const leaves = [
    { type: 'Annual Leave', alloc: myAllocs.find(a => (a.leaveType || a.type || '').toLowerCase().includes('annual')) },
    { type: 'Sick Leave', alloc: myAllocs.find(a => (a.leaveType || a.type || '').toLowerCase().includes('sick')) },
    { type: 'Personal Leave', alloc: myAllocs.find(a => (a.leaveType || a.type || '').toLowerCase().includes('personal')) },
    { type: 'Emergency Leave', alloc: myAllocs.find(a => (a.leaveType || a.type || '').toLowerCase().includes('emergency')) },
  ].map(l => ({
    type: l.type,
    total: l.alloc?.totalDays || 0,
    rem: (l.alloc?.totalDays || 0) - (l.alloc?.usedDays || 0)
  }));

  // HR Stats
  const rawEmps = empData?.data?.items ?? empData?.data ?? [];
  const empCount = Array.isArray(rawEmps) ? rawEmps.length : 0;
  
  // just show some mock value for leaves allocated if not trackable
  const allocatedLeavesCount = myAllocs.length;

  return (
    <>
      <div className="fade-up-1" style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '500', color: C.text, margin: '0 0 16px 0' }}>This Month</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: '24px' }}>
          <div><div style={{ fontSize: '20px', fontWeight: '600', color: C.text }}>{presentCount}</div><div style={{ fontSize: '11px', color: C.muted }}>Present</div></div>
          <div><div style={{ fontSize: '20px', fontWeight: '600', color: C.text }}>{absentCount}</div><div style={{ fontSize: '11px', color: C.muted }}>Absent</div></div>
          <div><div style={{ fontSize: '20px', fontWeight: '600', color: C.text }}>{leaveCount}</div><div style={{ fontSize: '11px', color: C.muted }}>Leave</div></div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            width: '120px', height: '120px', borderRadius: '50%', 
            background: `conic-gradient(${C.primary} ${attPct}%, ${C.border} 0)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: '700', color: C.primary }}>{attPct}%</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: C.muted, marginTop: '12px' }}>{attPct}% attendance this month</div>
        </div>
      </div>

      <div className="fade-up-2" style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '500', color: C.text, margin: '0 0 16px 0' }}>Leave Balance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {leaves.map((l, i) => {
            const pct = l.total > 0 ? (l.rem / l.total) * 100 : 0;
            const color = l.rem <= 2 && l.total > 0 ? C.danger : C.primary;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: C.text }}>{l.type}</span>
                  <span style={{ color: C.muted }}>{l.rem} days remaining</span>
                </div>
                <div style={{ height: '4px', background: C.surfaceHover, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fade-up-3" style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '500', color: C.text, margin: '0 0 16px 0' }}>My HR Stats</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${C.primary}20`, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: C.primary }}>{empCount}</div>
              <div style={{ fontSize: '12px', color: C.muted }}>Employees Registered</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${C.secondary}20`, color: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: C.secondary }}>{allocatedLeavesCount}</div>
              <div style={{ fontSize: '12px', color: C.muted }}>Leave Types Allocated</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
