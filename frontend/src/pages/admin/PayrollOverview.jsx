import MainLayout from '../../components/layouts/MainLayout';
import PayrollOverviewView from '../../components/admin/PayrollOverviewView';

export default function PayrollOver() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Admin User';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="admin" pageTitle="Payroll Overview" userName={userName} userInitials={userInitials} notifCount={0}>
      <PayrollOverviewView />
    </MainLayout>
  );
}