import express from "express";
import { authRequired } from "../middleware/auth.middleware.js";
import { getAuditLogs } from "../controllers/auditLogs.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/audit-logs", …) */
router.get("/", authRequired, getAuditLogs);

export default router;
