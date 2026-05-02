import { useState } from 'react';
import { usePayslips, usePayslipMutations, usePayrunMutations } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const fmt = v => '₹' + (v || 0).toLocaleString('en-IN');

const DlIco = ({color=C.teal}) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const XIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const EyeIco = ({color=C.cyan}) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

const numWords = (n) => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (n === 0) return 'Zero';
  let s = '';
  if (Math.floor(n / 100000) > 0) { s += a[Math.floor(n / 100000)] + ' Lakh '; n %= 100000; }
  if (Math.floor(n / 1000) > 0) { const t = Math.floor(n / 1000); s += (t < 20 ? a[t] : b[Math.floor(t / 10)] + (t % 10 ? ' ' + a[t % 10] : '')) + ' Thousand '; n %= 1000; }
  if (Math.floor(n / 100) > 0) { s += a[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
  if (n > 0) { if (n < 20) s += a[n]; else s += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ''); }
  return s.trim() + ' Only';
};

const Styles = () => <style dangerouslySetInnerHTML={{__html:`
  @keyframes pdFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .pd-card { animation: pdFade .4s ease-out both; }
  .pd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .pd-modal { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px; padding: 28px; width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto; position: relative; font-family: Poppins,sans-serif; }
  .pd-abtn { border: none; background: transparent; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all .2s; }
  .pd-abtn:hover { transform: scale(1.1); }
  @media print { .po-noprint { display: none !important; } }
`}}/>;

