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

const inputStyle = {
  background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '10px 14px', color: C.text, fontSize: 13,
  fontFamily: 'Poppins, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box',
  transition: 'border .2s',
};

const Styles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes prFadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    .pr-card { animation: prFadeUp .4s ease-out both; transition: transform .25s; }
    .pr-tab { padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer; font-family: Poppins, sans-serif; font-size: 13px; font-weight: 500; transition: all .2s; }
    .pr-field { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid ${C.border}; }
    .pr-input:focus { border-color: ${C.teal} !important; }
    @media(max-width:767px) { .pr-header { flex-direction: column !important; text-align: center !important; } }
  `}} />
);

const TABS = [
  { key: 'resume', label: 'Work Info' },
  { key: 'private', label: 'Personal Info' },
  { key: 'security', label: 'Security' },
];

const Field = ({ label, value }) => (
  <div className="pr-field">
    <span style={{ fontSize: 13, color: C.muted, fontWeight: 500, minWidth: 160 }}>{label}</span>
    <span style={{ fontSize: 13, color: C.text, fontWeight: 400, textAlign: 'right' }}>{value || '—'}</span>
  </div>
);

export default function ProfileView() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profileData, isLoading, error, refetch } = useEmployeeProfile(userId);
  const { updateEmployeeMe } = useEmployeeMutations();
  const [tab, setTab] = useState('resume');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  const raw = profileData?.data ?? profileData ?? {};
  const p = typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  const [form, setForm] = useState({});

  const startEdit = () => {
    setForm({
      phone: p.phone || user?.phone || '',
      about: p.about || '',
      location: p.location || '',
      // private
      gender: p.gender || '',
      nationality: p.nationality || '',
      maritalStatus: p.maritalStatus || p.marital_status || '',
      personalEmail: p.personalEmail || p.personal_email || '',
      // bank
      bankAccountNumber: p.bankAccountNumber || p.bank_account_number || '',
      bankName: p.bankName || p.bank_name || '',
      ifscCode: p.ifscCode || p.ifsc_code || '',
      panNumber: p.panNumber || p.pan_number || '',
      uanNumber: p.uanNumber || p.uan_number || '',
      esicNumber: p.esicNumber || p.esic_number || '',
    });
    setSaveMsg(''); setSaveErr('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setSaveMsg(''); setSaveErr(''); };

  const handleSave = async () => {
    setSaving(true); setSaveMsg(''); setSaveErr('');
    try {
      await updateEmployeeMe({
        phone: form.phone || undefined,
        profile: {
          about: form.about || undefined,
          location: form.location || undefined,
          gender: form.gender || undefined,
          nationality: form.nationality || undefined,
          marital_status: form.maritalStatus || undefined,
          personal_email: form.personalEmail || undefined,
          bank_account_number: form.bankAccountNumber || undefined,
          bank_name: form.bankName || undefined,
          ifsc_code: form.ifscCode || undefined,
          pan_number: form.panNumber || undefined,
          uan_number: form.uanNumber || undefined,
          esic_number: form.esicNumber || undefined,
        },
      });
      await refetch();
      setSaveMsg('Profile updated successfully.');
      setEditing(false);
    } catch (e) {
      setSaveErr(e?.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const fi = (label, key, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      <input
        className="pr-input"
        type={type}
        value={form[key] || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder || label}
        style={inputStyle}
      />
    </div>
  );

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const fmtType = t => (t || '—').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (isLoading) return <LoadingSpinner message="Loading profile..." />;
  if (error) return <ErrorState message="Failed to load profile" onRetry={refetch} />;

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <Styles />

      {/* SUCCESS / ERROR MSG */}
      {saveMsg && (
        <div style={{ background: `${C.teal}15`, border: `1px solid ${C.teal}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: C.teal, fontSize: 13 }}>{saveMsg}</div>
      )}
      {saveErr && (
        <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: C.danger, fontSize: 13 }}>{saveErr}</div>
      )}

      {/* PROFILE HEADER */}
      <div className="pr-card pr-header" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 32, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flex: 1 }}>
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
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: `${C.accent}22`, color: C.accent }}>{fmtType(p.role || user?.role)}</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: p.is_active !== false ? `${C.teal}22` : `${C.danger}22`, color: p.is_active !== false ? C.teal : C.danger }}>{p.is_active !== false ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={cancelEdit} style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: C.teal, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button onClick={startEdit} style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid ${C.teal}`, background: 'transparent', color: C.teal, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.tealLight}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Profile
            </button>
          )}
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
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {fi('Phone', 'phone', 'tel')}
                {fi('Location', 'location')}
                <div style={{ gridColumn: '1 / -1' }}>{fi('About / Bio', 'about')}</div>
              </div>
            ) : (
              <>
                <Field label="Employee ID" value={p.loginId || p.login_id || user?.loginId} />
                <Field label="Email" value={p.email || user?.email} />
                <Field label="Phone" value={p.phone || user?.phone} />
                <Field label="Designation" value={p.designation} />
                <Field label="Department" value={p.departmentName || p.department_name} />
                <Field label="Manager" value={p.managerName || p.manager_name} />
                <Field label="Location" value={p.location} />
                <Field label="Date of Joining" value={fmtDate(p.dateOfJoining || p.date_of_joining)} />
                {p.about && (
                  <>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '28px 0 20px' }}>About</h3>
                    <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>{p.about}</p>
                  </>
                )}
                {Array.isArray(p.skills) && p.skills.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Skills: </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {p.skills.map((s, i) => <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: `${C.accent}15`, color: C.accent }}>{s}</span>)}
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
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {fi('Gender', 'gender')}
                {fi('Nationality', 'nationality')}
                {fi('Marital Status', 'maritalStatus')}
                {fi('Personal Email', 'personalEmail', 'email')}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ margin: '20px 0 16px', fontSize: 16, fontWeight: 600, color: C.text }}>Bank & Tax Information</div>
                </div>
                {fi('Bank Account Number', 'bankAccountNumber')}
                {fi('Bank Name', 'bankName')}
                {fi('IFSC Code', 'ifscCode')}
                {fi('PAN Number', 'panNumber')}
                {fi('UAN Number', 'uanNumber')}
                {fi('ESIC Number', 'esicNumber')}
              </div>
            ) : (
              <>
                <Field label="Date of Birth" value={fmtDate(p.dateOfBirth || p.date_of_birth)} />
                <Field label="Gender" value={fmtType(p.gender)} />
                <Field label="Nationality" value={p.nationality} />
                <Field label="Marital Status" value={fmtType(p.maritalStatus || p.marital_status)} />
                <Field label="Personal Email" value={p.personalEmail || p.personal_email} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '28px 0 20px' }}>Bank & Tax Information</h3>
                <Field label="Bank Account" value={p.bankAccountNumber || p.bank_account_number ? `••••${(p.bankAccountNumber || p.bank_account_number || '').slice(-4)}` : null} />
                <Field label="Bank Name" value={p.bankName || p.bank_name} />
                <Field label="IFSC Code" value={p.ifscCode || p.ifsc_code} />
                <Field label="PAN Number" value={p.panNumber || p.pan_number ? `••••${(p.panNumber || p.pan_number || '').slice(-4)}` : null} />
                <Field label="UAN Number" value={p.uanNumber || p.uan_number} />
                <Field label="ESIC Number" value={p.esicNumber || p.esic_number} />
              </>
            )}
          </div>
        )}

        {tab === 'security' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20 }}>Security Settings</h3>
            <Field label="Login ID" value={p.loginId || p.login_id || user?.loginId} />
            <Field label="Email" value={p.email || user?.email} />
            <Field label="Role" value={fmtType(p.role || user?.role)} />
            <Field label="Account Created" value={fmtDate(p.createdAt || p.created_at)} />
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
