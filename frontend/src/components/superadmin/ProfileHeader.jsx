import React, { useRef, useState } from 'react';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

export const ProfileHeader = ({ profile, loading, editMode, onToggleEdit, onAvatarUpload, onSave, saving }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      await onAvatarUpload(file);
    } catch (err) {
      setPreview(null); // Revert preview on error
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: C.surface, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', height: '140px', animation: 'sa-shimmer 2s infinite linear', backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%' }}></div>
    );
  }

  const initials = profile?.name ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : (profile?.email ? profile.email[0].toUpperCase() : 'U');

  return (
    <div style={{ background: C.surface, borderRadius: '16px', border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
      {/* Top accent strip */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${C.violet}, ${C.teal})` }} />
      
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {/* Avatar Section */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div 
            onClick={handleAvatarClick}
            style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: C.violetLight, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden', position: 'relative'
            }}
            onMouseEnter={e => e.currentTarget.querySelector('.avatar-overlay').style.opacity = 1}
            onMouseLeave={e => e.currentTarget.querySelector('.avatar-overlay').style.opacity = 0}
          >
            {(preview || profile?.avatar) ? (
              <img src={preview || profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '28px', fontWeight: 600, color: '#fff' }}>{initials}</span>
            )}
            
            {/* Hover overlay */}
            <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <span style={{ color: '#fff', fontSize: '10px', marginTop: '4px' }}>Change Photo</span>
            </div>
          </div>
          
          {/* Progress bar below avatar */}
          {uploading && (
            <div style={{ position: 'absolute', bottom: '-10px', left: '10px', right: '10px', height: '3px', background: C.bg, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: C.violet, width: '40%', animation: 'sa-progress 1.5s infinite linear' }} />
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        {/* Center Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: C.text }}>{profile?.name}</h1>
            <span style={{ padding: '4px 12px', background: C.violetLight, color: C.violet, borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{profile?.role || 'User'}</span>
          </div>
          <div style={{ fontSize: '13px', color: C.muted, marginTop: '4px' }}>{profile?.email}</div>
          <div style={{ fontSize: '12px', color: C.muted, marginTop: '8px' }}>
            Last login: {profile?.lastLogin || 'N/A'}
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {!editMode ? (
            <button 
              onClick={onToggleEdit}
              style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${C.teal}`, color: C.teal, borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.tealLight}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                onClick={onSave}
                disabled={saving}
                style={{ padding: '10px 20px', background: C.teal, border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {saving && <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'sa-spin 1s linear infinite' }} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={onToggleEdit}
                disabled={saving}
                style={{ padding: '10px 20px', background: 'transparent', border: 'none', color: C.muted, fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes sa-progress { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
        @keyframes sa-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
