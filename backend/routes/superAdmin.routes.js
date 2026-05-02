import express from "express";
import { reviewCompanyRequest, listCompanyRequests } from "../controllers/superAdmin.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

/** Mounted at app.use("/api/company-requests", …) → /api/company-requests, /api/company-requests/:id/review */
router.get("/", authRequired, requireRole("superadmin"), listCompanyRequests);
router.post("/:id/review", authRequired, requireRole("superadmin"), reviewCompanyRequest);

export default router;
