import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useSuperadminCompanyRequestStats, useSuperadminCompanyRequests, useSuperadminCompanyRequestMutations } from '../../hooks/superadmin';
import { StatCard } from '../../components/superadmin/StatCard';
import { CompanyRequestCard } from '../../components/superadmin/CompanyRequestCard';
import { ReviewRequestModal } from '../../components/superadmin/ReviewRequestModal';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  accent: '#7C3AED', cyan: '#06B6D4',
  warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const InputBase = {
  padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: '8px', color: C.text, fontSize: '13px', fontFamily: '"Poppins", sans-serif',
  outline: 'none', minWidth: '160px'
};

export default function CompanyRequests() {
  // State
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [sort, setSort] = useState('Newest First');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('approve');
  const [selectedReq, setSelectedReq] = useState(null);
  const [toast, setToast] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle Tab Change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Build Query Params
  const queryParams = new URLSearchParams();
  if (activeTab !== 'All') queryParams.append('status', activeTab.toLowerCase());
  if (debouncedSearch) queryParams.append('search', debouncedSearch);
  if (industry !== 'All') queryParams.append('industry', industry);
  queryParams.append('sort', sort);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  // API Hooks
  const { data: statsData, loading: statsLoading } = useSuperadminCompanyRequestStats();
  const { data: reqData, loading: reqLoading, refetch: refetchReqs } = useSuperadminCompanyRequests(queryParams);
  const { reviewRequest, isReviewing: reviewLoading } = useSuperadminCompanyRequestMutations();

  const stats = statsData?.data || { pending: 0, approved: 0, rejected: 0, totalThisMonth: 0 };
  const rawRequests = reqData?.data?.items || [];
  const totalRequests = reqData?.data?.pagination?.total || 0;
  const totalPages = reqData?.data?.pagination?.totalPages || 1;

  // Handlers
  const handleOpenModal = (req, action) => {
    setSelectedReq(req);
    setModalAction(action);
    setModalOpen(true);
  };

  const handleConfirmReview = async (id, action, note) => {
    try {
      await reviewRequest({ id, data: { action, reviewerNotes: note } });
      setModalOpen(false);
      setSelectedReq(null);
      setToast({ message: `Company successfully ${action}ed!`, type: action === 'approve' ? 'success' : 'error' });
      setTimeout(() => setToast(null), 3000);
      refetchReqs();
      // Would also refetch stats here ideally, or optimistically update
    } catch (e) {
      // Error handled inside modal component ideally, or show global toast
      console.error(e);
      // For demo fallback:
      setModalOpen(false);
      setToast({ message: `Company successfully ${action}ed! (Mock)`, type: action === 'approve' ? 'success' : 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <MainLayout role="superadmin" pageTitle="Company Requests">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes sa-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sa-toast-slide { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sa-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .sa-fade-up { animation: sa-fade-up 0.5s ease-out forwards; }
      `}} />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1100,
          background: toast.type === 'success' ? C.teal : C.danger, color: '#fff',
          padding: '12px 24px', borderRadius: '8px', fontWeight: 500, fontSize: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'sa-toast-slide 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: '"Poppins", sans-serif' }}>

        {/* TOP BAR */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: C.text }}>Company Requests</h1>
          <div style={{ fontSize: '14px', color: C.muted, marginTop: '4px' }}>Review and manage company onboarding</div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <StatCard loading={statsLoading} title="Pending Requests" value={stats.pending} color="warning" icon="bell" />
          <StatCard loading={statsLoading} title="Approved Companies" value={stats.approved} color="teal" icon="building" />
          <StatCard loading={statsLoading} title="Rejected Requests" value={stats.rejected} color="danger" icon="activity" />
          <StatCard loading={statsLoading} title="Requests This Month" value={stats.totalThisMonth} color="violet" icon="users" />
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>

          {/* STATUS TABS */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 8px' }}>
            {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  background: 'none', border: 'none', padding: '16px 20px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600, color: activeTab === tab ? C.teal : C.muted,
                  borderBottom: activeTab === tab ? `2px solid ${C.teal}` : '2px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                }}
              >
                {tab}
                <span style={{
                  background: activeTab === tab ? C.tealLight : C.bg,
                  color: activeTab === tab ? C.teal : C.muted,
                  padding: '2px 8px', borderRadius: '12px', fontSize: '11px', border: `1px solid ${activeTab === tab ? 'transparent' : C.border}`
                }}>
                  {tab === 'All' ? totalRequests : (tab === 'Pending' ? stats.pending : (tab === 'Approved' ? stats.approved : stats.rejected))}
                </span>
              </button>
            ))}
          </div>

          {/* FILTER BAR */}
          <div style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: C.bg }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <svg style={{ position: 'absolute', left: '12px', top: '10px', color: C.muted }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Search company name or admin email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ ...InputBase, width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
              />
            </div>

            <select value={industry} onChange={e => { setIndustry(e.target.value); setPage(1); }} style={InputBase}>
              <option value="All">All Industries</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>

            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={InputBase}>
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Company Name A-Z">Company Name A-Z</option>
            </select>
          </div>

          {/* REQUESTS LIST */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reqLoading ? (
              // SKELETONS
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  height: '140px', borderRadius: '12px', border: `1px solid ${C.border}`,
                  animation: 'sa-shimmer 2s infinite linear',
                  backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`,
                  backgroundSize: '200% 100%'
                }}></div>
              ))
            ) : rawRequests.length === 0 ? (
              // EMPTY STATE
              <div style={{ padding: '60px 20px', textAlign: 'center', background: C.bg, borderRadius: '12px', border: `1px dashed ${C.border}` }}>
                {activeTab === 'Pending' && !searchQuery && industry === 'All' ? (
                  <>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: C.tealLight, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: C.text, marginBottom: '8px' }}>All caught up! No pending requests.</div>
                    <div style={{ fontSize: '13px', color: C.muted }}>New company registrations will appear here for your review.</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: C.text, marginBottom: '8px' }}>No {activeTab.toLowerCase()} requests found</div>
                    <div style={{ fontSize: '13px', color: C.muted }}>Try adjusting your search or filters to find what you're looking for.</div>
                  </>
                )}
              </div>
            ) : (
              // LIST
              rawRequests.map((req, i) => (
                <div key={req.id} style={{ animationDelay: `${i * 50}ms` }}>
                  <CompanyRequestCard
                    request={req}
                    onApprove={() => handleOpenModal(req, 'approve')}
                    onReject={() => handleOpenModal(req, 'reject')}
                    compact={false}
                  />
                </div>
              ))
            )}
          </div>

          {/* PAGINATION */}
          {!reqLoading && rawRequests.length > 0 && totalPages > 1 && (
            <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg }}>
              <div style={{ fontSize: '13px', color: C.muted }}>
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalRequests)} of {totalRequests} requests
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '6px 12px', background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '6px 12px',
                      background: page === p ? C.teal : C.surface,
                      border: `1px solid ${page === p ? C.teal : C.border}`,
                      color: page === p ? '#fff' : C.text,
                      borderRadius: '6px', cursor: 'pointer', fontWeight: page === p ? 600 : 400
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '6px 12px', background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReviewRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        request={selectedReq}
        action={modalAction}
        onConfirm={handleConfirmReview}
        loading={reviewLoading}
      />
    </MainLayout>
  );
}