export default function PayrunDetail({ payrun, onBack }) {
  const [search, setSearch] = useState('');
  const { data: payslipsData, isLoading, error, refetch } = usePayslips({ payrun_id: payrun.id, payrunId: payrun.id, limit: 100, search });
  const { loadPayslipPdfBlob } = usePayslipMutations();
  const { validatePayrun, markPayrunPaid, isValidating, isMarkingPaid } = usePayrunMutations();
  const [modal, setModal] = useState(null);

  const rawPayslips = payslipsData?.data?.items ?? payslipsData?.data ?? payslipsData ?? [];
  const payslips = Array.isArray(rawPayslips) ? rawPayslips : [];

  const handleDownload = async (slip) => {
    try {
      if (loadPayslipPdfBlob) {
        const blob = await loadPayslipPdfBlob(slip.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `payslip_${slip.user?.name?.replace(/\s+/g, '_') || 'employee'}.pdf`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading payslips..." />;
  if (error) return <ErrorState message="Failed to load payslips" onRetry={refetch} />;

  const th = { padding: '12px 16px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${C.border}`, textAlign: 'left', whiteSpace: 'nowrap' };
  const td = { padding: '12px 16px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

  const periodLabel = new Date(payrun.periodStart || payrun.period_start).toLocaleString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <div className="pd-card" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Styles />

      {/* PAYRUN SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: 'uppercase', marginBottom: 6 }}>Pay Period</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{periodLabel}</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: 'uppercase', marginBottom: 6 }}>Total Net Payout</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.teal }}>{fmt(payrun.totalNet || payrun.total_net)}</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: 'uppercase', marginBottom: 6 }}>Total Employees</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.cyan }}>{payslips.length}</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {payrun.status === 'draft' && (
            <button onClick={() => { validatePayrun(payrun.id); onBack(); }} disabled={isValidating} style={{ width: '100%', background: C.warning, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Validate Payrun
            </button>
          )}
          {payrun.status === 'validated' && (
            <button onClick={() => { markPayrunPaid({ payrunId: payrun.id, data: {} }); onBack(); }} disabled={isMarkingPaid} style={{ width: '100%', background: C.teal, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Mark as Paid
            </button>
          )}
          {payrun.status === 'paid' && (
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.teal }}>✓ Paid</div>
          )}
          {payrun.status === 'cancelled' && (
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.danger }}>Cancelled</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>Payslips</h3>
        <input 
          type="text" 
          placeholder="Search employee..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none', width: 220 }}
        />
      </div>

      {/* TABLE */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              {['Employee', 'Payable Days', 'Gross', 'Deductions', 'Net Salary', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>No payslips found.</td></tr>}
            {payslips.map((slip, i) => (
              <tr key={slip.id} style={{ background: i % 2 ? C.surfaceHover : 'transparent', transition: 'background .15s' }}>
                <td style={{ ...td, fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${C.teal}22`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                      {slip.user?.name?.[0] || 'E'}
                    </div>
                    <div>
                      <div style={{ color: C.text }}>{slip.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{slip.user?.loginId || slip.user?.login_id || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={td}>{slip.payableDays || slip.payable_days || 0}</td>
                <td style={td}>{fmt(slip.grossSalary || slip.gross_salary || slip.gross)}</td>
                <td style={{ ...td, color: C.danger }}>-{fmt(slip.totalDeductions || slip.total_deductions)}</td>
                <td style={{ ...td, color: C.teal, fontWeight: 600 }}>{fmt(slip.netSalary || slip.net_salary || slip.net)}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="pd-abtn" title="View Details" onClick={() => setModal(slip)} style={{ color: C.cyan }}><EyeIco /></button>
                    <button className="pd-abtn" title="Download PDF" onClick={() => handleDownload(slip)} style={{ color: C.teal }}><DlIco /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAYSLIP MODAL */}
      {modal && (
        <div className="pd-overlay" onClick={() => setModal(null)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="po-noprint" onClick={() => setModal(null)} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }}><XIco /></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg, ${C.teal}, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EmPay</div>
                <div style={{ fontSize: 10, color: C.muted }}>Smart HR Management System</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.accent, letterSpacing: '.06em' }}>PAYSLIP</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, fontSize: 12 }}>
              <div><span style={{ color: C.muted }}>Employee: </span><span style={{ color: C.text, fontWeight: 500 }}>{modal.user?.name}</span></div>
              <div><span style={{ color: C.muted }}>Employee ID: </span><span style={{ color: C.text, fontWeight: 500 }}>{modal.user?.loginId || modal.user?.login_id}</span></div>
              <div><span style={{ color: C.muted }}>Pay Period: </span><span style={{ color: C.text, fontWeight: 500 }}>{periodLabel}</span></div>
              <div><span style={{ color: C.muted }}>Payable Days: </span><span style={{ color: C.text, fontWeight: 500 }}>{modal.payableDays || modal.payable_days}</span></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.teal, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Earnings</div>
                {(modal.earnings || []).map((e, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{e.name || e.component}</span><span style={{ color: C.text }}>{fmt(e.amount)}</span>
                  </div>
                ))}
                {(!modal.earnings || modal.earnings.length === 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>Basic Salary</span><span style={{ color: C.text }}>{fmt(modal.grossSalary || modal.gross_salary || modal.gross)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: C.text }}>Gross Total</span><span style={{ color: C.teal }}>{fmt(modal.grossSalary || modal.gross_salary || modal.gross)}</span>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.danger, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Deductions</div>
                {(modal.deductions || []).map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{d.name || d.component}</span><span style={{ color: C.danger }}>-{fmt(d.amount)}</span>
                  </div>
                ))}
                {(!modal.deductions || modal.deductions.length === 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>Total Deductions</span><span style={{ color: C.danger }}>-{fmt(modal.totalDeductions || modal.total_deductions)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: C.text }}>Total Deductions</span><span style={{ color: C.danger }}>-{fmt(modal.totalDeductions || modal.total_deductions)}</span>
                </div>
              </div>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Net Pay</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.teal }}>{fmt(modal.netSalary || modal.net_salary || modal.net)}</div>
              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 4 }}>In Words: {numWords(Math.max(0, modal.netSalary || modal.net_salary || modal.net || 0))}</div>
            </div>

            <div className="po-noprint" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => window.print()} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 18px', color: C.text, fontSize: 13, cursor: 'pointer' }}>Print</button>
              <button onClick={() => handleDownload(modal)} style={{ background: C.teal, border: 'none', borderRadius: 10, padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DlIco color="#fff" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
