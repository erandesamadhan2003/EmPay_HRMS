import express from "express";
import {
	login,
	registerUser,
	changePassword,
	logout,
	refreshToken,
	resetPassword,
} from "../controllers/auth.controller.js";
import { authRequired, requireRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/** Mounted at app.use("/api/auth", …) → /api/auth/login, etc. */
router.post("/login", login);
router.post("/register", registerUser);
router.post("/change-password", authRequired, changePassword);
router.post("/logout", authRequired, logout);
router.post("/refresh", refreshToken);
router.post("/reset-password", authRequired, requireRoles("admin"), resetPassword);

export default router;
