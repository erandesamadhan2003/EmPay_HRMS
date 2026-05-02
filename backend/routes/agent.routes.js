import express from "express";
import { authRequired } from "../middleware/auth.middleware.js";
import { agentChat } from "../controllers/agent.controller.js";

const router = express.Router();

/** Mounted at app.use("/api/agent", …) */
router.post("/chat", authRequired, agentChat);

export default router;
