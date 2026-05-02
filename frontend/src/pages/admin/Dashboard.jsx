import MainLayout from '../../components/layouts/MainLayout';
import DashboardView from '../../components/admin/DashboardView';

export default function Dashboard() {
  return (
    <MainLayout role="admin" pageTitle="Dashboard" userName="Admin User" userInitials="AU" notifCount={3}>
      <DashboardView />
    </MainLayout>
  );
}