import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/auth/LandingPage";
import AdminDashboard from "../pages/admin/Dashboard";
import EmployeeManagement from "../pages/admin/EmployeeManagement";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/admin/dashboard", element: <AdminDashboard /> },
  { path: "/admin/employees", element: <EmployeeManagement /> },
]);

export default router;
