import express from "express";
import { getDepartments, createDept, updateDept, deleteDept } from "../controllers/departments.controller.js";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/** Mounted at app.use("/api/departments", …) */
router.get("/", authRequired, getDepartments);
router.post("/", authRequired, requireRoles("admin", "hr_officer"), createDept);
router.put("/:id", authRequired, requireRoles("admin", "hr_officer"), updateDept);
router.delete("/:id", authRequired, requireRoles("admin"), deleteDept);

export default router;
