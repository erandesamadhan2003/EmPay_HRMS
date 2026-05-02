import MainLayout from '../../components/layouts/MainLayout';
import PayslipsView from '../../components/employee/PayslipsView';

export default function EmployeePayslips() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Employee';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="employee" pageTitle="Payslips" userName={userName} userInitials={userInitials}>
      <PayslipsView />
    </MainLayout>
  );
}
