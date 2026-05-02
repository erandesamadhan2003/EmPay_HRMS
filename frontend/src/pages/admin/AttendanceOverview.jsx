import MainLayout from '../../components/layouts/MainLayout';
import AttendanceOverviewView from '../../components/admin/AttendanceOverviewView';

export default function AttendanceOver() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Admin User';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="admin" pageTitle="Attendance Overview" userName={userName} userInitials={userInitials} notifCount={0}>
      <AttendanceOverviewView />
    </MainLayout>
  );
}