import React, { useState } from 'react';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  cyan: '#06B6D4', cyanLight: 'rgba(6,182,212,0.15)',
  warning: '#F59E0B', warningLight: 'rgba(245,158,11,0.15)',
  danger: '#EF4444', dangerLight: 'rgba(239,68,68,0.15)',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

export const CompanyRequestCard = ({ request, onApprove, onReject, compact = true }) => {
  const [showReason, setShowReason] = useState(false);
  const isPending = request.status === 'pending' || !request.status;
  const isApproved = request.status === 'approved';
  const isRejected = request.status === 'rejected';

  let statusColor = C.warning;
  let statusLight = C.warningLight;
  if (isApproved) { statusColor = C.teal; statusLight = C.tealLight; }
  if (isRejected) { statusColor = C.danger; statusLight = C.dangerLight; }

  return (
    <div 
      className="sa-fade-up sa-request-card"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        padding: compact ? '16px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={e => {
        if (isPending) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = C.warning;
          e.currentTarget.style.boxShadow = `0 4px 16px ${C.warningLight}`;
        }
      }}
      onMouseLeave={e => {
        if (isPending) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: compact ? 'center' : 'flex-start', gap: '16px', width: '100%' }}>
        <div style={{
          width: compact ? '48px' : '56px',
          height: compact ? '48px' : '56px',
          borderRadius: '50%',
          background: C.violetLight,
          color: C.violet,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: compact ? '18px' : '20px',
          fontWeight: 700,
          flexShrink: 0
        }}>
          {getInitials(request.companyName)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {request.companyName}
              </div>
              <div style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>
                {request.adminName}
              </div>
            </div>
            {compact && (
              <div style={{ 
                padding: '2px 8px', borderRadius: '12px', background: statusLight, color: statusColor, 
                fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'
              }}>
                {request.status || 'Pending'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: C.muted, flexWrap: 'wrap' }}>
            <span>{request.email}</span>
            <span>•</span>
            <span>{request.appliedAt || request.appliedOn || '3 hours ago'}</span>
          </div>

          {!compact && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: C.muted, marginBottom: '8px' }}>
                <span>📞 {request.phone || 'N/A'}</span>
                <span>📍 {request.city || 'N/A'}</span>
                <span>🏢 {request.industry || 'Technology'}</span>
                {request.employeeCount && <span>👥 ~{request.employeeCount}</span>}
              </div>
              <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {request.description || 'Requesting platform access to manage employee payroll and HR operations.'}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: compact ? 'row' : 'column', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {!compact && (
            <div style={{ 
              padding: '4px 10px', borderRadius: '12px', background: statusLight, color: statusColor, 
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px'
            }}>
              {request.status || 'Pending'}
            </div>
          )}
          
          {isPending ? (
            compact ? (
              <>
                <button 
                  onClick={() => onApprove(request)}
                  title="Approve"
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    background: C.tealLight, color: C.teal, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.teal; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.tealLight; e.currentTarget.style.color = C.teal; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button 
                  onClick={() => onReject(request)}
                  title="Reject"
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    background: C.dangerLight, color: C.danger, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.danger; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.dangerLight; e.currentTarget.style.color = C.danger; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end', marginTop: 'auto' }}>
                <button 
                  onClick={() => onReject(request)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', background: 'transparent',
                    border: `1px solid ${C.danger}`, color: C.danger, cursor: 'pointer',
                    fontSize: '13px', fontWeight: 600, transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.dangerLight; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Reject
                </button>
                <button 
                  onClick={() => onApprove(request)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', background: C.teal,
                    border: `1px solid ${C.teal}`, color: '#fff', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 600, transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 12px ${C.tealLight}`; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Approve
                </button>
              </div>
            )
          ) : (
            // READ-ONLY STATE
            !compact && (
              <div style={{ textAlign: 'right', fontSize: '11px', color: C.muted, marginTop: 'auto' }}>
                <div>Reviewed by: {request.reviewedBy || 'System'}</div>
                <div>Reviewed on: {request.reviewedOn || 'N/A'}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* COLLAPSIBLE NOTE/REASON FOR APPROVED/REJECTED */}
      {!isPending && !compact && request.reviewNote && (
        <div style={{ marginTop: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
          <div 
            onClick={() => setShowReason(!showReason)}
            style={{ fontSize: '12px', color: C.teal, cursor: 'pointer', fontWeight: 500, display: 'inline-block' }}
          >
            {showReason ? 'Hide reason ↑' : 'Show reason ↓'}
          </div>
          {showReason && (
            <div style={{ 
              marginTop: '8px', padding: '12px', background: C.bg, 
              border: `1px solid ${C.border}`, borderRadius: '8px', 
              fontSize: '13px', color: C.muted, fontStyle: 'italic',
              borderLeft: `3px solid ${isApproved ? C.teal : C.danger}`
            }}>
              {request.reviewNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
