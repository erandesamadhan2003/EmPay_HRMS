import MainLayout from '../../components/layouts/MainLayout';
import DepartmentManagementView from '../../components/admin/DepartmentManagementView';

export default function DepartmentManagement() {
  return (
    <MainLayout role="admin" pageTitle="Department Management" userName="Admin User" userInitials="AU" notifCount={3}>
      <DepartmentManagementView />
    </MainLayout>
  );
}