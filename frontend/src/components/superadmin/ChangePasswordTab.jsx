import React, { useState, useEffect } from 'react';
import { useMutation } from '../../hooks/useMutation';
import { BASE_URL } from '../../config/api';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const InputGroup = ({ label, value, onChange, placeholder, type = 'password', error }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: C.text, marginBottom: '8px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '12px 40px 12px 14px', background: C.bg, 
            border: `1px solid ${error ? C.danger : C.border}`, borderRadius: '8px',
            color: C.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s'
          }}
          onFocus={e => !error && (e.target.style.borderColor = C.teal)}
          onBlur={e => !error && (e.target.style.borderColor = C.border)}
        />
        <button 
          onClick={() => setShow(!show)}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          )}
        </button>
      </div>
      {error && <div style={{ fontSize: '12px', color: C.danger, marginTop: '4px' }}>{error}</div>}
    </div>
  );
};

export const ChangePasswordTab = ({ onSuccess }) => {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(newPwd);
  const strengthLabels = ["Very Weak", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strengthColors = [C.danger, C.danger, C.danger, C.warning, C.teal, C.teal];
  
  const requirements = [
    { label: "At least 8 characters", met: newPwd.length >= 8 },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(newPwd) },
    { label: "At least one number", met: /[0-9]/.test(newPwd) },
    { label: "At least one special character", met: /[^A-Za-z0-9]/.test(newPwd) }
  ];

  const match = confirm && newPwd === confirm;
  const canSubmit = requirements.every(r => r.met) && match && current;

  const { mutate: changePwd } = useMutation('POST');

  const handleSubmit = async () => {
    setLoading(true);
    setStatus(null);
    try {
      await changePwd('/auth/change-password', {
        current_password: current,
        new_password: newPwd,
        confirm_password: confirm
      });
      
      setStatus({ type: 'success', msg: 'Password updated successfully' });
      setCurrent(''); setNewPwd(''); setConfirm('');
      setTimeout(() => setStatus(null), 3000);
      if (onSuccess) onSuccess();
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px' }}>
      {status?.type === 'success' && (
        <div style={{ padding: '12px 16px', background: `${C.teal}20`, border: `1px solid ${C.teal}`, color: C.teal, borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 500, animation: 'sa-fade-in 0.3s' }}>
          {status.msg}
        </div>
      )}
      
      <InputGroup 
        label="Current Password" value={current} onChange={setCurrent} 
        placeholder="Enter current password" 
        error={status?.type === 'error' && status.msg.includes('Current') ? status.msg : null}
      />
      
      <div style={{ position: 'relative' }}>
        <InputGroup label="New Password" value={newPwd} onChange={setNewPwd} placeholder="Enter new password" />
        
        {/* Strength Meter */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: C.muted }}>Password Strength:</span>
            <span style={{ color: strengthColors[strength], fontWeight: 600 }}>{strengthLabels[strength]}</span>
          </div>
          <div style={{ height: '4px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: strengthColors[strength], width: `${(strength / 5) * 100}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>

        {/* Requirements Checklist */}
        {newPwd && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px', animation: 'sa-fade-in 0.3s' }}>
            {requirements.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: r.met ? C.teal : C.muted }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: r.met ? `${C.teal}20` : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.met ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: C.muted }} />
                  )}
                </div>
                {r.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <InputGroup label="Confirm New Password" value={confirm} onChange={setConfirm} placeholder="Confirm new password" />
      {confirm && (
        <div style={{ fontSize: '12px', color: match ? C.teal : C.danger, marginTop: '-12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {match ? '✓ Passwords match' : '✗ Passwords do not match'}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
        style={{ width: '100%', padding: '14px', background: C.teal, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: (canSubmit && !loading) ? 'pointer' : 'not-allowed', opacity: (canSubmit && !loading) ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }}
      >
        {loading && <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'sa-spin 1s linear infinite' }} />}
        Update Password
      </button>

      {/* 2FA Section */}
      <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '12px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Security Settings</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: C.text }}>Two-Factor Authentication</div>
            <div style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>Add an extra layer of security to your account</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span style={{ fontSize: '12px', color: C.warning, background: `${C.warning}10`, padding: '2px 8px', borderRadius: '12px' }}>Not enabled</span>
             <div 
               onClick={() => alert('Feature coming soon')}
               style={{ width: '40px', height: '22px', borderRadius: '11px', background: C.border, cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}
             >
                <div style={{ position: 'absolute', left: '3px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: C.muted }} />
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sa-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sa-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
