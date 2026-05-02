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
  textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 600,
  color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap'
};

const td = {
  padding: '16px', fontSize: '13px', color: C.text,
  borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle'
};

const actionConfig = {
  COMPANY_APPROVED: { label: 'Company Approved', color: C.teal, light: C.tealLight },
  COMPANY_REJECTED: { label: 'Company Rejected', color: C.danger, light: C.dangerLight },
  COMPANY_SUSPENDED: { label: 'Company Suspended', color: C.warning, light: C.warningLight },
  USER_CREATED: { label: 'User Created', color: C.cyan, light: C.cyanLight },
  USER_DELETED: { label: 'User Deleted', color: C.danger, light: C.dangerLight },
  PAYROLL_GENERATED: { label: 'Payroll Generated', color: C.violet, light: C.violetLight },
  LEAVE_APPROVED: { label: 'Leave Approved', color: C.teal, light: C.tealLight },
  SETTINGS_CHANGED: { label: 'Settings Changed', color: C.warning, light: C.warningLight }
};
const getActionConfig = (action = '') => {
  const key = action.toUpperCase();
  if (actionConfig[key]) return actionConfig[key];
  
  // Generic fallback logic
  if (key.includes('APPROVE')) return { label: action, color: C.teal, light: C.tealLight };
  if (key.includes('REJECT') || key.includes('DELETE')) return { label: action, color: C.danger, light: C.dangerLight };
  if (key.includes('SUSPEND') || key.includes('CHANGE')) return { label: action, color: C.warning, light: C.warningLight };
  if (key.includes('CREATE') || key.includes('REGISTER')) return { label: action, color: C.cyan, light: C.cyanLight };
  
  return { label: action, color: C.muted, light: C.surfaceHover };
};

const targetIcons = {
  company: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path></svg>,
  user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  payroll: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  leave: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
};

const getInitials = (name) => {
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const AuditLogTable = ({ logs = [], loading, onRowClick }) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Timestamp', 'Actor', 'Action', 'Target', 'Severity', 'IP', 'Details'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}><td colSpan={7} style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ height: '24px', borderRadius: '4px', animation: 'sa-shimmer 2s infinite linear', backgroundColor: C.surface, backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%' }} />
              </td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: C.surfaceHover, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: C.text, marginBottom: '8px' }}>No audit logs found</div>
        <div style={{ fontSize: '13px', color: C.muted }}>Try adjusting your filters to find what you're looking for.</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Timestamp', 'Actor', 'Action', 'Target', 'Severity', 'IP', 'Details'].map(h => <th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {logs.map(log => {
            const isExpanded = expandedId === log.id;
            const config = getActionConfig(log.action);
            const isCritical = log.severity === 'critical';
            const isWarning = log.severity === 'warning';
            
            const timestamp = new Date(log.timestamp);
            const dateStr = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <React.Fragment key={log.id}>
                <tr 
                  onClick={() => toggleExpand(log.id)}
                  style={{ 
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: isCritical ? 'rgba(239, 68, 68, 0.03)' : (isExpanded ? C.surfaceHover : 'transparent'),
                    borderLeft: `4px solid ${isExpanded ? C.teal : 'transparent'}`
                  }}
                  onMouseEnter={e => !isExpanded && (e.currentTarget.style.background = C.surfaceHover)}
                  onMouseLeave={e => !isExpanded && (e.currentTarget.style.background = isCritical ? 'rgba(239, 68, 68, 0.03)' : 'transparent')}
                >
                  <td style={td}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{dateStr}</div>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{timeStr}</div>
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.violetLight, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        {getInitials(log.actor?.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{log.actor?.name}</div>
                        <div style={{ 
                          fontSize: '10px', background: C.surfaceHover, color: C.muted, 
                          padding: '1px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px',
                          textTransform: 'uppercase', fontWeight: 600
                        }}>{log.actor?.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', background: config.light, color: config.color, fontSize: '11px', fontWeight: 600 }}>
                      {config.label}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.text }}>
                      <span style={{ color: C.muted }}>{targetIcons[log.target?.type] || targetIcons.company}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{log.target?.name}</span>
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ 
                        width: '8px', height: '8px', borderRadius: '50%', 
                        background: isCritical ? C.danger : (isWarning ? C.warning : C.cyan),
                        boxShadow: isCritical ? `0 0 0 0 ${C.danger}` : 'none',
                        animation: isCritical ? 'sa-pulse 2s infinite' : 'none'
                      }} />
                      <span style={{ textTransform: 'capitalize', color: isCritical ? C.danger : (isWarning ? C.warning : C.cyan), fontWeight: 500 }}>
                        {log.severity}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', color: C.muted }}>{log.ip}</td>
                  <td style={td}>
                    <span style={{ color: C.teal, fontWeight: 500, fontSize: '12px' }}>{isExpanded ? 'Hide' : 'View'}</span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={7} style={{ padding: '0', background: C.surfaceHover, borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ padding: '24px', animation: 'sa-slide-down 0.2s ease-out' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase' }}>Action Details</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                <span style={{ color: C.muted, minWidth: '80px' }}>Log ID:</span>
                                <span style={{ color: C.text, fontFamily: 'monospace' }}>#{log.id}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                <span style={{ color: C.muted, minWidth: '80px' }}>Email:</span>
                                <span style={{ color: C.text }}>{log.actor?.email}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                <span style={{ color: C.muted, minWidth: '80px' }}>User Agent:</span>
                                <span style={{ color: C.muted, fontSize: '11px', lineHeight: 1.4 }}>{log.userAgent}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase' }}>Payload Metadata</h4>
                            <div style={{ background: C.bg, padding: '16px', borderRadius: '8px', border: `1px solid ${C.border}`, fontFamily: 'monospace', fontSize: '12px', color: C.teal }}>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <style>{`
        @keyframes sa-slide-down { from { max-height: 0; opacity: 0; } to { max-height: 400px; opacity: 1; } }
        @keyframes sa-pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
      `}</style>
    </div>
  );
};
