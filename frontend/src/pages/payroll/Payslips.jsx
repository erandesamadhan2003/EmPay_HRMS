import { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { usePayslips } from '../../hooks';
import { payslipsService } from '../../services/payslips.service';
import { generatePayslipPdf } from '../../utils/pdfGenerator';
import { LoadingSpinner, ErrorState } from '../../components/admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const fmt = v => '₹' + (v || 0).toLocaleString('en-IN');

const DlIco = ({ color = C.teal }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;

const Styles = () => <style dangerouslySetInnerHTML={{
  __html: `
  @keyframes psFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .ps-card { animation: psFade .4s ease-out both; background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 14px; padding: 20px; transition: transform .25s, box-shadow .25s; }
  .ps-card:hover { transform: translateY(-3px); border-color: ${C.teal}; }
  .ps-abtn { background: ${C.tealLight}; border: none; border-radius: 8px; padding: 8px 16px; color: ${C.teal}; font-size: 13px; font-weight: 600; cursor: pointer; font-family: Poppins,sans-serif; display: flex; align-items: center; gap: 8px; transition: all .2s; }
  .ps-abtn:hover { background: ${C.teal}; color: #fff; }
  .ps-abtn:hover svg { stroke: #fff; }
`}} />;

export default function PayrollPayslips() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const { data: payslipsData, isLoading, error, refetch } = usePayslips({ search, limit: 50 });

  const rawPayslips = payslipsData?.data?.items ?? payslipsData?.data ?? payslipsData ?? [];
  const payslips = Array.isArray(rawPayslips) ? rawPayslips : [];

  const handleDownload = async (slip) => {
    try {
      setDownloadingId(slip.id);
      const res = await payslipsService.getById(slip.id);
      const fullData = res.data || res;
      generatePayslipPdf(fullData);
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <MainLayout role="payroll" pageTitle="All Payslips" userName={userName} userInitials={userInitials} notifCount={0}>
      <Styles />
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Payslips Directory</h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 4 }}>Search and download all generated payslips</p>
          </div>
          <div>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none', width: 260 }}
            />
          </div>
        </div>

        {isLoading && <LoadingSpinner message="Loading payslips..." />}
        {error && <ErrorState message="Failed to load payslips" onRetry={refetch} />}

        {!isLoading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {payslips.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: C.muted }}>No payslips match your search.</div>}

            {payslips.map((slip, i) => (
              <div key={slip.id} className="ps-card" style={{ animationDelay: `${i * 50}ms` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${C.teal}22`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                      {(slip.employeeName || slip.user?.name || 'E')[0] || 'E'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{slip.employeeName || slip.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{slip.employeeCode || slip.user?.loginId || slip.user?.login_id || '—'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: `${C.cyan}18`, color: C.cyan }}>
                    {new Date(slip.periodStart || slip.payrun?.periodStart || slip.payrun?.period_start || new Date()).toLocaleString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, background: C.bg, padding: 12, borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>Payable Days</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{slip.workedDays?.payableDays || slip.payableDays || slip.payable_days || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>Net Salary</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.teal }}>{fmt(slip.netSalary || slip.net_salary || slip.net)}</div>
                  </div>
                </div>

                <button 
                  className="ps-abtn" 
                  style={{ width: '100%', justifyContent: 'center', opacity: downloadingId === slip.id ? 0.7 : 1 }} 
                  onClick={() => handleDownload(slip)}
                  disabled={downloadingId === slip.id}
                >
                  {downloadingId === slip.id ? (
                    <>Generating PDF...</>
                  ) : (
                    <><DlIco color={C.teal} /> Download PDF</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
