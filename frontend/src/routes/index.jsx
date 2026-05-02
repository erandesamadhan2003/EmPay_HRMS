import { createBrowserRouter } from "react-router-dom";

// Auth
import LandingPage from "../pages/auth/LandingPage";
import LoginPage from "../pages/auth/Login";
import CreateEmployeePage from "../pages/auth/Register"; 
import ChangePassword from "../pages/auth/ChangePassword";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";
import AdminEmployees from "../pages/admin/EmployeeManagement";
import AdminDepartments from "../pages/admin/DepartmentManagement";
import AdminAttendance from "../pages/admin/AttendanceOverview";
import AdminLeaves from "../pages/admin/LeaveManagement";
import AdminPayroll from "../pages/admin/PayrollOverview";
import AdminReports from "../pages/admin/Reports";
import AdminSettings from "../pages/admin/Settings";
import AdminProfile from "../pages/admin/Profile";

// HR
import HRDashboard from "../pages/hr/Dashboard";
import HREmployees from "../pages/hr/EmployeeManagement";
import HRAttendance from "../pages/hr/AttendanceMonitor";
import HRLeaveAllocation from "../pages/hr/LeaveAllocation";
import HRLeaveRequests from "../pages/hr/LeaveRequests";
import HRProfile from "../pages/hr/Profile";

// Payroll
import PayrollDashboard from "../pages/payroll/Dashboard";
import PayrollManagement from "../pages/payroll/PayrollManagement";
import PayrollPayslips from "../pages/payroll/Payslips";
import PayrollSalary from "../pages/payroll/SalaryManagement";
import PayrollLeaves from "../pages/payroll/LeaveRequests";
import PayrollReports from "../pages/payroll/Reports";
import PayrollProfile from "../pages/payroll/Profile";

// Employee
import EmpDashboard from "../pages/employee/Dashboard";
import EmpAttendance from "../pages/employee/Attendance";
import EmpApplyLeave from "../pages/employee/ApplyLeave";
import EmpMyLeaves from "../pages/employee/MyLeaves";
import EmpPayslips from "../pages/employee/Payslips";
import EmpProfile from "../pages/employee/Profile";

// Super Admin
import SuperAdminDashboard from "../pages/superadmin/Dashboard";
import SuperAdminRequests from "../pages/superadmin/CompanyRequests";
import SuperAdminCompanies from "../pages/superadmin/CompaniesManagement";
import SuperAdminAuditLogs from "../pages/superadmin/AuditLogs";
import SuperAdminProfile from "../pages/superadmin/Profile";


const router = createBrowserRouter([
  // Public / Auth
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <CreateEmployeePage /> },
  { path: "/change-password", element: <ChangePassword /> },

  // Admin
  { path: "/admin/dashboard", element: <AdminDashboard /> },
  { path: "/admin/employees", element: <AdminEmployees /> },
  { path: "/admin/departments", element: <AdminDepartments /> },
  { path: "/admin/attendance", element: <AdminAttendance /> },
  { path: "/admin/leaves", element: <AdminLeaves /> },
  { path: "/admin/payroll", element: <AdminPayroll /> },
  { path: "/admin/reports", element: <AdminReports /> },
  { path: "/admin/settings", element: <AdminSettings /> },
  { path: "/admin/profile", element: <AdminProfile /> },

  // HR
  { path: "/hr/dashboard", element: <HRDashboard /> },
  { path: "/hr/employees", element: <HREmployees /> },
  { path: "/hr/attendance", element: <HRAttendance /> },
  { path: "/hr/leave-allocation", element: <HRLeaveAllocation /> },
  { path: "/hr/leave-requests", element: <HRLeaveRequests /> },
  { path: "/hr/profile", element: <HRProfile /> },

  // Payroll
  { path: "/payroll/dashboard", element: <PayrollDashboard /> },
  { path: "/payroll/management", element: <PayrollManagement /> },
  { path: "/payroll/payslips", element: <PayrollPayslips /> },
  { path: "/payroll/salary", element: <PayrollSalary /> },
  { path: "/payroll/leaves", element: <PayrollLeaves /> },
  { path: "/payroll/reports", element: <PayrollReports /> },
  { path: "/payroll/profile", element: <PayrollProfile /> },

  // Employee
  { path: "/employee/dashboard", element: <EmpDashboard /> },
  { path: "/employee/attendance", element: <EmpAttendance /> },
  { path: "/employee/apply-leave", element: <EmpApplyLeave /> },
  { path: "/employee/my-leaves", element: <EmpMyLeaves /> },
  { path: "/employee/payslips", element: <EmpPayslips /> },
  { path: "/employee/profile", element: <EmpProfile /> },

  // Super Admin
  { path: "/superadmin/dashboard", element: <SuperAdminDashboard /> },
  { path: "/superadmin/company-requests", element: <SuperAdminRequests /> },
  { path: "/superadmin/companies", element: <SuperAdminCompanies /> },
  { path: "/superadmin/audit-logs", element: <SuperAdminAuditLogs /> },
  { path: "/superadmin/profile", element: <SuperAdminProfile /> },

]);

export default router;