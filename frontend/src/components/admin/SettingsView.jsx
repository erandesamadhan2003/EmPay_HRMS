import { useState, useEffect } from 'react';
import { useSettingsUsers, useSettingsCompany, useSettingsMutations } from '../../hooks';
import { authService } from '../../services';
import { LoadingSpinner, ErrorState } from './shared';

const C={bg:'#0A0A0F',surface:'#13131A',surfaceHover:'#1A1A24',accent:'#7C3AED',accentLight:'rgba(124,58,237,0.15)',teal:'#14B8A6',tealLight:'rgba(20,184,166,0.15)',cyan:'#06B6D4',warning:'#F59E0B',danger:'#EF4444',text:'#F1F0FF',muted:'#8B8A9B',border:'#2E2E3E'};
const fi={background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',width:'100%'};
const lb={fontSize:11,color:C.muted,display:'block',marginBottom:4,fontWeight:500};

const ROLE_OPTS=['admin','hr_officer','payroll_officer','employee'];
const ROLE_COLORS={admin:C.accent,hr_officer:C.teal,payroll_officer:C.cyan,employee:C.muted};

const Styles=()=><style dangerouslySetInnerHTML={{__html:`
  @keyframes stFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .st-anim{animation:stFade .4s ease-out both}
  .st-tab{background:transparent;border:none;padding:10px 20px;font-size:13px;font-weight:500;cursor:pointer;font-family:Poppins,sans-serif;color:${C.muted};border-bottom:2px solid transparent;transition:all .2s}
  .st-tab.active{color:${C.teal};border-bottom-color:${C.teal}}
  .st-row:hover{background:${C.surfaceHover}!important}
  .st-fi:focus{border-color:${C.teal}!important}
  .st-btn{border:none;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif;transition:all .2s}.st-btn:hover{transform:translateY(-1px)}
  @media(max-width:767px){.st-grid{grid-template-columns:1fr!important}}
`}}/>;

export default function SettingsView(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(1);
  const { data:usersData, isLoading, error, refetch } = useSettingsUsers({ search, page, limit: 10 });
  const { data:companyData, isLoading:compL } = useSettingsCompany();
  const { updateUserRole, updateCompany, isUpdatingRole, isUpdatingCompany } = useSettingsMutations();

  // Users list — properly extract paginated items
  const rawUsers = usersData?.data?.items ?? usersData?.data ?? usersData ?? [];
  const users = (Array.isArray(rawUsers) ? rawUsers : []).map(u => ({
    id: u.id, name: u.name || '—', loginId: u.loginId || u.login_id || '—', email: u.email || '—', role: u.role || 'employee', isActive: u.isActive ?? u.is_active ?? true,
  }));
  const pagination = usersData?.data?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  // Company info
  const ci = companyData?.data || companyData || {};
  const [compForm, setCompForm] = useState({ name: '', logoUrl: '', officeLatitude: '', officeLongitude: '' });
  const [compMsg, setCompMsg] = useState('');
  const [compErr, setCompErr] = useState('');

  useEffect(() => {
    if (ci.name) setCompForm({ name: ci.name || '', logoUrl: ci.logoUrl || '', officeLatitude: ci.officeLatitude ?? '', officeLongitude: ci.officeLongitude ?? '' });
  }, [ci.name, ci.logoUrl, ci.officeLatitude, ci.officeLongitude]);

  // Password state
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [isPwSaving, setIsPwSaving] = useState(false);

  // Preferences (localStorage only — no backend endpoint)
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_prefs') || '{}'); } catch { return {}; }
  });
  const [prefMsg, setPrefMsg] = useState('');

  const handleRoleChange = async (userId, newRole) => {
    try { await updateUserRole({ userId, data: { role: newRole } }); } catch (e) { console.error('Role update failed:', e); }
  };

  const handleSaveCompany = async () => {
    setCompMsg(''); setCompErr('');
    try {
      const body = { name: compForm.name };
      
      if (compForm.officeLatitude === '' || compForm.officeLongitude === '') {
        body.officeLatitude = null;
        body.officeLongitude = null;
      } else {
        body.officeLatitude = Number(compForm.officeLatitude);
        body.officeLongitude = Number(compForm.officeLongitude);
      }

      if (compForm.logoUrl) body.logoUrl = compForm.logoUrl;
      await updateCompany(body);
      setCompMsg('Company info updated!');
      setTimeout(() => setCompMsg(''), 3000);
    } catch (e) { setCompErr(e?.response?.data?.message || e?.message || 'Failed to update company.'); }
  };

  const handleChangePassword = async () => {
    setPwMsg(''); setPwErr('');
    if (!pw.current) return setPwErr('Current password required.');
    if (!pw.newPw || pw.newPw.length < 6) return setPwErr('New password must be at least 6 chars.');
    if (pw.newPw !== pw.confirm) return setPwErr('Passwords do not match.');
    setIsPwSaving(true);
    try {
      await authService.changePassword({ currentPassword: pw.current, newPassword: pw.newPw, confirmPassword: pw.confirm });
      setPwMsg('Password updated!');
      setPw({ current: '', newPw: '', confirm: '' });
    } catch (e) { setPwErr(e?.response?.data?.message || e?.message || 'Failed to change password.'); }
    finally { setIsPwSaving(false); }
  };

  const handleSavePrefs = () => {
    localStorage.setItem('admin_prefs', JSON.stringify(prefs));
    setPrefMsg('Preferences saved!');
    setTimeout(() => setPrefMsg(''), 3000);
  };

  const tabs = ['User Management', 'Company Info', 'Security', 'Preferences'];

  if (isLoading && tab === 0) return <LoadingSpinner message="Loading settings..." />;
  if (error && tab === 0) return <ErrorState message="Failed to load settings" onRetry={refetch} />;

  const th = { padding: '10px 12px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${C.border}`, textAlign: 'left', fontFamily: 'Poppins' };
  const td = { padding: '10px 12px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, fontFamily: 'Poppins' };

  return (
    <>
      <Styles />
      <div style={{ fontFamily: 'Poppins,sans-serif', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Settings</h2>
          <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 4 }}>Manage users, company info, and preferences</p>
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          {tabs.map((t, i) => <button key={t} className={`st-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>)}
        </div>

        {/* ═══ USER MANAGEMENT ═══ */}
        {tab === 0 && <div className="st-anim">
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input className="st-fi" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ ...fi, maxWidth: 300 }} />
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead><tr>
                {['Name', 'Login ID', 'Email', 'Role', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>No users found</td></tr>}
                {users.map((u, i) => (
                  <tr key={u.id} className="st-row" style={{ background: i % 2 ? C.surfaceHover : 'transparent', transition: 'background .15s' }}>
                    <td style={{ ...td, fontWeight: 500 }}>{u.name}</td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{u.loginId}</td>
                    <td style={{ ...td, fontSize: 12, color: C.muted }}>{u.email}</td>
                    <td style={td}>
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} disabled={isUpdatingRole}
                        style={{ background: `${ROLE_COLORS[u.role] || C.muted}18`, border: `1px solid ${ROLE_COLORS[u.role] || C.muted}40`, borderRadius: 8, padding: '4px 10px', color: ROLE_COLORS[u.role] || C.muted, fontSize: 11, fontWeight: 600, fontFamily: 'Poppins', outline: 'none', cursor: 'pointer' }}>
                        {ROLE_OPTS.map(r => <option key={r} value={r} style={{ background: C.surface, color: C.text }}>{r.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: u.isActive ? C.tealLight : 'rgba(239,68,68,.15)', color: u.isActive ? C.teal : C.danger }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${page === i + 1 ? C.teal : C.border}`, background: page === i + 1 ? C.teal : 'transparent', color: page === i + 1 ? '#fff' : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins' }}>{i + 1}</button>
            ))}
          </div>}
        </div>}

        {/* ═══ COMPANY INFO ═══ */}
        {tab === 1 && <div className="st-anim" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, maxWidth: 600 }}>
          {compL ? <LoadingSpinner message="Loading company..." /> : <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lb}>Company Name</label><input className="st-fi" style={fi} value={compForm.name} onChange={e => setCompForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label style={lb}>Logo URL</label><input className="st-fi" style={fi} value={compForm.logoUrl} onChange={e => setCompForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." /></div>
              <div className="st-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={lb}>Office Latitude</label><input className="st-fi" type="number" step="any" style={fi} value={compForm.officeLatitude} onChange={e => setCompForm(f => ({ ...f, officeLatitude: e.target.value }))} placeholder="e.g. 12.9716" /></div>
                <div><label style={lb}>Office Longitude</label><input className="st-fi" type="number" step="any" style={fi} value={compForm.officeLongitude} onChange={e => setCompForm(f => ({ ...f, officeLongitude: e.target.value }))} placeholder="e.g. 77.5946" /></div>
              </div>
              <button 
                onClick={() => {
                  if (!navigator.geolocation) return setCompErr('Geolocation not supported by your browser.');
                  setCompMsg('Fetching location...');
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setCompForm(f => ({ ...f, officeLatitude: pos.coords.latitude, officeLongitude: pos.coords.longitude }));
                      setCompMsg('Location fetched! Click Save.');
                    },
                    (err) => setCompErr('Failed to fetch location. Please allow location access.')
                  );
                }}
                className="st-btn"
                style={{ background: 'transparent', border: `1px solid ${C.teal}`, color: C.teal, padding: '6px 12px', fontSize: 11, alignSelf: 'flex-start', marginTop: -4 }}
              >
                📍 Fetch My Current Location
              </button>
            </div>
            {compErr && <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', fontSize: 12, color: '#EF4444' }}>{compErr}</div>}
            {compMsg && <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: 'rgba(20,184,166,.1)', border: '1px solid rgba(20,184,166,.25)', fontSize: 12, color: C.teal }}>✓ {compMsg}</div>}
            <div style={{ marginTop: 20 }}>
              <button onClick={handleSaveCompany} disabled={isUpdatingCompany} className="st-btn" style={{ background: C.teal, color: '#fff', padding: '10px 22px', fontSize: 13, opacity: isUpdatingCompany ? 0.6 : 1 }}>{isUpdatingCompany ? 'Saving...' : 'Save Company Info'}</button>
            </div>
          </>}
        </div>}

        {/* ═══ SECURITY ═══ */}
        {tab === 2 && <div className="st-anim" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, maxWidth: 450 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 16px' }}>Change Admin Password</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={lb}>Current Password</label><input className="st-fi" type="password" style={fi} value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" /></div>
            <div><label style={lb}>New Password</label><input className="st-fi" type="password" style={fi} value={pw.newPw} onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))} placeholder="••••••••" /></div>
            <div><label style={lb}>Confirm New Password</label><input className="st-fi" type="password" style={fi} value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" />
              {pw.confirm && <div style={{ fontSize: 11, marginTop: 6, color: pw.newPw === pw.confirm ? C.teal : C.danger, fontWeight: 500 }}>{pw.newPw === pw.confirm ? '✓ Passwords match' : '✕ Passwords do not match'}</div>}
            </div>
          </div>
          {pwErr && <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', fontSize: 12, color: '#EF4444' }}>{pwErr}</div>}
          {pwMsg && <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: 'rgba(20,184,166,.1)', border: '1px solid rgba(20,184,166,.25)', fontSize: 12, color: C.teal }}>✓ {pwMsg}</div>}
          <div style={{ marginTop: 20 }}>
            <button onClick={handleChangePassword} disabled={isPwSaving} className="st-btn" style={{ background: C.teal, color: '#fff', padding: '10px 22px', fontSize: 13, opacity: isPwSaving ? 0.6 : 1 }}>{isPwSaving ? 'Updating...' : 'Update Password'}</button>
          </div>
        </div>}

        {/* ═══ PREFERENCES ═══ */}
        {tab === 3 && <div className="st-anim" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, maxWidth: 500 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 16px' }}>Notification Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['emailNotifications', 'Email Notifications', 'Receive email alerts for important events'],
              ['leaveAlerts', 'Leave Request Alerts', 'Get notified when leave requests are submitted'],
              ['payrollReminders', 'Payroll Reminders', 'Monthly payroll processing reminders'],
              ['attendanceAlerts', 'Attendance Alerts', 'Daily attendance summary notifications'],
            ].map(([key, label, desc]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{desc}</div>
                </div>
                <div onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))} style={{ width: 44, height: 24, borderRadius: 12, background: prefs[key] ? C.teal : C.surfaceHover, cursor: 'pointer', position: 'relative', transition: 'background .2s', border: `1px solid ${prefs[key] ? C.teal : C.border}` }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: prefs[key] ? 22 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
                </div>
              </div>
            ))}
          </div>
          {prefMsg && <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: 'rgba(20,184,166,.1)', border: '1px solid rgba(20,184,166,.25)', fontSize: 12, color: C.teal }}>✓ {prefMsg}</div>}
          <div style={{ marginTop: 20 }}>
            <button onClick={handleSavePrefs} className="st-btn" style={{ background: C.teal, color: '#fff', padding: '10px 22px', fontSize: 13 }}>Save Preferences</button>
          </div>
        </div>}
      </div>
    </>
  );
}
