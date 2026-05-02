import MainLayout from '../../components/layouts/MainLayout';
import ProfileView from '../../components/admin/ProfileView';

export default function Profile() {
  return (
    <MainLayout role="admin" pageTitle="Profile" userName="Admin User" userInitials="AU" notifCount={3}>
      <ProfileView />
    </MainLayout>
  );
}