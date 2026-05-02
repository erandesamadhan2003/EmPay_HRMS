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

const Styles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes psFadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    .ps-card { animation: psFadeUp .4s ease-out both; transition: transform .25s, box-shadow .25s; }
    .ps-card:hover { transform: translateY(-3px); }
    .ps-row:hover { background: ${C.surfaceHover} !important; }
  `}} />
);

const PAGE_SIZE = 10;

export default function PayslipsView() {
  const { data: psData, isLoading, error, refetch } = useMyPayslips();
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const rawSlips = psData?.data?.items ?? psData?.data ?? psData ?? [];
  const payslips = Array.isArray(rawSlips) ? rawSlips : [];

  const paged = payslips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(payslips.length / PAGE_SIZE) || 1;

  const formatCurrency = (v) => {
    const n = Number(v || 0);
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0 });
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
  const formatFullDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

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
            { label: 'Latest Net Salary', value: formatCurrency(payslips[0]?.net_salary || payslips[0]?.netSalary), color: C.teal },
            { label: 'Latest Gross', value: formatCurrency(payslips[0]?.gross_salary || payslips[0]?.grossSalary || payslips[0]?.total_earnings || payslips[0]?.totalEarnings), color: C.cyan },
            { label: 'Total Payslips', value: payslips.length, color: C.accent },
          ].map((s, i) => (
            <div key={s.label} className="ps-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, animationDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
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
                    {['Period', 'Gross Salary', 'Deductions', 'Net Salary', 'Status', 'Generated'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((ps, i) => {
                    const status = ps.status || 'draft';
                    const ss = STATUS_STYLES[status] || STATUS_STYLES.draft;
                    const gross = Number(ps.gross_salary || ps.grossSalary || ps.total_earnings || ps.totalEarnings || 0);
                    const ded = Number(ps.total_deductions || ps.totalDeductions || 0);
                    const net = Number(ps.net_salary || ps.netSalary || 0);
                    const period = ps.period_start || ps.periodStart;
                    return (
                      <tr key={ps.id || i} className="ps-row" style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background .15s' }} onClick={() => setExpanded(expanded === ps.id ? null : ps.id)}>
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{formatDate(period)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: C.teal, fontWeight: 500 }}>{formatCurrency(gross)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: C.danger }}>{formatCurrency(ded)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: C.text }}>{formatCurrency(net)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 10, background: ss.bg, color: ss.color, textTransform: 'uppercase' }}>{status}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{formatFullDate(ps.created_at || ps.createdAt)}</td>
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
    </div>
  );
}
