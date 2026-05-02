import React, { useState } from 'react';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  cyan: '#06B6D4', cyanLight: 'rgba(6,182,212,0.15)',
  warning: '#F59E0B', warningLight: 'rgba(245,158,11,0.15)',
  danger: '#EF4444', dangerLight: 'rgba(239,68,68,0.15)',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const th = {
  textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600,
  color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: `1px solid ${C.border}`, cursor: 'pointer', whiteSpace: 'nowrap',
  userSelect: 'none'
};

const td = {
  padding: '12px 16px', fontSize: '13px', color: C.text,
  borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap'
};

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

export const CompanyTable = ({ companies = [], loading, onViewDetail, onSuspend, onActivate, sort, onSort }) => {
  const handleSortClick = (column) => {
    if (!onSort) return;
    if (sort?.column === column) {
      onSort({ column, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ column, direction: 'asc' });
    }
  };

  const renderSortIcon = (column) => {
    if (sort?.column !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: C.teal, marginLeft: '4px' }}>{sort.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Company', 'Admin', 'Industry', 'Employees', 'Status', 'Plan', 'Last Active', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={8} style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ height: '24px', borderRadius: '4px', animation: 'sa-shimmer 2s infinite linear', backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: C.surfaceHover, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: C.text, marginBottom: '8px' }}>No companies found</div>
        <div style={{ fontSize: '13px', color: C.muted }}>Try adjusting your search or filters to find what you're looking for.</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
        <thead>
          <tr>
            <th onClick={() => handleSortClick('name')} style={{ ...th, color: sort?.column === 'name' ? C.teal : C.muted }}>Company {renderSortIcon('name')}</th>
            <th style={th}>Admin</th>
            <th style={th}>Industry</th>
            <th onClick={() => handleSortClick('employeeCount')} style={{ ...th, color: sort?.column === 'employeeCount' ? C.teal : C.muted }}>Employees {renderSortIcon('employeeCount')}</th>
            <th onClick={() => handleSortClick('status')} style={{ ...th, color: sort?.column === 'status' ? C.teal : C.muted }}>Status {renderSortIcon('status')}</th>
            <th style={th}>Plan</th>
            <th onClick={() => handleSortClick('lastActive')} style={{ ...th, color: sort?.column === 'lastActive' ? C.teal : C.muted }}>Last Active {renderSortIcon('lastActive')}</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c, i) => {
            const isSuspended = c.status === 'suspended';
            const isPending = c.status === 'pending';
            const isActive = c.status === 'active';
            
            let statusColor = C.warning;
            let statusLight = C.warningLight;
            if (isActive) { statusColor = C.teal; statusLight = C.tealLight; }
            if (isSuspended) { statusColor = C.danger; statusLight = C.dangerLight; }

            let planStyle = { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` };
            if (c.plan === 'pro') planStyle = { background: C.cyanLight, color: C.cyan, border: 'none' };
            if (c.plan === 'enterprise') planStyle = { background: C.violetLight, color: C.violet, border: 'none' };

            // Check if last active is > 30 days
            let lastActiveDanger = false;
            if (c.lastActive) {
              const days = parseInt(c.lastActive.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(days) && c.lastActive.includes('days') && days > 30) lastActiveDanger = true;
            }

            return (
              <tr 
                key={c.id} 
                style={{ background: i % 2 === 0 ? 'transparent' : C.surfaceHover, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.teal}08`}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : C.surfaceHover}
              >
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.violetLight, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: C.text }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{c.city || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...td, color: C.muted }}>{c.adminName}</td>
                <td style={{ ...td, color: C.muted }}>{c.industry || '—'}</td>
                <td style={td}>{c.employeeCount || 0}</td>
                <td style={td}>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', background: statusLight, color: statusColor, fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                    {c.status || 'Active'}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', ...planStyle }}>
                    {c.plan || 'Free'}
                  </span>
                </td>
                <td style={{ ...td, color: lastActiveDanger ? C.danger : C.text }}>{c.lastActive || 'N/A'}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => onViewDetail(c.id)}
                      title="View Details"
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'transparent', color: C.cyan, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.cyanLight}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>

                    {isActive && (
                      <button 
                        onClick={() => onSuspend(c.id)}
                        title="Suspend"
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'transparent', color: C.warning, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.warningLight}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                      </button>
                    )}

                    {isSuspended && (
                      <button 
                        onClick={() => onActivate(c.id)}
                        title="Activate"
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'transparent', color: C.teal, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.tealLight}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
