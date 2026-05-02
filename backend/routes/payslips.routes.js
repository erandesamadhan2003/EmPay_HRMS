import express from "express";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";
import {
	getPayslipsController,
	getMyPayslipsController,
	getPayslipByIdController,
	getPayslipPdfController,
} from "../controllers/payslips.controller.js";
import { regeneratePayslipForPayrun } from "../controllers/payruns.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/payslips", …) */
router.get("/", authRequired, requireRoles("admin", "payroll_officer"), getPayslipsController);
router.get("/me", authRequired, getMyPayslipsController);
router.post("/:payrunId/regenerate", authRequired, requireRoles("admin", "payroll_officer"), regeneratePayslipForPayrun);
router.get("/:id/pdf", authRequired, getPayslipPdfController);
router.get("/:id", authRequired, getPayslipByIdController);

export default router;
