import MainLayout from '../../components/layouts/MainLayout';
import ReportsView from '../../components/admin/ReportsView';

export default function Reports() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="payroll" pageTitle="Payroll Reports" userName={userName} userInitials={userInitials}>
      <ReportsView />
    </MainLayout>
  );
}
