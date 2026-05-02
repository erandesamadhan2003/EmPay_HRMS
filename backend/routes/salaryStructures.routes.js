import express from "express";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";
import {
	getSalaryStructures,
	createSalaryStructure,
	getSalaryStructureById,
	updateSalaryStructure,
	removeSalaryStructure,
} from "../controllers/salaryStructures.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/salary-structures", …) */
router.get("/", authRequired, requireRoles("admin", "payroll_officer"), getSalaryStructures);
router.post("/", authRequired, requireRoles("admin", "payroll_officer"), createSalaryStructure);
router.get("/:id", authRequired, requireRoles("admin", "payroll_officer"), getSalaryStructureById);
router.put("/:id", authRequired, requireRoles("admin", "payroll_officer"), updateSalaryStructure);
router.delete("/:id", authRequired, requireRoles("admin", "payroll_officer"), removeSalaryStructure);

export default router;
