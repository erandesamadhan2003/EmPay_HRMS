import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, Icon } from './layoutConfig.jsx';

export function Navbar({
  pageTitle = '',
  userName = '',
  userInitials = '',
  role = 'admin',
  notifCount = 0,
  onLogout,
  onToggleSidebar,
  sidebarWidth = 240,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close search on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchVal('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const navigate = useNavigate();

  const dropdownItems = [
    { label: 'My Profile', icon: 'user', action: () => navigate(`/${role === 'payroll_officer' ? 'payroll' : role}/profile`) },
    ...(role === 'admin' ? [{ label: 'Settings', icon: 'settings', action: () => navigate('/admin/settings') }] : []),
    { divider: true },
    { label: 'Logout', icon: 'log-out', action: onLogout, danger: true },
  ];

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      right: 0,
      height: 64,
      zIndex: 90,
      background: 'rgba(19,19,26,0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      transition: 'left 0.3s ease',
      left: sidebarWidth,
      fontFamily: 'Poppins, sans-serif',
    }}>
      {/* Left: Hamburger + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          onClick={onToggleSidebar}
          style={{ cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Icon name="menu" size={20} color={C.muted} />
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>
          {pageTitle}
        </h1>
      </div>

      {/* Right: Search, Bell, Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {searchOpen && (
            <input
              ref={searchRef}
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onBlur={() => { if (!searchVal) setSearchOpen(false); }}
              placeholder="Search..."
              style={{
                width: 200,
                height: 34,
                background: C.surfaceHover,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '0 12px',
                fontSize: 13,
                color: C.text,
                outline: 'none',
                marginRight: 4,
                fontFamily: 'Poppins, sans-serif',
                animation: 'fadeIn 0.2s ease-out',
              }}
            />
          )}
          <div
            onClick={() => setSearchOpen(o => !o)}
            style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="search" size={18} color={C.muted} />
          </div>
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="bell" size={18} color={C.muted} />
          </div>
          {notifCount > 0 && (
            <div style={{
              position: 'absolute', top: 4, right: 4,
              minWidth: 16, height: 16, borderRadius: 8,
              background: C.accent, color: '#fff',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
              animation: 'pulse 2s ease-in-out infinite',
              boxShadow: `0 0 8px ${C.accentGlow}`,
            }}>
              {notifCount > 9 ? '9+' : notifCount}
            </div>
          )}
        </div>

        {/* Avatar + Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
              cursor: 'pointer', transition: 'box-shadow 0.2s',
              boxShadow: dropdownOpen ? `0 0 0 3px ${C.accentGlow}` : 'none',
            }}
          >
            {userInitials}
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 48, right: 0,
              width: 200, background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              animation: 'slideInDown 0.2s ease-out',
              zIndex: 100,
            }}>
              {/* User header */}
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{userName}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2, textTransform: 'capitalize' }}>{role}</div>
              </div>
              {dropdownItems.map((item, i) =>
                item.divider ? (
                  <div key={i} style={{ height: 1, background: C.border, margin: '4px 0' }} />
                ) : (
                  <div
                    key={item.label}
                    onClick={() => { item.action?.(); setDropdownOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', cursor: 'pointer',
                      transition: 'background 0.15s',
                      fontSize: 13, fontWeight: 400,
                      color: item.danger ? C.danger : C.text,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.1)' : C.surfaceHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon name={item.icon} size={15} color={item.danger ? C.danger : C.muted} />
                    <span>{item.label}</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
