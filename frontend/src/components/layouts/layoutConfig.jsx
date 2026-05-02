// ─── EmPay Layout Color Constants & Role Config ───

export const C = {
  bg: '#0A0A0F',
  surface: '#13131A',
  surfaceHover: '#1A1A24',
  accent: '#14B8A6',
  accentLight: 'rgba(20,184,166,0.15)',
  accentGlow: 'rgba(20,184,166,0.25)',
  cyan: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#F0FDFA',
  muted: '#8B8A9B',
  border: '#2E2E3E',
};

export const ROLE_BADGE_COLORS = {
  admin: C.accent,
  hr: C.cyan,
  payroll: C.warning,
  employee: C.success,
  superadmin: '#8B5CF6',
};

export const NAV_CONFIG = {
  admin: [
    { label: 'Dashboard', icon: 'grid', path: '/admin/dashboard' },
    { label: 'Employees', icon: 'users', path: '/admin/employees' },
    { label: 'Departments', icon: 'building', path: '/admin/departments' },
    { label: 'Attendance', icon: 'clock', path: '/admin/attendance' },
    { label: 'Leave Management', icon: 'calendar', path: '/admin/leaves' },
    { label: 'Payroll', icon: 'dollar', path: '/admin/payroll' },
    { label: 'Reports', icon: 'bar-chart', path: '/admin/reports' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' },
    { label: 'Assistant', icon: 'activity', path: '/admin/assistant' },
  ],
  hr: [
    { label: 'Dashboard', icon: 'grid', path: '/hr/dashboard' },
    { label: 'Employees', icon: 'users', path: '/hr/employees' },
    { label: 'Attendance Monitor', icon: 'clock', path: '/hr/attendance' },
    { label: 'Leave Allocation', icon: 'gift', path: '/hr/leave-allocation' },
    { label: 'Leave Requests', icon: 'calendar', path: '/hr/leave-requests' },
    { label: 'Assistant', icon: 'activity', path: '/hr/assistant' },
    { label: 'Profile', icon: 'user', path: '/hr/profile' },
  ],
  payroll: [
    { label: 'Dashboard', icon: 'grid', path: '/payroll/dashboard' },
    { label: 'Payroll Management', icon: 'dollar', path: '/payroll/manage' },
    { label: 'Payslips', icon: 'file-text', path: '/payroll/payslips' },
    { label: 'Salary Management', icon: 'trending-up', path: '/payroll/salary' },
    { label: 'Leave Requests', icon: 'calendar', path: '/payroll/leave-requests' },
    { label: 'Reports', icon: 'bar-chart', path: '/payroll/reports' },
    { label: 'Profile', icon: 'user', path: '/payroll/profile' },
  ],
  employee: [
    { label: 'Dashboard', icon: 'grid', path: '/employee/dashboard' },
    { label: 'Attendance', icon: 'clock', path: '/employee/attendance' },
    { label: 'Apply Leave', icon: 'plus-circle', path: '/employee/apply-leave' },
    { label: 'My Leaves', icon: 'calendar', path: '/employee/my-leaves' },
    { label: 'Payslips', icon: 'file-text', path: '/employee/payslips' },
    { label: 'Assistant', icon: 'activity', path: '/employee/assistant' },
    { label: 'Profile', icon: 'user', path: '/employee/profile' },
  ],
  superadmin: [
    { label: 'Dashboard', icon: 'grid', path: '/superadmin/dashboard' },
    { label: 'Company Requests', icon: 'bell', path: '/superadmin/company-requests' },
    { label: 'Companies', icon: 'building', path: '/superadmin/companies' },
    { label: 'Audit Logs', icon: 'file-list', path: '/superadmin/audit-logs' },
    { label: 'Profile', icon: 'user', path: '/superadmin/profile' },
  ],
};

// ─── SVG Icon Component (pure inline SVG, no library) ───
export function Icon({ name, size = 20, color = C.muted }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    grid: <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    users: <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    clock: <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    calendar: <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    dollar: <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    'bar-chart': <svg {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    settings: <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    user: <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    building: <svg {...p}><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 22v-4h6v4"/></svg>,
    gift: <svg {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
    'file-text': <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    'plus-circle': <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    'trending-up': <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    'log-out': <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    search: <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell: <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    menu: <svg {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    'chevron-left': <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>,
    'chevron-right': <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    x: <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    activity: <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    'file-list': <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  };
  return icons[name] || null;
}
