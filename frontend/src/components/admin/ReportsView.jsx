import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { useAllAttendance, useEmployees, useDepartments, useTimeOffRequests, useTimeOffAllocations, usePayrollSummaryReport, useEmployeeCountReport } from '../../hooks';
import { LoadingSpinner, ErrorState } from './shared';

const C={bg:'#0A0A0F',surface:'#13131A',surfaceHover:'#1A1A24',accent:'#7C3AED',accentLight:'rgba(124,58,237,0.15)',teal:'#14B8A6',tealLight:'rgba(20,184,166,0.15)',cyan:'#06B6D4',warning:'#F59E0B',danger:'#EF4444',text:'#F1F0FF',muted:'#8B8A9B',border:'#2E2E3E'};
const COLORS=[C.teal,C.accent,C.cyan,C.warning,C.danger,'#EC4899','#8B5CF6','#F97316'];

const Styles=()=><style dangerouslySetInnerHTML={{__html:`
  @keyframes rpFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .rp-anim{animation:rpFade .4s ease-out both}
  .rp-tab{background:transparent;border:none;padding:10px 20px;font-size:13px;font-weight:500;cursor:pointer;font-family:Poppins,sans-serif;color:${C.muted};border-bottom:2px solid transparent;transition:all .2s}
  .rp-tab.active{color:${C.teal};border-bottom-color:${C.teal}}
  .rp-card{background:${C.surface};border:1px solid ${C.border};border-radius:16px;padding:24px;transition:transform .25s,box-shadow .25s}
  .rp-card:hover{transform:translateY(-2px)}
  .rp-btn{border:none;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif;transition:all .2s}.rp-btn:hover{transform:translateY(-1px)}
  @media(max-width:767px){.rp-grid2{grid-template-columns:1fr!important}.rp-stats{grid-template-columns:repeat(2,1fr)!important}}
`}}/>;

const CTooltip=({active,payload,label})=>{
  if(!active||!payload)return null;
  return<div style={{background:C.surfaceHover,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 12px',fontFamily:'Poppins',boxShadow:'0 4px 20px rgba(0,0,0,.4)'}}>
    <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{fontSize:11,color:p.color}}>{p.name}: {typeof p.value==='number'&&p.value>1000?`₹${(p.value/1000).toFixed(0)}K`:p.value}</div>)}
  </div>;
};

