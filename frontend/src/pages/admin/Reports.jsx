import MainLayout from '../../components/layouts/MainLayout';
import ReportsView from '../../components/admin/ReportsView';

export default function Reports() {
  return (
    <MainLayout role="admin" pageTitle="Reports & Analytics" userName="Admin User" userInitials="AU" notifCount={3}>
      <ReportsView />
    </MainLayout>
  );
}