import { useState } from 'react';
import { AreaChart,Area,BarChart,Bar,LineChart,Line,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend } from 'recharts';

const C={bg:'#0A0A0F',surface:'#13131A',surfaceHover:'#1A1A24',accent:'#7C3AED',accentLight:'rgba(124,58,237,0.15)',teal:'#14B8A6',tealLight:'rgba(20,184,166,0.15)',cyan:'#06B6D4',warning:'#F59E0B',danger:'#EF4444',text:'#F1F0FF',muted:'#8B8A9B',border:'#2E2E3E'};
const fmt=v=>'₹'+v.toLocaleString('en-IN');

// Dummy data
const attDaily=Array.from({length:30},(_,i)=>({day:i+1,pct:75+Math.floor(Math.random()*20)}));
const attDept=[{dept:'Eng',present:92,absent:8},{dept:'HR',present:88,absent:12},{dept:'Fin',present:90,absent:10},{dept:'Ops',present:85,absent:15},{dept:'Mkt',present:91,absent:9}];
const attEmp=[{name:'Aarav Sharma',present:22,absent:2,leave:2,pct:85},{name:'Priya Mehta',present:24,absent:1,leave:1,pct:92},{name:'Rohit Kumar',present:20,absent:3,leave:3,pct:77},{name:'Neha Reddy',present:25,absent:0,leave:1,pct:96},{name:'Vikram Singh',present:18,absent:5,leave:3,pct:69}];

const lvType=[{name:'Annual',value:35,color:C.teal},{name:'Sick',value:18,color:C.danger},{name:'Personal',value:12,color:C.accent},{name:'Emergency',value:5,color:C.warning}];
const lvTrend=[{m:'Dec',count:8},{m:'Jan',count:12},{m:'Feb',count:10},{m:'Mar',count:15},{m:'Apr',count:9},{m:'May',count:14}];
const lvBal=[{name:'Aarav Sharma',annual:12,sick:7,personal:3,used:10},{name:'Priya Mehta',annual:15,sick:9,personal:4,used:6},{name:'Rohit Kumar',annual:10,sick:5,personal:2,used:14},{name:'Neha Reddy',annual:18,sick:10,personal:5,used:4},{name:'Vikram Singh',annual:8,sick:4,personal:1,used:16}];

const payTrend=[{m:'Dec',gross:420000,net:372000},{m:'Jan',gross:445000,net:394000},{m:'Feb',gross:460000,net:408000},{m:'Mar',gross:452000,net:400000},{m:'Apr',gross:478000,net:424000},{m:'May',gross:482000,net:428000}];
const dedTrend=[{m:'Dec',pf:38000,tax:2000},{m:'Jan',pf:41000,tax:2000},{m:'Feb',pf:39000,tax:2000},{m:'Mar',pf:42000,tax:2000},{m:'Apr',pf:44000,tax:2000},{m:'May',pf:40000,tax:2000}];
const paySummary=payTrend.map(p=>({...p,ded:p.gross-p.net}));

const empDept=[{name:'Engineering',value:42,color:C.teal},{name:'HR',value:12,color:C.accent},{name:'Finance',value:18,color:C.cyan},{name:'Operations',value:28,color:C.warning},{name:'Marketing',value:15,color:'#EC4899'},{name:'Design',value:9,color:'#F97316'}];
const empRole=[{role:'Developer',count:25},{role:'Manager',count:8},{role:'Analyst',count:12},{role:'Designer',count:9},{role:'Lead',count:6},{role:'Coordinator',count:10},{role:'Exec',count:5}];
const empList=[{name:'Aarav Sharma',dept:'Engineering',role:'Developer',join:'2024-01-15',status:'Active',salary:69400},{name:'Priya Mehta',dept:'HR',role:'Manager',join:'2024-02-10',status:'Active',salary:62200},{name:'Rohit Kumar',dept:'Finance',role:'Analyst',join:'2023-11-05',status:'Active',salary:57300},{name:'Neha Reddy',dept:'Engineering',role:'Lead',join:'2024-03-20',status:'Active',salary:96200},{name:'Vikram Singh',dept:'Operations',role:'Manager',join:'2023-09-12',status:'Inactive',salary:79700}];

const DlIco=({color=C.teal,size=14})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

const CTooltip=({active,payload,label})=>{
  if(!active||!payload)return null;
  return <div style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 12px',fontFamily:'Poppins',boxShadow:'0 4px 16px rgba(0,0,0,.4)'}}>
    <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{fontSize:11,color:p.color}}>{p.name}: {typeof p.value==='number'&&p.value>1000?fmt(p.value):p.value}{typeof p.value==='number'&&p.value<200&&p.name?.includes('%')?'':'%' in p?'':''}</div>)}
  </div>;
};

