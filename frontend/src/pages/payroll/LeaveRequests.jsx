import { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useTimeOffRequests, useTimeOffRequestMutations } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../../components/admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const ST_C = {
  pending: C.warning,
  approved: C.teal,
  rejected: C.danger,
  cancelled: C.muted,
};

const CheckIco = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIco = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const ModalXIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const Styles = () => <style dangerouslySetInnerHTML={{__html:`
  .lr-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px; padding: 24px; animation: lrFade .4s ease-out both; }
  .lr-row { transition: background .15s; }
  .lr-row:hover { background: ${C.surfaceHover} !important; }
  .lr-abtn { background: transparent; border: none; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; transition: all .2s; }
  .lr-abtn:hover { transform: scale(1.1); background: rgba(255,255,255,0.05); }
  @keyframes lrFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .lr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .lr-modal { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px; padding: 28px; width: 90%; max-width: 480px; position: relative; font-family: Poppins,sans-serif; }
  .lr-input { width: 100%; background: ${C.surfaceHover}; border: 1px solid ${C.border}; border-radius: 10px; padding: 10px 14px; color: ${C.text}; font-size: 13px; outline: none; transition: border-color .2s; margin-bottom: 16px; }
  .lr-input:focus { border-color: ${C.teal}; }
  .lr-label { font-size: 11px; color: ${C.muted}; text-transform: uppercase; letter-spacing: .04em; font-weight: 500; margin-bottom: 6px; display: block; }
`}}/>;

export default function LeaveRequests() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const [statusFilter, setStatusFilter] = useState('pending');
  const { data: requestsData, isLoading, error, refetch } = useTimeOffRequests({ status: statusFilter === 'all' ? undefined : statusFilter, limit: 100 });
  const { approveRequest, rejectRequest, isApproving, isRejecting } = useTimeOffRequestMutations();

  const [modal, setModal] = useState({ open: false, type: '', data: null });

  const rawReqs = requestsData?.data?.items ?? requestsData?.data ?? requestsData ?? [];
  const requests = Array.isArray(rawReqs) ? rawReqs : [];

  const handleAction = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const comment = fd.get('comment');

    try {
      if (modal.type === 'approve') {
        await approveRequest({ id: modal.data.id, data: { comment } });
      } else {
        await rejectRequest({ id: modal.data.id, data: { comment } });
      }
      setModal({ open: false, type: '', data: null });
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const th = { padding: '14px 16px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${C.border}`, textAlign: 'left', whiteSpace: 'nowrap' };
  const td = { padding: '14px 16px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

  return (
    <MainLayout role="payroll" pageTitle="Leave Requests" userName={userName} userInitials={userInitials}>
      <Styles />
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Leave Requests & Sync</h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 4 }}>Review pending leave requests for accurate payroll processing.</p>
          </div>
          <div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div className="lr-card" style={{ padding: 0, overflow: 'auto' }}>
          {isLoading && <LoadingSpinner message="Loading requests..." />}
          {error && <ErrorState message="Failed to load leave requests" onRetry={refetch} />}
          
          {!isLoading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={th}>Employee</th>
                  <th style={th}>Type</th>
                  <th style={th}>Dates</th>
                  <th style={th}>Days</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>No leave requests found for this filter.</td></tr>}
                {requests.map((r, i) => {
                  const sc = ST_C[r.status?.toLowerCase()] || C.muted;
                  return (
                    <tr key={r.id} className="lr-row" style={{ background: i % 2 ? C.surfaceHover : 'transparent' }}>
                      <td style={{ ...td, fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${C.cyan}22`, color: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                            {r.user?.name?.[0] || 'E'}
                          </div>
                          <div>{r.user?.name || 'Unknown'}</div>
                        </div>
                      </td>
                      <td style={td}>{r.timeOffType?.name || r.time_off_type?.name || 'Standard Leave'}</td>
                      <td style={td}>
                        {new Date(r.startDate || r.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        {' - '}
                        {new Date(r.endDate || r.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </td>
                      <td style={td}>{r.daysRequested || r.days_requested}</td>
                      <td style={td}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: `${sc}15`, color: sc, textTransform: 'capitalize' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={td}>
                        {r.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="lr-abtn" onClick={() => setModal({ open: true, type: 'approve', data: r })} title="Approve"><CheckIco /></button>
                            <button className="lr-abtn" onClick={() => setModal({ open: true, type: 'reject', data: r })} title="Reject"><XIco /></button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: C.muted }}>{r.reviewerComment || r.reviewer_comment || 'Processed'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL */}
        {modal.open && (
          <div className="lr-overlay" onClick={() => setModal({ open: false, type: '', data: null })}>
            <div className="lr-modal" onClick={e => e.stopPropagation()}>
              <div onClick={() => setModal({ open: false, type: '', data: null })} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }}><ModalXIco /></div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: modal.type === 'approve' ? C.teal : C.danger, margin: '0 0 8px' }}>
                {modal.type === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
                {modal.type === 'approve' 
                  ? `Approving this leave for ${modal.data?.user?.name} will sync with their payable days calculation.`
                  : `Rejecting this leave for ${modal.data?.user?.name}. Please provide a reason.`}
              </p>
              
              <form onSubmit={handleAction}>
                <label className="lr-label">Reviewer Comment {modal.type === 'reject' && '*'}</label>
                <textarea required={modal.type === 'reject'} name="comment" className="lr-input" rows="3" placeholder="Add a note..."></textarea>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" onClick={() => setModal({ open: false, type: '', data: null })} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', color: C.text, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isApproving || isRejecting} style={{ background: modal.type === 'approve' ? C.teal : C.danger, border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (isApproving || isRejecting) ? 0.6 : 1 }}>
                    {isApproving || isRejecting ? 'Processing...' : modal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
