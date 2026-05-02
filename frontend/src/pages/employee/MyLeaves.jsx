import MainLayout from '../../components/layouts/MainLayout';
import MyLeavesView from '../../components/employee/MyLeavesView';

export default function EmployeeMyLeaves() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Employee';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="employee" pageTitle="My Leaves" userName={userName} userInitials={userInitials}>
      <MyLeavesView />
    </MainLayout>
  );
}