const Styles=()=><style dangerouslySetInnerHTML={{__html:`
  @keyframes rpFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .rp-card{animation:rpFade .4s ease-out both;background:${C.surface};border:1px solid ${C.border};border-radius:16px;padding:24px}
  .rp-tab{background:transparent;border:none;padding:10px 20px;font-size:13px;font-weight:500;cursor:pointer;font-family:Poppins,sans-serif;color:${C.muted};border-bottom:2px solid transparent;transition:all .2s}
  .rp-tab.active{color:${C.teal};border-bottom-color:${C.teal}}
  .rp-row:hover{background:${C.surfaceHover}!important}
  .rp-ebtn{background:transparent;border:1px solid ${C.teal};border-radius:8px;padding:6px 14px;color:${C.teal};font-size:12px;font-weight:500;cursor:pointer;font-family:Poppins,sans-serif;display:inline-flex;align-items:center;gap:6;transition:all .2s}
  .rp-ebtn:hover{background:${C.tealLight}}
`}}/>;

const th={padding:'10px 12px',fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'.04em',borderBottom:`1px solid ${C.border}`,textAlign:'left',fontFamily:'Poppins,sans-serif'};
const td={padding:'10px 12px',fontSize:13,color:C.text,borderBottom:`1px solid ${C.border}`,fontFamily:'Poppins,sans-serif'};

const ExBtn=()=><button className="rp-ebtn"><DlIco size={12}/> Export</button>;

