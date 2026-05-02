import MainLayout from '../../components/layouts/MainLayout';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E', teal: '#14B8A6'
};

export default function Reports() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="payroll" pageTitle="Payroll Reports" userName={userName} userInitials={userInitials}>
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: C.text, margin: '0 0 8px 0' }}>Reports</h2>
        <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 24 }}>Generate and export detailed payroll ledgers and tax reports.</p>
        
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <div style={{ color: C.muted, marginBottom: 16 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <h3 style={{ fontSize: 16, color: C.text, marginBottom: 8 }}>Under Construction</h3>
          <p style={{ fontSize: 13, color: C.muted }}>Advanced reporting and CSV export features will be available here soon.</p>
        </div>
      </div>
    </MainLayout>
  );
}
