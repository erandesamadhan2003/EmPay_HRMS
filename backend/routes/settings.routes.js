import express from "express";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";
import {
	getSettingsUsers,
	updateSettingsUserRole,
	getSettingsCompany,
	updateSettingsCompany,
} from "../controllers/settings.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/settings", …) */
router.get("/users", authRequired, requireRoles("admin"), getSettingsUsers);
router.put("/users/:id/role", authRequired, requireRoles("admin"), updateSettingsUserRole);
router.get("/company", authRequired, requireRoles("admin"), getSettingsCompany);
router.put("/company", authRequired, requireRoles("admin"), updateSettingsCompany);

export default router;
