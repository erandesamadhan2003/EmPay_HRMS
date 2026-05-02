import React, { useState } from 'react';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  primary: '#14B8A6',
  primaryHover: '#0D9488',
  secondary: '#8B5CF6',
  success: '#10B981',
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

const typeColors = {
  'Annual Leave': C.primary,
  'Sick Leave': C.info,
  'Personal Leave': C.secondary,
  'Emergency Leave': C.danger
};

const statusColors = {
  'pending': { bg: `${C.warning}20`, text: C.warning },
  'approved': { bg: `${C.primary}20`, text: C.primary },
  'rejected': { bg: `${C.danger}20`, text: C.danger }
};

const getInitials = (name) => {
  if (!name) return 'XX';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function LeaveRequestCard({ request, onViewDetails }) {
  const [expanded, setExpanded] = useState(false);
  
  const isLongReason = request.reason && request.reason.length > 80;
  const displayReason = expanded || !isLongReason ? request.reason : request.reason.substring(0, 80) + '...';

  return (
    <div style={{ background: C.surface, borderRadius: '14px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', gap: '20px', transition: 'all 0.2s', cursor: 'default', flexWrap: 'wrap' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 0 0 1px ${C.primary}, 0 4px 12px rgba(0,0,0,0.2)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Left Section */}
      <div style={{ flex: '1 1 200px', minWidth: '200px', display: 'flex', gap: '16px', alignItems: 'flex-start', borderRight: `1px solid ${C.border}`, paddingRight: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: deptColors[request.department] || C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600', flexShrink: 0 }}>
          {getInitials(request.employeeName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: '500', fontSize: '15px', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{request.employeeName}</div>
          <div style={{ fontSize: '12px', color: C.muted, fontFamily: 'monospace', margin: '4px 0' }}>{request.loginId}</div>
          <div style={{ display: 'inline-block', padding: '2px 8px', background: C.bg, borderRadius: '12px', fontSize: '11px', color: C.muted, border: `1px solid ${C.border}` }}>
            {request.department}
          </div>
        </div>
      </div>

      {/* Center Section */}
      <div style={{ flex: '3 1 300px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-block', padding: '4px 10px', background: `${typeColors[request.leaveType] || C.primary}20`, color: typeColors[request.leaveType] || C.primary, borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
            {request.leaveType}
          </div>
          <div style={{ fontSize: '14px', color: C.text }}>
            {new Date(request.fromDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})} &mdash; {new Date(request.toDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: C.text }}>
            &bull; {request.days} day{request.days > 1 ? 's' : ''}
          </div>
        </div>
        
        <div style={{ fontSize: '13px', color: C.muted, lineHeight: '1.5' }}>
          {displayReason}
          {isLongReason && (
            <span onClick={() => setExpanded(!expanded)} style={{ color: C.primary, cursor: 'pointer', marginLeft: '6px', fontWeight: '500' }}>
              {expanded ? 'Show less' : 'Read more'}
            </span>
          )}
        </div>
        
        <div style={{ fontSize: '12px', color: C.muted, marginTop: 'auto', paddingTop: '8px' }}>
          Applied on {new Date(request.appliedOn).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
        </div>
      </div>

      {/* Right Section */}
      <div style={{ flex: '1 1 120px', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', borderLeft: `1px solid ${C.border}`, paddingLeft: '16px' }}>
        <div style={{ padding: '6px 16px', background: statusColors[request.status].bg, color: statusColors[request.status].text, borderRadius: '20px', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>
          {request.status}
        </div>
        
        <button onClick={() => onViewDetails(request)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${C.primary}`, color: C.primary, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s', marginTop: '16px' }}
          onMouseEnter={e => e.currentTarget.style.background = `${C.primary}10`}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          View Details
        </button>
      </div>
    </div>
  );
}
