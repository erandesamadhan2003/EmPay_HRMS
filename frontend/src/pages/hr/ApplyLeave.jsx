import MainLayout from '../../components/layouts/MainLayout';
import ApplyLeaveView from '../../components/employee/ApplyLeaveView';

export default function HRApplyLeave() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'HR Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="hr" pageTitle="Apply Leave" userName={userName} userInitials={userInitials}>
      <ApplyLeaveView />
    </MainLayout>
  );
}
