import { useState } from 'react';
import { useTimeOffRequests, useTimeOffRequestMutations } from '../../hooks';
import { LoadingSpinner, ErrorState } from './shared';

const C={bg:'#0A0A0F',surface:'#13131A',surfaceHover:'#1A1A24',accent:'#7C3AED',accentLight:'rgba(124,58,237,0.15)',teal:'#14B8A6',tealLight:'rgba(20,184,166,0.15)',cyan:'#06B6D4',warning:'#F59E0B',danger:'#EF4444',text:'#F1F0FF',muted:'#8B8A9B',border:'#2E2E3E'};

const LT_COLORS={'Annual Leave':C.teal,'Sick Leave':C.danger,'Personal Leave':C.accent,'Emergency Leave':C.warning};
const ST_COLORS={Pending:C.warning,Approved:C.teal,Rejected:C.danger};

// Allocations fallback (only used if API doesn't provide)
const ALLOCATIONS_FB=[];

const XIco=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const Styles=()=><style dangerouslySetInnerHTML={{__html:`
  @keyframes lmFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes lmModal{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  @keyframes lmOverlay{from{opacity:0}to{opacity:1}}
  @keyframes lmApproved{0%{background:${C.tealLight}}50%{background:${C.tealLight}}100%{background:transparent}}
  .lm-card{animation:lmFade .4s ease-out both;transition:transform .25s,box-shadow .25s,border-color .2s}.lm-card:hover{transform:translateY(-2px);border-color:${C.teal}}
  .lm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:lmOverlay .2s}
  .lm-modal{background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:28px;width:90%;animation:lmModal .3s;position:relative;font-family:Poppins,sans-serif}
  .lm-btn{border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif;transition:all .2s}.lm-btn:hover{transform:translateY(-1px)}
  .lm-tab{background:transparent;border:none;padding:8px 18px;font-size:13px;font-weight:500;cursor:pointer;font-family:Poppins,sans-serif;color:${C.muted};border-bottom:2px solid transparent;transition:all .2s}
  .lm-tab.active{color:${C.teal};border-bottom-color:${C.teal}}
  .lm-flash{animation:lmApproved 1s ease-out}
  @media(max-width:767px){.lm-stats{grid-template-columns:1fr!important}.lm-req-right{flex-direction:column!important;align-items:flex-start!important}}
`}}/>;

const fmtDate=(d)=>new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});

