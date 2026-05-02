import { C } from './layoutConfig.jsx';

export function Footer({ sidebarWidth = 240 }) {
  return (
    <footer style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      height: 48,
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      transition: 'left 0.3s ease',
      left: sidebarWidth,
      fontFamily: 'Poppins, sans-serif',
      zIndex: 80,
    }}>
      <span style={{ fontSize: 12, color: C.muted, fontWeight: 300 }}>
        &copy; {new Date().getFullYear()} EmPay. All rights reserved.
      </span>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>
        v1.0.0
      </span>
    </footer>
  );
}

export default Footer;
