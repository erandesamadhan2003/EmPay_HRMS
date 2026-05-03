import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

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
  warningBg: 'rgba(245, 158, 11, 0.1)',
  info: '#06B6D4',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#334155',
  font: '"Poppins", sans-serif'
};

const deptColors = {
  'Engineering': C.primary,
  'HR': C.secondary,
  'Finance': C.info,
  'Operations': C.warning,
  'Marketing': C.success
};

const InputBase = {
  width: '100%',
  padding: '10px 12px',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: '8px',
  color: C.text,
  fontSize: '14px',
  fontFamily: C.font,
  outline: 'none',
  boxSizing: 'border-box'
};

import { useEmployees, useTimeOffAllocations, useTimeOffAllocationMutations } from '../../hooks';

const getInitials = (name) => {
  if (!name) return 'XX';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const LeaveCell = ({ used, total }) => {
  const remaining = total - used;
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  let color = C.primary;
  if (pct <= 20) color = C.danger;
  else if (pct <= 50) color = C.warning;

  return (
    <div style={{ padding: '8px 16px', minWidth: '120px' }}>
      <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
        <span>
          <span style={{ color: C.muted }}>{used}</span>
          <span style={{ color: C.muted, margin: '0 4px' }}>/</span>
          <span style={{ color: C.text, fontWeight: '500' }}>{total}</span>
        </span>
        <span style={{ fontSize: '11px', color: C.muted }}>{remaining} left</span>
      </div>
      <div style={{ height: '4px', background: C.surfaceHover, borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: color, borderRadius: '2px', transition: 'width 0.3s ease' }}></div>
      </div>
    </div>
  );
};

export default function LeaveAllocation() {
  const { data: empData, isLoading: empLoading } = useEmployees();
  const { data: allocData, isLoading: allocLoading } = useTimeOffAllocations();
  const { createAllocation, updateAllocation, isCreating, isUpdating } = useTimeOffAllocationMutations();

  const [modalMode, setModalMode] = useState(null); // 'add', 'edit'
  const [formData, setFormData] = useState({ employeeId: '', annualLeave: 12, sickLeave: 8, personalLeave: 4, emergencyLeave: 2 });
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkAnnual, setBulkAnnual] = useState(12);
  const [bulkAllModal, setBulkAllModal] = useState(false);
  const [bulkAllForm, setBulkAllForm] = useState({ annualLeave: 12, sickLeave: 8, personalLeave: 4, emergencyLeave: 2 });
  const [bulkAllProgress, setBulkAllProgress] = useState(null);

  const rawEmps = empData?.data?.items ?? empData?.data ?? empData ?? [];
  const employees = (Array.isArray(rawEmps) ? rawEmps : []).map(e => ({
    id: e.id,
    name: e.name || 'Unknown',
    loginId: e.loginId || '—',
    department: e.profile?.department?.name || 'Unassigned',
  }));

  const rawAllocs = allocData?.data?.items ?? allocData?.data ?? allocData ?? [];
  const apiAllocations = Array.isArray(rawAllocs) ? rawAllocs : [];

  const allocations = employees.map(emp => {
    const empAllocs = apiAllocations.filter(a => a.userId === emp.id || a.employee?.id === emp.id);
    const getLeave = (type) => empAllocs.find(a => {
      const lt = (a.leaveType || a.type || '').toLowerCase().replace(/[_ ]+/g, '');
      return lt.includes(type.toLowerCase().replace(/[_ ]+/g, ''));
    });
    
    const ann = getLeave('annual');
    const sck = getLeave('sick');
    const prs = getLeave('personal');
    const emg = getLeave('emergency');

    return {
      employeeId: emp.id,
      annId: ann?.id,
      annualLeave: ann?.allocatedDays ?? ann?.totalDays ?? 0,
      usedAnnual: ann?.usedDays ?? 0,
      sckId: sck?.id,
      sickLeave: sck?.allocatedDays ?? sck?.totalDays ?? 0,
      usedSick: sck?.usedDays ?? 0,
      prsId: prs?.id,
      personalLeave: prs?.allocatedDays ?? prs?.totalDays ?? 0,
      usedPersonal: prs?.usedDays ?? 0,
      emgId: emg?.id,
      emergencyLeave: emg?.allocatedDays ?? emg?.totalDays ?? 0,
      usedEmergency: emg?.usedDays ?? 0,
    };
  });

  let zeroBalanceCount = 0;
  let totalRemaining = 0;
  
  allocations.forEach(a => {
    const remAnn = a.annualLeave - a.usedAnnual;
    const remSick = a.sickLeave - a.usedSick;
    const remPers = a.personalLeave - a.usedPersonal;
    const remEmer = a.emergencyLeave - a.usedEmergency;
    const totalRem = remAnn + remSick + remPers + remEmer;
    if (remAnn <= 0) zeroBalanceCount++;
    totalRemaining += totalRem;
  });
  
  const avgBalance = allocations.length > 0 ? Math.round(totalRemaining / allocations.length) : 0;

  const handleSaveModal = async () => {
    if (!formData.employeeId) return;
    try {
      const vs = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const ve = new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10);
      const empAllocs = allocations.find(a => a.employeeId === Number(formData.employeeId));

      const doSave = (leaveType, days, existingId) => {
        if (existingId) {
          return updateAllocation({ id: existingId, data: { allocatedDays: days } });
        } else {
          return createAllocation({ userId: formData.employeeId, leaveType, allocatedDays: days, validityStart: vs, validityEnd: ve });
        }
      };

      const p1 = doSave('annual_leave', formData.annualLeave, empAllocs?.annId);
      const p2 = doSave('sick_leave', formData.sickLeave, empAllocs?.sckId);
      const p3 = doSave('personal_leave', formData.personalLeave, empAllocs?.prsId);
      const p4 = doSave('emergency_leave', formData.emergencyLeave, empAllocs?.emgId);
      
      await Promise.allSettled([p1, p2, p3, p4]);
      setModalMode(null);
    } catch(e) {
      console.error(e);
    }
  };

  const handleBulkApply = async () => {
    try {
      const vs = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const ve = new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10);
      const promises = employees.map(emp => {
        const empAllocs = allocations.find(a => a.employeeId === emp.id);
        if (empAllocs?.annId) {
          return updateAllocation({ id: empAllocs.annId, data: { allocatedDays: bulkAnnual } });
        } else {
          return createAllocation({ userId: emp.id, leaveType: 'annual_leave', allocatedDays: bulkAnnual, validityStart: vs, validityEnd: ve });
        }
      });
      await Promise.allSettled(promises);
      setBulkConfirm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkAllApply = async () => {
    const vs = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const ve = new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10);
    setBulkAllProgress(0);
    const total = employees.length;
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const ea = allocations.find(a => a.employeeId === emp.id);
      const doSave = (lt, days, eid) => eid
        ? updateAllocation({ id: eid, data: { allocatedDays: days } })
        : createAllocation({ userId: emp.id, leaveType: lt, allocatedDays: days, validityStart: vs, validityEnd: ve });
      await Promise.allSettled([
        doSave('annual_leave',   bulkAllForm.annualLeave,   ea?.annId),
        doSave('sick_leave',     bulkAllForm.sickLeave,     ea?.sckId),
        doSave('personal_leave', bulkAllForm.personalLeave, ea?.prsId),
        doSave('emergency_leave',bulkAllForm.emergencyLeave,ea?.emgId),
      ]);
      setBulkAllProgress(Math.round(((i + 1) / total) * 100));
    }
    setBulkAllModal(false);
    setBulkAllProgress(null);
  };

  // Chart: show allocated vs used for first 20 employees with any allocation
  const chartData = allocations
    .filter(a => a.annualLeave > 0 || a.sickLeave > 0)
    .slice(0, 20)
    .map(a => {
      const emp = employees.find(e => e.id === a.employeeId);
      if (!emp) return null;
      return {
        name: emp.name.split(' ')[0],
        Allocated: a.annualLeave + a.sickLeave + a.personalLeave + a.emergencyLeave,
        Used: a.usedAnnual + a.usedSick + a.usedPersonal + a.usedEmergency,
        Remaining: (a.annualLeave - a.usedAnnual) + (a.sickLeave - a.usedSick) + (a.personalLeave - a.usedPersonal) + (a.emergencyLeave - a.usedEmergency),
      };
    }).filter(Boolean);

  const selectedEmpInfo = employees.find(e => e.id === Number(formData.employeeId));

  if (empLoading || allocLoading) {
    return (
      <MainLayout role="hr" pageTitle="Leave Allocation">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: C.muted, fontFamily: C.font }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div>Loading Allocation Data...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="hr" pageTitle="Leave Allocation">
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-modal {
          animation: fadeInScale 0.25s ease-out forwards;
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
        
        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Leave Allocation</h1>
            <div style={{ fontSize: '14px', color: C.muted, marginTop: '4px' }}>Manage leave balances for all employees</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => setBulkAllModal(true)} style={{
              padding: '10px 20px', background: C.secondary, color: '#fff', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: `0 4px 12px ${C.secondary}40`, transition: 'all 0.2s'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Allocate All Employees
            </button>
            <button onClick={() => {
              setFormData({ employeeId: '', annualLeave: 12, sickLeave: 8, personalLeave: 4, emergencyLeave: 2 });
              setModalMode('add');
            }} style={{
              padding: '10px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: `0 4px 12px ${C.primary}40`, transition: 'all 0.2s'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Allocate Employee
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Total Leave Types</div>
                <div style={{ color: C.text, fontSize: '28px', fontWeight: '600' }}>4</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${C.secondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
            </div>
          </div>
          
          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Employees with Zero Balance</div>
                <div style={{ color: C.text, fontSize: '28px', fontWeight: '600' }}>{zeroBalanceCount}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${C.danger}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.danger }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
            </div>
          </div>

          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Avg Leave Balance</div>
                <div style={{ color: C.text, fontSize: '28px', fontWeight: '600' }}>{avgBalance}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${C.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
            </div>
          </div>
        </div>

        {/* ALLOCATION TABLE */}
        <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, overflowX: 'auto' }} className="hide-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontWeight: '500', fontSize: '13px', background: C.bg }}>Employee</th>
                <th style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontWeight: '500', fontSize: '13px', background: C.bg }}>Annual Leave</th>
                <th style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontWeight: '500', fontSize: '13px', background: C.bg }}>Sick Leave</th>
                <th style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontWeight: '500', fontSize: '13px', background: C.bg }}>Personal Leave</th>
                <th style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontWeight: '500', fontSize: '13px', background: C.bg }}>Emergency Leave</th>
                <th style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontWeight: '500', fontSize: '13px', background: C.bg, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: C.muted }}>No allocations found.</td></tr>
              ) : allocations.map((a, i) => {
                const emp = employees.find(e => e.id === a.employeeId);
                if (!emp) return null;
                return (
                  <tr key={a.employeeId} style={{ background: i % 2 === 0 ? C.surface : C.surfaceHover, borderBottom: `1px solid ${C.border}`, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.surfaceHover; e.currentTarget.style.boxShadow = `inset 4px 0 0 ${C.primary}`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.surfaceHover; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: deptColors[emp.department] || C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', color: C.text, fontSize: '14px' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'monospace', marginTop: '2px' }}>{emp.loginId}</div>
                        </div>
                      </div>
                    </td>
                    <td><LeaveCell used={a.usedAnnual} total={a.annualLeave} /></td>
                    <td><LeaveCell used={a.usedSick} total={a.sickLeave} /></td>
                    <td><LeaveCell used={a.usedPersonal} total={a.personalLeave} /></td>
                    <td><LeaveCell used={a.usedEmergency} total={a.emergencyLeave} /></td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button onClick={() => {
                        setFormData({ employeeId: a.employeeId, annualLeave: a.annualLeave, sickLeave: a.sickLeave, personalLeave: a.personalLeave, emergencyLeave: a.emergencyLeave });
                        setModalMode('edit');
                      }} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', padding: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Allocation">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* LEAVE BALANCE OVERVIEW CHART */}
        <div style={{ background: C.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: C.text, margin: 0 }}>Leave Balance Overview</h2>
            <div style={{ fontSize: '12px', color: C.muted }}>Top {Math.min(20, chartData.length)} employees</div>
          </div>
          {chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>No allocation data to display. Allocate leaves to employees first.</div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }} className="hide-scroll">
              <div style={{ minWidth: `${Math.max(600, chartData.length * 60)}px`, height: '360px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="name" stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} dy={10} interval={0} />
                    <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      cursor={{ fill: `${C.primary}15` }}
                      contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '13px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Allocated" fill={C.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Used" fill={C.danger} radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Remaining" fill={C.success} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* BULK ALLOCATE PANEL */}
        <div style={{ background: C.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: C.text, margin: '0 0 8px 0' }}>Bulk Reset Annual Leaves</h3>
            <div style={{ fontSize: '14px', color: C.muted }}>Reset all employees annual leave balance to default at year start.</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: C.muted, marginBottom: '6px', fontWeight: '500' }}>New Annual Leave Limit</label>
              <input type="number" style={{ ...InputBase, width: '120px' }} value={bulkAnnual} onChange={e => setBulkAnnual(Number(e.target.value))} min="0" />
            </div>
            <button onClick={() => setBulkConfirm(true)} style={{ padding: '10px 24px', background: C.warning, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: `0 4px 12px ${C.warning}40` }}>
              Apply to All
            </button>
          </div>
        </div>

      </div>

      {/* ALLOCATE MODAL */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setModalMode(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}></div>
          <div className="animate-modal hide-scroll" style={{ position: 'relative', width: '100%', maxWidth: '440px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: C.text }}>
                {modalMode === 'add' ? 'Allocate Leaves' : 'Edit Leave Balance'}
              </h2>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: selectedEmpInfo ? (deptColors[selectedEmpInfo.department] || C.primary) : C.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '16px', flexShrink: 0 }}>
                {selectedEmpInfo ? getInitials(selectedEmpInfo.name) : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: C.muted, marginBottom: '6px', fontWeight: '500' }}>Select Employee</label>
                <select style={InputBase} value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} disabled={modalMode === 'edit'}>
                  <option value="" disabled>Select Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.loginId})</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {['annualLeave', 'sickLeave', 'personalLeave', 'emergencyLeave'].map(field => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: '12px', color: C.text, marginBottom: '6px', fontWeight: '500' }}>
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <input type="number" style={InputBase} value={formData[field]} onChange={e => setFormData({...formData, [field]: Number(e.target.value)})} min="0" />
                  <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>days per year</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '28px', padding: '16px', background: `${C.primary}10`, border: `1px solid ${C.primary}40`, borderRadius: '12px' }}>
              <div style={{ color: C.primary, fontWeight: '600', fontSize: '15px' }}>
                Total allocated: {Number(formData.annualLeave) + Number(formData.sickLeave) + Number(formData.personalLeave) + Number(formData.emergencyLeave)} days
              </div>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '6px', lineHeight: '1.4' }}>
                These are yearly allocations. Used leaves will be deducted automatically based on approved requests.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setModalMode(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${C.border}`, color: C.text, borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Cancel
              </button>
              <button onClick={handleSaveModal} disabled={!formData.employeeId || isCreating || isUpdating} style={{ flex: 1, padding: '12px', background: C.primary, border: 'none', color: '#fff', borderRadius: '8px', cursor: formData.employeeId ? 'pointer' : 'not-allowed', fontWeight: '500', opacity: formData.employeeId && !isCreating && !isUpdating ? 1 : 0.5, boxShadow: formData.employeeId ? `0 4px 12px ${C.primary}40` : 'none' }}>
                {isCreating || isUpdating ? 'Saving...' : (modalMode === 'add' ? 'Allocate' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ALL EMPLOYEES MODAL */}
      {bulkAllModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => !bulkAllProgress && setBulkAllModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
          <div className="animate-modal hide-scroll" style={{ position: 'relative', width: '100%', maxWidth: '480px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: C.text }}>Allocate All Employees</h2>
              <button onClick={() => setBulkAllModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px 0' }}>Set leave balances for all <strong style={{ color: C.text }}>{employees.length}</strong> employees at once. Existing allocations will be updated.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[['annualLeave','Annual Leave',C.primary],['sickLeave','Sick Leave',C.secondary],['personalLeave','Personal Leave',C.info],['emergencyLeave','Emergency Leave',C.warning]].map(([field, label, color]) => (
                <div key={field} style={{ background: C.bg, borderRadius: '10px', padding: '16px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '11px', color, fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <input type="number" min="0" style={{ ...InputBase, fontSize: '18px', fontWeight: '600', padding: '8px 12px', color }} value={bulkAllForm[field]} onChange={e => setBulkAllForm(f => ({ ...f, [field]: Number(e.target.value) }))} />
                  <div style={{ fontSize: '11px', color: C.muted, marginTop: '6px' }}>days / year</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 16px', background: `${C.secondary}10`, border: `1px solid ${C.secondary}30`, borderRadius: '10px', marginBottom: '24px' }}>
              <div style={{ color: C.secondary, fontWeight: '600', fontSize: '14px' }}>Total per employee: {Object.values(bulkAllForm).reduce((s, v) => s + Number(v), 0)} days</div>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>Will apply to {employees.length} employees · Validity: Jan 1 – Dec 31, {new Date().getFullYear()}</div>
            </div>
            {bulkAllProgress !== null && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.muted, marginBottom: '6px' }}>
                  <span>Processing employees...</span><span>{bulkAllProgress}%</span>
                </div>
                <div style={{ height: '6px', background: C.surfaceHover, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${bulkAllProgress}%`, background: C.secondary, borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setBulkAllModal(false)} disabled={bulkAllProgress !== null} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${C.border}`, color: C.text, borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleBulkAllApply} disabled={bulkAllProgress !== null} style={{ flex: 1, padding: '12px', background: C.secondary, border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', opacity: bulkAllProgress !== null ? 0.6 : 1, boxShadow: `0 4px 12px ${C.secondary}40` }}>
                {bulkAllProgress !== null ? `Applying... ${bulkAllProgress}%` : `Apply to All ${employees.length} Employees`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK CONFIRM MODAL */}
      {bulkConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setBulkConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}></div>
          <div className="animate-modal" style={{ position: 'relative', width: '100%', maxWidth: '400px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '32px 24px', textAlign: 'center', margin: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${C.warning}20`, color: C.warning, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: C.text, margin: '0 0 12px 0' }}>Confirm Bulk Reset</h3>
            <p style={{ fontSize: '14px', color: C.muted, margin: '0 0 32px 0', lineHeight: '1.5' }}>This will set the Annual Leave limit to <strong style={{color:C.text}}>{bulkAnnual}</strong> and reset the used amount to <strong style={{color:C.text}}>0</strong> for <strong>ALL</strong> employees. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setBulkConfirm(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${C.border}`, color: C.text, borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleBulkApply} disabled={isCreating} style={{ flex: 1, padding: '12px', background: C.warning, border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: `0 4px 12px ${C.warning}40`, opacity: isCreating ? 0.5 : 1 }}>{isCreating ? 'Applying...' : 'Yes, Reset All'}</button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