export default function ReportsView(){
  const [tab,setTab]=useState(0);
  const [from,setFrom]=useState('2025-05-01');
  const [to,setTo]=useState('2025-05-31');
  const tabs=['Attendance','Leave','Payroll','Employee'];

  return(
    <>
      <Styles/>
      <div style={{fontFamily:'Poppins,sans-serif',maxWidth:1200,margin:'0 auto'}}>
        {/* TOP */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:14}}>
          <div>
            <h2 style={{fontSize:22,fontWeight:600,color:C.text,margin:0}}>Reports & Analytics</h2>
            <p style={{fontSize:13,color:C.muted,fontWeight:300,marginTop:4}}>Comprehensive insights across your organization</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'8px 12px',color:C.text,fontSize:12,fontFamily:'Poppins,sans-serif',outline:'none',colorScheme:'dark'}}/>
            <span style={{color:C.muted,fontSize:12}}>to</span>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:10,padding:'8px 12px',color:C.text,fontSize:12,fontFamily:'Poppins,sans-serif',outline:'none',colorScheme:'dark'}}/>
            <button style={{background:C.teal,color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Export All</button>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,marginBottom:24}}>
          {tabs.map((t,i)=><button key={t} className={`rp-tab ${tab===i?'active':''}`} onClick={()=>setTab(i)}>{t} Report</button>)}
        </div>

        {/* TAB 1: ATTENDANCE */}
        {tab===0&&<div style={{display:'flex',flexDirection:'column',gap:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:20}}>
            <div className="rp-card">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600,color:C.text}}>Daily Attendance %</span><ExBtn/></div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={attDaily}><defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={.3}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="day" tick={{fill:C.muted,fontSize:10}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis domain={[60,100]} tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Area type="monotone" dataKey="pct" name="Attendance %" stroke={C.teal} fill="url(#gA)" strokeWidth={2} dot={false}/></AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="rp-card">
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:16}}>Department Comparison</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={attDept}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="dept" tick={{fill:C.muted,fontSize:10}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Bar dataKey="present" name="Present %" fill={C.teal} radius={[4,4,0,0]} barSize={20}/><Bar dataKey="absent" name="Absent %" fill={C.accent} radius={[4,4,0,0]} barSize={20}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rp-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600,color:C.text}}>Employee Attendance Summary</span><ExBtn/></div>
            <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Name','Present','Absent','Leaves','%'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{attEmp.map((e,i)=><tr key={e.name} className="rp-row" style={{background:i%2?C.surfaceHover:'transparent'}}><td style={{...td,fontWeight:500}}>{e.name}</td><td style={{...td,color:C.teal}}>{e.present}</td><td style={{...td,color:C.danger}}>{e.absent}</td><td style={{...td,color:C.warning}}>{e.leave}</td><td style={{...td,fontWeight:600,color:e.pct>=80?C.teal:C.danger}}>{e.pct}%</td></tr>)}</tbody>
            </table>
          </div>
        </div>}

        {/* TAB 2: LEAVE */}
        {tab===1&&<div style={{display:'flex',flexDirection:'column',gap:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:20}}>
            <div className="rp-card">
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:16}}>Leave Type Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={lvType} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>{lvType.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<CTooltip/>}/></PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:8}}>{lvType.map(d=><div key={d.name} style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:8,height:8,borderRadius:'50%',background:d.color}}/><span style={{fontSize:11,color:C.muted}}>{d.name} ({d.value})</span></div>)}</div>
            </div>
            <div className="rp-card">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600,color:C.text}}>Monthly Leave Trend</span><ExBtn/></div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={lvTrend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="m" tick={{fill:C.muted,fontSize:10}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Bar dataKey="count" name="Leaves" fill={C.accent} radius={[4,4,0,0]} barSize={28}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rp-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600,color:C.text}}>Leave Balance Summary</span><ExBtn/></div>
            <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Name','Annual','Sick','Personal','Used','Remaining'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{lvBal.map((e,i)=>{const rem=e.annual+e.sick+e.personal-e.used;return<tr key={e.name} className="rp-row" style={{background:i%2?C.surfaceHover:'transparent'}}><td style={{...td,fontWeight:500}}>{e.name}</td><td style={{...td,color:C.teal}}>{e.annual}</td><td style={{...td,color:C.danger}}>{e.sick}</td><td style={{...td,color:C.accent}}>{e.personal}</td><td style={{...td,color:C.warning}}>{e.used}</td><td style={{...td,fontWeight:600,color:rem>10?C.teal:C.danger}}>{rem}</td></tr>})}</tbody>
            </table>
          </div>
        </div>}

        {/* TAB 3: PAYROLL */}
        {tab===2&&<div style={{display:'flex',flexDirection:'column',gap:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:20}}>
            <div className="rp-card">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600,color:C.text}}>Monthly Payroll Trend</span><ExBtn/></div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={payTrend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="m" tick={{fill:C.muted,fontSize:10}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}K`}/><Tooltip content={<CTooltip/>}/><Bar dataKey="gross" name="Gross" fill={C.accent} radius={[4,4,0,0]} barSize={20}/><Bar dataKey="net" name="Net" fill={C.teal} radius={[4,4,0,0]} barSize={20}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rp-card">
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:16}}>Deductions Trend</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dedTrend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="m" tick={{fill:C.muted,fontSize:10}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}K`}/><Tooltip content={<CTooltip/>}/><Line type="monotone" dataKey="pf" name="PF" stroke={C.danger} strokeWidth={2} dot={{fill:C.danger,r:3}}/><Line type="monotone" dataKey="tax" name="Tax" stroke={C.warning} strokeWidth={2} dot={{fill:C.warning,r:3}}/></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rp-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600,color:C.text}}>Payroll Summary</span><ExBtn/></div>
            <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Month','Gross','Deductions','Net','Employees'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{paySummary.map((p,i)=><tr key={p.m} className="rp-row" style={{background:i%2?C.surfaceHover:'transparent'}}><td style={{...td,fontWeight:500}}>{p.m}</td><td style={td}>{fmt(p.gross)}</td><td style={{...td,color:C.danger}}>{fmt(p.ded)}</td><td style={{...td,fontWeight:600,color:C.teal}}>{fmt(p.net)}</td><td style={td}>10</td></tr>)}
                <tr style={{background:C.bg}}><td style={{...td,fontWeight:700}}>TOTAL</td><td style={{...td,fontWeight:700}}>{fmt(paySummary.reduce((a,p)=>a+p.gross,0))}</td><td style={{...td,fontWeight:700,color:C.danger}}>{fmt(paySummary.reduce((a,p)=>a+p.ded,0))}</td><td style={{...td,fontWeight:700,color:C.teal}}>{fmt(paySummary.reduce((a,p)=>a+p.net,0))}</td><td style={{...td,fontWeight:700}}>10</td></tr>
              </tbody>
            </table>
          </div>
        </div>}

        {/* TAB 4: EMPLOYEE */}
        {tab===3&&<div style={{display:'flex',flexDirection:'column',gap:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:20}}>
            <div className="rp-card">
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:16}}>Department Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={empDept} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>{empDept.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<CTooltip/>}/></PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:8,flexWrap:'wrap'}}>{empDept.map(d=><div key={d.name} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,borderRadius:'50%',background:d.color}}/><span style={{fontSize:10,color:C.muted}}>{d.name}</span></div>)}</div>
            </div>
            <div className="rp-card">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600,color:C.text}}>Role Distribution</span><ExBtn/></div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={empRole} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/><XAxis type="number" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="role" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} width={80}/><Tooltip content={<CTooltip/>}/><Bar dataKey="count" name="Employees" fill={C.teal} radius={[0,4,4,0]} barSize={16}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rp-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600,color:C.text}}>Employee Directory</span><ExBtn/></div>
            <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Name','Department','Role','Joined','Status','Salary'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{empList.map((e,i)=><tr key={e.name} className="rp-row" style={{background:i%2?C.surfaceHover:'transparent'}}><td style={{...td,fontWeight:500}}>{e.name}</td><td style={{...td,color:C.muted}}>{e.dept}</td><td style={{...td,color:C.muted}}>{e.role}</td><td style={{...td,color:C.muted,fontSize:12}}>{new Date(e.join).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td><td style={td}><span style={{fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:20,background:e.status==='Active'?C.tealLight:'rgba(239,68,68,.15)',color:e.status==='Active'?C.teal:C.danger}}>{e.status}</span></td><td style={{...td,fontWeight:500,color:C.teal}}>{fmt(e.salary)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>}
      </div>
    </>
  );
}
