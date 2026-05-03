import { createBrowserRouter, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

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
import AdminAssistant from "../pages/admin/Assistant";

// HR
import HRDashboard from "../pages/hr/Dashboard";
import HREmployees from "../pages/hr/EmployeeManagement";
import HRAttendance from "../pages/hr/AttendanceMonitor";
import HRLeaveAllocation from "../pages/hr/LeaveAllocation";
import HRLeaveRequests from "../pages/hr/LeaveRequests";
import HRApplyLeave from "../pages/hr/ApplyLeave";
import HRMyLeaves from "../pages/hr/MyLeaves";
import HRProfile from "../pages/hr/Profile";
import HRAssistant from "../pages/hr/Assistant";

// Payroll
import PayrollDashboard from "../pages/payroll/Dashboard";
import PayrollManagement from "../pages/payroll/PayrollManagement";
import PayrollPayslips from "../pages/payroll/Payslips";
import PayrollSalary from "../pages/payroll/SalaryManagement";
import PayrollApplyLeave from "../pages/payroll/ApplyLeave";
import PayrollMyLeaves from "../pages/payroll/MyLeaves";
import PayrollReports from "../pages/payroll/Reports";
import PayrollProfile from "../pages/payroll/Profile";

// Employee
import EmpDashboard from "../pages/employee/Dashboard";
import EmpAttendance from "../pages/employee/Attendance";
import EmpApplyLeave from "../pages/employee/ApplyLeave";
import EmpMyLeaves from "../pages/employee/MyLeaves";
import EmpPayslips from "../pages/employee/Payslips";
import EmpProfile from "../pages/employee/Profile";
import EmpAssistant from "../pages/employee/Assistant";

// Super Admin
import SuperAdminDashboard from "../pages/superadmin/Dashboard";
import SuperAdminRequests from "../pages/superadmin/CompanyRequests";
import SuperAdminCompanies from "../pages/superadmin/CompaniesManagement";
import SuperAdminAuditLogs from "../pages/superadmin/AuditLogs";
import SuperAdminProfile from "../pages/superadmin/Profile";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) {
    return null;
  }

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    // Force password change if required
    if (user.must_change_pwd && window.location.pathname !== "/change-password") {
      return <Navigate to="/change-password" replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      const roleDashboards = {
        superadmin: "/superadmin/dashboard",
        admin: "/admin/dashboard",
        hr: "/hr/dashboard",
        payroll: "/payroll/dashboard",
        payroll_officer: "/payroll/dashboard",
        employee: "/employee/dashboard",
      };

      const redirectPath = roleDashboards[user.role] || "/login";
      return <Navigate to={redirectPath} replace />;
    }

    return children;
  } catch (error) {
    console.error("Auth check failed:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) {
    return null;
  }

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);

      // If user must change password, redirect to change-password
      if (user.must_change_pwd) {
        return <Navigate to="/change-password" replace />;
      }

      // Redirect to appropriate dashboard based on role
      const roleDashboards = {
        superadmin: "/superadmin/dashboard",
        admin: "/admin/dashboard",
        hr: "/hr/dashboard",
        payroll: "/payroll/dashboard",
        payroll_officer: "/payroll/dashboard",
        employee: "/employee/dashboard",
      };

      const redirectPath = roleDashboards[user.role] || "/employee/dashboard";
      return <Navigate to={redirectPath} replace />;
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  return children;
};

const router = createBrowserRouter([
  // Public / Auth Routes
  {
    path: "/",
    element: (
      <PublicRoute>
        <LandingPage />
      </PublicRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <CreateEmployeePage />
      </PublicRoute>
    ),
  },
  {
    path: "/change-password",
    element: (
      <ProtectedRoute allowedRoles={["admin", "hr", "payroll", "payroll_officer", "employee", "superadmin"]}>
        <ChangePassword />
      </ProtectedRoute>
    ),
  },
  // Admin Routes
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/employees",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminEmployees />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/departments",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDepartments />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/attendance",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminAttendance />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/leaves",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLeaves />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/payroll",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPayroll />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/reports",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminReports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/profile",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/assistant",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminAssistant />
      </ProtectedRoute>
    ),
  },

  // HR Routes
  {
    path: "/hr/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HRDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hr/employees",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HREmployees />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hr/attendance",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HRAttendance />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hr/leave-allocation",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HRLeaveAllocation />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hr/leave-requests",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HRLeaveRequests />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hr/apply-leave",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HRApplyLeave />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hr/my-leaves",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HRMyLeaves />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hr/profile",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HRProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hr/assistant",
    element: (
      <ProtectedRoute allowedRoles={["hr", "hr_officer"]}>
        <HRAssistant />
      </ProtectedRoute>
    ),
  },

  // Payroll Routes
  {
    path: "/payroll/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["payroll", "payroll_officer"]}>
        <PayrollDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payroll/management",
    element: (
      <ProtectedRoute allowedRoles={["payroll", "payroll_officer"]}>
        <PayrollManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payroll/payslips",
    element: (
      <ProtectedRoute allowedRoles={["payroll", "payroll_officer"]}>
        <PayrollPayslips />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payroll/salary",
    element: (
      <ProtectedRoute allowedRoles={["payroll", "payroll_officer"]}>
        <PayrollSalary />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payroll/apply-leave",
    element: (
      <ProtectedRoute allowedRoles={["payroll", "payroll_officer"]}>
        <PayrollApplyLeave />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payroll/my-leaves",
    element: (
      <ProtectedRoute allowedRoles={["payroll", "payroll_officer"]}>
        <PayrollMyLeaves />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payroll/reports",
    element: (
      <ProtectedRoute allowedRoles={["payroll", "payroll_officer"]}>
        <PayrollReports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payroll/profile",
    element: (
      <ProtectedRoute allowedRoles={["payroll", "payroll_officer"]}>
        <PayrollProfile />
      </ProtectedRoute>
    ),
  },

  // Employee Routes
  {
    path: "/employee/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmpDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/employee/attendance",
    element: (
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmpAttendance />
      </ProtectedRoute>
    ),
  },
  {
    path: "/employee/apply-leave",
    element: (
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmpApplyLeave />
      </ProtectedRoute>
    ),
  },
  {
    path: "/employee/my-leaves",
    element: (
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmpMyLeaves />
      </ProtectedRoute>
    ),
  },
  {
    path: "/employee/payslips",
    element: (
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmpPayslips />
      </ProtectedRoute>
    ),
  },
  {
    path: "/employee/profile",
    element: (
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmpProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/employee/assistant",
    element: (
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmpAssistant />
      </ProtectedRoute>
    ),
  },

  // Super Admin Routes
  {
    path: "/superadmin/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["superadmin"]}>
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/superadmin/company-requests",
    element: (
      <ProtectedRoute allowedRoles={["superadmin"]}>
        <SuperAdminRequests />
      </ProtectedRoute>
    ),
  },
  {
    path: "/superadmin/companies",
    element: (
      <ProtectedRoute allowedRoles={["superadmin"]}>
        <SuperAdminCompanies />
      </ProtectedRoute>
    ),
  },
  {
    path: "/superadmin/audit-logs",
    element: (
      <ProtectedRoute allowedRoles={["superadmin"]}>
        <SuperAdminAuditLogs />
      </ProtectedRoute>
    ),
  },
  {
    path: "/superadmin/profile",
    element: (
      <ProtectedRoute allowedRoles={["superadmin"]}>
        <SuperAdminProfile />
      </ProtectedRoute>
    ),
  },
]);

export default router;