import { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import PayrunTable from '../../components/payroll/PayrunTable';
import PayrunDetail from '../../components/payroll/PayrunDetail';

export default function PayrollManagement() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const [selectedPayrun, setSelectedPayrun] = useState(null);

  return (
    <MainLayout role="payroll" pageTitle="Payroll Management" userName={userName} userInitials={userInitials} notifCount={0}>
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#F1F0FF', margin: 0 }}>Payroll Management</h2>
            <p style={{ fontSize: 13, color: '#8B8A9B', fontWeight: 300, marginTop: 4 }}>Manage payruns and payslips</p>
          </div>
          {selectedPayrun && (
            <button 
              onClick={() => setSelectedPayrun(null)} 
              style={{ background: 'transparent', border: '1px solid #2E2E3E', borderRadius: 10, padding: '8px 16px', color: '#F1F0FF', fontSize: 13, cursor: 'pointer' }}
            >
              ← Back to Payruns
            </button>
          )}
        </div>

        {selectedPayrun ? (
          <PayrunDetail payrun={selectedPayrun} onBack={() => setSelectedPayrun(null)} />
        ) : (
          <PayrunTable onSelectPayrun={setSelectedPayrun} />
        )}
      </div>
    </MainLayout>
  );
}
