import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MainLayout from '../../components/layouts/MainLayout';

const C={bg:'#0A0A0F',surface:'#13131A',surfaceHover:'#1A1A24',accent:'#7C3AED',accentLight:'rgba(124,58,237,0.15)',teal:'#14B8A6',tealLight:'rgba(20,184,166,0.15)',cyan:'#06B6D4',warning:'#F59E0B',danger:'#EF4444',text:'#F1F0FF',muted:'#8B8A9B',border:'#2E2E3E'};

const STATUS={P:{color:C.teal,label:'Present'},A:{color:C.danger,label:'Absent'},L:{color:C.warning,label:'Leave'},H:{color:C.muted,label:'Holiday'},W:{color:'#1A1A24',label:'Weekend'}};

// Generate dummy attendance for a month
function genData(year,month){
  const days=new Date(year,month+1,0).getDate();
  const names=['Aarav Sharma','Priya Mehta','Rohit Kumar','Neha Reddy','Vikram Singh','Anita Gupta','Karan Joshi','Sneha Desai','Manish Patel','Divya Nair'];
  const depts=['Engineering','HR','Finance','Engineering','Operations','Marketing','Engineering','Finance','Operations','HR'];
  return names.map((n,idx)=>{
    const rec=[];
    for(let d=1;d<=days;d++){
      const dt=new Date(year,month,d);
      const dow=dt.getDay();
      if(dow===0||dow===6) rec.push('W');
      else if(d===15||d===26) rec.push('H');
      else{const r=Math.random();rec.push(r<0.75?'P':r<0.88?'A':'L');}
    }
    return{id:idx+1,name:n,dept:depts[idx],initials:n.split(' ').map(x=>x[0]).join(''),days:rec};
  });
}

const XIco=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const ChevIco=({dir='left'})=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points={dir==='left'?'15 18 9 12 15 6':'9 6 15 12 9 18'}/></svg>;

const Styles=()=><style dangerouslySetInnerHTML={{__html:`
  @keyframes aoFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes aoModal{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  @keyframes aoOverlay{from{opacity:0}to{opacity:1}}
  .ao-card{animation:aoFadeUp .4s ease-out both;transition:transform .25s,box-shadow .25s}.ao-card:hover{transform:translateY(-3px)}
  .ao-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:aoOverlay .2s}
  .ao-modal{background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:28px;width:90%;animation:aoModal .3s;position:relative;font-family:Poppins,sans-serif}
  .ao-heatcell{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:pointer;transition:all .15s;position:relative}
  .ao-heatcell:hover{transform:scale(1.25);z-index:5}
  .ao-tooltip{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);background:${C.surfaceHover};border:1px solid ${C.border};border-radius:8px;padding:6px 10px;font-size:10px;color:${C.text};white-space:nowrap;z-index:10;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.4)}
  .ao-scroll::-webkit-scrollbar{height:5px}.ao-scroll::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
  @media(max-width:767px){.ao-stats{grid-template-columns:repeat(2,1fr)!important}.ao-topbar{flex-direction:column!important;align-items:stretch!important}}
`}}/>;

const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEPTS_FILTER=['All','Engineering','HR','Finance','Operations','Marketing'];

