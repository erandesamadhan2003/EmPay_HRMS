import MainLayout from '../../components/layouts/MainLayout';
import EmployeeManagementView from '../../components/admin/EmployeeManagementView';

export default function EmployeeManagement() {
  return (
    <MainLayout role="admin" pageTitle="Employee Management" userName="Admin User" userInitials="AU" notifCount={3}>
      <EmployeeManagementView />
    </MainLayout>
  );
}