const exportCSV=(headers,rows,filename)=>{
  const csv=[headers,...rows].map(r=>r.join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
};

export default function ReportsView(){
  const [tab,setTab]=useState(0);
  const now=new Date();
  const curYear=now.getFullYear();
  const [year,setYear]=useState(curYear);

  const { data:empData, isLoading:empL } = useEmployees();
  const { data:deptData, isLoading:deptL } = useDepartments();
  const { data:attData, isLoading:attL } = useAllAttendance();
  const { data:leaveData, isLoading:lvL } = useTimeOffRequests();
  const { data:allocData } = useTimeOffAllocations();
  const { data:payrollData, isLoading:payL } = usePayrollSummaryReport({ year });
  const { data:empCountData, isLoading:ecL } = useEmployeeCountReport({ year });

  const rawEmps=empData?.data?.items??empData?.data??empData??[];
  const emps=Array.isArray(rawEmps)?rawEmps:[];
  const rawDepts=deptData?.data?.items??deptData?.data??deptData??[];
  const depts=Array.isArray(rawDepts)?rawDepts:[];
  const rawAtt=attData?.data?.items??attData?.data??attData??[];
  const attRecords=Array.isArray(rawAtt)?rawAtt:[];
  const rawLeaves=leaveData?.data?.items??leaveData?.data??leaveData??[];
  const leaves=Array.isArray(rawLeaves)?rawLeaves:[];
  const rawAllocs=allocData?.data?.items??allocData?.data??allocData??[];
  const allocs=Array.isArray(rawAllocs)?rawAllocs:[];

  const anyLoading=empL||deptL||attL||lvL||payL||ecL;

  // ─── ATTENDANCE TAB DATA ────
  const attByDept = useMemo(() => {
    const map = {};
    emps.forEach(e => {
      const dept = e.profile?.department?.name || 'Unassigned';
      if (!map[dept]) map[dept] = { dept, present: 0, absent: 0, leave: 0 };
    });
    attRecords.forEach(r => {
      const emp = emps.find(e => e.id === (r.userId || r.user_id || r.user?.id));
      const dept = emp?.profile?.department?.name || 'Unassigned';
      if (!map[dept]) map[dept] = { dept, present: 0, absent: 0, leave: 0 };
      if (r.status === 'present') map[dept].present++;
      else if (r.status === 'on_leave') map[dept].leave++;
      else map[dept].absent++;
    });
    return Object.values(map);
  }, [emps, attRecords]);

  const attMonthly = useMemo(() => {
    const months = {};
    attRecords.forEach(r => {
      const d = new Date(r.date);
      const key = d.toLocaleString('en-US', { month: 'short' });
      if (!months[key]) months[key] = { month: key, present: 0, absent: 0, leave: 0 };
      if (r.status === 'present') months[key].present++;
      else if (r.status === 'on_leave') months[key].leave++;
      else months[key].absent++;
    });
    return Object.values(months);
  }, [attRecords]);

  const totalPresent = attRecords.filter(r => r.status === 'present').length;
  const totalAbsent = attRecords.filter(r => r.status === 'absent').length;
  const totalLeave = attRecords.filter(r => r.status === 'on_leave').length;
  const avgAttRate = (totalPresent + totalAbsent + totalLeave) > 0 ? Math.round(totalPresent / (totalPresent + totalAbsent + totalLeave) * 100) : 0;

  // ─── LEAVE TAB DATA ────
  const leaveByType = useMemo(() => {
    const map = {};
    leaves.forEach(l => {
      const t = l.leaveType || 'Other';
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [leaves]);

  const leaveByStatus = useMemo(() => {
    const s = { Approved: 0, Pending: 0, Rejected: 0 };
    leaves.forEach(l => {
      const st = l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1) : 'Pending';
      if (s[st] !== undefined) s[st]++;
    });
    return [
      { name: 'Approved', value: s.Approved, color: C.teal },
      { name: 'Pending', value: s.Pending, color: C.warning },
      { name: 'Rejected', value: s.Rejected, color: C.danger },
    ];
  }, [leaves]);

  const totalAllocDays = allocs.reduce((a, al) => a + (al.totalDays || al.days || 0), 0);
  const totalUsedDays = allocs.reduce((a, al) => a + (al.usedDays || 0), 0);

  // ─── PAYROLL TAB DATA ────
  const payrollMonths = payrollData?.data?.months || [];
  const totalPayrollCost = payrollMonths.reduce((a, m) => a + (m.totalEmployerCost || 0), 0);
  const avgPayrollCost = payrollMonths.length > 0 ? Math.round(totalPayrollCost / payrollMonths.length) : 0;

  // ─── EMPLOYEE TAB DATA ────
  const empCountMonths = empCountData?.data?.months || [];
  const empByDept = useMemo(() => {
    const map = {};
    emps.forEach(e => {
      const dept = e.profile?.department?.name || 'Unassigned';
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [emps]);

  const empByRole = useMemo(() => {
    const map = {};
    emps.forEach(e => { const r = e.role || 'employee'; map[r] = (map[r] || 0) + 1; });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [emps]);

  const activeEmps = emps.filter(e => e.isActive !== false).length;
  const inactiveEmps = emps.length - activeEmps;

  const tabs = ['Attendance', 'Leave', 'Payroll', 'Employees'];
  const fmt = v => '₹' + (Math.max(0, v || 0)).toLocaleString('en-IN');

  if (anyLoading) return <LoadingSpinner message="Loading reports..." />;

  const StatCard = ({ label, value, color, delay = 0 }) => (
    <div className="rp-anim rp-card" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children, delay = 0 }) => (
    <div className="rp-anim rp-card" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );

  const NoData = () => <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 13 }}>No data available</div>;

  return (
    <>
      <Styles />
      <div style={{ fontFamily: 'Poppins,sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Reports & Analytics</h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 4 }}>Organization insights from live data</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', color: C.text, fontSize: 13, fontFamily: 'Poppins', outline: 'none', cursor: 'pointer' }}>
              {[curYear, curYear - 1, curYear - 2].map(y => <option key={y} value={y} style={{ background: C.surface }}>{y}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          {tabs.map((t, i) => <button key={t} className={`rp-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>)}
        </div>

        {/* ═══ ATTENDANCE TAB ═══ */}
        {tab === 0 && <>
          <div className="rp-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Records" value={attRecords.length} color={C.accent} delay={0} />
            <StatCard label="Present" value={totalPresent} color={C.teal} delay={80} />
            <StatCard label="Absent" value={totalAbsent} color={C.danger} delay={160} />
            <StatCard label="Avg Rate" value={`${avgAttRate}%`} color={C.cyan} delay={240} />
          </div>
          <div className="rp-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <ChartCard title="Attendance by Department" delay={300}>
              {attByDept.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={attByDept}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="dept" tick={{fill:C.muted,fontSize:10}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Bar dataKey="present" name="Present" fill={C.teal} radius={[4,4,0,0]} barSize={16}/><Bar dataKey="absent" name="Absent" fill={C.danger} radius={[4,4,0,0]} barSize={16}/></BarChart></ResponsiveContainer> : <NoData />}
            </ChartCard>
            <ChartCard title="Monthly Attendance Trend" delay={400}>
              {attMonthly.length > 0 ? <ResponsiveContainer width="100%" height={260}><AreaChart data={attMonthly}><defs><linearGradient id="rpTeal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={0.3}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="month" tick={{fill:C.muted,fontSize:10}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Area type="monotone" dataKey="present" name="Present" stroke={C.teal} fill="url(#rpTeal)" strokeWidth={2}/></AreaChart></ResponsiveContainer> : <NoData />}
            </ChartCard>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 8 }}>
            <button className="rp-btn" onClick={() => exportCSV(['Department','Present','Absent','Leave'], attByDept.map(d => [d.dept, d.present, d.absent, d.leave]), `attendance_report_${year}.csv`)}
              style={{ background: C.teal, color: '#fff' }}>Export Attendance CSV</button>
          </div>
        </>}

        {/* ═══ LEAVE TAB ═══ */}
        {tab === 1 && <>
          <div className="rp-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Requests" value={leaves.length} color={C.accent} />
            <StatCard label="Allocated Days" value={totalAllocDays} color={C.teal} delay={80} />
            <StatCard label="Used Days" value={totalUsedDays} color={C.warning} delay={160} />
            <StatCard label="Remaining" value={totalAllocDays - totalUsedDays} color={C.cyan} delay={240} />
          </div>
          <div className="rp-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <ChartCard title="Leave Requests by Type" delay={300}>
              {leaveByType.length > 0 ? <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={leaveByType} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>{leaveByType.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<CTooltip/>}/></PieChart></ResponsiveContainer> : <NoData />}
              <div style={{display:'flex',justifyContent:'center',gap:16,flexWrap:'wrap',marginTop:8}}>{leaveByType.map(d=>(
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:d.color}}/><span style={{fontSize:11,color:C.muted}}>{d.name} ({d.value})</span>
                </div>))}</div>
            </ChartCard>
            <ChartCard title="Leave Request Status" delay={400}>
              <ResponsiveContainer width="100%" height={260}><BarChart data={leaveByStatus}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Bar dataKey="value" name="Count" radius={[6,6,0,0]} barSize={40}>{leaveByStatus.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar></BarChart></ResponsiveContainer>
            </ChartCard>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 8 }}>
            <button className="rp-btn" onClick={() => exportCSV(['Employee','Type','From','To','Days','Status'], leaves.map(l => [l.employee?.name||'—',l.leaveType||'—',l.startDate||'',l.endDate||'',l.daysRequested||1,l.status||'pending']), `leave_report_${year}.csv`)}
              style={{ background: C.teal, color: '#fff' }}>Export Leave CSV</button>
          </div>
        </>}

        {/* ═══ PAYROLL TAB ═══ */}
        {tab === 2 && <>
          <div className="rp-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Cost" value={fmt(totalPayrollCost)} color={C.teal} />
            <StatCard label="Avg Monthly" value={fmt(avgPayrollCost)} color={C.accent} delay={80} />
            <StatCard label="Payruns" value={payrollMonths.length} color={C.cyan} delay={160} />
            <StatCard label="Year" value={year} color={C.warning} delay={240} />
          </div>
          <ChartCard title="Monthly Employer Cost" subtitle={`Payroll trend for ${year}`} delay={300}>
            {payrollMonths.length > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={payrollMonths.map(m=>({month:m.month,cost:m.totalEmployerCost,employees:m.employeeCount}))}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="month" tick={{fill:C.muted,fontSize:11}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}K`}/><Tooltip content={<CTooltip/>}/><Bar dataKey="cost" name="Employer Cost" fill={C.accent} radius={[6,6,0,0]} barSize={32}/></BarChart></ResponsiveContainer> : <NoData />}
          </ChartCard>
          <div style={{ textAlign: 'right', margin: '16px 0 8px' }}>
            <button className="rp-btn" onClick={() => exportCSV(['Month','Cost','Employees','Status'], payrollMonths.map(m => [m.month, m.totalEmployerCost, m.employeeCount, m.status]), `payroll_report_${year}.csv`)}
              style={{ background: C.teal, color: '#fff' }}>Export Payroll CSV</button>
          </div>
        </>}

        {/* ═══ EMPLOYEES TAB ═══ */}
        {tab === 3 && <>
          <div className="rp-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Employees" value={emps.length} color={C.teal} />
            <StatCard label="Active" value={activeEmps} color={C.accent} delay={80} />
            <StatCard label="Inactive" value={inactiveEmps} color={C.danger} delay={160} />
            <StatCard label="Departments" value={depts.length} color={C.cyan} delay={240} />
          </div>
          <div className="rp-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <ChartCard title="Employees by Department" delay={300}>
              {empByDept.length > 0 ? <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={empByDept} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>{empByDept.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<CTooltip/>}/></PieChart></ResponsiveContainer> : <NoData />}
              <div style={{display:'flex',justifyContent:'center',gap:14,flexWrap:'wrap',marginTop:8}}>{empByDept.map(d=>(<div key={d.name} style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,borderRadius:'50%',background:d.color}}/><span style={{fontSize:11,color:C.muted}}>{d.name} ({d.value})</span></div>))}</div>
            </ChartCard>
            <ChartCard title="Hiring Trend" subtitle={`New employees in ${year}`} delay={400}>
              {empCountMonths.length > 0 ? <ResponsiveContainer width="100%" height={260}><LineChart data={empCountMonths}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="month" tick={{fill:C.muted,fontSize:11}} axisLine={{stroke:C.border}} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Line type="monotone" dataKey="count" name="New Hires" stroke={C.teal} strokeWidth={2} dot={{fill:C.teal,r:4}}/></LineChart></ResponsiveContainer> : <NoData />}
            </ChartCard>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 8 }}>
            <button className="rp-btn" onClick={() => exportCSV(['Name','Email','Dept','Role','Status'], emps.map(e => [e.name||'—',e.email||'—',e.profile?.department?.name||'—',e.role||'—',e.isActive?'Active':'Inactive']), `employees_report_${year}.csv`)}
              style={{ background: C.teal, color: '#fff' }}>Export Employees CSV</button>
          </div>
        </>}
      </div>
    </>
  );
}
