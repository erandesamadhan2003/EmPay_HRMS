import MainLayout from '../../components/layouts/MainLayout';
import ProfileView from '../../components/employee/ProfileView';

export default function EmployeeProfile() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Employee';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="employee" pageTitle="Profile" userName={userName} userInitials={userInitials}>
      <ProfileView />
    </MainLayout>
  );
}
