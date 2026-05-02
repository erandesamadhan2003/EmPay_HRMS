import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { C, NAV_CONFIG, ROLE_BADGE_COLORS, Icon } from './layoutConfig.jsx';

export function Sidebar({
  role = 'admin',
  userName = '',
  userInitials = '',
  onLogout,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const items = NAV_CONFIG[role] || [];
  const badgeColor = ROLE_BADGE_COLORS[role] || C.accent;
  const w = isCollapsed ? 64 : 240;

  const handleNav = (path) => {
    navigate(path);
    if (isMobileOpen && onMobileClose) onMobileClose();
  };

  const sidebarContent = (
    <div style={{
      width: w,
      height: '100vh',
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        padding: isCollapsed ? '0' : '0 20px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: isCollapsed ? 20 : 22,
          fontWeight: 700,
          background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          whiteSpace: 'nowrap',
          fontFamily: 'Poppins, sans-serif',
        }}>
          {isCollapsed ? 'E' : 'EmPay'}
        </div>
      </div>

      {/* Accent divider */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${C.accent}, transparent)`, margin: '0 12px', flexShrink: 0 }} />

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px' }}>
        {items.map((item, idx) => {
          const isActive = currentPath === item.path;
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={item.path}
              onClick={() => handleNav(item.path)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: isCollapsed ? '10px 0' : '10px 12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                marginBottom: 2,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: isActive ? C.accentLight : isHovered ? C.surfaceHover : 'transparent',
                borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                position: 'relative',
              }}
            >
              <Icon name={item.icon} size={18} color={isActive ? C.accent : isHovered ? C.text : C.muted} />
              {!isCollapsed && (
                <span style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.accent : isHovered ? C.text : C.muted,
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.2s ease',
                  fontFamily: 'Poppins, sans-serif',
                }}>
                  {item.label}
                </span>
              )}
              {isCollapsed && isHovered && (
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  marginLeft: 8,
                  background: C.surfaceHover,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: C.text,
                  whiteSpace: 'nowrap',
                  zIndex: 1000,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  fontFamily: 'Poppins, sans-serif',
                  animation: 'fadeIn 0.15s ease-out',
                }}>
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: User info + collapse toggle */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: isCollapsed ? '12px 8px' : '16px', flexShrink: 0 }}>
        {/* User info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          marginBottom: 12,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${badgeColor}, ${C.accent})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            fontFamily: 'Poppins, sans-serif',
          }}>
            {userInitials}
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', fontFamily: 'Poppins, sans-serif' }}>
                {userName}
              </div>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: badgeColor,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: 2,
                fontFamily: 'Poppins, sans-serif',
              }}>
                {role}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: isCollapsed ? '8px 0' : '8px 12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.2s',
            marginBottom: 8,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Icon name="log-out" size={16} color={C.danger} />
          {!isCollapsed && (
            <span style={{ fontSize: 12, color: C.danger, fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}>
              Logout
            </span>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <div
          onClick={onToggleCollapse}
          className="sidebar-collapse-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 6,
            borderRadius: 6,
            cursor: 'pointer',
            border: `1px solid ${C.border}`,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ transition: 'transform 0.3s ease', transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <Icon name="chevron-left" size={16} color={C.muted} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar-desktop" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        height: '100vh',
      }}>
        {sidebarContent}
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="sidebar-mobile-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div
            onClick={onMobileClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <div style={{
            position: 'relative',
            zIndex: 1,
            animation: 'slideInLeft 0.3s ease-out',
          }}>
            {/* Force expanded in mobile overlay */}
            <div style={{
              width: 240,
              height: '100vh',
              background: C.surface,
              borderRight: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Close button */}
              <div style={{ position: 'absolute', top: 16, right: 12, cursor: 'pointer', zIndex: 10 }} onClick={onMobileClose}>
                <Icon name="x" size={18} color={C.muted} />
              </div>
              {/* Reuse nav content for mobile */}
              <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 22, fontWeight: 700, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Poppins, sans-serif' }}>EmPay</div>
              </div>
              <div style={{ height: 2, background: `linear-gradient(90deg, ${C.accent}, transparent)`, margin: '0 12px' }} />
              <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                {items.map((item) => {
                  const isActive = currentPath === item.path;
                  return (
                    <div key={item.path} onClick={() => handleNav(item.path)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 2, borderRadius: 8, cursor: 'pointer',
                      background: isActive ? C.accentLight : 'transparent',
                      borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                    }}>
                      <Icon name={item.icon} size={18} color={isActive ? C.accent : C.muted} />
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? C.accent : C.muted, fontFamily: 'Poppins, sans-serif' }}>{item.label}</span>
                    </div>
                  );
                })}
              </nav>
              <div style={{ borderTop: `1px solid ${C.border}`, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${badgeColor}, ${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'Poppins, sans-serif' }}>{userInitials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text, fontFamily: 'Poppins, sans-serif' }}>{userName}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Poppins, sans-serif' }}>{role}</div>
                  </div>
                </div>
                <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
                  <Icon name="log-out" size={16} color={C.danger} />
                  <span style={{ fontSize: 12, color: C.danger, fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}>Logout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
