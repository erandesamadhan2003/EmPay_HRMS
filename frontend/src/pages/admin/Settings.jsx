import { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';

const C={bg:'#0A0A0F',surface:'#13131A',surfaceHover:'#1A1A24',accent:'#7C3AED',accentLight:'rgba(124,58,237,0.15)',teal:'#14B8A6',tealLight:'rgba(20,184,166,0.15)',cyan:'#06B6D4',warning:'#F59E0B',danger:'#EF4444',text:'#F1F0FF',muted:'#8B8A9B',border:'#2E2E3E'};

const SECTIONS=['Company Info','Role Management','Password & Security','Notifications','Payroll Config'];
const ICONS=['🏢','👥','🔒','🔔','💰'];

const USERS=[
  {name:'Aarav Sharma',role:'Employee'},{name:'Priya Mehta',role:'HR Officer'},{name:'Rohit Kumar',role:'Employee'},
  {name:'Neha Reddy',role:'Employee'},{name:'Vikram Singh',role:'Payroll Officer'},{name:'Anita Gupta',role:'Employee'},
];
const ROLE_OPTS=['Employee','HR Officer','Payroll Officer'];

const fi={background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',width:'100%',transition:'border .2s'};
const label={fontSize:11,color:C.muted,display:'block',marginBottom:5,fontWeight:500};
const saveBtn={background:C.teal,color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif',transition:'all .25s'};

const Styles=()=><style dangerouslySetInnerHTML={{__html:`
  @keyframes stFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .st-section{animation:stFade .35s ease-out both}
  .st-fi:focus{border-color:${C.teal}!important}
  .st-toggle{position:relative;width:44px;height:24px;border-radius:12px;cursor:pointer;transition:background .25s;border:none;padding:0}
  .st-toggle::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .25s}
  .st-toggle.on{background:${C.teal}}.st-toggle.on::after{transform:translateX(20px)}
  .st-toggle.off{background:${C.border}}
  .st-menuitem{display:flex;align-items:center;gap:10;padding:12px 18px;cursor:pointer;transition:all .2s;border-left:3px solid transparent;font-size:13px;color:${C.muted};font-family:Poppins,sans-serif;border-radius:0 8px 8px 0;margin-bottom:2px}
  .st-menuitem:hover{background:${C.surfaceHover};color:${C.text}}
  .st-menuitem.active{border-left-color:${C.teal};color:${C.teal};background:${C.tealLight}}
  @media(max-width:767px){.st-wrap{flex-direction:column!important}.st-menu{width:100%!important;flex-direction:row!important;overflow-x:auto;gap:0!important}.st-menuitem{white-space:nowrap;border-left:none!important;border-bottom:2px solid transparent;border-radius:0!important;padding:10px 14px!important}.st-menuitem.active{border-bottom-color:${C.teal}!important}}
`}}/>;

const Toggle=({on,onToggle,label:lb})=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:`1px solid ${C.border}`}}>
    <span style={{fontSize:13,color:C.text,fontWeight:500}}>{lb}</span>
    <button className={`st-toggle ${on?'on':'off'}`} onClick={onToggle}/>
  </div>
);

