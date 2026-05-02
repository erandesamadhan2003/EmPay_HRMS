import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import LeaveRequestCard from '../../components/hr/LeaveRequestCard';
import LeaveRequestModal from '../../components/hr/LeaveRequestModal';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  primary: '#14B8A6',
  primaryHover: '#0D9488',
  secondary: '#8B5CF6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#06B6D4',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#334155',
  font: '"Poppins", sans-serif'
};

const InputBase = {
  padding: '10px 12px',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: '8px',
  color: C.text,
  fontSize: '13px',
  fontFamily: C.font,
  outline: 'none',
  minWidth: '140px'
};

import { useTimeOffRequests } from '../../hooks';

export default function LeaveRequests() {

  const [selectedReq, setSelectedReq] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data: reqData, isLoading } = useTimeOffRequests();

  const rawReqs = reqData?.data?.items ?? reqData?.data ?? reqData ?? [];
  const requests = (Array.isArray(rawReqs) ? rawReqs : []).map(l => ({
    id: l.id,
    employeeId: l.employee?.id,
    employeeName: l.employee?.name || 'Employee',
    department: l.employee?.profile?.department?.name || 'Unassigned',
    loginId: l.employee?.loginId || '—',
    role: l.employee?.profile?.job_title || 'Staff',
    leaveType: l.leaveType || 'Leave',
    fromDate: l.startDate || '',
    toDate: l.endDate || '',
    days: l.daysRequested || 1,
    reason: l.reason || '',
    status: l.status || 'pending',
    appliedOn: l.createdAt || ''
  })).sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

  // Sync tab with statusFilter
  const handleTabClick = (tab) => {
    setStatusFilter(tab);
    setCurrentPage(1);
  };

  // Filter logic
  const filtered = requests.filter(r => {
    if (statusFilter !== 'All' && r.status !== statusFilter.toLowerCase()) return false;
    if (typeFilter !== 'All' && r.leaveType !== typeFilter) return false;
    if (search && !r.employeeName.toLowerCase().includes(search.toLowerCase()) && !r.loginId.toLowerCase().includes(search.toLowerCase())) return false;
    if (fromDate && new Date(r.fromDate) < new Date(fromDate)) return false;
    if (toDate && new Date(r.toDate) > new Date(toDate)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Summary counts
  const totalReqs = requests.length;
  const pendingReqs = requests.filter(r => r.status.toLowerCase() === 'pending').length;
  const approvedReqs = requests.filter(r => r.status.toLowerCase() === 'approved').length;
  const rejectedReqs = requests.filter(r => r.status.toLowerCase() === 'rejected').length;

  if (isLoading) {
    return (
      <MainLayout role="hr" pageTitle="Leave Requests">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: C.muted, fontFamily: C.font }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div>Loading Leave Requests...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="hr" pageTitle="Leave Requests">
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal {
          animation: fadeInScale 0.25s ease-out forwards;
        }
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div style={{ padding: '24px', fontFamily: C.font, color: C.text, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* TOP BAR & FILTERS */}
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Leave Requests</h1>
          <div style={{ fontSize: '14px', color: C.muted, marginTop: '4px', marginBottom: '24px' }}>Monitor all employee leave requests</div>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Search name or ID..." style={{ ...InputBase, flex: '1 1 200px' }} value={search} onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} />
            <select style={InputBase} value={typeFilter} onChange={e => {setTypeFilter(e.target.value); setCurrentPage(1);}}>
              <option value="All">All Leave Types</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
            <select style={InputBase} value={statusFilter} onChange={e => {setStatusFilter(e.target.value); setCurrentPage(1);}}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="date" style={InputBase} value={fromDate} onChange={e => {setFromDate(e.target.value); setCurrentPage(1);}} />
              <span style={{ color: C.muted }}>to</span>
              <input type="date" style={InputBase} value={toDate} onChange={e => {setToDate(e.target.value); setCurrentPage(1);}} />
            </div>
          </div>
        </div>

        {/* INFO BANNER */}
        <div style={{ padding: '16px 20px', background: `${C.primary}10`, borderLeft: `3px solid ${C.primary}`, borderRadius: '0 8px 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '20px' }}>ℹ️</div>
          <div style={{ color: C.text, fontSize: '14px', fontWeight: '400' }}>
            <span style={{ fontWeight: '500' }}>As HR Officer, you can monitor leave requests.</span> Approvals and rejections are handled exclusively by the Payroll Officer.
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Total Requests</div>
            <div style={{ color: C.secondary, fontSize: '28px', fontWeight: '600' }}>{totalReqs}</div>
          </div>
          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Pending</div>
            <div style={{ color: C.warning, fontSize: '28px', fontWeight: '600' }}>{pendingReqs}</div>
          </div>
          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Approved</div>
            <div style={{ color: C.primary, fontSize: '28px', fontWeight: '600' }}>{approvedReqs}</div>
          </div>
          <div style={{ background: C.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ color: C.muted, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Rejected</div>
            <div style={{ color: C.danger, fontSize: '28px', fontWeight: '600' }}>{rejectedReqs}</div>
          </div>
        </div>

        {/* TAB FILTER BAR */}
        <div style={{ display: 'flex', gap: '32px', borderBottom: `1px solid ${C.border}`, paddingBottom: '0' }}>
          {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
            <div key={tab} onClick={() => handleTabClick(tab)} style={{ 
              paddingBottom: '12px', 
              color: statusFilter === tab ? C.primary : C.muted,
              borderBottom: statusFilter === tab ? `2px solid ${C.primary}` : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}>
              {tab}
            </div>
          ))}
        </div>

        {/* REQUESTS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {paginated.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: C.muted, background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}` }}>
              No leave requests found matching your filters.
            </div>
          ) : (
            paginated.map(req => (
              <LeaveRequestCard key={req.id} request={req} onViewDetails={() => setSelectedReq(req)} />
            ))
          )}
        </div>

        {/* PAGINATION */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ fontSize: '13px', color: C.muted }}>
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} requests
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >Prev</button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)} style={{ 
                  padding: '8px 14px', 
                  background: currentPage === p ? C.primary : C.surface, 
                  border: `1px solid ${currentPage === p ? C.primary : C.border}`, 
                  color: currentPage === p ? '#fff' : C.text, 
                  borderRadius: '8px', cursor: 'pointer' 
                }}>
                  {p}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >Next</button>
            </div>
          </div>
        )}

      </div>

      <LeaveRequestModal request={selectedReq} onClose={() => setSelectedReq(null)} />

    </MainLayout>
  );
}
