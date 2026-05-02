import React, { useState, useEffect } from 'react';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  violet: '#8B5CF6', violetLight: 'rgba(139,92,246,0.15)',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  cyan: '#06B6D4', cyanLight: 'rgba(6,182,212,0.15)',
  warning: '#F59E0B', warningLight: 'rgba(245,158,11,0.15)',
  danger: '#EF4444', dangerLight: 'rgba(239,68,68,0.15)',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E'
};

const getColors = (colorName) => {
  switch(colorName) {
    case 'teal': return { main: C.teal, light: C.tealLight };
    case 'violet': return { main: C.accent, light: C.accentLight };
    case 'cyan': return { main: C.cyan, light: C.cyanLight };
    case 'warning': return { main: C.warning, light: C.warningLight };
    case 'danger': return { main: C.danger, light: C.dangerLight };
    default: return { main: C.teal, light: C.tealLight };
  }
};

const Icons = {
  building: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>,
  activity: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  bell: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
};

export const StatCard = ({ title, value, subtitle, color = 'teal', icon, trendUp, loading, onClick }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const c = getColors(color);

  useEffect(() => {
    if (loading) return;
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }
    
    const duration = 1200;
    let animationFrame;
    const start = performance.now();
    
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * target));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      } else {
        setDisplayValue(target);
      }
    };
    
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, loading]);

  const formattedValue = typeof displayValue === 'number' && displayValue > 1000 
    ? displayValue.toLocaleString('en-US') 
    : displayValue;

  if (loading) {
    return (
      <div style={{
        backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px',
        padding: '24px', height: '142px', display: 'flex', flexDirection: 'column', gap: '16px',
        animation: 'sa-shimmer 2s infinite linear',
        backgroundImage: `linear-gradient(90deg, ${C.surface} 0%, ${C.surfaceHover} 50%, ${C.surface} 100%)`,
        backgroundSize: '200% 100%'
      }}>
      </div>
    );
  }

  return (
    <div 
      className="sa-stat-card sa-fade-up"
      onClick={onClick}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        position: 'relative', overflow: 'hidden'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${c.light}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Pulse animation for warnings */}
      {color === 'warning' && value > 0 && (
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%',
          background: C.warning, margin: '20px',
          boxShadow: `0 0 0 0 ${C.warning}`,
          animation: 'sa-pulse 2s infinite'
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
            {formattedValue}
          </div>
          <div style={{ fontSize: '13px', color: C.muted, marginTop: '4px' }}>
            {title}
          </div>
        </div>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: c.light, color: c.main,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {Icons[icon] || Icons.building}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
        {trendUp !== undefined && (
          <div style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            ...(trendUp ? { borderBottom: `6px solid ${C.teal}` } : { borderTop: `6px solid ${C.danger}` })
          }} />
        )}
        <span style={{ fontSize: '12px', color: trendUp !== undefined ? (trendUp ? C.teal : C.danger) : C.muted }}>
          {subtitle}
        </span>
      </div>
    </div>
  );
};
