import MainLayout from '../../components/layouts/MainLayout';
import SettingsView from '../../components/admin/SettingsView';

export default function Settings() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Admin User';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="admin" pageTitle="Settings" userName={userName} userInitials={userInitials} notifCount={0}>
      <SettingsView />
    </MainLayout>
  );
}