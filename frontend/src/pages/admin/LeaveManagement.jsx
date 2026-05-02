import MainLayout from '../../components/layouts/MainLayout';
import LeaveManagementView from '../../components/admin/LeaveManagementView';

export default function LeaveManagement() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Admin User';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="admin" pageTitle="Leave Management" userName={userName} userInitials={userInitials} notifCount={0}>
      <LeaveManagementView />
    </MainLayout>
  );
}