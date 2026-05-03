import { useState } from 'react';
import { usePayruns, usePayrunMutations, usePayslips, usePayslipMutations, useEmployees } from '../../hooks';
import { LoadingSpinner, ErrorState } from './shared';

const C = { bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24', accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)', teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)', cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444', text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E' };
const ST_C = { Paid: C.teal, Pending: C.warning, Processing: C.cyan, paid: C.teal, pending: C.warning, processing: C.cyan, draft: C.muted, Draft: C.muted };
const fmt = v => '₹' + (Math.max(0, v || 0)).toLocaleString('en-IN');

const numWords = (n) => { const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']; const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']; if (n === 0) return 'Zero'; let s = ''; if (Math.floor(n / 100000) > 0) { s += a[Math.floor(n / 100000)] + ' Lakh '; n %= 100000; } if (Math.floor(n / 1000) > 0) { const t = Math.floor(n / 1000); s += (t < 20 ? a[t] : b[Math.floor(t / 10)] + (t % 10 ? ' ' + a[t % 10] : '')) + ' Thousand '; n %= 1000; } if (Math.floor(n / 100) > 0) { s += a[Math.floor(n / 100)] + ' Hundred '; n %= 100; } if (n > 0) { if (n < 20) s += a[n]; else s += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ''); } return s.trim() + ' Only'; };

