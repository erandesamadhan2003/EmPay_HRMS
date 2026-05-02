import MainLayout from '../../components/layouts/MainLayout';
import EmployeeDashboardView from '../../components/employee/DashboardView';

export default function EmployeeDashboard() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Employee';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="employee" pageTitle="Dashboard" userName={userName} userInitials={userInitials} notifCount={0}>
      <EmployeeDashboardView />
    </MainLayout>
  );
}
