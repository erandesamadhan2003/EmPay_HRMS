import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from './layoutConfig.jsx';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './footer';

// ─── Global Layout Keyframes (injected once) ───
const LayoutStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideInLeft {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.bg}; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${C.muted}; }

    @media (max-width: 767px) {
      .sidebar-desktop { display: none !important; }
      .navbar-bar { left: 0 !important; }
      .footer-bar { left: 0 !important; }
      .main-content { margin-left: 0 !important; }
    }
    @media (min-width: 768px) {
      .sidebar-mobile-overlay { display: none !important; }
    }
  `}} />
);

export default function MainLayout({
  role = 'admin',
  userName = 'User',
  userInitials = 'U',
  children,
  pageTitle = 'Dashboard',
  notifCount = 0,
  onLogout,
}) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [onLogout, navigate]);

  // Load Poppins font
  useEffect(() => {
    if (!document.querySelector('link[href*="Poppins"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Responsive breakpoint detection
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if (w >= 768 && w < 1024) {
        setIsCollapsed(true);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sidebarWidth = isMobile ? 0 : (isCollapsed ? 64 : 240);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(o => !o);
    } else {
      setIsCollapsed(c => !c);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Poppins, sans-serif', color: C.text }}>
      <LayoutStyles />

      <Sidebar
        role={role}
        userName={userName}
        userInitials={userInitials}
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(c => !c)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <Navbar
        pageTitle={pageTitle}
        userName={userName}
        userInitials={userInitials}
        role={role}
        notifCount={notifCount}
        onLogout={handleLogout}
        onToggleSidebar={handleToggleSidebar}
        sidebarWidth={sidebarWidth}
      />

      <main
        className="main-content"
        style={{
          marginLeft: sidebarWidth,
          marginTop: 64,
          marginBottom: 48,
          padding: 32,
          minHeight: 'calc(100vh - 64px - 48px)',
          background: C.bg,
          transition: 'margin-left 0.3s ease',
        }}
      >
        {children}
      </main>

      <Footer sidebarWidth={sidebarWidth} />
    </div>
  );
}

// ─── Re-exports for convenience ───
export { Sidebar } from './Sidebar';
export { Navbar } from './Navbar';
export { Footer } from './footer';

// ─── Usage Example ───
// <MainLayout role="admin" userName="John Doe" userInitials="JD" pageTitle="Dashboard" notifCount={3} onLogout={() => {}}>
//   <YourPageComponent />
// </MainLayout>
