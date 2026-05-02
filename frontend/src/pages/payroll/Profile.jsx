import MainLayout from '../../components/layouts/MainLayout';
import ProfileView from '../../components/employee/ProfileView';

export default function Profile() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="payroll" pageTitle="My Profile" userName={userName} userInitials={userInitials}>
      <ProfileView />
    </MainLayout>
  );
}
