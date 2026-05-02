import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useFetch } from '../../hooks/useFetch';
import { BASE_URL } from '../../config/api';
import { StatCard } from '../../components/superadmin/StatCard';
import { AuditLogTable } from '../../components/superadmin/AuditLogTable';
import { AuditFilterBar } from '../../components/superadmin/AuditFilterBar';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  cyan: '#06B6D4',
  warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    search: '',
    action: 'All',
    severity: 'All',
    company: 'All',
    from: '',
    to: ''
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  const [lastUpdated, setLastUpdated] = useState(0);

  // API Call: Stats
  const { data: statsData, loading: statsLoading } = useFetch('/superadmin/audit-logs/stats');
  
  // API Call: Logs
  const queryParams = new URLSearchParams();
  if (filters.action !== 'All') queryParams.append('action', filters.action);
  if (filters.severity !== 'All') queryParams.append('severity', filters.severity.toLowerCase());
  if (filters.company !== 'All') queryParams.append('company', filters.company);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.from) queryParams.append('from', filters.from);
  if (filters.to) queryParams.append('to', filters.to);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const { data: logData, loading: logLoading, refetch: refetchLogs } = useFetch(`/superadmin/audit-logs?${queryParams.toString()}`);

  // Fallback Data
  const stats = statsData?.data || { totalToday: 0, criticalToday: 0, warningToday: 0, topActors: [] };
  const logs = logData?.data?.items || [];
  const totalLogs = logData?.data?.pagination?.total || 0;
  const totalPages = logData?.data?.pagination?.totalPages || 1;

  // Auto Refresh & Counter
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refetchLogs();
      setLastUpdated(0);
    }, 30000);

    const counterInterval = setInterval(() => {
      setLastUpdated(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(counterInterval);
    };
  }, [refetchLogs]);

  // Handle Export
  const handleExport = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('empay_auth') || '{}')?.token;
      const res = await fetch(`${BASE_URL}/superadmin/audit-logs/export?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(e) {
      console.error(e);
      alert('Export failed. Make sure backend is running.');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <MainLayout role="superadmin" pageTitle="Audit Logs">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sa-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sa-live-pulse { 0% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.4; transform: scale(0.8); } }
        .sa-fade-up { animation: sa-fade-up 0.5s ease-out forwards; }
      `}} />

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: '"Poppins", sans-serif' }}>
        
        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: C.text }}>Audit Logs</h1>
            <div style={{ fontSize: '14px', color: C.muted, marginTop: '4px' }}>Complete system activity trail for all companies and users</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${C.teal}10`, padding: '6px 12px', borderRadius: '20px', border: `1px solid ${C.teal}30` }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.teal, animation: 'sa-live-pulse 2s infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Tracking</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '11px', color: C.muted }}>Last updated</div>
                   <div style={{ fontSize: '12px', color: C.text, fontWeight: 500 }}>{lastUpdated}s ago</div>
                </div>
                <button 
                  onClick={() => { refetchLogs(); setLastUpdated(0); }}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
             </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <StatCard loading={statsLoading} title="Total Today" value={stats.totalToday} color="violet" icon="activity" />
          <StatCard loading={statsLoading} title="Critical Today" value={stats.criticalToday} color="danger" icon="bell" />
          <StatCard loading={statsLoading} title="Warnings Today" value={stats.warningToday} color="warning" icon="bell" />
          <StatCard loading={statsLoading} title="Active Actors" value={stats.topActors.length} color="teal" icon="users" />
        </div>

        {/* FILTERS & TOP ACTORS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '24px' }}>
          {/* Filters */}
          <AuditFilterBar 
            filters={filters} 
            onChange={handleFilterChange} 
            onExport={handleExport}
            loading={logLoading} 
          />

          {/* Top Actors */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 600, color: C.text }}>Most Active Today</h3>
            {statsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: '40px', marginBottom: '12px', borderRadius: '8px', animation: 'sa-shimmer 2s infinite linear', backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%' }} />
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.topActors.map((actor, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: C.muted, fontWeight: 600, width: '12px' }}>{i + 1}</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.violetLight, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {getInitials(actor.name)}
                      </div>
                      <span style={{ fontSize: '14px', color: C.text, fontWeight: 500 }}>{actor.name}</span>
                    </div>
                    <span style={{ background: C.tealLight, color: C.teal, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                      {actor.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AUDIT TABLE */}
        <div className="sa-fade-up">
          <AuditLogTable logs={logs} loading={logLoading} />
        </div>

        {/* PAGINATION */}
        {!logLoading && logs.length > 0 && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ fontSize: '13px', color: C.muted }}>
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalLogs)} of {totalLogs} logs
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 12px', background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              >Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button 
                  key={p} 
                  onClick={() => setPage(p)} 
                  style={{ padding: '6px 12px', background: page === p ? C.teal : C.surface, border: `1px solid ${page === p ? C.teal : C.border}`, color: page === p ? '#fff' : C.text, borderRadius: '6px', cursor: 'pointer', fontWeight: page === p ? 600 : 400 }}
                >{p}</button>
              ))}
              {totalPages > 5 && <span style={{ color: C.muted }}>...</span>}
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '6px 12px', background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
              >Next</button>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

function getInitials(name) {
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
