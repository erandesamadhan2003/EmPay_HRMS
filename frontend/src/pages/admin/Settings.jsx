import MainLayout from '../../components/layouts/MainLayout';
import SettingsView from '../../components/admin/SettingsView';

export default function Settings() {
  return (
    <MainLayout role="admin" pageTitle="Settings" userName="Admin User" userInitials="AU" notifCount={3}>
      <SettingsView />
    </MainLayout>
  );
}