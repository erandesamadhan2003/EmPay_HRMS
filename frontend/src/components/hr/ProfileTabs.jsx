import React, { useState, useEffect, useMemo } from 'react';
import { useAllAttendance, useTimeOffRequests } from '../../hooks';

const InputBase = (C) => ({
  width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, 
  borderRadius: '8px', color: C.text, fontSize: '14px', fontFamily: C.font, outline: 'none', boxSizing: 'border-box'
});

export default function ProfileTabs({ activeTab, user, setUser, editMode, C }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(false);

  const handleUserChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = () => {
    let strength = 0;
    if (newPassword.length >= 1) strength = 25; // Weak
    if (newPassword.length >= 5) strength = 50; // Fair
    if (newPassword.length >= 8) strength = 75; // Good
    if (newPassword.length >= 8 && /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength = 100; // Strong
    return strength;
  };

  const str = getPasswordStrength();
  const strColor = str === 25 ? C.danger : str <= 75 ? C.warning : C.primary;
  const strLabel = str === 0 ? '' : str === 25 ? 'Weak' : str === 50 ? 'Fair' : str === 75 ? 'Good' : 'Strong';

  const passwordsMatch = newPassword && newPassword === confirmPassword;

  const handlePasswordUpdate = () => {
    setToast(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setToast(false), 3000);
  };

  const { data: attData } = useAllAttendance();
  const { data: leaveData } = useTimeOffRequests();

  const activities = useMemo(() => {
    const items = [];
    const rawAtt = attData?.data?.items ?? attData?.data ?? [];
    const myAtt = Array.isArray(rawAtt) ? rawAtt.filter(a => a.userId === user?.id || a.user_id === user?.id) : [];
    
    myAtt.slice(-5).forEach(r => {
      items.push({
        text: `Marked attendance as ${r.status}`,
        time: r.checkIn ? new Date(r.checkIn).toLocaleString() : new Date(r.date).toLocaleDateString()
      });
    });

    const rawLeaves = leaveData?.data?.items ?? leaveData?.data ?? [];
    const myLeaves = Array.isArray(rawLeaves) ? rawLeaves.filter(l => l.userId === user?.id || l.employeeId === user?.id) : [];
    
    myLeaves.slice(-5).forEach(l => {
      items.push({
        text: `Applied for ${l.leaveType || 'leave'}`,
        time: l.createdAt ? new Date(l.createdAt).toLocaleString() : 'Recently'
      });
    });

    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
  }, [attData, leaveData, user]);

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: C.primary, color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: `0 4px 12px ${C.primary}40`, animation: 'fadeIn 0.3s ease-in' }}>
          Password updated successfully!
        </div>
      )}

      {activeTab === 'personal' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '500', color: C.text, margin: '0 0 16px 0' }}>Personal Information</h3>
          </div>
          
          {[
            { label: 'Full Name', key: 'name', type: 'text', readOnly: false },
            { label: 'Login ID', key: 'loginId', type: 'text', readOnly: true },
            { label: 'Email', key: 'email', type: 'email', readOnly: false },
            { label: 'Phone', key: 'phone', type: 'tel', readOnly: false },
            { label: 'Date of Birth', key: 'dob', type: 'date', readOnly: false },
            { label: 'Gender', key: 'gender', type: 'select', readOnly: false, options: ['Male', 'Female', 'Other'] },
            { label: 'Department', key: 'department', type: 'text', readOnly: true },
            { label: 'Role', key: 'role', type: 'text', readOnly: true },
            { label: 'Join Date', key: 'joinDate', type: 'text', readOnly: true },
            { label: 'Status', key: 'status', type: 'status', readOnly: true },
          ].map((field, idx) => (
            <div key={idx}>
              <div style={{ fontSize: '12px', color: C.muted, marginBottom: '6px' }}>{field.label}</div>
              {field.key === 'status' ? (
                <div style={{ display: 'inline-block', padding: '4px 10px', background: `${C.primary}20`, color: C.primary, borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>Active</div>
              ) : !editMode || field.readOnly ? (
                <div style={{ fontSize: '15px', color: field.readOnly && editMode ? C.muted : C.text, padding: '10px 0' }}>{user[field.key]}</div>
              ) : field.type === 'select' ? (
                <select name={field.key} value={user[field.key]} onChange={handleUserChange} style={InputBase(C)}>
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input name={field.key} type={field.type === 'date' ? 'text' : field.type} value={user[field.key]} onChange={handleUserChange} style={InputBase(C)} />
              )}
            </div>
          ))}

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '12px', color: C.muted, marginBottom: '6px' }}>Address</div>
            {!editMode ? (
              <div style={{ fontSize: '15px', color: C.text, padding: '10px 0' }}>{user.address}</div>
            ) : (
              <textarea name="address" value={user.address} onChange={handleUserChange} style={{ ...InputBase(C), minHeight: '80px', resize: 'vertical' }} />
            )}
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div style={{ maxWidth: '400px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', color: C.text, margin: '0 0 24px 0' }}>Change Password</h3>
          
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12px', color: C.muted, marginBottom: '6px' }}>Current Password</label>
            <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={InputBase(C)} placeholder="Enter current password" />
            <button onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>
              {showCurrent ? 'Hide' : 'Show'}
            </button>
          </div>

          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12px', color: C.muted, marginBottom: '6px' }}>New Password</label>
            <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={InputBase(C)} placeholder="Enter new password" />
            <button onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>
              {showNew ? 'Hide' : 'Show'}
            </button>
            <div style={{ height: '4px', background: C.surfaceHover, borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${str}%`, background: strColor, transition: 'width 0.3s ease, background 0.3s ease' }}></div>
            </div>
            {str > 0 && <div style={{ fontSize: '11px', color: strColor, marginTop: '4px', textAlign: 'right' }}>{strLabel}</div>}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: C.muted, marginBottom: '6px' }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={InputBase(C)} placeholder="Confirm new password" />
            {confirmPassword.length > 0 && (
              <div style={{ fontSize: '12px', color: passwordsMatch ? C.primary : C.danger, marginTop: '6px' }}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>

          <button onClick={handlePasswordUpdate} disabled={!(str >= 75 && passwordsMatch)} style={{ width: '100%', padding: '12px', background: C.primary, border: 'none', color: '#fff', borderRadius: '8px', cursor: (str >= 75 && passwordsMatch) ? 'pointer' : 'not-allowed', fontWeight: '500', opacity: (str >= 75 && passwordsMatch) ? 1 : 0.5 }}>
            Update Password
          </button>
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '500', color: C.text, margin: '0 0 24px 0' }}>Activity Log</h3>
          <div style={{ position: 'relative', paddingLeft: '16px' }}>
            <div style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '2px', background: `${C.primary}40` }}></div>
            {activities.map((act, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: i === activities.length - 1 ? 0 : '24px', animation: `fadeIn 0.4s ease forwards ${i * 0.05}s`, opacity: 0 }}>
                <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: C.primary, border: `2px solid ${C.surface}` }}></div>
                <div style={{ fontSize: '14px', color: C.text, marginBottom: '4px' }}>{act.text}</div>
                <div style={{ fontSize: '12px', color: C.muted }}>{act.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
