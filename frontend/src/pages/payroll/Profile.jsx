import MainLayout from '../../components/layouts/MainLayout';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E', teal: '#14B8A6'
};

export default function Profile() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="payroll" pageTitle="My Profile" userName={userName} userInitials={userInitials}>
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: C.text, margin: '0 0 8px 0' }}>Profile</h2>
        <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 24 }}>Manage your personal details and account security.</p>
        
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <div style={{ color: C.muted, marginBottom: 16 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3 style={{ fontSize: 16, color: C.text, marginBottom: 8 }}>Under Construction</h3>
          <p style={{ fontSize: 13, color: C.muted }}>Profile and settings management will be available here soon.</p>
        </div>
      </div>
    </MainLayout>
  );
}
