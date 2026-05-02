import MainLayout from '../../components/layouts/MainLayout';
import DepartmentManagementView from '../../components/admin/DepartmentManagementView';

export default function DepartmentManagement() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Admin User';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="admin" pageTitle="Department Management" userName={userName} userInitials={userInitials} notifCount={0}>
      <DepartmentManagementView />
    </MainLayout>
  );
}