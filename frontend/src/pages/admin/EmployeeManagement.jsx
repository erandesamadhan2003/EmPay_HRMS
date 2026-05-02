import { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';

const C = {
  bg:'#0A0A0F',surface:'#13131A',surfaceHover:'#1A1A24',
  accent:'#7C3AED',accentLight:'rgba(124,58,237,0.15)',
  teal:'#14B8A6',tealLight:'rgba(20,184,166,0.15)',
  cyan:'#06B6D4',success:'#10B981',warning:'#F59E0B',danger:'#EF4444',
  text:'#F1F0FF',muted:'#8B8A9B',border:'#2E2E3E',
};

const DEPT_COLORS = { Engineering:C.teal, HR:C.accent, Finance:C.cyan, Operations:C.warning, Marketing:'#EC4899' };

const EMPLOYEES = [
  { id:1,loginId:'EMP-AS-2024-001',name:'Aarav Sharma',email:'aarav@empay.io',phone:'9876543210',department:'Engineering',role:'Developer',joinDate:'2024-01-15',status:'Active',salary:85000 },
  { id:2,loginId:'EMP-PM-2024-002',name:'Priya Mehta',email:'priya@empay.io',phone:'9876543211',department:'HR',role:'HR Manager',joinDate:'2024-02-10',status:'Active',salary:72000 },
  { id:3,loginId:'EMP-RK-2023-003',name:'Rohit Kumar',email:'rohit@empay.io',phone:'9876543212',department:'Finance',role:'Analyst',joinDate:'2023-11-05',status:'Active',salary:68000 },
  { id:4,loginId:'EMP-NR-2024-004',name:'Neha Reddy',email:'neha@empay.io',phone:'9876543213',department:'Engineering',role:'Lead Developer',joinDate:'2024-03-20',status:'Active',salary:110000 },
  { id:5,loginId:'EMP-VS-2023-005',name:'Vikram Singh',email:'vikram@empay.io',phone:'9876543214',department:'Operations',role:'Manager',joinDate:'2023-09-12',status:'Inactive',salary:92000 },
  { id:6,loginId:'EMP-AG-2024-006',name:'Anita Gupta',email:'anita@empay.io',phone:'9876543215',department:'Marketing',role:'Exec',joinDate:'2024-04-01',status:'Active',salary:55000 },
  { id:7,loginId:'EMP-KJ-2024-007',name:'Karan Joshi',email:'karan@empay.io',phone:'9876543216',department:'Engineering',role:'DevOps',joinDate:'2024-05-18',status:'Active',salary:95000 },
  { id:8,loginId:'EMP-SD-2023-008',name:'Sneha Desai',email:'sneha@empay.io',phone:'9876543217',department:'Finance',role:'Controller',joinDate:'2023-07-22',status:'Active',salary:78000 },
  { id:9,loginId:'EMP-MP-2024-009',name:'Manish Patel',email:'manish@empay.io',phone:'9876543218',department:'Operations',role:'Coordinator',joinDate:'2024-06-10',status:'Inactive',salary:48000 },
  { id:10,loginId:'EMP-DN-2024-010',name:'Divya Nair',email:'divya@empay.io',phone:'9876543219',department:'HR',role:'Recruiter',joinDate:'2024-07-05',status:'Active',salary:58000 },
];

const Ico = ({d,color=C.muted,size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const EyeIco = ({color}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const PenIco = ({color}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIco = ({color}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const SearchIco = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

const XIco = ({color=C.muted}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const PER_PAGE = 8;
const modalField = {background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',width:'100%'};

const Styles = () => <style dangerouslySetInnerHTML={{__html:`
  @keyframes emFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes emModalIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  @keyframes emOverlayIn{from{opacity:0}to{opacity:1}}
  .em-anim{animation:emFadeUp .4s ease-out both}
  .em-row:hover{background:${C.surfaceHover}!important}
  .em-abtn{transition:all .2s;cursor:pointer;border:none;display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:transparent}
  .em-abtn:hover{transform:scale(1.1)}
  .em-input{background:${C.surfaceHover};border:1px solid ${C.border};border-radius:10px;padding:9px 14px 9px 36px;color:${C.text};font-size:13px;font-family:Poppins,sans-serif;outline:none;width:240px;transition:border .2s}
  .em-input:focus{border-color:${C.teal}}
  .em-select{background:${C.surfaceHover};border:1px solid ${C.border};border-radius:10px;padding:9px 14px;color:${C.text};font-size:13px;font-family:Poppins,sans-serif;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;min-width:140px}
  .em-select:focus{border-color:${C.teal}}
  .em-stoggle{display:flex;border-radius:10px;overflow:hidden;border:1px solid ${C.border}}
  .em-stoggle button{background:transparent;border:none;padding:8px 14px;font-size:12px;font-weight:500;color:${C.muted};cursor:pointer;font-family:Poppins,sans-serif;transition:all .2s}
  .em-stoggle button.active{background:${C.teal};color:#fff}
  .em-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:emOverlayIn .2s ease-out}
  .em-modal{background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:28px;width:90%;animation:emModalIn .3s ease-out;position:relative;font-family:Poppins,sans-serif}
  .em-pgbtn{background:transparent;border:1px solid ${C.border};border-radius:8px;padding:6px 12px;color:${C.muted};font-size:12px;cursor:pointer;font-family:Poppins,sans-serif;transition:all .2s}
  .em-pgbtn:hover{border-color:${C.teal};color:${C.text}}
  .em-pgbtn.active{background:${C.teal};color:#fff;border-color:${C.teal}}
  .em-pgbtn:disabled{opacity:.4;cursor:default}
  @media(max-width:767px){.em-input{width:100%}.em-filters{flex-direction:column!important;align-items:stretch!important}.em-table-wrap{display:none!important}.em-cards{display:grid!important}}
  @media(min-width:768px){.em-cards{display:none!important}}
`}}/>;

export default function EmployeeManagement() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // 'add'|'edit'|'view'|'delete'
  const [modalEmp, setModalEmp] = useState(null);
  const [form, setForm] = useState({name:'',email:'',phone:'',department:'Engineering',role:'',joinDate:'',salary:''});

  const depts = ['All',...new Set(EMPLOYEES.map(e=>e.department))];
  const roles = ['All',...new Set(EMPLOYEES.map(e=>e.role))];

  const filtered = EMPLOYEES.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.loginId.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter!=='All' && e.department!==deptFilter) return false;
    if (roleFilter!=='All' && e.role!==roleFilter) return false;
    if (statusFilter!=='All' && e.status!==statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length/PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const allChecked = paged.length>0 && paged.every(e=>selected.includes(e.id));
  const toggleAll = () => setSelected(allChecked ? [] : paged.map(e=>e.id));
  const toggleOne = (id) => setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  const openAdd = () => { setForm({name:'',email:'',phone:'',department:'Engineering',role:'',joinDate:'',salary:''}); setModal('add'); };
  const openEdit = (e) => { setForm({name:e.name,email:e.email,phone:e.phone,department:e.department,role:e.role,joinDate:e.joinDate,salary:e.salary}); setModalEmp(e); setModal('edit'); };
  const openView = (e) => { setModalEmp(e); setModal('view'); };
  const openDelete = (e) => { setModalEmp(e); setModal('delete'); };
  const closeModal = () => { setModal(null); setModalEmp(null); };
  const genLoginId = () => { const n=form.name.trim().split(' '); return `EMP-${(n[0]?.[0]||'X')}${(n[1]?.[0]||'X')}-${new Date().getFullYear()}-${String(EMPLOYEES.length+1).padStart(3,'0')}`; };

  const th = {padding:'12px 14px',fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'.04em',borderBottom:`1px solid ${C.border}`,textAlign:'left',position:'sticky',top:0,background:C.surface,zIndex:2,fontFamily:'Poppins,sans-serif'};
  const td = {padding:'12px 14px',fontSize:13,color:C.text,fontFamily:'Poppins,sans-serif',borderBottom:`1px solid ${C.border}`};

  return (
    <MainLayout role="admin" pageTitle="Employee Management" userName="Admin User" userInitials="AU" notifCount={3}>
      <Styles/>
      <div className="em-anim" style={{fontFamily:'Poppins,sans-serif',maxWidth:1200,margin:'0 auto'}}>

        {/* TOP BAR */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:16}}>
          <div>
            <h2 style={{fontSize:22,fontWeight:600,color:C.text,margin:0}}>Employees</h2>
            <p style={{fontSize:13,color:C.muted,fontWeight:300,marginTop:4}}>Manage your team</p>
          </div>
          <button onClick={openAdd} style={{background:C.teal,color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif',transition:'all .25s'}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 4px 20px ${C.tealLight}`;e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none'}}>
            + Add Employee
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="em-filters" style={{display:'flex',gap:12,alignItems:'center',marginBottom:24,flexWrap:'wrap'}}>
          <div style={{position:'relative'}}>
            <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}><SearchIco/></div>
            <input className="em-input" placeholder="Search by name or ID..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="em-select" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
            {depts.map(d=><option key={d} value={d} style={{background:C.surface}}>{d==='All'?'All Departments':d}</option>)}
          </select>
          <select className="em-select" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
            {roles.map(r=><option key={r} value={r} style={{background:C.surface}}>{r==='All'?'All Roles':r}</option>)}
          </select>
          <div className="em-stoggle">
            {['All','Active','Inactive'].map(s=>(
              <button key={s} className={statusFilter===s?'active':''} onClick={()=>setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{marginLeft:'auto',fontSize:12,color:C.muted}}>{filtered.length} results</div>
        </div>

        {/* BULK ACTIONS */}
        {selected.length>0 && (
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 18px',marginBottom:16,display:'flex',alignItems:'center',gap:16,animation:'emFadeUp .3s ease-out'}}>
            <span style={{fontSize:13,color:C.text,fontWeight:500}}>{selected.length} selected</span>
            <button style={{background:C.warning,color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Deactivate</button>
            <button style={{background:C.danger,color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Delete</button>
          </div>
        )}

        {/* TABLE (desktop) */}
        <div className="em-table-wrap" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,overflow:'auto',maxHeight:520}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{...th,width:40}}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{accentColor:C.teal,cursor:'pointer'}}/></th>
                <th style={th}>Employee</th>
                <th style={th}>Login ID</th>
                <th style={th}>Department</th>
                <th style={th}>Role</th>
                <th style={th}>Join Date</th>
                <th style={th}>Status</th>
                <th style={{...th,textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e,i) => {
                const dc = DEPT_COLORS[e.department]||C.muted;
                return (
                  <tr key={e.id} className="em-row" style={{background:i%2===0?'transparent':C.surfaceHover,transition:'background .15s',cursor:'pointer'}}>
                    <td style={td}><input type="checkbox" checked={selected.includes(e.id)} onChange={()=>toggleOne(e.id)} style={{accentColor:C.teal,cursor:'pointer'}}/></td>
                    <td style={td}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:34,height:34,borderRadius:'50%',background:`${dc}22`,border:`1.5px solid ${dc}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:dc,flexShrink:0}}>{e.name[0]}</div>
                        <div>
                          <div style={{fontWeight:500,fontSize:13}}>{e.name}</div>
                          <div style={{fontSize:11,color:C.muted}}>{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{...td,fontFamily:'monospace',color:C.muted,fontSize:12}}>{e.loginId}</td>
                    <td style={td}><span style={{fontSize:11,fontWeight:600,color:dc,background:`${dc}18`,padding:'3px 10px',borderRadius:20}}>{e.department}</span></td>
                    <td style={{...td,fontSize:13,color:C.muted}}>{e.role}</td>
                    <td style={{...td,fontSize:12,color:C.muted}}>{new Date(e.joinDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td style={td}><span style={{fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:20,background:e.status==='Active'?C.tealLight:'rgba(239,68,68,.15)',color:e.status==='Active'?C.teal:C.danger}}>{e.status}</span></td>
                    <td style={{...td,textAlign:'center'}}>
                      <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                        <button className="em-abtn" title="View" onClick={()=>openView(e)} onMouseEnter={ev=>ev.currentTarget.style.background=`${C.cyan}18`} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}><EyeIco color={C.cyan}/></button>
                        <button className="em-abtn" title="Edit" onClick={()=>openEdit(e)} onMouseEnter={ev=>ev.currentTarget.style.background=C.accentLight} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}><PenIco color={C.accent}/></button>
                        <button className="em-abtn" title="Delete" onClick={()=>openDelete(e)} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(239,68,68,.12)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}><TrashIco color={C.danger}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0 && <tr><td colSpan={8} style={{...td,textAlign:'center',padding:40,color:C.muted}}>No employees found</td></tr>}
            </tbody>
          </table>
        </div>

        {/* CARDS (mobile) */}
        <div className="em-cards" style={{display:'none',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {filtered.map(e => {
            const dc = DEPT_COLORS[e.department]||C.muted;
            return (
              <div key={e.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,transition:'all .2s'}}
                onMouseEnter={ev=>ev.currentTarget.style.borderColor=C.teal} onMouseLeave={ev=>ev.currentTarget.style.borderColor=C.border}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:`${dc}22`,border:`1.5px solid ${dc}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:dc}}>{e.name[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.text}}>{e.name}</div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{e.loginId}</div>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:20,background:e.status==='Active'?C.tealLight:'rgba(239,68,68,.15)',color:e.status==='Active'?C.teal:C.danger}}>{e.status}</span>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                  <span style={{fontSize:11,color:dc,background:`${dc}18`,padding:'2px 8px',borderRadius:12,fontWeight:500}}>{e.department}</span>
                  <span style={{fontSize:11,color:C.muted}}>{e.role}</span>
                </div>
                <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button className="em-abtn" onClick={()=>openView(e)} style={{background:`${C.cyan}18`}}><EyeIco color={C.cyan}/></button>
                  <button className="em-abtn" onClick={()=>openEdit(e)} style={{background:C.accentLight}}><PenIco color={C.accent}/></button>
                  <button className="em-abtn" onClick={()=>openDelete(e)} style={{background:'rgba(239,68,68,.12)'}}><TrashIco color={C.danger}/></button>
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {totalPages>1 && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:20,flexWrap:'wrap',gap:12}}>
            <span style={{fontSize:12,color:C.muted}}>Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}</span>
            <div style={{display:'flex',gap:6}}>
              <button className="em-pgbtn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
              {Array.from({length:totalPages},(_,i)=>(
                <button key={i} className={`em-pgbtn ${page===i+1?'active':''}`} onClick={()=>setPage(i+1)}>{i+1}</button>
              ))}
              <button className="em-pgbtn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
            </div>
          </div>
        )}

      </div>

      {/* ADD/EDIT MODAL */}
      {(modal==='add'||modal==='edit') && (
        <div className="em-overlay" onClick={closeModal}>
          <div className="em-modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:600,color:C.text,margin:0}}>{modal==='add'?'Add New Employee':'Edit Employee'}</h3>
              <div onClick={closeModal} style={{cursor:'pointer'}}><XIco/></div>
            </div>
            {form.name && <div style={{fontSize:12,color:C.muted,marginBottom:16,background:C.surfaceHover,padding:'8px 14px',borderRadius:8}}>Login ID Preview: <span style={{color:C.teal,fontFamily:'monospace',fontWeight:600}}>{genLoginId()}</span></div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'span 2'}}><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Full Name</label><input style={modalField} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full Name"/></div>
              <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Email</label><input style={modalField} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@empay.io"/></div>
              <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Phone</label><div style={{display:'flex',gap:6}}><span style={{...modalField,width:50,textAlign:'center',flexShrink:0,padding:'10px 6px'}}>+91</span><input style={modalField} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="9876543210"/></div></div>
              <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Department</label><select style={{...modalField,cursor:'pointer'}} value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>{['Engineering','HR','Finance','Operations','Marketing'].map(d=><option key={d} value={d} style={{background:C.surface}}>{d}</option>)}</select></div>
              <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Role</label><input style={modalField} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="Role"/></div>
              <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Date of Joining</label><input type="date" style={{...modalField,colorScheme:'dark'}} value={form.joinDate} onChange={e=>setForm(f=>({...f,joinDate:e.target.value}))}/></div>
              <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Salary</label><input type="number" style={modalField} value={form.salary} onChange={e=>setForm(f=>({...f,salary:e.target.value}))} placeholder="Monthly salary"/></div>
            </div>
            <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:24}}>
              <button onClick={closeModal} style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 22px',color:C.text,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Cancel</button>
              <button onClick={closeModal} style={{background:C.teal,border:'none',borderRadius:10,padding:'10px 22px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {modal==='view' && modalEmp && (()=>{
        const dc=DEPT_COLORS[modalEmp.department]||C.muted;
        return (
          <div className="em-overlay" onClick={closeModal}>
            <div className="em-modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
              <div onClick={closeModal} style={{position:'absolute',top:16,right:16,cursor:'pointer'}}><XIco/></div>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{width:64,height:64,borderRadius:'50%',background:`${dc}22`,border:`2px solid ${dc}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:dc,margin:'0 auto 12px'}}>{modalEmp.name[0]}</div>
                <div style={{fontSize:18,fontWeight:600,color:C.text}}>{modalEmp.name}</div>
                <span style={{fontSize:11,fontWeight:600,color:dc,background:`${dc}18`,padding:'3px 10px',borderRadius:20}}>{modalEmp.department}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
                {[['Login ID',modalEmp.loginId],['Email',modalEmp.email],['Phone','+91 '+modalEmp.phone],['Role',modalEmp.role],['Joined',new Date(modalEmp.joinDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})],['Status',modalEmp.status],['Salary','\u20B9'+modalEmp.salary.toLocaleString('en-IN')],['Present Days','22 / 26']].map(([k,v])=>(
                  <div key={k} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px'}}>
                    <div style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:500,color:k==='Status'?(v==='Active'?C.teal:C.danger):C.text}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:12}}>
                <div style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:'uppercase',marginBottom:4}}>Leave Days</div>
                  <div style={{fontSize:18,fontWeight:700,color:C.warning}}>4</div>
                </div>
                <div style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:'uppercase',marginBottom:4}}>Last Payslip</div>
                  <div style={{fontSize:18,fontWeight:700,color:C.teal}}>\u20B9{modalEmp.salary.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>
        );})()}

      {/* DELETE DIALOG */}
      {modal==='delete' && modalEmp && (
        <div className="em-overlay" onClick={closeModal}>
          <div className="em-modal" style={{maxWidth:380,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:48,height:48,margin:'0 auto 16px',position:'relative'}}>
              <div style={{width:0,height:0,borderLeft:'24px solid transparent',borderRight:'24px solid transparent',borderBottom:`42px solid ${C.warning}22`,position:'absolute',top:0,left:0}}/>
              <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',fontSize:20,fontWeight:700,color:C.warning}}>!</div>
            </div>
            <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 8px'}}>Remove Employee</h3>
            <p style={{fontSize:13,color:C.muted,marginBottom:24}}>Are you sure you want to remove <strong style={{color:C.text}}>{modalEmp.name}</strong>? This action cannot be undone.</p>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <button onClick={closeModal} style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 22px',color:C.text,fontSize:13,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Cancel</button>
              <button onClick={closeModal} style={{background:C.danger,border:'none',borderRadius:10,padding:'10px 22px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