export default function LeaveManagementView(){
  const { data: reqData, isLoading, error, refetch } = useTimeOffRequests();
  const { approveRequest, rejectRequest, isApproving, isRejecting } = useTimeOffRequestMutations();

  // Map API response
  const rawReqs = Array.isArray(reqData?.data) ? reqData.data : (Array.isArray(reqData) ? reqData : []);
  const leaves = rawReqs.map(l => ({
    id: l._id || l.id,
    employeeName: l.employee?.firstName ? `${l.employee.firstName} ${l.employee.lastName||''}`.trim() : (l.employeeName || 'Employee'),
    employeeId: l.employee?.employeeId || l.employeeId || '—',
    leaveType: l.leaveType || l.type || 'Leave',
    fromDate: l.startDate || l.fromDate || '',
    toDate: l.endDate || l.toDate || '',
    days: l.numberOfDays || l.days || 1,
    reason: l.reason || l.description || '',
    status: l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase() : 'Pending',
    appliedOn: l.createdAt || l.appliedOn || '',
  }));

  const [tab,setTab]=useState('all');
  const [typeF,setTypeF]=useState('All');
  const [expanded,setExpanded]=useState(null);
  const [rejectModal,setRejectModal]=useState(null);
  const [rejectReason,setRejectReason]=useState('');
  const [allocEmp,setAllocEmp]=useState('');
  const [allocType,setAllocType]=useState('Annual Leave');
  const [allocDays,setAllocDays]=useState('');

  const filtered=leaves.filter(l=>{
    if(tab==='pending'&&l.status!=='Pending')return false;
    if(tab==='done'&&l.status==='Pending')return false;
    if(typeF!=='All'&&l.leaveType!==typeF)return false;
    return true;
  });

  const pending=leaves.filter(l=>l.status==='Pending').length;
  const approved=leaves.filter(l=>l.status==='Approved').length;
  const rejected=leaves.filter(l=>l.status==='Rejected').length;

  const approve=async(id)=>{ try { await approveRequest({ id, data: {} }); } catch(e) { console.error('Approve failed:', e); } };
  const reject=async(id)=>{ try { await rejectRequest({ id, data: { reason: rejectReason } }); setRejectModal(null); setRejectReason(''); } catch(e) { console.error('Reject failed:', e); } };

  if (isLoading) return <LoadingSpinner message="Loading leave requests..." />;
  if (error) return <ErrorState message="Failed to load leave requests" onRetry={refetch} />;

  const stats=[{label:'Pending Requests',value:pending,color:C.warning},{label:'Approved',value:approved,color:C.teal},{label:'Rejected',value:rejected,color:C.danger}];

  return(
    <>
      <Styles/>
      <div style={{fontFamily:'Poppins,sans-serif',maxWidth:1100,margin:'0 auto'}}>

        {/* TOP BAR */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:14}}>
          <div>
            <h2 style={{fontSize:22,fontWeight:600,color:C.text,margin:0}}>Leave Management</h2>
            <p style={{fontSize:13,color:C.muted,fontWeight:300,marginTop:4}}>Review and manage employee leave requests</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <select value={typeF} onChange={e=>setTypeF(e.target.value)} style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'8px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',cursor:'pointer'}}>
              {['All','Annual Leave','Sick Leave','Personal Leave','Emergency Leave'].map(t=><option key={t} value={t} style={{background:C.surface}}>{t==='All'?'All Types':t}</option>)}
            </select>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`1px solid ${C.border}`}}>
          {[['all','All Requests'],['pending','Pending'],['done','Approved / Rejected']].map(([k,l])=>(
            <button key={k} className={`lm-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l} {k==='pending'&&pending>0&&<span style={{background:C.warning,color:'#000',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10,marginLeft:6}}>{pending}</span>}</button>
          ))}
        </div>

        {/* STATS */}
        <div className="lm-stats" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
          {stats.map((s,i)=>(
            <div key={s.label} className="lm-card" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:'16px 20px',animationDelay:`${i*80}ms`}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:500,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>{s.label}</div>
              <div style={{fontSize:28,fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* REQUESTS */}
        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:32}}>
          {filtered.length===0&&<div style={{textAlign:'center',padding:40,color:C.muted,fontSize:14}}>No leave requests found</div>}
          {filtered.map((l,i)=>{
            const ltc=LT_COLORS[l.leaveType]||C.muted;
            const ini=l.employeeName.split(' ').map(x=>x[0]).join('');
            const isP=l.status==='Pending';
            return(
              <div key={l.id} className={`lm-card ${!isP&&l.status==='Approved'?'':''}`.trim()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:'16px 20px',animationDelay:`${(i+3)*60}ms`,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                {/* Left: avatar + name */}
                <div style={{display:'flex',alignItems:'center',gap:10,minWidth:160}}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:`${ltc}22`,border:`1.5px solid ${ltc}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:ltc,flexShrink:0}}>{ini}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:C.text}}>{l.employeeName}</div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{l.employeeId}</div>
                  </div>
                </div>
                {/* Center: details */}
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,fontWeight:600,color:ltc,background:`${ltc}18`,padding:'2px 10px',borderRadius:12}}>{l.leaveType}</span>
                    <span style={{fontSize:12,color:C.text,fontWeight:500}}>{fmtDate(l.fromDate)} — {fmtDate(l.toDate)}</span>
                    <span style={{fontSize:11,color:C.muted}}>({l.days} day{l.days>1?'s':''})</span>
                  </div>
                  <p onClick={()=>setExpanded(expanded===l.id?null:l.id)} style={{fontSize:12,color:C.muted,fontWeight:300,margin:0,cursor:'pointer',overflow:expanded===l.id?'visible':'hidden',textOverflow:expanded===l.id?'unset':'ellipsis',whiteSpace:expanded===l.id?'normal':'nowrap',maxWidth:expanded===l.id?'none':320}}>
                    {l.reason}
                  </p>
                  <div style={{fontSize:10,color:C.muted,marginTop:4}}>Applied: {fmtDate(l.appliedOn)}</div>
                </div>
                {/* Right: status + actions */}
                <div className="lm-req-right" style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  <span style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,background:`${ST_COLORS[l.status]}18`,color:ST_COLORS[l.status]}}>{l.status}</span>
                  {isP&&<>
                    <button className="lm-btn" onClick={()=>approve(l.id)} style={{background:C.teal,color:'#fff'}} onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 4px 12px ${C.tealLight}`} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>Approve</button>
                    <button className="lm-btn" onClick={()=>setRejectModal(l)} style={{background:'transparent',color:C.danger,border:`1px solid ${C.danger}`}} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.1)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>Reject</button>
                  </>}
                </div>
              </div>
            );
          })}
        </div>

        {/* LEAVE ALLOCATION */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,marginBottom:8}}>
          <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 16px'}}>Allocate Leaves to Employee</h3>
          <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap',marginBottom:20}}>
            <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Employee</label>
              <select value={allocEmp} onChange={e=>setAllocEmp(e.target.value)} style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',minWidth:180}}>
                <option value="" style={{background:C.surface}}>Select employee</option>
                {ALLOCATIONS_FB.map(a=><option key={a.emp} value={a.emp} style={{background:C.surface}}>{a.emp}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Leave Type</label>
              <select value={allocType} onChange={e=>setAllocType(e.target.value)} style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',minWidth:150}}>
                {['Annual Leave','Sick Leave','Personal Leave','Emergency Leave'].map(t=><option key={t} value={t} style={{background:C.surface}}>{t}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Days</label>
              <input type="number" value={allocDays} onChange={e=>setAllocDays(e.target.value)} placeholder="0" style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',width:80}}/>
            </div>
            <button className="lm-btn" style={{background:C.teal,color:'#fff',padding:'10px 20px',fontSize:13}}>Allocate</button>
          </div>
          {/* Allocation table */}
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Employee','Annual','Sick','Personal','Emergency','Total'].map(h=>(
                  <th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'.04em',borderBottom:`1px solid ${C.border}`}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {ALLOCATIONS_FB.map((a,i)=>(
                  <tr key={a.emp} style={{background:i%2?C.surfaceHover:'transparent'}}>
                    <td style={{padding:'10px 12px',fontSize:13,fontWeight:500,color:C.text}}>{a.emp}</td>
                    <td style={{padding:'10px 12px',fontSize:13,color:C.teal}}>{a.annual}</td>
                    <td style={{padding:'10px 12px',fontSize:13,color:C.danger}}>{a.sick}</td>
                    <td style={{padding:'10px 12px',fontSize:13,color:C.accent}}>{a.personal}</td>
                    <td style={{padding:'10px 12px',fontSize:13,color:C.warning}}>{a.emergency}</td>
                    <td style={{padding:'10px 12px',fontSize:13,fontWeight:600,color:C.text}}>{a.annual+a.sick+a.personal+a.emergency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* REJECT REASON MODAL */}
      {rejectModal&&(
        <div className="lm-overlay" onClick={()=>setRejectModal(null)}>
          <div className="lm-modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div onClick={()=>setRejectModal(null)} style={{position:'absolute',top:16,right:16,cursor:'pointer'}}><XIco/></div>
            <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:'0 0 4px'}}>Reject Leave</h3>
            <p style={{fontSize:13,color:C.muted,marginBottom:16}}>{rejectModal.employeeName} — {rejectModal.leaveType}</p>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Reason for rejection</label>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Enter reason..." style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',width:'100%',minHeight:80,resize:'vertical',marginBottom:20}}/>
            <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
              <button onClick={()=>setRejectModal(null)} className="lm-btn" style={{background:'transparent',border:`1px solid ${C.border}`,color:C.text,padding:'10px 20px'}}>Cancel</button>
              <button onClick={()=>reject(rejectModal.id)} className="lm-btn" style={{background:C.danger,color:'#fff',padding:'10px 20px'}}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
