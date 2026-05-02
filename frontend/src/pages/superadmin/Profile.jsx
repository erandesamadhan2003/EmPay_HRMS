import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useFetch } from '../../hooks/useFetch';
import { useMutation } from '../../hooks/useMutation';
import { BASE_URL } from '../../config/api';
import { ProfileHeader } from '../../components/superadmin/ProfileHeader';
import { ChangePasswordTab } from '../../components/superadmin/ChangePasswordTab';
import { ActivityLogTab } from '../../components/superadmin/ActivityLogTab';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  accent: '#7C3AED', cyan: '#06B6D4',
  warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState('Personal Info');
  const [editMode, setEditMode] = useState(false);
  
  // API Calls
  const { data: profileData, loading: profileLoading, refetch: refetchProfile } = useFetch('/auth/me');
  const { data: platformStats, loading: statsLoading } = useFetch('/superadmin/dashboard/stats');
  const { data: auditStats } = useFetch('/superadmin/audit-logs/stats');
  
  const { mutate: updateProfile, loading: saving } = useMutation('PUT');
  const { mutate: uploadAvatar } = useMutation('POST');

  // Form State
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (profileData) {
      setForm({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || ''
      });
    }
  }, [profileData]);

  const handleSave = async () => {
    try {
      await updateProfile('/auth/me', form);
      setEditMode(false);
      refetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    // In actual app, use fetch directly for FormData or update useMutation to handle FormData
    const token = JSON.parse(localStorage.getItem('empay_auth') || '{}')?.token;
    const res = await fetch(`${BASE_URL}/auth/me/avatar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    refetchProfile();
  };

  const profile = profileData?.data || { name: 'Super Admin', email: '', phone: '', role: 'superadmin', joinDate: '-', lastLogin: '-', avatar: null, twoFactorEnabled: false };
  
  // Format dates if they exist
  if (profileData?.data) {
    if (profileData.data.created_at) {
      profile.joinDate = new Date(profileData.data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else if (profileData.data.profile?.dateOfJoining) {
      profile.joinDate = new Date(profileData.data.profile.dateOfJoining).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  const stats = platformStats?.data || { totalCompanies: 0, totalUsers: 0 };
  const audit = auditStats?.data || { totalToday: 0, criticalToday: 0, warningToday: 0 };

  return (
    <MainLayout role="superadmin" pageTitle="Profile & Settings">
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: '"Poppins", sans-serif' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '24px' }}>
          <ProfileHeader 
            profile={profile} 
            loading={profileLoading} 
            editMode={editMode} 
            onToggleEdit={() => setEditMode(!editMode)} 
            onAvatarUpload={handleAvatarUpload}
            onSave={handleSave}
            saving={saving}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          {/* LEFT COLUMN - TABS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 16px' }}>
                   {['Personal Info', 'Change Password', 'Activity Log'].map(t => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        style={{
                           padding: '20px 24px', background: 'transparent', border: 'none', cursor: 'pointer',
                           fontSize: '14px', fontWeight: 600, color: activeTab === t ? C.violet : C.muted,
                           borderBottom: activeTab === t ? `2px solid ${C.violet}` : '2px solid transparent',
                           transition: 'all 0.2s'
                        }}
                      >
                         {t}
                      </button>
                   ))}
                </div>

                <div style={{ padding: '32px' }}>
                   {activeTab === 'Personal Info' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                         <div style={{ gridColumn: editMode ? 'span 1' : 'span 1' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: C.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Full Name</label>
                            {editMode ? (
                               <input 
                                 type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                 style={{ width: '100%', padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, outline: 'none' }}
                               />
                            ) : (
                               <div style={{ fontSize: '15px', color: C.text, fontWeight: 500 }}>{profile.name}</div>
                            )}
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '12px', color: C.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
                            {editMode ? (
                               <input 
                                 type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                                 style={{ width: '100%', padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, outline: 'none' }}
                               />
                            ) : (
                               <div style={{ fontSize: '15px', color: C.text, fontWeight: 500 }}>{profile.email}</div>
                            )}
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '12px', color: C.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Phone Number</label>
                            {editMode ? (
                               <input 
                                 type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                                 style={{ width: '100%', padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, outline: 'none' }}
                               />
                            ) : (
                               <div style={{ fontSize: '15px', color: C.text, fontWeight: 500 }}>{profile.phone}</div>
                            )}
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '12px', color: C.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Account Role</label>
                            <div style={{ fontSize: '15px', color: C.muted, fontWeight: 500 }}>Super Admin</div>
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '12px', color: C.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Member Since</label>
                            <div style={{ fontSize: '15px', color: C.text }}>{profile.joinDate}</div>
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '12px', color: C.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Last Login</label>
                            <div style={{ fontSize: '15px', color: C.text }}>{profile.lastLogin}</div>
                         </div>
                      </div>
                   )}

                   {activeTab === 'Change Password' && <ChangePasswordTab />}
                   {activeTab === 'Activity Log' && <ActivityLogTab />}
                </div>
             </div>
          </div>

          {/* RIGHT COLUMN - STATS CARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             {/* Platform Overview */}
             <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', borderTop: `3px solid ${C.violet}` }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 600, color: C.text }}>Platform Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div style={{ background: C.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px' }}>Companies</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: C.violet }}>{stats.totalCompanies}</div>
                   </div>
                   <div style={{ background: C.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px' }}>Total Users</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: C.teal }}>{stats.totalUsers.toLocaleString()}</div>
                   </div>
                </div>
             </div>

             {/* My Actions Today */}
             <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: C.text }}>My Actions Today</h3>
                   <span style={{ fontSize: '24px', fontWeight: 700, color: C.violet }}>{audit.totalToday}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                   <div style={{ color: C.danger }}>Critical: {audit.criticalToday}</div>
                   <div style={{ color: C.muted }}>|</div>
                   <div style={{ color: C.warning }}>Warnings: {audit.warningToday}</div>
                </div>
             </div>

             {/* Account Security */}
             <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 600, color: C.text }}>Account Security</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                         <span style={{ color: C.muted }}>Password Status</span>
                         <span style={{ color: C.teal, fontWeight: 500 }}>Up to date</span>
                      </div>
                      <div style={{ height: '4px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
                         <div style={{ height: '100%', background: C.teal, width: '100%' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '8px' }}>Last changed: 12 days ago</div>
                   </div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '13px', color: C.text }}>2FA Status</span>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', background: `${C.warning}10`, color: C.warning, fontSize: '11px', fontWeight: 600 }}>Not Enabled</span>
                   </div>

                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: C.text }}>Joined Date</span>
                      <span style={{ fontSize: '13px', color: C.muted }}>{profile.joinDate}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 1fr 360px"] { grid-template-columns: 1fr !important; }
        }
      `}} />
    </MainLayout>
  );
}
