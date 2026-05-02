import React, { useState, useEffect } from 'react';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  danger: '#EF4444', dangerLight: 'rgba(239,68,68,0.15)',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

export const ReviewRequestModal = ({ request, action, isOpen, onClose, onConfirm, loading }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const isApprove = action === 'approve';
  const color = isApprove ? C.teal : C.danger;
  const colorLight = isApprove ? C.tealLight : C.dangerLight;
  
  const handleConfirm = () => {
    if (!isApprove && note.length < 20) {
      setError(true);
      return;
    }
    onConfirm(request.id, action, note);
  };

  const maxChars = isApprove ? 300 : 500;
  
  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'sa-overlay 0.2s ease'
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes sa-modal-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes sa-overlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sa-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .sa-modal-enter { animation: sa-modal-scale 0.25s ease-out forwards; }
        .sa-error-shake { animation: sa-shake 0.3s ease; }
      `}</style>
      
      <div 
        className="sa-modal-enter"
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: '16px',
          width: '90%',
          maxWidth: '500px',
          overflow: 'hidden',
          fontFamily: '"Poppins", sans-serif',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* HEADER */}
        <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: colorLight, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {isApprove ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: C.text }}>
              {isApprove ? 'Approve Company Registration' : 'Reject Company Registration'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '24px' }}>
          {/* Summary Card */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: C.text, marginBottom: '8px' }}>{request.companyName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: C.muted }}>
              <div>Admin: <span style={{ color: C.text }}>{request.adminName}</span></div>
              <div>Email: <span style={{ color: C.text }}>{request.email}</span></div>
              <div>Industry: <span style={{ color: C.text }}>{request.industry || 'N/A'}</span></div>
              <div>City: <span style={{ color: C.text }}>{request.city || 'N/A'}</span></div>
              <div style={{ gridColumn: 'span 2' }}>Employees: <span style={{ color: C.text }}>~{request.employeeCount || 'N/A'}</span></div>
            </div>
          </div>

          {/* Textarea */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: C.text }}>
                {isApprove ? 'Welcome note (optional)' : 'Rejection reason (required)'}
              </label>
              <span style={{ fontSize: '11px', color: note.length > maxChars ? C.danger : C.muted }}>
                {note.length} / {maxChars}
              </span>
            </div>
            <textarea
              value={note}
              onChange={e => { setNote(e.target.value); setError(false); }}
              placeholder={isApprove ? "Add a welcome message..." : "Provide a clear reason (min 20 chars)..."}
              className={error ? 'sa-error-shake' : ''}
              style={{
                width: '100%', height: '100px', resize: 'none',
                background: C.bg, border: `1px solid ${error ? C.danger : C.border}`,
                borderRadius: '8px', padding: '12px', color: C.text, fontSize: '13px',
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = color}
              onBlur={e => e.target.style.borderColor = error ? C.danger : C.border}
            />
            {error && <div style={{ fontSize: '11px', color: C.danger, marginTop: '6px' }}>Minimum 20 characters required.</div>}
          </div>

          {/* Info Box */}
          <div style={{
            background: colorLight, borderLeft: `3px solid ${color}`,
            borderRadius: '0 8px 8px 0', padding: '12px 16px',
            fontSize: '13px', color: C.text, lineHeight: 1.5
          }}>
            {isApprove 
              ? "Approving will create a company workspace and send login credentials to the admin email."
              : "Rejecting will notify the company admin via email with your provided reason."
            }
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: '12px', background: C.bg }}>
          <button 
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 16px', background: 'transparent', border: 'none',
              color: C.muted, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={loading || (!isApprove && note.length < 20) || note.length > maxChars}
            style={{
              padding: '10px 20px', background: color, border: 'none', borderRadius: '8px',
              color: '#fff', fontWeight: 600, cursor: (loading || (!isApprove && note.length < 20) || note.length > maxChars) ? 'not-allowed' : 'pointer',
              opacity: (loading || (!isApprove && note.length < 20) || note.length > maxChars) ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {loading && <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'sa-spin 1s linear infinite' }} />}
            <style>{`@keyframes sa-spin { to { transform: rotate(360deg); } }`}</style>
            {isApprove ? 'Confirm Approve' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};
