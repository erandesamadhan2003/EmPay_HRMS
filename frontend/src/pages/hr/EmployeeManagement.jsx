import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layouts/MainLayout';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  primary: '#14B8A6',
  primaryHover: '#0D9488',
  secondary: '#8B5CF6',
  secondaryHover: '#7C3AED',
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  warning: '#F59E0B',
  info: '#06B6D4',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#334155',
  font: '"Poppins", sans-serif'
};

const deptColors = {
  'Engineering': C.primary,
  'HR': C.secondary,
  'Finance': C.info,
  'Operations': C.warning,
  'Marketing': C.success
};

import { useEmployees, useEmployeeMutations, useDepartments } from '../../hooks';

const InputBase = {
  width: '100%',
  padding: '10px 12px',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: '8px',
  color: C.text,
  fontSize: '14px',
  fontFamily: C.font,
  outline: 'none',
  boxSizing: 'border-box'
};

const LabelBase = {
  display: 'block',
  fontSize: '12px',
  color: C.muted,
  marginBottom: '6px',
  fontWeight: '500'
};

export default function EmployeeManagement() {
  const { data: empData, isLoading: empLoading } = useEmployees();
  const { createEmployee, updateEmployee, isCreating, isUpdating } = useEmployeeMutations();
  const { data: deptData } = useDepartments();

  const rawDepts = deptData?.data?.items ?? deptData?.data ?? deptData ?? [];
  const activeDepts = Array.isArray(rawDepts) ? rawDepts.map(d => d.name).filter(Boolean) : [];

  const rawEmps = empData?.data?.items ?? empData?.data ?? empData ?? [];
  const employees = (Array.isArray(rawEmps) ? rawEmps : []).map(e => ({
    id: e.id,
    loginId: e.loginId || '—',
    name: e.name || 'Unknown',
    email: e.email || '',
    phone: e.profile?.phone_number || '',
    department: e.profile?.department?.name || 'Unassigned',
    role: e.role === 'hr_officer' ? 'HR Officer' : e.role === 'payroll_officer' ? 'Payroll Officer' : 'Employee',
    joinDate: e.profile?.dateOfJoining ? new Date(e.profile?.dateOfJoining).toISOString().split('T')[0] : '',
    status: e.isActive ? 'Active' : 'Inactive',
    avatar: null
  }));
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [modalMode, setModalMode] = useState(null); // 'add', 'edit', 'view'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: 'Engineering', role: 'Employee', joinDate: new Date().toISOString().split('T')[0], status: 'Active'
  });

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  const getInitials = (name) => {
    if (!name) return 'XX';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const generateNamePart = (name) => {
    if (!name) return 'XXXX';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      const p1 = parts[0].substring(0, 2).toUpperCase().padEnd(2, 'X');
      const p2 = parts[1].substring(0, 2).toUpperCase().padEnd(2, 'X');
      return p1 + p2;
    }
    return name.substring(0, 4).toUpperCase().padEnd(4, 'X');
  };

  const filteredEmployees = employees.filter(e => {
    if (statusFilter !== 'All' && e.status !== statusFilter) return false;
    if (departmentFilter !== 'All' && e.department !== departmentFilter) return false;
    if (roleFilter !== 'All' && e.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.loginId.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredEmployees.length, currentPage, totalPages]);

  const handleSave = async () => {
    try {
      if (modalMode === 'add') {
        const deptObj = rawDepts.find(d => d.name === formData.department);
        const payload = {
          name: formData.name,
          email: formData.email,
          loginId: `HR${generateNamePart(formData.name)}${formData.joinDate ? formData.joinDate.substring(0, 4) : new Date().getFullYear()}${String(employees.length + 1).padStart(4, '0')}`,
          password: 'password123',
          role: formData.role === 'HR Officer' ? 'hr_officer' : formData.role === 'Payroll Officer' ? 'payroll_officer' : 'employee',
          phone: formData.phone,
          departmentId: deptObj ? deptObj.id : undefined,
          designation: formData.role,
          dateOfJoining: formData.joinDate,
        };
        await createEmployee(payload);
      } else if (modalMode === 'edit') {
        const deptObj = rawDepts.find(d => d.name === formData.department);
        const payload = {
          name: formData.name,
          email: formData.email,
          isActive: formData.status === 'Active',
          phone: formData.phone,
          role: formData.role === 'HR Officer' ? 'hr_officer' : formData.role === 'Payroll Officer' ? 'payroll_officer' : 'employee',
          profile: {
            designation: formData.role,
            dateOfJoining: formData.joinDate,
            departmentId: deptObj ? deptObj.id : undefined,
          }
        };
        await updateEmployee({ id: formData.id, data: payload });
      }
      setModalMode(null);
    } catch(e) {
      console.error(e);
    }
  };

  if (empLoading) {
    return (
      <MainLayout role="hr" pageTitle="Employee Management">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: C.muted, fontFamily: C.font }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div>Loading Employees...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="hr" pageTitle="Employee Management">
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-modal {
          animation: fadeInScale 0.25s ease-out forwards;
        }
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div style={{ padding: isMobile ? '16px' : '24px', fontFamily: C.font, color: C.text, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Employees</h1>
            <div style={{ fontSize: '14px', color: C.muted, marginTop: '4px' }}>Manage your team members</div>
          </div>
          <button onClick={() => {
            setFormData({
              name: '', email: '', phone: '', department: 'Engineering', role: 'Employee', joinDate: new Date().toISOString().split('T')[0], status: 'Active'
            });
            setModalMode('add');
          }} style={{ 
            padding: '10px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', 
            cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: `0 4px 12px ${C.primary}40`, transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}80`}
          onMouseLeave={e => e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}40`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Employee
          </button>
        </div>

        {/* FILTER BAR */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '10px', color: C.muted }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search name or Login ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ ...InputBase, paddingLeft: '40px' }} 
            />
          </div>
          <select style={{ ...InputBase, flex: '1 1 150px' }} value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="All">All Departments</option>
            {activeDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select style={{ ...InputBase, flex: '1 1 150px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="All">All Roles</option>
            <option value="Employee">Employee</option>
            <option value="HR Officer">HR Officer</option>
            <option value="Payroll Officer">Payroll Officer</option>
          </select>
          <div style={{ display: 'flex', gap: '8px', background: C.surface, padding: '4px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
            {['All', 'Active', 'Inactive'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '6px 12px',
                background: statusFilter === s ? C.bg : 'transparent',
                color: statusFilter === s ? C.text : C.muted,
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s'
              }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* DATA DISPLAY */}
        {!isMobile ? (
          <div style={{ background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  {['Employee', 'Login ID', 'Email', 'Department', 'Role', 'Join Date', 'Status', 'Actions'].map(th => (
                    <th key={th} style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontWeight: '500', position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: C.muted }}>No employees found matching the filters.</td>
                  </tr>
                ) : paginatedEmployees.map((emp, i) => (
                  <tr key={emp.id} style={{ 
                    background: i % 2 === 0 ? C.surface : C.surfaceHover,
                    borderBottom: `1px solid ${C.border}`,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.surfaceHover;
                    e.currentTarget.style.boxShadow = `inset 4px 0 0 ${C.primary}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.surfaceHover;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: deptColors[emp.department] || C.primary, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '12px', fontWeight: '600'
                        }}>
                          {getInitials(emp.name)}
                        </div>
                        <span style={{ fontWeight: '500' }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: C.muted, fontSize: '13px' }}>{emp.loginId}</td>
                    <td style={{ padding: '12px 16px', color: C.muted }}>{emp.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: `${deptColors[emp.department]}20`, color: deptColors[emp.department] }}>
                        {emp.department}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: C.muted }}>{emp.role}</td>
                    <td style={{ padding: '12px 16px', color: C.muted }}>{emp.joinDate}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: emp.status === 'Active' ? C.successBg : C.dangerBg, color: emp.status === 'Active' ? C.success : C.danger }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => { setSelectedEmployee(emp); setModalMode('view'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.info, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="View Profile">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button onClick={() => { setFormData(emp); setModalMode('edit'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Profile">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {paginatedEmployees.length === 0 ? (
               <div style={{ padding: '32px', textAlign: 'center', color: C.muted, background: C.surface, borderRadius: '12px' }}>No employees found.</div>
            ) : paginatedEmployees.map(emp => (
              <div key={emp.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: deptColors[emp.department] || C.primary, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '16px', fontWeight: '600'
                  }}>
                    {getInitials(emp.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: C.muted, marginTop: '2px' }}>{emp.loginId}</div>
                    <div style={{ fontSize: '13px', color: C.muted, marginTop: '4px' }}>{emp.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', background: `${deptColors[emp.department]}20`, color: deptColors[emp.department] }}>
                      {emp.department}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', background: emp.status === 'Active' ? C.successBg : C.dangerBg, color: emp.status === 'Active' ? C.success : C.danger }}>
                      {emp.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { setSelectedEmployee(emp); setModalMode('view'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.info, padding: '4px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button onClick={() => { setFormData(emp); setModalMode('edit'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, padding: '4px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: C.muted }}>
            Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                style={{ padding: '8px', background: C.surface, border: `1px solid ${C.border}`, color: currentPage === 1 ? C.muted : C.text, borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ width: '36px', height: '36px', background: currentPage === i + 1 ? C.primary : C.surface, border: `1px solid ${currentPage === i + 1 ? C.primary : C.border}`, color: currentPage === i + 1 ? '#fff' : C.text, borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                style={{ padding: '8px', background: C.surface, border: `1px solid ${C.border}`, color: currentPage === totalPages ? C.muted : C.text, borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* MODALS */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setModalMode(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}></div>
          <div className="animate-modal hide-scroll" style={{ position: 'relative', width: '100%', maxWidth: '520px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: C.text }}>
                {modalMode === 'add' ? 'Add New Employee' : 'Edit Employee Profile'}
              </h2>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              {modalMode === 'edit' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LabelBase}>Login ID</label>
                  <input style={{ ...InputBase, fontFamily: 'monospace', opacity: 0.7, cursor: 'not-allowed' }} value={formData.loginId || ''} disabled readOnly />
                </div>
              )}
              <div>
                <label style={LabelBase}>Full Name</label>
                <input style={InputBase} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label style={LabelBase}>Email</label>
                <input type="email" style={InputBase} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@empay.com" />
              </div>
              <div>
                <label style={LabelBase}>Phone</label>
                <div style={{ ...InputBase, display: 'flex', alignItems: 'center', padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 12px', background: C.surfaceHover, color: C.muted, borderRight: `1px solid ${C.border}`, fontSize: '14px' }}>+91</div>
                  <input style={{ flex: 1, background: 'transparent', border: 'none', color: C.text, padding: '10px 12px', outline: 'none', fontSize: '14px', fontFamily: C.font }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" />
                </div>
              </div>
              <div>
                <label style={LabelBase}>Department</label>
                <select style={InputBase} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                  <option value="Unassigned">Unassigned</option>
                  {activeDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={LabelBase}>Role</label>
                <select 
                  style={InputBase} 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Employee">Employee</option>
                  <option value="HR Officer">HR Officer</option>
                  <option value="Payroll Officer">Payroll Officer</option>
                </select>
              </div>
              <div>
                <label style={LabelBase}>Date of Joining</label>
                <input type="date" style={InputBase} value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
              </div>
              {modalMode === 'edit' && (
                <div>
                  <label style={LabelBase}>Status</label>
                  <select style={InputBase} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {modalMode === 'add' && (
              <div style={{ marginTop: '24px', padding: '16px', background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '12px', color: C.muted, marginBottom: '12px' }}>Generated ID: <span style={{ color: C.text, fontFamily: 'monospace' }}>HR{generateNamePart(formData.name)}{formData.joinDate ? formData.joinDate.substring(0, 4) : new Date().getFullYear()}{String(employees.length + 1).padStart(4, '0')}</span></div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { text: 'HR', label: 'Company' },
                    { text: generateNamePart(formData.name), label: 'Name' },
                    { text: formData.joinDate ? formData.joinDate.substring(0, 4) : String(new Date().getFullYear()), label: 'Year' },
                    { text: String(employees.length + 1).padStart(4, '0'), label: 'Serial' }
                  ].map((p, i) => (
                    <div key={i} style={{ 
                      padding: '8px', 
                      background: C.surfaceHover, 
                      border: `1px solid ${C.border}`, 
                      borderRadius: '8px',
                      animation: `fadeIn 0.3s ease-out ${i * 100}ms forwards`,
                      opacity: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      flex: 1,
                      minWidth: '60px'
                    }}>
                      <span style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: C.primary, fontFamily: 'monospace' }}>{p.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalMode === 'add' && (
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '16px', textAlign: 'center' }}>
                Temporary password will be auto-generated and shared with employee.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setModalMode(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${C.border}`, color: C.text, borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={isCreating || isUpdating} style={{ flex: 1, padding: '12px', background: C.primary, border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: `0 4px 12px ${C.primary}40`, opacity: (isCreating || isUpdating) ? 0.5 : 1 }}>
                {(isCreating || isUpdating) ? 'Saving...' : (modalMode === 'add' ? 'Create Employee' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'view' && selectedEmployee && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setModalMode(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}></div>
          <div className="animate-modal" style={{ position: 'relative', width: '100%', maxWidth: '480px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <button onClick={() => setModalMode(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', marginBottom: '16px',
                background: deptColors[selectedEmployee.department] || C.primary, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '24px', fontWeight: '600',
                boxShadow: `0 8px 24px ${deptColors[selectedEmployee.department]}40`
              }}>
                {getInitials(selectedEmployee.name)}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: C.text, marginBottom: '8px' }}>{selectedEmployee.name}</div>
              <div style={{ padding: '4px 12px', background: C.surfaceHover, borderRadius: '16px', fontSize: '12px', color: C.muted }}>{selectedEmployee.role}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px', background: C.bg, padding: '20px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Login ID</div>
                <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>{selectedEmployee.loginId}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</div>
                <div style={{ fontSize: '14px', color: deptColors[selectedEmployee.department], fontWeight: '500' }}>{selectedEmployee.department}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
                <div style={{ fontSize: '14px' }}>{selectedEmployee.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</div>
                <div style={{ fontSize: '14px' }}>+91 {selectedEmployee.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Join Date</div>
                <div style={{ fontSize: '14px' }}>{selectedEmployee.joinDate}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                <div style={{ fontSize: '14px', color: selectedEmployee.status === 'Active' ? C.success : C.danger, fontWeight: '500' }}>{selectedEmployee.status}</div>
              </div>
            </div>

             <div style={{ padding: '20px', background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Attendance (Preview)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                   <span style={{ color: C.muted, fontWeight: '500' }}>To view precise attendance data, navigate to Attendance Monitor.</span>
                </div>
             </div>

            <div style={{ fontSize: '12px', color: C.muted, textAlign: 'center', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
               Salary information is restricted
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
