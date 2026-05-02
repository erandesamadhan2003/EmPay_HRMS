import React from 'react';
import { useTimeOffAllocations } from '../../hooks';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  primary: '#14B8A6',
  secondary: '#8B5CF6',
  danger: '#EF4444',
  warning: '#F59E0B',
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

const getInitials = (name) => {
  if (!name) return 'XX';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function LeaveRequestModal({ request, onClose }) {
  if (!request) return null;

  const { data: allocData } = useTimeOffAllocations();
  const rawAllocs = allocData?.data?.items ?? allocData?.data ?? allocData ?? [];
  const apiAllocations = Array.isArray(rawAllocs) ? rawAllocs : [];

  const empAllocs = apiAllocations.filter(a => a.userId === request.employeeId || a.employee?.id === request.employeeId);
  const getLeave = (type) => empAllocs.find(a => (a.leaveType || a.type || '').toLowerCase().includes(type.toLowerCase()));

  const balances = {
    'Annual Leave': (getLeave('annual')?.totalDays || 0) - (getLeave('annual')?.usedDays || 0),
    'Sick Leave': (getLeave('sick')?.totalDays || 0) - (getLeave('sick')?.usedDays || 0),
    'Personal Leave': (getLeave('personal')?.totalDays || 0) - (getLeave('personal')?.usedDays || 0),
    'Emergency Leave': (getLeave('emergency')?.totalDays || 0) - (getLeave('emergency')?.usedDays || 0)
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}></div>
      <div className="animate-modal hide-scroll" style={{ position: 'relative', width: '100%', maxWidth: '600px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '32px', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${C.border}`, paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: deptColors[request.department] || C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '600', flexShrink: 0 }}>
              {getInitials(request.employeeName)}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: C.text }}>{request.employeeName}</h2>
              <div style={{ fontSize: '13px', color: C.muted, marginTop: '4px' }}>{request.role} &bull; {request.department} &bull; {request.loginId}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: C.muted, marginBottom: '4px' }}>Leave Type</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: C.text }}>{request.leaveType}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: C.muted, marginBottom: '4px' }}>Duration</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: C.text }}>{request.days} day(s)</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: C.muted, marginBottom: '4px' }}>From Date</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: C.text }}>{new Date(request.fromDate).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: C.muted, marginBottom: '4px' }}>To Date</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: C.text }}>{new Date(request.toDate).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: C.muted, marginBottom: '4px' }}>Applied On</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: C.text }}>{new Date(request.appliedOn).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}</div>
          </div>
        </div>

        {/* Reason */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Reason</div>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', fontSize: '14px', color: C.text, lineHeight: '1.6' }}>
            {request.reason}
          </div>
        </div>

        {/* Balance */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', color: C.muted, marginBottom: '12px' }}>Current Leave Balance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {Object.entries(balances).map(([type, amount]) => (
              <div key={type} style={{ background: C.bg, border: `1px solid ${type === request.leaveType ? C.primary : C.border}`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: type === request.leaveType ? C.primary : C.text }}>{amount}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>{type.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ background: `${C.surfaceHover}50`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '32px', left: '40px', right: '40px', height: '2px', background: C.border, zIndex: 0 }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: C.text }}>Applied</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: request.status === 'pending' ? C.warning : C.border, border: `2px solid ${C.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {request.status === 'pending' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></div>}
            </div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: request.status === 'pending' ? C.text : C.muted }}>Under Review</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: request.status === 'approved' ? C.primary : (request.status === 'rejected' ? C.danger : C.border), border: `2px solid ${C.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(request.status === 'approved' || request.status === 'rejected') && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></div>}
            </div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: (request.status === 'approved' || request.status === 'rejected') ? C.text : C.muted }}>Decision</div>
          </div>
        </div>

      </div>
    </div>
  );
}
