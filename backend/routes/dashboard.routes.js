import express from "express";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";
import {
	dashboardStats,
	dashboardEmployerCost,
	dashboardEmployeeCount,
	dashboardWarnings,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/dashboard", …) */
router.get("/stats", authRequired, dashboardStats);
router.get("/employer-cost", authRequired, requireRoles("admin", "payroll_officer"), dashboardEmployerCost);
router.get("/employee-count", authRequired, requireRoles("admin", "payroll_officer"), dashboardEmployeeCount);
router.get("/warnings", authRequired, requireRoles("admin", "payroll_officer"), dashboardWarnings);

export default router;