const EyeIco = ({ color = C.cyan }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const DlIco = ({ color = C.teal }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const XIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

const Styles = () => <style dangerouslySetInnerHTML={{
  __html: `
  @keyframes poFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes poModal{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  @keyframes poOverlay{from{opacity:0}to{opacity:1}}
  .po-card{animation:poFade .4s ease-out both;transition:transform .25s,box-shadow .25s}.po-card:hover{transform:translateY(-3px)}
  .po-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:poOverlay .2s}
  .po-modal{background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:28px;width:90%;animation:poModal .3s;position:relative;font-family:Poppins,sans-serif}
  .po-abtn{border:none;background:transparent;cursor:pointer;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .2s}.po-abtn:hover{transform:scale(1.1)}
  .po-row:hover{background:${C.surfaceHover}!important}
  @media(max-width:767px){.po-stats{grid-template-columns:repeat(2,1fr)!important}}
  @media print{.po-noprint{display:none!important}}
`}} />;

export default function PayrollOverviewView() {
  // Fetch payruns and payslips
  const { data: payrunsData, isLoading: isLoadingPayruns, error: errorPayruns } = usePayruns();
  const payruns = payrunsData?.data?.items ?? payrunsData?.data ?? [];

  // Dynamic months — last 5 months
  const now = new Date();
  const MONTHS = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
    return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  });
  const currentMonth = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // Parse month string (e.g. "April 2026") into YYYY-MM
  const [month, setMonth] = useState(currentMonth);
  const [modal, setModal] = useState(null);
  const [payrun, setPayrun] = useState(false);
  const { createPayrun, isCreating: isCreatingPayrun } = usePayrunMutations();
  const { loadPayslipPdfBlob } = usePayslipMutations();

  const targetDate = new Date(Date.parse(month + " 1"));
  const targetPrefix = month ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}` : '';

  const currentPayrun = payruns.find(p => p.periodStart?.startsWith(targetPrefix));

  const { data: payslipsData, isLoading: isLoadingPayslips, error: errorPayslips, refetch } = usePayslips({ payrun_id: currentPayrun?.id, limit: 1000 });
  const rawPayslips = payslipsData?.data?.items ?? payslipsData?.data ?? [];

  const EMPS = rawPayslips.map(p => ({
    id: p.id,
    name: p.employeeName || 'Unknown',
    department: p.department || '\u2014',
    basicSalary: p.basicSalary || 0,
    hra: p.hra || 0,
    allowances: p.standardAllowance || 0,
    pfDeduction: p.pfEmployee || 0,
    professionalTax: p.professionalTax || 0,
    status: p.status || 'Pending',
    netSalary: p.netSalary || 0,
  }));

  const totGross = EMPS.reduce((a, e) => a + e.basicSalary + e.hra + e.allowances, 0);
  const totDed = EMPS.reduce((a, e) => a + e.pfDeduction + e.professionalTax, 0);
  const totNet = EMPS.reduce((a, e) => a + e.netSalary, 0);
  const paid = EMPS.filter(e => e.status === 'Paid' || e.status === 'paid').length;

  const stats = [
    { label: 'Total Gross', value: fmt(totGross), color: C.accent },
    { label: 'Total Deductions', value: fmt(totDed), color: C.danger },
    { label: 'Total Net Payout', value: fmt(totNet), color: C.teal },
    { label: 'Employees Paid', value: `${paid} / ${EMPS.length}`, color: C.cyan },
  ];

  const handlePayrun = async () => {
    try { await createPayrun({ month, year: now.getFullYear() }); setPayrun(false); } catch (err) { console.error('Payrun failed:', err); }
  };

  const handleDownload = async (emp) => {
    // Open the modal to show the slip then immediately open the print dialog
    setModal(emp);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Dept', 'Basic', 'HRA', 'Allowances', 'PF', 'Tax', 'Net Salary', 'Status'];
    const rows = EMPS.map(e => [e.name, e.department, e.basicSalary, e.hra, e.allowances, e.pfDeduction, e.professionalTax, e.netSalary, e.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `payroll_${month.replace(/\s+/g, '_')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingPayruns || isLoadingPayslips) return <LoadingSpinner message="Loading payroll..." />;
  if (errorPayruns || errorPayslips) return <ErrorState message="Failed to load payroll data" onRetry={refetch} />;

  const th = { padding: '10px 12px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${C.border}`, textAlign: 'left', whiteSpace: 'nowrap', fontFamily: 'Poppins,sans-serif' };
  const td = { padding: '10px 12px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, fontFamily: 'Poppins,sans-serif', whiteSpace: 'nowrap' };

  return (
    <>
      <Styles />
      <div style={{ fontFamily: 'Poppins,sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Payroll Overview</h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 4 }}>Manage salary processing and payslips</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select value={month} onChange={e => setMonth(e.target.value)} style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 14px', color: C.text, fontSize: 13, fontFamily: 'Poppins,sans-serif', outline: 'none', cursor: 'pointer' }}>
              {MONTHS.map(m => <option key={m} value={m} style={{ background: C.surface }}>{m}</option>)}
            </select>
            <button onClick={() => setPayrun(true)} style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', transition: 'all .25s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${C.tealLight}`; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
              Generate Payrun
            </button>
            <button onClick={handleExportCSV} style={{ background: 'transparent', border: `1px solid ${C.teal}`, borderRadius: 10, padding: '9px 18px', color: C.teal, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.tealLight} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              Export Report
            </button>
          </div>
        </div>

        <div className="po-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={s.label} className="po-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', animationDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'auto', marginBottom: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead><tr>
              {['Employee', 'Dept', 'Basic', 'HRA', 'Allow.', 'PF', 'Tax', 'Net Salary', 'Status', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {EMPS.length === 0 && <tr><td colSpan={10} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>No employees found</td></tr>}
              {EMPS.map((e, i) => {
                const sc = ST_C[e.status] || C.muted;
                return (
                  <tr key={e.id} className="po-row" style={{ background: i % 2 ? C.surfaceHover : 'transparent', transition: 'background .15s' }}>
                    <td style={{ ...td, fontWeight: 500 }}>{e.name}</td>
                    <td style={{ ...td, color: C.muted, fontSize: 12 }}>{e.department}</td>
                    <td style={td}>{fmt(e.basicSalary)}</td>
                    <td style={td}>{fmt(e.hra)}</td>
                    <td style={td}>{fmt(e.allowances)}</td>
                    <td style={{ ...td, color: C.danger }}>-{fmt(e.pfDeduction)}</td>
                    <td style={{ ...td, color: C.danger }}>-{fmt(e.professionalTax)}</td>
                    <td style={{ ...td, fontWeight: 600, color: C.teal }}>{fmt(e.netSalary)}</td>
                    <td style={td}><span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${sc}18`, color: sc }}>{e.status}</span></td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="po-abtn" title="View Payslip" onClick={() => setModal(e)} onMouseEnter={ev => ev.currentTarget.style.background = `${C.cyan}18`} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}><EyeIco /></button>
                        <button className="po-abtn" title="Download" onClick={() => handleDownload(e)} onMouseEnter={ev => ev.currentTarget.style.background = C.tealLight} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}><DlIco /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {EMPS.length > 0 && <tr style={{ background: C.bg }}>
                <td style={{ ...td, fontWeight: 700 }} colSpan={2}>TOTAL</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmt(EMPS.reduce((a, e) => a + e.basicSalary, 0))}</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmt(EMPS.reduce((a, e) => a + e.hra, 0))}</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmt(EMPS.reduce((a, e) => a + e.allowances, 0))}</td>
                <td style={{ ...td, fontWeight: 700, color: C.danger }}>-{fmt(EMPS.reduce((a, e) => a + e.pfDeduction, 0))}</td>
                <td style={{ ...td, fontWeight: 700, color: C.danger }}>-{fmt(EMPS.reduce((a, e) => a + e.professionalTax, 0))}</td>
                <td style={{ ...td, fontWeight: 700, color: C.teal }}>{fmt(totNet)}</td>
                <td style={td}></td><td style={td}></td>
              </tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYSLIP MODAL */}
      {modal && (
        <div className="po-overlay" onClick={() => setModal(null)}>
          <div className="po-modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="po-noprint" onClick={() => setModal(null)} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }}><XIco /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg,${C.teal},${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EmPay</div>
                <div style={{ fontSize: 10, color: C.muted }}>Smart HR Management System</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.accent, letterSpacing: '.06em' }}>PAYSLIP</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, fontSize: 12 }}>
              {[['Name', modal.name], ['Department', modal.department], ['Pay Period', month], ['Status', modal.status]].map(([k, v]) => (
                <div key={k}><span style={{ color: C.muted }}>{k}: </span><span style={{ color: C.text, fontWeight: 500 }}>{v}</span></div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.teal, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Earnings</div>
                {[['Basic Salary', modal.basicSalary], ['HRA', modal.hra], ['Special Allowance', modal.allowances]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{k}</span><span style={{ color: C.text }}>{fmt(v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: C.text }}>Gross Total</span><span style={{ color: C.teal }}>{fmt(modal.basicSalary + modal.hra + modal.allowances)}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.danger, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Deductions</div>
                {[['PF (12%)', modal.pfDeduction], ['Professional Tax', modal.professionalTax]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{k}</span><span style={{ color: C.danger }}>-{fmt(v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: C.text }}>Total Deductions</span><span style={{ color: C.danger }}>-{fmt(modal.pfDeduction + modal.professionalTax)}</span>
                </div>
              </div>
            </div>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Net Pay</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.teal }}>{fmt(modal.netSalary)}</div>
              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 4 }}>In Words: {numWords(Math.max(0, modal.netSalary))}</div>
            </div>
            <div className="po-noprint" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => window.print()} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 18px', color: C.text, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>Print</button>
              <button onClick={() => handleDownload(modal)} style={{ background: C.teal, border: 'none', borderRadius: 10, padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DlIco color="#fff" /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYRUN MODAL */}
      {payrun && (
        <div className="po-overlay" onClick={() => setPayrun(false)}>
          <div className="po-modal" style={{ maxWidth: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div onClick={() => setPayrun(false)} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }}><XIco /></div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${C.teal}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>Generate Payrun</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Process salaries for <strong style={{ color: C.text }}>{month}</strong></p>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>Total Payout</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.teal }}>{fmt(totNet)}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{EMPS.length} employees</div>
            </div>
            <p style={{ fontSize: 11, color: C.warning, marginBottom: 20 }}>⚠ This will process salaries for all employees</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setPayrun(false)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 22px', color: C.text, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>Cancel</button>
              <button onClick={handlePayrun} disabled={isCreatingPayrun} style={{ background: C.teal, border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', opacity: isCreatingPayrun ? 0.6 : 1 }}>{isCreatingPayrun ? 'Processing...' : 'Confirm & Generate'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
