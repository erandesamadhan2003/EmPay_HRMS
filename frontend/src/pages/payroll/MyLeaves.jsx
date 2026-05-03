import MainLayout from '../../components/layouts/MainLayout';
import MyLeavesView from '../../components/employee/MyLeavesView';

export default function PayrollMyLeaves() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="payroll" pageTitle="My Leaves" userName={userName} userInitials={userInitials}>
      <MyLeavesView />
    </MainLayout>
  );
}
