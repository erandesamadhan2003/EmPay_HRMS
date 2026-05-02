import MainLayout from '../../components/layouts/MainLayout';
import EmployeeManagementView from '../../components/admin/EmployeeManagementView';

export default function EmployeeManagement() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Admin User';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="admin" pageTitle="Employee Management" userName={userName} userInitials={userInitials} notifCount={0}>
      <EmployeeManagementView />
    </MainLayout>
  );
}