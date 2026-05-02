import { useState } from 'react';
import { useMyTimeOffRequests, useMyTimeOffAllocations, useTimeOffRequestMutations } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#0D9488', accentLight: 'rgba(13,148,136,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const STATUS_STYLES = {
  pending:  { bg: `${C.warning}22`, color: C.warning },
  approved: { bg: `${C.teal}22`, color: C.teal },
  rejected: { bg: `${C.danger}22`, color: C.danger },
  cancelled: { bg: `${C.muted}22`, color: C.muted },
};

const LEAVE_COLORS = {
  paid_time_off: C.teal,
  sick_leave: C.danger,
  unpaid_leave: C.warning,
};

const Styles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes lvFadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    .lv-card { animation: lvFadeUp .4s ease-out both; transition: transform .25s, box-shadow .25s; }
    .lv-card:hover { transform: translateY(-3px); }
    .lv-row:hover { background: ${C.surfaceHover} !important; }
    @media(max-width:767px) { .lv-alloc { grid-template-columns: 1fr !important; } }
  `}} />
);

const PAGE_SIZE = 10;

export default function MyLeavesView() {
  const { data: allocData, isLoading: allocLoading } = useMyTimeOffAllocations();
  const { data: reqData, isLoading: reqLoading, error, refetch } = useMyTimeOffRequests();
  const { cancelRequest, isCancelling } = useTimeOffRequestMutations();

  const [tab, setTab] = useState('requests');
  const [page, setPage] = useState(1);

  const rawAllocs = allocData?.data?.items ?? allocData?.data ?? allocData ?? [];
  const allocs = Array.isArray(rawAllocs) ? rawAllocs : [];

  const rawReqs = reqData?.data?.items ?? reqData?.data ?? reqData ?? [];
  const requests = Array.isArray(rawReqs) ? rawReqs : [];

  const paged = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(requests.length / PAGE_SIZE) || 1;

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try { await cancelRequest(id); refetch(); } catch (e) { console.error(e); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const formatType = (t) => (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const isLoading = allocLoading || reqLoading;
  if (isLoading) return <LoadingSpinner message="Loading leaves..." />;
  if (error) return <ErrorState message="Failed to load leaves" onRetry={refetch} />;

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <Styles />

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>My Leaves</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0', fontWeight: 300 }}>View your leave balances and request history</p>
      </div>

      {/* ALLOCATION CARDS */}
      <div className="lv-alloc" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {allocs.length > 0 ? allocs.map((a, i) => {
          const type = a.leave_type || a.leaveType || 'paid_time_off';
          const total = Number(a.total_days ?? a.totalDays ?? a.days ?? 0);
          const used = Number(a.used_days ?? a.usedDays ?? 0);
          const remaining = total - used;
          const pct = total > 0 ? (used / total) * 100 : 0;
          const color = LEAVE_COLORS[type] || C.accent;
          return (
            <div key={a.id || i} className="lv-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, animationDelay: `${i * 80}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatType(type)}</span>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: `${color}22`, color }}>{a.validity_start || a.validityStart ? 'Active' : 'N/A'}</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color, marginBottom: 4 }}>{remaining}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>of {total} days remaining</div>
              <div style={{ height: 6, borderRadius: 3, background: C.surfaceHover, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 10, color: C.muted }}>Used: {used}</span>
                <span style={{ fontSize: 10, color: C.muted }}>Balance: {remaining}</span>
              </div>
            </div>
          );
        }) : (
          [
            { type: 'Paid Time Off', total: 12, used: 0, color: C.teal },
            { type: 'Sick Leave', total: 6, used: 0, color: C.danger },
            { type: 'Unpaid Leave', total: 0, used: 0, color: C.warning },
          ].map((a, i) => (
            <div key={i} className="lv-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, animationDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>{a.type}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: a.color, marginBottom: 4 }}>{a.total - a.used}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>of {a.total} days remaining</div>
              <div style={{ height: 6, borderRadius: 3, background: C.surfaceHover }} />
              <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>No allocations assigned yet</div>
            </div>
          ))
        )}
      </div>

      {/* REQUEST HISTORY TABLE */}
      <div className="lv-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden', animationDelay: '250ms' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>Leave Request History</h3>
          <span style={{ fontSize: 12, color: C.muted }}>{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
        </div>

        {requests.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 13 }}>No leave requests found.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Leave Type', 'From', 'To', 'Days', 'Status', 'Reason', 'Action'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((req, i) => {
                    const type = req.leave_type || req.leaveType || '';
                    const status = req.status || 'pending';
                    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
                    const from = req.from_date || req.fromDate || req.start_date || req.startDate;
                    const to = req.to_date || req.toDate || req.end_date || req.endDate;
                    const days = req.days || req.total_days || 1;
                    return (
                      <tr key={req.id || i} className="lv-row" style={{ borderBottom: `1px solid ${C.border}`, transition: 'background .15s' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: LEAVE_COLORS[type] || C.text }}>{formatType(type)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>{formatDate(from)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>{formatDate(to)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{days}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 10, background: statusStyle.bg, color: statusStyle.color, textTransform: 'uppercase' }}>{status}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {status === 'pending' && (
                            <button onClick={() => handleCancel(req.id)} disabled={isCancelling} style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${C.danger}`, background: 'transparent', color: C.danger, fontSize: 11, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Cancel</button>
                          )}
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
    </div>
  );
}
