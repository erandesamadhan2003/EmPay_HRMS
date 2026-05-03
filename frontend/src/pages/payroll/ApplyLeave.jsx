import MainLayout from '../../components/layouts/MainLayout';
import ApplyLeaveView from '../../components/employee/ApplyLeaveView';

export default function PayrollApplyLeave() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="payroll" pageTitle="Apply Leave" userName={userName} userInitials={userInitials}>
      <ApplyLeaveView />
    </MainLayout>
  );
}
