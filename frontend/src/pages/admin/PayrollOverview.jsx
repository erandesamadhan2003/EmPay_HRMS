import MainLayout from '../../components/layouts/MainLayout';
import PayrollOverviewView from '../../components/admin/PayrollOverviewView';

export default function PayrollOver() {
  return (
    <MainLayout role="admin" pageTitle="Payroll Overview" userName="Admin User" userInitials="AU" notifCount={3}>
      <PayrollOverviewView />
    </MainLayout>
  );
}