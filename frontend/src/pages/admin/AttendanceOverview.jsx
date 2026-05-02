import MainLayout from '../../components/layouts/MainLayout';
import AttendanceOverviewView from '../../components/admin/AttendanceOverviewView';

export default function AttendanceOver() {
  return (
    <MainLayout role="admin" pageTitle="Attendance Overview" userName="Admin User" userInitials="AU" notifCount={3}>
      <AttendanceOverviewView />
    </MainLayout>
  );
}