import { useState } from 'react';
import { useEmployeeProfile, useEmployeeMutations, useAuth } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#0D9488', accentLight: 'rgba(13,148,136,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const Styles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes prFadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    .pr-card { animation: prFadeUp .4s ease-out both; transition: transform .25s; }
    .pr-tab { padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer; font-family: Poppins, sans-serif; font-size: 13px; font-weight: 500; transition: all .2s; }
    .pr-field { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid ${C.border}; }
    @media(max-width:767px) { .pr-header { flex-direction: column !important; text-align: center !important; } }
  `}} />
);

const TABS = [
  { key: 'resume', label: 'Resume' },
  { key: 'private', label: 'Private Info' },
  { key: 'security', label: 'Security' },
];

export default function ProfileView() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profileData, isLoading, error, refetch } = useEmployeeProfile(userId);
  const [tab, setTab] = useState('resume');

  const raw = profileData?.data ?? profileData ?? {};
  const p = typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const formatType = (t) => (t || '—').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (isLoading) return <LoadingSpinner message="Loading profile..." />;
  if (error) return <ErrorState message="Failed to load profile" onRetry={refetch} />;

  const Field = ({ label, value }) => (
    <div className="pr-field">
      <span style={{ fontSize: 13, color: C.muted, fontWeight: 500, minWidth: 160 }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text, fontWeight: 400, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <Styles />

      {/* PROFILE HEADER */}
      <div className="pr-card pr-header" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 32, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.teal}, ${C.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {(p.name || user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{p.name || user?.name || 'Employee'}</h1>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{p.designation || 'No designation'} · {p.departmentName || p.department_name || 'No department'}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: `${C.teal}22`, color: C.teal }}>{p.loginId || p.login_id || user?.loginId || '—'}</span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: `${C.accent}22`, color: C.accent }}>{formatType(p.role || user?.role)}</span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: p.is_active !== false ? `${C.teal}22` : `${C.danger}22`, color: p.is_active !== false ? C.teal : C.danger }}>{p.is_active !== false ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} className="pr-tab" onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? C.teal : C.surfaceHover,
            color: tab === t.key ? '#fff' : C.muted,
          }}>{t.label}</button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="pr-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 28, animationDelay: '100ms' }}>
        {tab === 'resume' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20 }}>Work Information</h3>
            <Field label="Employee ID" value={p.loginId || p.login_id || user?.loginId} />
            <Field label="Email" value={p.email || user?.email} />
            <Field label="Phone" value={p.phone || user?.phone} />
            <Field label="Designation" value={p.designation} />
            <Field label="Department" value={p.departmentName || p.department_name} />
            <Field label="Manager" value={p.managerName || p.manager_name} />
            <Field label="Location" value={p.location} />
            <Field label="Date of Joining" value={formatDate(p.dateOfJoining || p.date_of_joining)} />

            {(p.about || p.skills || p.certifications) && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '28px 0 20px' }}>About</h3>
                {p.about && <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>{p.about}</p>}
                {Array.isArray(p.skills) && p.skills.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Skills: </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {p.skills.map((s, i) => <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: `${C.accent}15`, color: C.accent }}>{s}</span>)}
                    </div>
                  </div>
                )}
                {Array.isArray(p.certifications) && p.certifications.length > 0 && (
                  <div>
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Certifications: </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {p.certifications.map((c, i) => <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: `${C.teal}15`, color: C.teal }}>{c}</span>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'private' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20 }}>Personal Information</h3>
            <Field label="Date of Birth" value={formatDate(p.dateOfBirth || p.date_of_birth)} />
            <Field label="Gender" value={formatType(p.gender)} />
            <Field label="Nationality" value={p.nationality} />
            <Field label="Marital Status" value={formatType(p.maritalStatus || p.marital_status)} />
            <Field label="Personal Email" value={p.personalEmail || p.personal_email} />

            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '28px 0 20px' }}>Bank & Tax Information</h3>
            <Field label="Bank Account" value={p.bankAccountNumber || p.bank_account_number ? `••••${(p.bankAccountNumber || p.bank_account_number || '').slice(-4)}` : null} />
            <Field label="Bank Name" value={p.bankName || p.bank_name} />
            <Field label="IFSC Code" value={p.ifscCode || p.ifsc_code} />
            <Field label="PAN Number" value={p.panNumber || p.pan_number ? `••••${(p.panNumber || p.pan_number || '').slice(-4)}` : null} />
            <Field label="UAN Number" value={p.uanNumber || p.uan_number} />
            <Field label="ESIC Number" value={p.esicNumber || p.esic_number} />
          </div>
        )}

        {tab === 'security' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20 }}>Security Settings</h3>
            <Field label="Login ID" value={p.loginId || p.login_id || user?.loginId} />
            <Field label="Email" value={p.email || user?.email} />
            <Field label="Role" value={formatType(p.role || user?.role)} />
            <Field label="Account Created" value={formatDate(p.createdAt || p.created_at)} />

            <div style={{ marginTop: 28, padding: 20, background: C.surfaceHover, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Password</div>
              <p style={{ fontSize: 12, color: C.muted, margin: '0 0 16px' }}>To change your password, use the Change Password page.</p>
              <a href="/change-password" style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${C.teal}`, background: 'transparent', color: C.teal, fontSize: 12, fontWeight: 500, textDecoration: 'none', fontFamily: 'Poppins, sans-serif' }}>
                Change Password
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
