import MainLayout from '../../components/layouts/MainLayout';
import LeaveManagementView from '../../components/admin/LeaveManagementView';

export default function LeaveManagement() {
  return (
    <MainLayout role="admin" pageTitle="Leave Management" userName="Admin User" userInitials="AU" notifCount={3}>
      <LeaveManagementView />
    </MainLayout>
  );
}