export default function AttendanceOverview(){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [deptF,setDeptF]=useState('All');
  const [hover,setHover]=useState(null);
  const [modal,setModal]=useState(null);

  const data=genData(year,month);
  const filtered=deptF==='All'?data:data.filter(e=>e.dept===deptF);
  const daysInMonth=new Date(year,month+1,0).getDate();
  const today=now.getDate();

  const countToday=(s)=>filtered.reduce((a,e)=>(today<=daysInMonth&&e.days[today-1]===s)?a+1:a,0);
  const presentToday=countToday('P');
  const absentToday=countToday('A');
  const leaveToday=countToday('L');
  const totalWorkDays=filtered.length>0?filtered[0].days.filter(d=>d!=='W'&&d!=='H').length:0;
  const avgAtt=totalWorkDays>0?Math.round(filtered.reduce((a,e)=>a+e.days.filter(d=>d==='P').length,0)/(filtered.length*totalWorkDays)*100):0;

  const prevMonth=()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1);};
  const nextMonth=()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1);};

  const stats=[
    {label:'Present Today',value:presentToday,color:C.teal},
    {label:'Absent Today',value:absentToday,color:C.danger},
    {label:'On Leave Today',value:leaveToday,color:C.warning},
    {label:'Avg Attendance',value:`${avgAtt}%`,color:C.accent},
  ];

  const openModal=(emp)=>{
    const present=emp.days.filter(d=>d==='P').length;
    const absent=emp.days.filter(d=>d==='A').length;
    const leave=emp.days.filter(d=>d==='L').length;
    const hours=emp.days.map((d,i)=>({day:i+1,hrs:d==='P'?7+Math.random()*2:0}));
    setModal({...emp,present,absent,leave,hours});
  };

  const CTooltip=({active,payload,label})=>{
    if(!active||!payload)return null;
    return <div style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 12px',fontSize:11,color:C.text,fontFamily:'Poppins'}}>{`Day ${label}: ${payload[0]?.value?.toFixed(1)}h`}</div>;
  };

  return(
    <MainLayout role="admin" pageTitle="Attendance Overview" userName="Admin User" userInitials="AU" notifCount={3}>
      <Styles/>
      <div style={{fontFamily:'Poppins,sans-serif',maxWidth:1200,margin:'0 auto'}}>

        {/* TOP BAR */}
        <div className="ao-topbar" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:14}}>
          <div>
            <h2 style={{fontSize:22,fontWeight:600,color:C.text,margin:0}}>Attendance Overview</h2>
            <p style={{fontSize:13,color:C.muted,fontWeight:300,marginTop:4}}>Track employee attendance records</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            {/* Month Nav */}
            <div style={{display:'flex',alignItems:'center',gap:8,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'6px 12px'}}>
              <div onClick={prevMonth} style={{cursor:'pointer',display:'flex'}}><ChevIco dir="left"/></div>
              <span style={{fontSize:14,fontWeight:500,color:C.text,minWidth:120,textAlign:'center'}}>{MONTHS[month]} {year}</span>
              <div onClick={nextMonth} style={{cursor:'pointer',display:'flex'}}><ChevIco dir="right"/></div>
            </div>
            <select value={deptF} onChange={e=>setDeptF(e.target.value)} style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'8px 14px',color:C.text,fontSize:13,fontFamily:'Poppins,sans-serif',outline:'none',cursor:'pointer'}}>
              {DEPTS_FILTER.map(d=><option key={d} value={d} style={{background:C.surface}}>{d==='All'?'All Departments':d}</option>)}
            </select>
            <button style={{background:'transparent',border:`1px solid ${C.teal}`,borderRadius:10,padding:'8px 16px',color:C.teal,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'Poppins,sans-serif',display:'flex',alignItems:'center',gap:6,transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.tealLight}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="ao-stats" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {stats.map((s,i)=>(
            <div key={s.label} className="ao-card" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:'16px 20px',animationDelay:`${i*80}ms`}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:500,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>{s.label}</div>
              <div style={{fontSize:28,fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* HEATMAP TABLE */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,overflow:'hidden',marginBottom:20}}>
          <div className="ao-scroll" style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',minWidth:28*daysInMonth+180}}>
              <thead>
                <tr>
                  <th style={{position:'sticky',left:0,zIndex:3,background:C.surface,padding:'10px 14px',textAlign:'left',fontSize:11,color:C.muted,fontWeight:600,borderBottom:`1px solid ${C.border}`,minWidth:160}}>Employee</th>
                  {Array.from({length:daysInMonth},(_,i)=>{
                    const dow=new Date(year,month,i+1).getDay();
                    const isWe=dow===0||dow===6;
                    return <th key={i} style={{padding:'8px 2px',fontSize:10,color:isWe?C.border:C.muted,fontWeight:500,textAlign:'center',borderBottom:`1px solid ${C.border}`,minWidth:28}}>{i+1}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp=>(
                  <tr key={emp.id}>
                    <td onClick={()=>openModal(emp)} style={{position:'sticky',left:0,zIndex:2,background:C.surface,padding:'8px 14px',borderBottom:`1px solid ${C.border}`,cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:26,height:26,borderRadius:'50%',background:`${C.teal}22`,border:`1px solid ${C.teal}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:C.teal}}>{emp.initials}</div>
                        <span style={{fontSize:12,fontWeight:500,color:C.text,whiteSpace:'nowrap'}}>{emp.name}</span>
                      </div>
                    </td>
                    {emp.days.map((s,di)=>{
                      const st=STATUS[s];
                      const hk=`${emp.id}-${di}`;
                      return(
                        <td key={di} style={{padding:'4px 2px',textAlign:'center',borderBottom:`1px solid ${C.border}`}}>
                          <div className="ao-heatcell" onMouseEnter={()=>setHover(hk)} onMouseLeave={()=>setHover(null)}
                            style={{margin:'0 auto',background:s==='W'?'transparent':`${st.color}18`}}>
                            {s!=='W'&&<div style={{width:10,height:10,borderRadius:'50%',background:st.color}}/>}
                            {hover===hk&&s!=='W'&&<div className="ao-tooltip">{emp.name} — {MONTHS[month].slice(0,3)} {di+1} — {st.label}</div>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div style={{display:'flex',gap:20,padding:'12px 18px',borderTop:`1px solid ${C.border}`,flexWrap:'wrap'}}>
            {Object.entries(STATUS).map(([k,v])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:k==='W'?C.border:v.color}}/>
                <span style={{fontSize:11,color:C.muted}}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INDIVIDUAL MODAL */}
      {modal&&(
        <div className="ao-overlay" onClick={()=>setModal(null)}>
          <div className="ao-modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div onClick={()=>setModal(null)} style={{position:'absolute',top:16,right:16,cursor:'pointer'}}><XIco/></div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:`${C.teal}22`,border:`2px solid ${C.teal}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:C.teal}}>{modal.initials}</div>
              <div><div style={{fontSize:18,fontWeight:600,color:C.text}}>{modal.name}</div><div style={{fontSize:12,color:C.muted}}>{modal.dept} — {MONTHS[month]} {year}</div></div>
            </div>
            {/* Summary */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
              {[['Present',modal.present,C.teal],['Absent',modal.absent,C.danger],['Leaves',modal.leave,C.warning],['Work Hrs',`${(modal.present*8)}h`,C.accent]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 10px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:'uppercase',marginBottom:4}}>{l}</div>
                  <div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            {/* Hours chart */}
            <div style={{fontSize:14,fontWeight:500,color:C.text,marginBottom:12}}>Daily Hours Worked</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={modal.hours.filter(h=>h.hrs>0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="day" tick={{fill:C.muted,fontSize:10}} axisLine={{stroke:C.border}} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} domain={[0,10]}/>
                <Tooltip content={<CTooltip/>}/>
                <Bar dataKey="hrs" fill={C.teal} radius={[4,4,0,0]} barSize={14}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
