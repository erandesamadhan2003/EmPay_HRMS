import MainLayout from '../../components/layouts/MainLayout';
import DashboardView from '../../components/admin/DashboardView';

export default function Dashboard() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Admin User';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="admin" pageTitle="Dashboard" userName={userName} userInitials={userInitials} notifCount={0}>
      <DashboardView />
    </MainLayout>
  );
}