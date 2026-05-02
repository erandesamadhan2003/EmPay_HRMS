import express from "express";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";
import {
	getAllocations,
	createAllocationController,
	getMyAllocationsController,
	updateAllocationController,
	deleteAllocationController,
	listRequestsController,
	createRequestController,
	myRequestsController,
	getRequestByIdController,
	approveRequestController,
	rejectRequestController,
	cancelRequestController,
} from "../controllers/timeOff.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/time-off", …) */
router.get("/allocations", authRequired, requireRoles("admin", "hr_officer"), getAllocations);
router.post("/allocations", authRequired, requireRoles("admin", "hr_officer"), createAllocationController);
router.get("/allocations/me", authRequired, getMyAllocationsController);
router.put("/allocations/:id", authRequired, requireRoles("admin", "hr_officer"), updateAllocationController);
router.delete("/allocations/:id", authRequired, requireRoles("admin"), deleteAllocationController);

router.get("/requests", authRequired, requireRoles("admin", "payroll_officer"), listRequestsController);
router.post("/requests", authRequired, createRequestController);
router.get("/requests/me", authRequired, myRequestsController);
router.get("/requests/:id", authRequired, getRequestByIdController);
router.put("/requests/:id/approve", authRequired, requireRoles("admin", "payroll_officer"), approveRequestController);
router.put("/requests/:id/reject", authRequired, requireRoles("admin", "payroll_officer"), rejectRequestController);
router.put("/requests/:id/cancel", authRequired, cancelRequestController);

export default router;
