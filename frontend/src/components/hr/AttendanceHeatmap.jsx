import React, { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  primary: '#14B8A6',
  primaryHover: '#0D9488',
  secondary: '#8B5CF6',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#06B6D4',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#334155',
  font: '"Poppins", sans-serif'
};

export default function AttendanceHeatmap({ employees }) {
  const daysInMonth = 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDate = 15;
  
  const [tooltip, setTooltip] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  const handleCellEnter = (e, emp, day) => {
    const status = emp.attendance[day];
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      text: `${emp.name} — May ${day} — ${status.charAt(0).toUpperCase() + status.slice(1)}`
    });
  };
  
  const handleCellLeave = () => setTooltip(null);
  
  const getCellStyles = (status) => {
    switch(status) {
      case 'present': return { background: C.primary, text: '' };
      case 'absent': return { background: C.danger, text: '' };
      case 'leave': return { background: C.warning, text: '' };
      case 'holiday': return { background: C.surfaceHover, text: 'H', color: C.muted };
      case 'weekend': return { background: 'transparent', text: '' };
      default: return { background: 'transparent', text: '' };
    }
  };

  const calculateTotals = (emp) => {
    let p=0, a=0, l=0, w=0;
    Object.values(emp.attendance).forEach(val => {
      if(val==='present') p++;
      if(val==='absent') a++;
      if(val==='leave') l++;
      if(val!=='weekend' && val!=='holiday') w++;
    });
    const pct = w > 0 ? Math.round((p / w) * 100) : 0;
    return { p, a, l, pct };
  };

  const handleEmpClick = (emp) => {
    const hoursData = days.map(d => {
      const status = emp.attendance[d];
      let hours = 0;
      if (status === 'present') hours = 7 + Math.random() * 2;
      return { day: d, hours: parseFloat(hours.toFixed(1)) };
    });
    setSelectedEmp({ ...emp, hoursData, totals: calculateTotals(emp) });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ overflowX: 'auto', background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}` }} className="hide-scroll">
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', background: C.bg, color: C.muted, fontWeight: '500', position: 'sticky', left: 0, zIndex: 10, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, textAlign: 'left', minWidth: '180px' }}>Employee</th>
              {days.map(d => {
                const dayOfWeek = (d + 3) % 7;
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isToday = d === todayDate;
                return (
                  <th key={d} style={{ 
                    padding: '12px 6px', 
                    background: isWeekend ? C.bg : C.surface, 
                    borderBottom: `1px solid ${C.border}`,
                    color: isToday ? C.primary : (isWeekend ? C.muted : C.text),
                    fontWeight: isToday ? '600' : '400',
                    textAlign: 'center',
                    minWidth: '32px'
                  }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: isToday ? `${C.primary}20` : 'transparent' }}>
                      {isWeekend ? 'S' : d}
                    </div>
                  </th>
                )
              })}
              <th style={{ padding: '12px 16px', background: C.bg, color: C.muted, fontWeight: '500', position: 'sticky', right: 0, zIndex: 10, borderLeft: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>Totals</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const totals = calculateTotals(emp);
              return (
                <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'all 0.2s', background: C.surface }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.surfaceHover;
                    e.currentTarget.style.boxShadow = `inset 3px 0 0 ${C.primary}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = C.surface;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td style={{ padding: '8px 16px', position: 'sticky', left: 0, background: 'inherit', borderRight: `1px solid ${C.border}`, zIndex: 5, cursor: 'pointer' }} onClick={() => handleEmpClick(emp)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: C.primaryHover, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                        {emp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: '500', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                      </div>
                    </div>
                  </td>
                  {days.map(d => {
                    const status = emp.attendance[d];
                    const s = getCellStyles(status);
                    const dayOfWeek = (d + 3) % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <td key={d} style={{ padding: '4px', textAlign: 'center', background: isWeekend ? C.bg : 'inherit' }}
                        onMouseEnter={(e) => handleCellEnter(e, emp, d)}
                        onMouseLeave={handleCellLeave}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: s.background, color: s.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', margin: '0 auto' }}>
                          {s.text}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 16px', position: 'sticky', right: 0, background: 'inherit', borderLeft: `1px solid ${C.border}`, zIndex: 5, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '12px', fontWeight: '500' }}>
                      <span style={{ color: C.primary }} title="Present">P:{totals.p}</span>
                      <span style={{ color: C.muted }}>|</span>
                      <span style={{ color: C.danger }} title="Absent">A:{totals.a}</span>
                      <span style={{ color: C.muted }}>|</span>
                      <span style={{ color: C.warning }} title="Leave">L:{totals.l}</span>
                      <span style={{ color: C.muted }}>|</span>
                      <span style={{ color: totals.pct >= 90 ? C.primary : (totals.pct >= 75 ? C.warning : C.danger) }}>{totals.pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {tooltip && tooltip.visible && (
        <div style={{
          position: 'fixed',
          top: tooltip.y - 40,
          left: tooltip.x,
          transform: 'translateX(-50%)',
          background: C.surface,
          border: `1px solid ${C.border}`,
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: C.text,
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.15s ease-out forwards',
        }}>
          {tooltip.text}
        </div>
      )}

      {selectedEmp && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={() => setSelectedEmp(null)}></div>
          <div style={{ 
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100%',
            background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 1001,
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out forwards',
            boxShadow: '-8px 0 24px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: '600', flexShrink: 0 }}>
                  {selectedEmp.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', color: C.text }}>{selectedEmp.name}</h2>
                  <div style={{ color: C.muted, fontSize: '13px', marginTop: '2px' }}>{selectedEmp.role} &bull; {selectedEmp.department}</div>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '16px', background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: C.primary }}>{selectedEmp.totals.p}</div>
                  <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>Present</div>
                </div>
                <div style={{ padding: '16px', background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: C.danger }}>{selectedEmp.totals.a}</div>
                  <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>Absent</div>
                </div>
                <div style={{ padding: '16px', background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: C.warning }}>{selectedEmp.totals.l}</div>
                  <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>Leave</div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: C.text, marginBottom: '16px', marginTop: 0 }}>Daily Hours Logged</h3>
                <div style={{ height: '200px', background: C.bg, borderRadius: '12px', padding: '16px 16px 0 0', border: `1px solid ${C.border}` }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedEmp.hoursData}>
                      <XAxis dataKey="day" stroke={C.muted} fontSize={10} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '12px' }}
                        itemStyle={{ color: C.primary }}
                        formatter={(value) => [`${value} hrs`, 'Logged']}
                        labelFormatter={(l) => `May ${l}`}
                        cursor={{ fill: C.surfaceHover }}
                      />
                      <Bar dataKey="hours" fill={C.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: C.text, marginBottom: '16px', marginTop: 0 }}>Weekly Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(w => {
                    const start = (w - 1) * 7 + 1;
                    const end = Math.min(w * 7, 31);
                    if (start > 31) return null;
                    let wp=0, wa=0;
                    for (let i=start; i<=end; i++) {
                      if(selectedEmp.attendance[i]==='present') wp++;
                      if(selectedEmp.attendance[i]==='absent') wa++;
                    }
                    return (
                      <div key={w} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: C.bg, borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px' }}>
                        <span style={{ color: C.text, fontWeight: '500' }}>Week {w} (May {start}-{end})</span>
                        <div style={{ display: 'flex', gap: '16px', color: C.muted }}>
                          <span><span style={{ color: C.primary }}>{wp}</span> Present</span>
                          <span><span style={{ color: C.danger }}>{wa}</span> Absent</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