export default function Settings(){
  const [sec,setSec]=useState(0);
  const [company,setCompany]=useState({name:'EmPay Technologies Pvt Ltd',address:'Vellore Institute of Technology, Vellore, Tamil Nadu 632014',email:'admin@empay.io',phone:'+91 9876543210'});
  const [roles,setRoles]=useState(USERS.map(u=>u.role));
  const [pw,setPw]=useState({current:'',newPw:'',confirm:''});
  const [resetEmp,setResetEmp]=useState('');
  const [tfa,setTfa]=useState(false);
  const [notifs,setNotifs]=useState({leave:true,payroll:true,newEmp:false,attendance:true});
  const [payroll,setPayroll]=useState({pf:'12',tax:'200',cycle:'monthly',day:'15'});

  return(
    <MainLayout role="admin" pageTitle="Settings" userName="Admin User" userInitials="AU" notifCount={3}>
      <Styles/>
      <div style={{fontFamily:'Poppins,sans-serif',maxWidth:1100,margin:'0 auto'}}>
        <h2 style={{fontSize:22,fontWeight:600,color:C.text,margin:'0 0 4px'}}>Settings</h2>
        <p style={{fontSize:13,color:C.muted,fontWeight:300,marginBottom:24}}>Configure your HRMS preferences</p>

        <div className="st-wrap" style={{display:'flex',gap:24}}>
          {/* SIDEBAR MENU */}
          <div className="st-menu" style={{width:220,flexShrink:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:'12px 0',height:'fit-content',display:'flex',flexDirection:'column',gap:0}}>
            {SECTIONS.map((s,i)=>(
              <div key={s} className={`st-menuitem ${sec===i?'active':''}`} onClick={()=>setSec(i)}>
                <span>{ICONS[i]}</span><span>{s}</span>
              </div>
            ))}
          </div>

          {/* CONTENT */}
          <div style={{flex:1,minWidth:0}}>

            {/* COMPANY INFO */}
            {sec===0&&<div className="st-section" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
              <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 20px'}}>Company Information</h3>
              <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:24}}>
                <div style={{width:72,height:72,borderRadius:'50%',background:`${C.teal}22`,border:`2px solid ${C.teal}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:C.teal,flexShrink:0}}>EP</div>
                <div>
                  <div style={{fontSize:13,color:C.text,fontWeight:500,marginBottom:6}}>Company Logo</div>
                  <button style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:8,padding:'6px 14px',color:C.teal,fontSize:12,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Upload Logo</button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div style={{gridColumn:'span 2'}}><label style={label}>Company Name</label><input className="st-fi" style={fi} value={company.name} onChange={e=>setCompany(c=>({...c,name:e.target.value}))}/></div>
                <div style={{gridColumn:'span 2'}}><label style={label}>Address</label><textarea className="st-fi" style={{...fi,minHeight:70,resize:'vertical'}} value={company.address} onChange={e=>setCompany(c=>({...c,address:e.target.value}))}/></div>
                <div><label style={label}>Email</label><input className="st-fi" style={fi} value={company.email} onChange={e=>setCompany(c=>({...c,email:e.target.value}))}/></div>
                <div><label style={label}>Phone</label><input className="st-fi" style={fi} value={company.phone} onChange={e=>setCompany(c=>({...c,phone:e.target.value}))}/></div>
              </div>
              <div style={{marginTop:24,textAlign:'right'}}><button style={saveBtn}>Save Changes</button></div>
            </div>}

            {/* ROLE MANAGEMENT */}
            {sec===1&&<div className="st-section" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
              <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 20px'}}>Role Management</h3>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  {['Employee','Current Role','Change Role',''].map(h=><th key={h} style={{padding:'10px 12px',fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'.04em',borderBottom:`1px solid ${C.border}`,textAlign:'left'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {USERS.map((u,i)=>(
                    <tr key={u.name} style={{background:i%2?C.surfaceHover:'transparent'}}>
                      <td style={{padding:'10px 12px',fontSize:13,fontWeight:500,color:C.text,borderBottom:`1px solid ${C.border}`}}>{u.name}</td>
                      <td style={{padding:'10px 12px',fontSize:12,color:C.muted,borderBottom:`1px solid ${C.border}`}}>{u.role}</td>
                      <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`}}>
                        <select value={roles[i]} onChange={e=>{const r=[...roles];r[i]=e.target.value;setRoles(r);}} style={{...fi,width:'auto',minWidth:150,cursor:'pointer',padding:'7px 12px'}}>
                          {ROLE_OPTS.map(r=><option key={r} value={r} style={{background:C.surface}}>{r}</option>)}
                        </select>
                      </td>
                      <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`}}>
                        {roles[i]!==u.role&&<button style={{background:C.teal,color:'#fff',border:'none',borderRadius:8,padding:'5px 14px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Save</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}

            {/* PASSWORD & SECURITY */}
            {sec===2&&<div className="st-section" style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
                <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 20px'}}>Reset Employee Password</h3>
                <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:200}}><label style={label}>Select Employee</label>
                    <select className="st-fi" value={resetEmp} onChange={e=>setResetEmp(e.target.value)} style={{...fi,cursor:'pointer'}}>
                      <option value="" style={{background:C.surface}}>Choose employee</option>
                      {USERS.map(u=><option key={u.name} value={u.name} style={{background:C.surface}}>{u.name}</option>)}
                    </select>
                  </div>
                  <button style={{...saveBtn,background:C.warning}}>Send Reset Link</button>
                </div>
              </div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
                <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 20px'}}>Change Your Password</h3>
                <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:400}}>
                  <div><label style={label}>Current Password</label><input className="st-fi" type="password" style={fi} value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} placeholder="••••••••"/></div>
                  <div><label style={label}>New Password</label><input className="st-fi" type="password" style={fi} value={pw.newPw} onChange={e=>setPw(p=>({...p,newPw:e.target.value}))} placeholder="••••••••"/></div>
                  <div><label style={label}>Confirm Password</label><input className="st-fi" type="password" style={fi} value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} placeholder="••••••••"/></div>
                </div>
                <div style={{marginTop:20}}><button style={saveBtn}>Update Password</button></div>
              </div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
                <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 12px'}}>Two-Factor Authentication</h3>
                <Toggle on={tfa} onToggle={()=>setTfa(!tfa)} label="Enable 2FA for admin login"/>
                <p style={{fontSize:12,color:C.muted,fontWeight:300,marginTop:8}}>Adds an extra layer of security by requiring a verification code when logging in.</p>
              </div>
            </div>}

            {/* NOTIFICATIONS */}
            {sec===3&&<div className="st-section" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
              <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 8px'}}>Notification Preferences</h3>
              <p style={{fontSize:12,color:C.muted,marginBottom:16}}>Choose which notifications you want to receive</p>
              <Toggle on={notifs.leave} onToggle={()=>setNotifs(n=>({...n,leave:!n.leave}))} label="Leave request notifications"/>
              <Toggle on={notifs.payroll} onToggle={()=>setNotifs(n=>({...n,payroll:!n.payroll}))} label="Payroll processed notifications"/>
              <Toggle on={notifs.newEmp} onToggle={()=>setNotifs(n=>({...n,newEmp:!n.newEmp}))} label="New employee added"/>
              <Toggle on={notifs.attendance} onToggle={()=>setNotifs(n=>({...n,attendance:!n.attendance}))} label="Attendance alerts"/>
              <div style={{marginTop:24,textAlign:'right'}}><button style={saveBtn}>Save Preferences</button></div>
            </div>}

            {/* PAYROLL CONFIG */}
            {sec===4&&<div className="st-section" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
              <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 20px'}}>Payroll Configuration</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:500}}>
                <div><label style={label}>PF Rate (%)</label><input className="st-fi" type="number" style={fi} value={payroll.pf} onChange={e=>setPayroll(p=>({...p,pf:e.target.value}))}/></div>
                <div><label style={label}>Professional Tax (₹)</label><input className="st-fi" type="number" style={fi} value={payroll.tax} onChange={e=>setPayroll(p=>({...p,tax:e.target.value}))}/></div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={label}>Pay Cycle</label>
                  <div style={{display:'flex',gap:16,marginTop:4}}>
                    {['monthly','biweekly'].map(v=>(
                      <label key={v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:payroll.cycle===v?C.teal:C.muted}}>
                        <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${payroll.cycle===v?C.teal:C.border}`,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setPayroll(p=>({...p,cycle:v}))}>
                          {payroll.cycle===v&&<div style={{width:8,height:8,borderRadius:'50%',background:C.teal}}/>}
                        </div>
                        {v==='monthly'?'Monthly':'Bi-weekly'}
                      </label>
                    ))}
                  </div>
                </div>
                <div><label style={label}>Processing Day</label><input className="st-fi" type="number" style={fi} value={payroll.day} onChange={e=>setPayroll(p=>({...p,day:e.target.value}))}/><span style={{fontSize:11,color:C.muted,marginTop:4,display:'block'}}>{payroll.day}th of every month</span></div>
              </div>
              <div style={{marginTop:24}}><button style={saveBtn}>Save Configuration</button></div>
            </div>}

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
