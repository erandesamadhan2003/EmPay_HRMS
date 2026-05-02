import express from "express";
import {
	checkIn,
	checkOut,
	getMyAttendance,
	listOrgAttendance,
	getUserAttendance,
	attendanceSummary,
	updateAttendanceRecord,
} from "../controllers/attendance.controller.js";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/** Mounted at app.use("/api/attendance", …) */
router.post("/check-in", authRequired, checkIn);
router.post("/check-out", authRequired, checkOut);
router.get("/me", authRequired, getMyAttendance);
router.get("/summary/:userId", authRequired, attendanceSummary);
router.get("/", authRequired, requireRoles("admin", "hr_officer", "payroll_officer"), listOrgAttendance);
router.get("/:userId", authRequired, getUserAttendance);
router.put("/:id", authRequired, requireRoles("admin"), updateAttendanceRecord);

export default router;
