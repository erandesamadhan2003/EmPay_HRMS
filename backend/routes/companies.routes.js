import express from "express";
import { createCompany } from "../controllers/auth.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/companies", …) → POST /api/companies */
router.post("/", createCompany);

export default router;
