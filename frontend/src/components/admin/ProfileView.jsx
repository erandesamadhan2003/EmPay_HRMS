import { useState, useEffect } from 'react';
import { useEmployeeProfile, useEmployeeMutations, useMyAttendance, useMyTimeOffAllocations, useDashboardStats, useAuditLogs } from '../../hooks';
import { authService } from '../../services';
import { LoadingSpinner, ErrorState } from './shared';

const C={bg:'#0A0A0F',surface:'#13131A',surfaceHover:'#1A1A24',accent:'#7C3AED',accentLight:'rgba(124,58,237,0.15)',teal:'#14B8A6',tealLight:'rgba(20,184,166,0.15)',cyan:'#06B6D4',warning:'#F59E0B',danger:'#EF4444',text:'#F1F0FF',muted:'#8B8A9B',border:'#2E2E3E'};

const fi={background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',width:'100%'};
const lb={fontSize:11,color:C.muted,display:'block',marginBottom:4,fontWeight:500};

const Styles=()=><style dangerouslySetInnerHTML={{__html:`
  @keyframes prFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .pr-anim{animation:prFade .4s ease-out both}
  .pr-fi:focus{border-color:${C.teal}!important}
  .pr-tab{background:transparent;border:none;padding:10px 18px;font-size:13px;font-weight:500;cursor:pointer;font-family:Poppins,sans-serif;color:${C.muted};border-bottom:2px solid transparent;transition:all .2s}
  .pr-tab.active{color:${C.teal};border-bottom-color:${C.teal}}
  .pr-avatar-wrap{position:relative;cursor:pointer}
  .pr-avatar-wrap:hover .pr-cam{opacity:1}
  .pr-cam{position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:${C.teal};display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;border:2px solid ${C.surface}}
  @media(max-width:767px){.pr-cols{flex-direction:column!important}.pr-left{width:100%!important}}
`}}/>;

const ProgressBar=({value,max,color=C.teal})=>(
  <div style={{height:6,borderRadius:3,background:C.surfaceHover,overflow:'hidden',flex:1}}>
    <div style={{height:'100%',borderRadius:3,background:color,width:`${Math.min(100,(value/max)*100)}%`,transition:'width .4s ease-out'}}/>
  </div>
);

const pwStrength=(p)=>{if(p.length<4)return{w:20,c:C.danger,l:'Weak'};if(p.length<8)return{w:50,c:C.warning,l:'Medium'};const has=/[A-Z]/.test(p)&&/[0-9]/.test(p)&&/[^A-Za-z0-9]/.test(p);return has?{w:100,c:C.teal,l:'Strong'}:{w:75,c:C.cyan,l:'Good'};};

export default function ProfileView(){
  const { data: profileData, isLoading, error, refetch } = useEmployeeProfile();
  const { updateEmployeeMe, isUpdatingMe } = useEmployeeMutations();
  const { data: attData } = useMyAttendance();
  const { data: allocData } = useMyTimeOffAllocations();
  const { data: dashData } = useDashboardStats();
  const { data: logsData } = useAuditLogs();

  const p = profileData?.data || profileData || {};
  const profileUser = {
    name: `${p.firstName||''} ${p.lastName||''}`.trim() || p.name || 'Admin User',
    email: p.email || '',
    phone: p.phone || '',
    dob: p.dateOfBirth || p.dob || '',
    gender: p.gender || '',
    address: p.address || '',
    department: p.department?.name || p.departmentName || '—',
    designation: p.jobTitle || p.designation || '—',
    joinDate: p.joiningDate || p.createdAt || '',
    loginId: p.loginId || p.employeeId || '—',
    role: p.role || 'Admin',
  };
  const userInitials = profileUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'AU';

  // Attendance data from API
  const rawAtt = attData?.data?.items ?? attData?.data ?? attData ?? [];
  const attList = Array.isArray(rawAtt) ? rawAtt : [];
  const presentCount = attList.filter(a => a.status === 'present').length;
  const absentCount = attList.filter(a => a.status === 'absent').length;
  const leaveCount = attList.filter(a => a.status === 'on_leave').length;
  const totalDays = Math.max(1, presentCount + absentCount + leaveCount);
  const attPct = Math.round((presentCount / totalDays) * 100);

  // Leave balance from API
  const rawAllocs = allocData?.data?.items ?? allocData?.data ?? allocData ?? [];
  const allocList = Array.isArray(rawAllocs) ? rawAllocs : [];
  const leaveBalance = [];
  const leaveTypes = { 'Annual Leave': { color: C.teal }, 'Sick Leave': { color: C.danger }, 'Personal Leave': { color: C.accent } };
  allocList.forEach(a => {
    const type = a.leaveType || a.type || 'Annual Leave';
    const total = a.totalDays || a.days || 0;
    const used = a.usedDays || 0;
    leaveBalance.push({ type, used, total, color: leaveTypes[type]?.color || C.teal });
  });
  // If no allocations, show empty state
  if (leaveBalance.length === 0) {
    Object.entries(leaveTypes).forEach(([type, { color }]) => leaveBalance.push({ type, used: 0, total: 0, color }));
  }

  // Dashboard stats for quick stats
  const ds = dashData?.data || dashData || {};
  const managedCount = ds.totalEmployees || 0;

  // Activity log from audit logs API
  const rawLogs = logsData?.data?.items ?? logsData?.data ?? logsData ?? [];
  const activityLogs = (Array.isArray(rawLogs) ? rawLogs : []).slice(0, 10).map(l => ({
    action: l.action || l.description || l.message || 'Activity',
    time: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
    icon: l.action?.includes('leave') ? '🏖️' : l.action?.includes('payrun') ? '💰' : l.action?.includes('employee') ? '👤' : l.action?.includes('department') ? '🏢' : '📋',
  }));

  const [edit,setEdit]=useState(false);
  const [tab,setTab]=useState(0);
  const [form,setForm]=useState(profileUser);
  const [pw,setPw]=useState({current:'',newPw:'',confirm:''});
  const [pwMsg,setPwMsg]=useState('');
  const [pwErr,setPwErr]=useState('');
  const [isPwSaving,setIsPwSaving]=useState(false);
  const str=pwStrength(pw.newPw);
  const match=pw.newPw&&pw.confirm&&pw.newPw===pw.confirm;

  useEffect(() => {
    if (p.firstName || p.name) setForm(profileUser);
  }, [p.firstName, p.name]);

  const handleSaveProfile = async () => {
    try {
      await updateEmployeeMe({ firstName: form.name.split(' ')[0], lastName: form.name.split(' ').slice(1).join(' '), email: form.email, phone: form.phone, address: form.address });
      setEdit(false);
    } catch(e) { console.error('Save profile failed:', e); }
  };

  const handleChangePassword = async () => {
    setPwMsg(''); setPwErr('');
    if (!pw.current) return setPwErr('Current password is required.');
    if (!pw.newPw || pw.newPw.length < 6) return setPwErr('New password must be at least 6 characters.');
    if (pw.newPw !== pw.confirm) return setPwErr('Passwords do not match.');
    setIsPwSaving(true);
    try {
      await authService.changePassword({ currentPassword: pw.current, newPassword: pw.newPw, confirmPassword: pw.confirm });
      setPwMsg('Password updated successfully!');
      setPw({ current: '', newPw: '', confirm: '' });
    } catch (e) {
      setPwErr(e?.response?.data?.message || e?.message || 'Failed to change password.');
    } finally { setIsPwSaving(false); }
  };

  const currentMonthName = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  if (isLoading) return <LoadingSpinner message="Loading profile..." />;
  if (error) return <ErrorState message="Failed to load profile" onRetry={refetch} />;

  return(
    <>
      <Styles/>
      <div style={{fontFamily:'Poppins,sans-serif',maxWidth:1100,margin:'0 auto'}}>
        {/* TOP PROFILE CARD */}
        <div className="pr-anim" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,overflow:'hidden',marginBottom:24}}>
          <div style={{height:6,background:`linear-gradient(90deg,${C.accent},${C.teal})`}}/>
          <div style={{padding:'24px 28px',display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
            <div className="pr-avatar-wrap">
              <div style={{width:80,height:80,borderRadius:'50%',background:`${C.accent}22`,border:`3px solid ${C.accent}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,color:C.accent}}>{userInitials}</div>
              <div className="pr-cam">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:24,fontWeight:600,color:C.text}}>{form.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginTop:6}}>
                <span style={{fontSize:11,fontWeight:600,color:C.accent,background:C.accentLight,padding:'3px 12px',borderRadius:20}}>{form.role}</span>
                <span style={{fontSize:12,color:C.muted,fontFamily:'monospace'}}>{form.loginId}</span>
              </div>
            </div>
            <button onClick={()=>setEdit(!edit)} style={{background:edit?C.teal:'transparent',border:`1px solid ${C.teal}`,borderRadius:10,padding:'9px 20px',color:edit?'#fff':C.teal,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'Poppins,sans-serif',transition:'all .2s'}}>
              {edit?'Cancel Edit':'Edit Profile'}
            </button>
          </div>
        </div>

        {/* TWO COLUMNS */}
        <div className="pr-cols" style={{display:'flex',gap:24}}>
          <div className="pr-left" style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
              {['Personal Info','Change Password','Activity Log'].map((t,i)=>(
                <button key={t} className={`pr-tab ${tab===i?'active':''}`} onClick={()=>setTab(i)}>{t}</button>
              ))}
            </div>

            {/* PERSONAL INFO */}
            {tab===0&&<div className="pr-anim" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div><label style={lb}>Full Name</label><input className="pr-fi" style={{...fi,opacity:edit?1:.7}} value={form.name} readOnly={!edit} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
                <div><label style={lb}>Email</label><input className="pr-fi" style={{...fi,opacity:edit?1:.7}} value={form.email} readOnly={!edit} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                <div><label style={lb}>Phone</label><input className="pr-fi" style={{...fi,opacity:edit?1:.7}} value={form.phone} readOnly={!edit} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
                <div><label style={lb}>Date of Birth</label><input className="pr-fi" type="date" style={{...fi,colorScheme:'dark',opacity:edit?1:.7}} value={form.dob} readOnly={!edit} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/></div>
                <div><label style={lb}>Gender</label>
                  <select className="pr-fi" style={{...fi,cursor:edit?'pointer':'default',opacity:edit?1:.7}} value={form.gender} disabled={!edit} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                    <option value="">Select</option>{['Male','Female','Other'].map(g=><option key={g} value={g} style={{background:C.surface}}>{g}</option>)}
                  </select>
                </div>
                <div><label style={lb}>Department</label><input style={{...fi,opacity:.5}} value={form.department} readOnly/></div>
                <div style={{gridColumn:'span 2'}}><label style={lb}>Address</label><textarea className="pr-fi" style={{...fi,minHeight:60,resize:'vertical',opacity:edit?1:.7}} value={form.address} readOnly={!edit} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></div>
                <div><label style={lb}>Designation</label><input style={{...fi,opacity:.5}} value={form.designation} readOnly/></div>
                <div><label style={lb}>Join Date</label><input style={{...fi,opacity:.5}} value={form.joinDate ? new Date(form.joinDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'} readOnly/></div>
                <div><label style={lb}>Login ID</label><input style={{...fi,opacity:.5,fontFamily:'monospace'}} value={form.loginId} readOnly/></div>
              </div>
              {edit&&<div style={{marginTop:20,textAlign:'right'}}><button onClick={handleSaveProfile} disabled={isUpdatingMe} style={{background:C.teal,color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif',opacity:isUpdatingMe?0.6:1}}>{isUpdatingMe?'Saving...':'Save Changes'}</button></div>}
            </div>}

            {/* CHANGE PASSWORD */}
            {tab===1&&<div className="pr-anim" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24}}>
              <div style={{maxWidth:400,display:'flex',flexDirection:'column',gap:14}}>
                <div><label style={lb}>Current Password</label><input className="pr-fi" type="password" style={fi} value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} placeholder="••••••••"/></div>
                <div>
                  <label style={lb}>New Password</label><input className="pr-fi" type="password" style={fi} value={pw.newPw} onChange={e=>setPw(p=>({...p,newPw:e.target.value}))} placeholder="••••••••"/>
                  {pw.newPw&&<div style={{marginTop:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{height:4,borderRadius:2,background:C.surfaceHover,flex:1,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:str.c,width:`${str.w}%`,transition:'all .3s'}}/></div>
                      <span style={{fontSize:11,color:str.c,fontWeight:500}}>{str.l}</span>
                    </div>
                  </div>}
                </div>
                <div>
                  <label style={lb}>Confirm Password</label><input className="pr-fi" type="password" style={fi} value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} placeholder="••••••••"/>
                  {pw.confirm&&<div style={{fontSize:11,marginTop:6,color:match?C.teal:C.danger,fontWeight:500}}>{match?'✓ Passwords match':'✕ Passwords do not match'}</div>}
                </div>
              </div>
              {pwErr && <div style={{marginTop:12,padding:'8px 14px',borderRadius:10,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',fontSize:12,color:'#EF4444',fontWeight:500}}>{pwErr}</div>}
              {pwMsg && <div style={{marginTop:12,padding:'8px 14px',borderRadius:10,background:'rgba(20,184,166,0.1)',border:'1px solid rgba(20,184,166,0.25)',fontSize:12,color:C.teal,fontWeight:500}}>✓ {pwMsg}</div>}
              <div style={{marginTop:20}}><button onClick={handleChangePassword} disabled={isPwSaving} style={{background:C.teal,color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif',opacity:isPwSaving?0.6:1}}>{isPwSaving?'Updating...':'Update Password'}</button></div>
            </div>}

            {/* ACTIVITY LOG */}
            {tab===2&&<div className="pr-anim" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24}}>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {activityLogs.length === 0 && <div style={{textAlign:'center',padding:30,color:C.muted,fontSize:13}}>No activity recorded yet</div>}
                {activityLogs.map((a,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:i<activityLogs.length-1?`1px solid ${C.border}`:'none'}}>
                    <div style={{width:34,height:34,borderRadius:10,background:C.surfaceHover,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{a.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:C.text,fontWeight:400}}>{a.action}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',gap:20}}>
            {/* Attendance */}
            <div className="pr-anim" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,animationDelay:'.1s'}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Attendance — {currentMonthName}</div>
              <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                <div style={{width:100,height:100,borderRadius:'50%',background:`conic-gradient(${C.teal} ${attPct*3.6}deg, ${C.surfaceHover} 0deg)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{width:76,height:76,borderRadius:'50%',background:C.surface,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                    <div style={{fontSize:22,fontWeight:700,color:C.teal}}>{attPct}%</div>
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[['Present',presentCount,C.teal],['Absent',absentCount,C.danger],['Leave',leaveCount,C.warning]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:'center',background:C.bg,borderRadius:10,padding:'10px 6px'}}>
                    <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
                    <div style={{fontSize:10,color:C.muted}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Balance */}
            <div className="pr-anim" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,animationDelay:'.2s'}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Leave Balance</div>
              {leaveBalance.map(l=>(
                <div key={l.type} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12,color:C.text,fontWeight:500}}>{l.type}</span>
                    <span style={{fontSize:11,color:C.muted}}>{Math.max(0,l.total-l.used)}/{l.total} remaining</span>
                  </div>
                  <ProgressBar value={Math.max(0,l.total-l.used)} max={Math.max(1,l.total)} color={l.color}/>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="pr-anim" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,animationDelay:'.3s'}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Quick Stats</div>
              {[['Employees Managed',managedCount,C.teal],['Present Today',ds.presentToday||0,C.accent]].map(([l,v,c])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:12,color:C.muted}}>{l}</span>
                  <span style={{fontSize:18,fontWeight:700,color:c}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
