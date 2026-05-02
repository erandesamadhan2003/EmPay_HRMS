import express from "express";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";
import {
	getPayruns,
	createPayrunController,
	getPayrunByIdController,
	validatePayrunController,
	payPayrunController,
	cancelPayrunController,
} from "../controllers/payruns.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/payruns", …) */
router.get("/", authRequired, requireRoles("admin", "payroll_officer"), getPayruns);
router.post("/", authRequired, requireRoles("admin", "payroll_officer"), createPayrunController);
router.get("/:id", authRequired, requireRoles("admin", "payroll_officer"), getPayrunByIdController);
router.post("/:id/validate", authRequired, requireRoles("admin", "payroll_officer"), validatePayrunController);
router.post("/:id/pay", authRequired, requireRoles("admin", "payroll_officer"), payPayrunController);
router.post("/:id/cancel", authRequired, requireRoles("admin", "payroll_officer"), cancelPayrunController);

export default router;
