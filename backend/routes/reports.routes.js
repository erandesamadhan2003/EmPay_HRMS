import express from "express";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";
import {
	salaryStatementReport,
	payrollSummaryReport,
	employeeCountReport,
} from "../controllers/reports.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/reports", …) */
router.get("/salary-statement", authRequired, requireRoles("admin", "payroll_officer"), salaryStatementReport);
router.get("/payroll-summary", authRequired, requireRoles("admin", "payroll_officer"), payrollSummaryReport);
router.get("/employee-count", authRequired, requireRoles("admin", "payroll_officer"), employeeCountReport);

export default router;
