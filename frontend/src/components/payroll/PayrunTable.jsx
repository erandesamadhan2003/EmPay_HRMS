import { useState } from 'react';
import { usePayruns, usePayrunMutations } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const ST_C = {
  draft: C.muted,
  validated: C.warning,
  paid: C.teal,
  cancelled: C.danger,
};

const fmt = v => '₹' + (v || 0).toLocaleString('en-IN');
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const XIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const CheckIco = ({color="#fff"}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

const Styles = () => <style dangerouslySetInnerHTML={{__html:`
  @keyframes prFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .pr-card { animation: prFade .4s ease-out both; }
  .pr-row { transition: background .15s; cursor: pointer; }
  .pr-row:hover { background: ${C.surfaceHover} !important; }
  .pr-abtn { border: none; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: Poppins,sans-serif; transition: all .2s; }
  .pr-abtn:hover { transform: translateY(-1px); }
  .pr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .pr-modal { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px; padding: 28px; width: 90%; max-width: 480px; position: relative; font-family: Poppins,sans-serif; }
`}}/>;

export default function PayrunTable({ onSelectPayrun }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState('All');
  
  const { data: payrunsData, isLoading, error, refetch } = usePayruns({ year, status: status === 'All' ? undefined : status.toLowerCase() });
  const { createPayrun, validatePayrun, markPayrunPaid, cancelPayrun, isCreating, isValidating, isMarkingPaid } = usePayrunMutations();
  
  const [generateModal, setGenerateModal] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().getMonth());
  const [genYear, setGenYear] = useState(new Date().getFullYear());

  const rawPayruns = payrunsData?.data?.items ?? payrunsData?.data ?? payrunsData ?? [];
  const payruns = Array.isArray(rawPayruns) ? rawPayruns : [];

  const handleGenerate = async () => {
    try {
      const periodStart = `${genYear}-${String(genMonth + 1).padStart(2, '0')}-01`;
      const periodEnd = new Date(genYear, genMonth + 1, 0).toISOString().slice(0, 10);
      await createPayrun({ periodStart, periodEnd });
      setGenerateModal(false);
    } catch (err) {
      console.error('Generate failed:', err);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading payruns..." />;
  if (error) return <ErrorState message="Failed to load payruns" onRetry={refetch} />;

  const th = { padding: '12px 16px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${C.border}`, textAlign: 'left', whiteSpace: 'nowrap' };
  const td = { padding: '12px 16px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

  return (
    <div className="pr-card" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Styles />
      
      {/* HEADER & FILTERS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={year} onChange={e=>setYear(e.target.value)} style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', color: C.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', color: C.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {['All', 'Draft', 'Validated', 'Paid', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={() => setGenerateModal(true)} style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
          Generate Payrun
        </button>
      </div>

      {/* TABLE */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              {['Period', 'Gross Total', 'Deductions', 'Net Payout', 'Status', 'Generated On', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {payruns.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>No payruns found for the selected filters.</td></tr>}
            {payruns.map((p, i) => {
              const sc = ST_C[p.status?.toLowerCase()] || C.muted;
              return (
                <tr key={p.id} className="pr-row" style={{ background: i % 2 ? C.surfaceHover : 'transparent' }} onClick={() => onSelectPayrun(p)}>
                  <td style={{ ...td, fontWeight: 600 }}>
                    {new Date(p.periodStart || p.period_start).toLocaleString('en-IN', { month: 'short', year: 'numeric' })}
                  </td>
                  <td style={td}>{fmt(p.totalCost || p.total_cost)}</td>
                  <td style={{ ...td, color: C.danger }}>-{fmt(0)}</td>
                  <td style={{ ...td, color: C.teal, fontWeight: 600 }}>{fmt(p.totalCost || p.total_cost)}</td>
                  <td style={td}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: `${sc}18`, color: sc, textTransform: 'capitalize' }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ ...td, color: C.muted, fontSize: 12 }}>{fmtDate(p.createdAt || p.created_at)}</td>
                  <td style={td} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {p.status === 'draft' && (
                        <button className="pr-abtn" onClick={() => validatePayrun(p.id)} disabled={isValidating} style={{ background: C.warning, color: '#fff' }}>Validate</button>
                      )}
                      {p.status === 'validated' && (
                        <button className="pr-abtn" onClick={() => markPayrunPaid({ payrunId: p.id, data: {} })} disabled={isMarkingPaid} style={{ background: C.teal, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckIco /> Pay
                        </button>
                      )}
                      {p.status === 'draft' && (
                        <button className="pr-abtn" onClick={() => cancelPayrun(p.id)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted }}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GENERATE MODAL */}
      {generateModal && (
        <div className="pr-overlay" onClick={() => setGenerateModal(false)}>
          <div className="pr-modal" onClick={e => e.stopPropagation()}>
            <div onClick={() => setGenerateModal(false)} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }}><XIco /></div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 16px' }}>Generate Payrun</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Month</label>
                <select value={genMonth} onChange={e=>setGenMonth(Number(e.target.value))} style={{ width: '100%', background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none' }}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Year</label>
                <select value={genYear} onChange={e=>setGenYear(Number(e.target.value))} style={{ width: '100%', background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none' }}>
                  {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setGenerateModal(false)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', color: C.text, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleGenerate} disabled={isCreating} style={{ background: C.teal, border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isCreating ? 0.6 : 1 }}>
                {isCreating ? 'Processing...' : 'Generate Payrun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
