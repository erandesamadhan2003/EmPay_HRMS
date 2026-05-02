import MainLayout from '../../components/layouts/MainLayout';
import ApplyLeaveView from '../../components/employee/ApplyLeaveView';

export default function EmployeeApplyLeave() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Employee';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="employee" pageTitle="Apply Leave" userName={userName} userInitials={userInitials}>
      <ApplyLeaveView />
    </MainLayout>
  );
}
