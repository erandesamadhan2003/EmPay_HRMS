import MainLayout from '../../components/layouts/MainLayout';
import ProfileView from '../../components/admin/ProfileView';

export default function Profile() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Admin User';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="admin" pageTitle="Profile" userName={userName} userInitials={userInitials} notifCount={0}>
      <ProfileView />
    </MainLayout>
  );
}