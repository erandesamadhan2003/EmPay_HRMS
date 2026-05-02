import MainLayout from '../../components/layouts/MainLayout';

const C = { text: '#F1F0FF', muted: '#8B8A9B' };

export default function EmployeeMyLeaves() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Employee';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="employee" pageTitle="My Leaves" userName={userName} userInitials={userInitials}>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>My Leaves</h2>
        <p style={{ fontSize: 14, color: C.muted, fontWeight: 300 }}>This page is under construction.</p>
      </div>
    </MainLayout>
  );
}
