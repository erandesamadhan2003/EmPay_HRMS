import React, { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', cyan: '#06B6D4',
  warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const InputBase = {
  padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: '8px', color: C.text, fontSize: '13px', fontFamily: '"Poppins", sans-serif',
  outline: 'none', minWidth: '160px'
};

export const AuditFilterBar = ({ filters, onChange, onExport, loading }) => {
  const [search, setSearch] = useState(filters.search || '');
  
  // Fetch companies for the filter
  const { data: companiesData } = useFetch('/superadmin/companies?status=active&limit=100');
  const companies = companiesData?.data || [];

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== filters.search) onChange({ ...filters, search });
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handleSeverityToggle = (sev) => {
    onChange({ ...filters, severity: filters.severity === sev ? 'All' : sev });
  };

  const setPreset = (preset) => {
    const now = new Date();
    let from = new Date();
    if (preset === 'Today') from.setHours(0,0,0,0);
    if (preset === 'This Week') from.setDate(now.getDate() - now.getDay());
    if (preset === 'This Month') from.setDate(1);
    if (preset === 'Last 3 Months') from.setMonth(now.getMonth() - 3);
    
    onChange({ 
      ...filters, 
      from: from.toISOString().split('T')[0], 
      to: now.toISOString().split('T')[0] 
    });
  };

  const hasFilters = filters.search || filters.action !== 'All' || filters.severity !== 'All' || filters.company !== 'All' || filters.from || filters.to;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Row: Search and Action */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '10px', color: C.muted }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search by actor, action, company..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...InputBase, width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }} 
          />
        </div>

        <select 
          value={filters.action} 
          onChange={e => onChange({ ...filters, action: e.target.value })}
          style={InputBase}
        >
          <option value="All">All Actions</option>
          <option value="COMPANY_APPROVED">Company Approved</option>
          <option value="COMPANY_REJECTED">Company Rejected</option>
          <option value="COMPANY_SUSPENDED">Company Suspended</option>
          <option value="USER_CREATED">User Created</option>
          <option value="USER_DELETED">User Deleted</option>
          <option value="PAYROLL_GENERATED">Payroll Generated</option>
          <option value="LEAVE_APPROVED">Leave Approved</option>
          <option value="SETTINGS_CHANGED">Settings Changed</option>
        </select>

        <select 
          value={filters.company} 
          onChange={e => onChange({ ...filters, company: e.target.value })}
          style={{ ...InputBase, flex: '0 1 200px' }}
        >
          <option value="All">All Companies</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Second Row: Severity and Dates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Severity Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: C.muted, marginRight: '4px' }}>Severity:</span>
          {['All', 'Info', 'Warning', 'Critical'].map(sev => {
            const isActive = filters.severity === sev;
            let color = C.muted;
            if (sev === 'Info') color = C.cyan;
            if (sev === 'Warning') color = C.warning;
            if (sev === 'Critical') color = C.danger;
            
            return (
              <button
                key={sev}
                onClick={() => handleSeverityToggle(sev)}
                style={{
                  padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: isActive ? color : 'transparent',
                  color: isActive ? '#fff' : color,
                  border: `1px solid ${color}`
                }}
              >
                {sev}
              </button>
            );
          })}
        </div>

        {/* Date Range */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="date" value={filters.from || ''} onChange={e => onChange({ ...filters, from: e.target.value })} style={{ ...InputBase, minWidth: 'auto', padding: '6px 10px' }} />
            <span style={{ color: C.muted }}>-</span>
            <input type="date" value={filters.to || ''} onChange={e => onChange({ ...filters, to: e.target.value })} style={{ ...InputBase, minWidth: 'auto', padding: '6px 10px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Today', 'This Week', 'This Month'].map(p => (
              <button 
                key={p} 
                onClick={() => setPreset(p)}
                style={{ background: 'transparent', border: 'none', color: C.teal, fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Actions and Clear */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
        <div>
          {hasFilters && (
            <button 
              onClick={() => onChange({ search: '', action: 'All', severity: 'All', company: 'All', from: '', to: '' })}
              style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear all filters
            </button>
          )}
        </div>
        <button 
          onClick={onExport}
          disabled={loading}
          style={{ 
            padding: '10px 18px', background: 'transparent', border: `1px solid ${C.teal}`, color: C.teal, 
            borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
            fontSize: '13px'
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.tealLight}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export CSV
        </button>
      </div>
    </div>
  );
};
