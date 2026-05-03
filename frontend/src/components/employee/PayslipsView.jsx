import { useState } from 'react';
import { useMyPayslips } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#0D9488', accentLight: 'rgba(13,148,136,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const STATUS_STYLES = {
  draft:     { bg: `${C.warning}22`, color: C.warning },
  validated: { bg: `${C.cyan}22`, color: C.cyan },
  paid:      { bg: `${C.teal}22`, color: C.teal },
  cancelled: { bg: `${C.muted}22`, color: C.muted },
};

const numWords = (n) => {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (n === 0) return 'Zero';
  let s = '';
  if (Math.floor(n/100000)>0){s+=a[Math.floor(n/100000)]+' Lakh ';n%=100000;}
  if (Math.floor(n/1000)>0){const t=Math.floor(n/1000);s+=(t<20?a[t]:b[Math.floor(t/10)]+(t%10?' '+a[t%10]:'')+' ');s+='Thousand ';n%=1000;}
  if (Math.floor(n/100)>0){s+=a[Math.floor(n/100)]+' Hundred ';n%=100;}
  if (n>0){if(n<20)s+=a[n];else s+=b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'');}
  return s.trim()+' Only';
};

const XIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const DlIco = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

const Styles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes psFadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    @keyframes psModal { from { opacity:0; transform:scale(.93) } to { opacity:1; transform:scale(1) } }
    @keyframes psOverlay { from { opacity:0 } to { opacity:1 } }
    .ps-card { animation: psFadeUp .4s ease-out both; transition: transform .25s, box-shadow .25s; }
    .ps-card:hover { transform: translateY(-3px); }
    .ps-row:hover { background: ${C.surfaceHover} !important; cursor: pointer; }
    .ps-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.72); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: psOverlay .2s; }
    .ps-modal { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px; padding: 28px; width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto; animation: psModal .3s; position: relative; font-family: Poppins, sans-serif; }
    .ps-abtn { border:none; background:transparent; cursor:pointer; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:all .2s; color:${C.teal}; }
    .ps-abtn:hover { background: ${C.tealLight}; transform: scale(1.1); }
    @media print { .ps-noprint { display:none!important } }
  `}} />
);

const PAGE_SIZE = 10;
const fmt = v => '₹' + Math.max(0, Number(v || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0 });
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
const fmtFull = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function PayslipsView() {
  const { data: psData, isLoading, error, refetch } = useMyPayslips();
  const [page, setPage] = useState(1);
  const [slipModal, setSlipModal] = useState(null);

  const rawSlips = psData?.data?.items ?? psData?.data ?? psData ?? [];
  const payslips = Array.isArray(rawSlips) ? rawSlips : [];

  const paged = payslips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(payslips.length / PAGE_SIZE) || 1;

  const handleDownload = (ps) => {
    setSlipModal(ps);
    setTimeout(() => window.print(), 150);
  };

  if (isLoading) return <LoadingSpinner message="Loading payslips..." />;
  if (error) return <ErrorState message="Failed to load payslips" onRetry={refetch} />;

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <Styles />

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>My Payslips</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0', fontWeight: 300 }}>View and download your monthly salary slips</p>
      </div>

      {/* SUMMARY CARDS */}
      {payslips.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Latest Net Salary', value: fmt(payslips[0]?.net_salary || payslips[0]?.netSalary), color: C.teal },
            { label: 'Latest Gross', value: fmt(payslips[0]?.gross_salary || payslips[0]?.grossSalary || payslips[0]?.total_earnings), color: C.cyan },
            { label: 'Total Payslips', value: payslips.length, color: C.accent },
          ].map((s, i) => (
            <div key={s.label} className="ps-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, animationDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE */}
      <div className="ps-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden', animationDelay: '250ms' }}>
        {payslips.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.muted, fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            No payslips found yet. They will appear here once payroll is processed.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Period', 'Gross Salary', 'Deductions', 'Net Salary', 'Status', 'Generated', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((ps, i) => {
                    const status = ps.status || 'draft';
                    const ss = STATUS_STYLES[status] || STATUS_STYLES.draft;
                    const gross = Number(ps.gross_salary || ps.grossSalary || ps.total_earnings || 0);
                    const ded = Number(ps.total_deductions || ps.totalDeductions || 0);
                    const net = Number(ps.net_salary || ps.netSalary || 0);
                    const period = ps.period_start || ps.periodStart;
                    return (
                      <tr
                        key={ps.id || i}
                        className="ps-row"
                        style={{ borderBottom: `1px solid ${C.border}`, transition: 'background .15s' }}
                        onClick={() => setSlipModal(ps)}
                      >
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{fmtDate(period)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: C.teal, fontWeight: 500 }}>{fmt(gross)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: C.danger }}>{fmt(ded)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: C.text }}>{fmt(net)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 10, background: ss.bg, color: ss.color, textTransform: 'uppercase' }}>{status}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{fmtFull(ps.created_at || ps.createdAt)}</td>
                        <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                          <button
                            className="ps-abtn"
                            title="View & Download Payslip"
                            onClick={() => handleDownload(ps)}
                          >
                            <DlIco />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.muted }}>Page {page} of {totalPages}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: page === 1 ? C.muted : C.text, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: page === totalPages ? C.muted : C.text, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* PAYSLIP DETAIL MODAL */}
      {slipModal && (
        <div className="ps-overlay" onClick={() => setSlipModal(null)}>
          <div className="ps-modal" onClick={e => e.stopPropagation()}>
            <div className="ps-noprint" onClick={() => setSlipModal(null)} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }}><XIco /></div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg,${C.teal},${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EmPay</div>
                <div style={{ fontSize: 10, color: C.muted }}>Smart HR Management System</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.accent, letterSpacing: '.06em' }}>PAYSLIP</div>
            </div>

            {/* Employee Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, fontSize: 12 }}>
              {[
                ['Employee', slipModal.employee_name || slipModal.employeeName || '—'],
                ['Employee Code', slipModal.employee_code || slipModal.employeeCode || '—'],
                ['Department', slipModal.department || '—'],
                ['Pay Period', fmtDate(slipModal.period_start || slipModal.periodStart)],
                ['Status', slipModal.status || '—'],
                ['Pay Date', fmtFull(slipModal.pay_date || slipModal.payDate || slipModal.created_at)],
              ].map(([k, v]) => (
                <div key={k}><span style={{ color: C.muted }}>{k}: </span><span style={{ color: C.text, fontWeight: 500 }}>{v}</span></div>
              ))}
            </div>

            {/* Earnings & Deductions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.teal, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Earnings</div>
                {[
                  ['Basic Salary', slipModal.basic_salary],
                  ['HRA', slipModal.hra],
                  ['Special Allowance', slipModal.standard_allowance],
                  ['Leave Travel Allow.', slipModal.leave_travel_allowance],
                  ['Performance Bonus', slipModal.performance_bonus],
                ].map(([k, v]) => v != null && Number(v) > 0 ? (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{k}</span><span style={{ color: C.text }}>{fmt(v)}</span>
                  </div>
                ) : null)}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: C.text }}>Gross Total</span>
                  <span style={{ color: C.teal }}>{fmt(slipModal.gross_salary || slipModal.grossSalary)}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.danger, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Deductions</div>
                {[
                  ['PF (Employee)', slipModal.pf_employee],
                  ['Professional Tax', slipModal.professional_tax],
                  ['TDS', slipModal.tds_deduction],
                ].map(([k, v]) => v != null && Number(v) > 0 ? (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{k}</span><span style={{ color: C.danger }}>-{fmt(v)}</span>
                  </div>
                ) : null)}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: C.text }}>Total Deductions</span>
                  <span style={{ color: C.danger }}>-{fmt(slipModal.total_deductions || slipModal.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Net Pay</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.teal }}>{fmt(slipModal.net_salary || slipModal.netSalary)}</div>
              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 4 }}>
                In Words: {numWords(Math.max(0, Math.round(Number(slipModal.net_salary || slipModal.netSalary || 0))))}
              </div>
            </div>

            {/* Actions */}
            <div className="ps-noprint" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setSlipModal(null)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 20px', color: C.text, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Close</button>
              <button onClick={() => window.print()} style={{ background: C.teal, border: 'none', borderRadius: 10, padding: '9px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DlIco /> Print / Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
