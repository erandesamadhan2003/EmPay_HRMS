import React, { useState, useEffect } from 'react';
import { useEmployeeProfile, useEmployeeMutations } from '../../hooks';
import MainLayout from '../../components/layouts/MainLayout';
import ProfileTabs from '../../components/hr/ProfileTabs';
import ProfileWidgets from '../../components/hr/ProfileWidgets';

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

const initialHrUser = {
  name: 'HR Officer',
  loginId: '—',
  email: '',
  phone: '',
  department: 'Human Resources',
  role: 'HR Officer',
  joinDate: '',
  dob: '',
  gender: '',
  address: '',
};

export default function Profile() {
  const { data: empData, isLoading } = useEmployeeProfile();
  const { updateEmployeeMe } = useEmployeeMutations();
  
  const [user, setUser] = useState(initialHrUser);
  const [editMode, setEditMode] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (empData) {
      const rawEmp = empData?.data ?? empData;
      setUser({
        id: rawEmp.id,
        name: rawEmp.name || 'HR Officer',
        loginId: rawEmp.loginId || '—',
        email: rawEmp.email || '',
        phone: rawEmp.profile?.phone_number || '',
        department: rawEmp.profile?.department?.name || 'Human Resources',
        role: rawEmp.profile?.job_title || 'HR Officer',
        joinDate: rawEmp.profile?.hire_date ? new Date(rawEmp.profile?.hire_date).toLocaleDateString() : '—',
        dob: rawEmp.profile?.date_of_birth ? new Date(rawEmp.profile?.date_of_birth).toISOString().split('T')[0] : '',
        gender: rawEmp.profile?.gender || '—',
        address: rawEmp.profile?.address || '—',
      });
    }
  }, [empData]);

  const handleSave = async () => {
    try {
      await updateEmployeeMe({
        name: user.name,
        email: user.email,
        profile: {
          phone_number: user.phone,
          date_of_birth: user.dob,
          gender: user.gender,
          address: user.address,
        }
      });
      setEditMode(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <MainLayout role="hr" pageTitle="My Profile">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .fade-up-1 { opacity: 0; animation: fadeUp 0.4s ease forwards 0.1s; }
        .fade-up-2 { opacity: 0; animation: fadeUp 0.4s ease forwards 0.2s; }
        .fade-up-3 { opacity: 0; animation: fadeUp 0.4s ease forwards 0.3s; }
        .avatar-container:hover .camera-overlay { opacity: 1 !important; }
      `}</style>
      
      <div className="fade-in" style={{ padding: '24px', fontFamily: C.font, maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* HEADER CARD */}
        <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: '24px', position: 'relative' }}>
          <div style={{ height: '3px', background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`, width: '100%' }}></div>
          <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="avatar-container" style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '600', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
                {avatar ? <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'PS'}
                <div className="camera-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Change Photo">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} />
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: C.text }}>{user.name}</h2>
                  <span style={{ padding: '4px 10px', background: `${C.primary}20`, color: C.primary, borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>{user.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: C.muted }}>
                  <span style={{ fontFamily: 'monospace' }}>{user.loginId}</span>
                  <span>•</span>
                  <span>{user.department}</span>
                </div>
              </div>
            </div>

            <div>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${C.primary}`, color: C.primary, borderRadius: '8px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}>
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setEditMode(false)} style={{ padding: '10px 20px', background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontWeight: '500' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} style={{ padding: '10px 20px', background: C.primary, border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    Save Changes
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* TWO COLUMNS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          
          {/* LEFT COLUMN: TABS & CONTENT */}
          <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
              {['personal', 'password', 'activity'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    padding: '8px 16px', 
                    background: activeTab === tab ? `${C.primary}10` : 'transparent', 
                    border: 'none', 
                    color: activeTab === tab ? C.primary : C.muted, 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab === 'personal' ? 'Personal Information' : tab === 'password' ? 'Change Password' : 'Activity Log'}
                </button>
              ))}
            </div>

            <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '24px', minHeight: '400px' }}>
              <ProfileTabs activeTab={activeTab} user={user} setUser={setUser} editMode={editMode} C={C} />
            </div>
          </div>

          {/* RIGHT COLUMN: WIDGETS */}
          <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <ProfileWidgets user={user} C={C} />
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
