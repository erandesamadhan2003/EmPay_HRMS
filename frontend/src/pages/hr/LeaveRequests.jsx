import React, { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useTimeOffRequests, useTimeOffRequestMutations } from '../../hooks';

const C = {
  bg: '#0F172A', surface: '#1E293B', surfaceHover: '#334155',
  primary: '#14B8A6', secondary: '#8B5CF6',
  danger: '#EF4444', warning: '#F59E0B',
  text: '#F8FAFC', muted: '#94A3B8', border: '#334155',
  font: '"Poppins", sans-serif'
};
const ST_C = { pending: C.warning, approved: C.primary, rejected: C.danger, cancelled: C.muted };
const InputBase = { padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '13px', fontFamily: C.font, outline: 'none', minWidth: '140px' };

export default function LeaveRequests() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState({ open: false, type: '', data: null });
  const [comment, setComment] = useState('');
  const itemsPerPage = 8;

  const { data: reqData, isLoading } = useTimeOffRequests();
  const { approveRequest, rejectRequest, isApproving, isRejecting } = useTimeOffRequestMutations();

  const rawReqs = reqData?.data?.items ?? reqData?.data ?? reqData ?? [];
  const requests = (Array.isArray(rawReqs) ? rawReqs : []).map(l => ({
    id: l.id,
    employeeName: l.employee?.name || 'Employee',
    loginId: l.employee?.loginId || '—',
    leaveType: l.leaveType || 'Leave',
    fromDate: l.startDate || '',
    toDate: l.endDate || '',
    days: l.daysRequested || 1,
    reason: l.reason || '',
    status: l.status || 'pending',
    appliedOn: l.createdAt || '',
  })).sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

  const filtered = requests.filter(r => {
    if (statusFilter !== 'All' && r.status !== statusFilter.toLowerCase()) return false;
    if (typeFilter !== 'All' && r.leaveType !== typeFilter) return false;
    if (search && !r.employeeName.toLowerCase().includes(search.toLowerCase()) && !r.loginId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const pending  = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  const openModal = (type, data) => { setModal({ open: true, type, data }); setComment(''); };
  const closeModal = () => { setModal({ open: false, type: '', data: null }); setComment(''); };

  const handleAction = async () => {
    if (modal.type === 'reject' && !comment.trim()) return;
    try {
      if (modal.type === 'approve') await approveRequest({ id: modal.data.id, data: { reviewerNote: comment } });
      else await rejectRequest({ id: modal.data.id, data: { reason: comment } });
      closeModal();
    } catch (err) { console.error('Action failed:', err); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
  const th = { padding: '14px 16px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${C.border}`, textAlign: 'left', whiteSpace: 'nowrap', background: C.bg };
  const td = { padding: '13px 16px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

  return (
    <MainLayout role="hr" pageTitle="Leave Requests">
      <style>{`
        @keyframes lrFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .lr-anim { animation: lrFadeIn .35s ease-out both; }
        .lr-row:hover { background: ${C.surfaceHover} !important; }
        .lr-abtn { padding: 6px 14px; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: ${C.font}; transition: all .2s; }
        .lr-abtn:hover { transform: translateY(-1px); }
        .lr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.72); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .lr-modal { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px; padding: 28px; width: 90%; max-width: 460px; position: relative; font-family: ${C.font}; }
      `}</style>

      <div style={{ padding: '24px', fontFamily: C.font, color: C.text, maxWidth: 1400, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Leave Requests</h1>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Review, approve or reject employee leave requests</div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[['Total', requests.length, C.secondary], ['Pending', pending, C.warning], ['Approved', approved, C.primary], ['Rejected', rejected, C.danger]].map(([label, val, color]) => (
            <div key={label} className="lr-anim" style={{ background: C.surface, borderRadius: 12, padding: '18px 20px', border: `1px solid ${C.border}` }}>
              <div style={{ color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</div>
              <div style={{ color, fontSize: 28, fontWeight: 600 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <input type="text" placeholder="Search name or ID..." style={{ ...InputBase, flex: '1 1 180px' }} value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          <select style={InputBase} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
            <option value="All">All Types</option>
            {['Annual Leave','Sick Leave','Personal Leave','Emergency Leave'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={InputBase} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            {['All','pending','approved','rejected','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>

        {/* TABLE */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
              <thead>
                <tr>{['Employee','Type','Dates','Days','Reason','Status','Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {paginated.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>No leave requests found.</td></tr>}
                {paginated.map((r, i) => {
                  const sc = ST_C[r.status] || C.muted;
                  return (
                    <tr key={r.id} className="lr-row" style={{ background: i % 2 ? C.surfaceHover : 'transparent', transition: 'background .15s' }}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${C.primary}22`, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{r.employeeName[0]}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{r.employeeName}</div>
                            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{r.loginId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={td}>{r.leaveType}</td>
                      <td style={{ ...td, color: C.muted }}>{fmtDate(r.fromDate)} – {fmtDate(r.toDate)}</td>
                      <td style={td}>{r.days}</td>
                      <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', color: C.muted }}>{r.reason || '—'}</td>
                      <td style={td}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${sc}18`, color: sc, textTransform: 'capitalize' }}>{r.status}</span>
                      </td>
                      <td style={td}>
                        {r.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="lr-abtn" onClick={() => openModal('approve', r)} disabled={isApproving||isRejecting} style={{ background: C.primary, color: '#fff' }}>Approve</button>
                            <button className="lr-abtn" onClick={() => openModal('reject', r)} disabled={isApproving||isRejecting} style={{ background: 'transparent', border: `1px solid ${C.danger}`, color: C.danger }}>Reject</button>
                          </div>
                        ) : <span style={{ fontSize: 11, color: C.muted }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {filtered.length > itemsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: C.muted }}>Showing {(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage, filtered.length)} of {filtered.length}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1} style={{ padding: '8px 16px', background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, cursor: 'pointer', opacity: currentPage===1?0.5:1 }}>Prev</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setCurrentPage(p)} style={{ padding:'8px 14px', background: currentPage===p?C.primary:C.surface, border:`1px solid ${currentPage===p?C.primary:C.border}`, color: currentPage===p?'#fff':C.text, borderRadius:8, cursor:'pointer' }}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages} style={{ padding:'8px 16px', background:C.surface, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, cursor:'pointer', opacity:currentPage===totalPages?0.5:1 }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* APPROVE / REJECT MODAL */}
      {modal.open && (
        <div className="lr-overlay" onClick={closeModal}>
          <div className="lr-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: modal.type==='approve'?C.primary:C.danger, margin: '0 0 8px' }}>
              {modal.type==='approve' ? '✓ Approve Leave' : '✕ Reject Leave'}
            </h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              {modal.type==='approve'
                ? `Approving ${modal.data?.days}-day ${modal.data?.leaveType} for ${modal.data?.employeeName}.`
                : `Please provide a reason for rejecting ${modal.data?.employeeName}'s request.`}
            </p>
            <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Reviewer Note {modal.type==='reject' && <span style={{color:C.danger}}>*</span>}
            </label>
            <textarea rows={3} value={comment} onChange={e=>setComment(e.target.value)}
              placeholder={modal.type==='approve' ? 'Optional note...' : 'Reason for rejection (required)...'}
              style={{ width:'100%', background:C.surfaceHover, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:C.text, fontSize:13, outline:'none', resize:'vertical', marginBottom:20, boxSizing:'border-box', fontFamily:C.font }}
            />
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={closeModal} style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 20px', color:C.text, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAction} disabled={isApproving||isRejecting||(modal.type==='reject'&&!comment.trim())}
                style={{ background:modal.type==='approve'?C.primary:C.danger, border:'none', borderRadius:10, padding:'10px 20px', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:(isApproving||isRejecting)?0.6:1 }}>
                {isApproving||isRejecting ? 'Processing...' : modal.type==='approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
