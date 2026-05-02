import express from "express";
import {
	getEmployees,
	createEmployee,
	getMe,
	updateMe,
	getById,
	updateEmployee,
	deleteEmployee,
	getEmployeeSalary,
	putEmployeeSalary,
} from "../controllers/employees.controller.js";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/** Mounted at app.use("/api/employees", …) */
router.get("/", authRequired, getEmployees);
router.post("/", authRequired, requireRoles("admin", "hr_officer"), createEmployee);
router.get("/me", authRequired, getMe);
router.put("/me", authRequired, updateMe);
router.get("/:id/salary", authRequired, requireRoles("admin", "payroll_officer"), getEmployeeSalary);
router.put("/:id/salary", authRequired, requireRoles("admin", "payroll_officer"), putEmployeeSalary);
router.get("/:id", authRequired, getById);
router.put("/:id", authRequired, requireRoles("admin", "hr_officer"), updateEmployee);
router.delete("/:id", authRequired, requireRoles("admin"), deleteEmployee);

export default router;
