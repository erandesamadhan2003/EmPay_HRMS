import MainLayout from '../../components/layouts/MainLayout';
import AttendanceView from '../../components/employee/AttendanceView';

export default function EmployeeAttendance() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Employee';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MainLayout role="employee" pageTitle="Attendance" userName={userName} userInitials={userInitials}>
      <AttendanceView />
    </MainLayout>
  );
}
