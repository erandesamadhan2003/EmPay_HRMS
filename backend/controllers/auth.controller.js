import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { successResponse, errorResponse } from "../utils/constant.js";
import { generateLoginId } from "../utils/loginId.js";
import { createCompany as createCompanyModel, findCompanyById } from "../models/Company.js";
import {
	createUser,
	findUserAuthByLogin,
	findUserPasswordById,
	updateUserLoginId,
	updateUserPassword,
	findUserById,
} from "../models/User.js";
import { createEmployeeProfile } from "../models/EmployeeProfile.js";
import {
	createCompanyRequest,
	findCompanyRequestByCompanyId,
} from "../models/CompanyRequest.js";
import { sendEmail } from "../utils/emailService.js";
import { generateSuperAdminRegistrationTemplate } from "../templates/registrationEmail.js";

dotenv.config();

export async function createCompany(req, res) {
	try {
		const { name, logo_url, logoUrl } = req.body;
		if (!name) return res.status(400).json(errorResponse("Company name required"));
		const company = await createCompanyModel(req.db, {
			name,
			logoUrl: logo_url ?? logoUrl ?? null,
		});
		return res.json(
			successResponse(
				{
					id: company.id,
					name: company.name,
					logoUrl: company.logo_url,
					createdAt: company.created_at,
					updatedAt: company.updated_at,
				},
				"Company created",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to create company"));
	}
}

export async function registerUser(req, res) {
	const client = await req.db.connect();
	try {
		const { company_id, name, email, phone, first_name, last_name, date_of_joining } =
			req.body;
		if (!company_id || !name || !email) {
			return res.status(400).json(errorResponse("company_id, name, email required"));
		}

		await client.query("BEGIN");

		const plain = "samadhan";
		const password_hash = await bcrypt.hash(plain, 10);

		const company = await findCompanyById(client, company_id);
		if (!company) {
			await client.query("ROLLBACK");
			return res.status(404).json(errorResponse("Company not found"));
		}

		const tempLogin = `TMP-${Date.now()}`;
		const user = await createUser(client, {
			companyId: company_id,
			loginId: tempLogin,
			name,
			email,
			phone,
			passwordHash: password_hash,
			role: "admin",
			isActive: false,
			mustChangePwd: true,
		});

		const doj = date_of_joining || new Date().toISOString().slice(0, 10);
		await createEmployeeProfile(client, {
			userId: user.id,
			companyId: company_id,
			dateOfJoining: doj,
		});

		const loginId = await generateLoginId(
			client,
			company_id,
			company.name,
			first_name || name.split(" ")[0],
			last_name || name.split(" ")[1] || "",
			doj,
		);
		await updateUserLoginId(client, user.id, loginId);

		let requestRow = await findCompanyRequestByCompanyId(client, company_id);
		if (!requestRow) {
			requestRow = await createCompanyRequest(client, {
				companyId: company_id,
				adminUserId: user.id,
			});
		}

		await client.query("COMMIT");

		const notificationRecipient = process.env.SUPER_ADMIN_EMAIL || "samadhanerande2003@gmail.com";
		const emailTemplate = generateSuperAdminRegistrationTemplate({
			companyName: company.name,
			userName: user.name,
			userEmail: user.email,
			userPhone: user.phone,
			loginId,
			companyId: company_id,
			registrationDate: new Date().toLocaleString(),
		});

		const emailResult = await sendEmail({
			to: notificationRecipient,
			subject: emailTemplate.subject,
			html: emailTemplate.html,
			text: emailTemplate.text,
		});

		console.log("Super admin registration notification sent:", emailResult);

		return res.json(
			successResponse(
				{
					id: user.id,
					loginId,
					companyRequestId: requestRow?.id ?? null,
					notificationEmailSent: emailResult.success,
				},
				"User registered - pending approval",
			),
		);
	} catch (err) {
		await client.query("ROLLBACK");
		if (err.code === "23505") {
			const detail = String(err.detail || err.constraint || "");
			const msg =
				/login_id|users_login_id/i.test(detail) ?
					"Login id already in use"
					: "User with this email already exists";
			return res.status(409).json(errorResponse(msg));
		}
		console.error(err);
		return res.status(500).json(errorResponse("Registration failed"));
	} finally {
		client.release();
	}
}

export async function login(req, res) {
	try {
		const { login_id, password } = req.body;
		if (!login_id || !password) {
			return res.status(400).json(errorResponse("login_id and password required"));
		}
		const user = await findUserAuthByLogin(req.db, login_id);
		if (!user) return res.status(404).json(errorResponse("User not found"));
		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) return res.status(401).json(errorResponse("Invalid credentials"));
		if (!user.is_active) {
			return res.status(403).json(errorResponse("Account not active yet"));
		}

		const payload = { id: user.id, role: user.role, company_id: user.company_id };
		const token = jwt.sign(payload, process.env.JWT_SECRET || "PayrollJWTSecretKey", {
			expiresIn: "7d",
		});

		const company = user.company_id ?
			(await findCompanyById(req.db, user.company_id))?.name
			: null;

		const must = user.must_change_pwd;
		return res.json(
			successResponse(
				{
					token,
					must_change_pwd: must,
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						role: user.role,
						loginId: user.login_id,
						companyId: user.company_id,
						companyName: company,
						avatarUrl: user.avatar_url,
						must_change_pwd: must,
					},
				},
				must ?
					"Login successful. Password change required."
					: "Login successful",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Login error"));
	}
}

export async function changePassword(req, res) {
	try {
		const userId = req.user?.id;
		const current_password =
			req.body.current_password ?? req.body.currentPassword ?? null;
		const new_password =
			req.body.new_password ?? req.body.newPassword ?? req.body.password;
		const confirm_password =
			req.body.confirm_password ?? req.body.confirmPassword ?? new_password;

		if (!userId) return res.status(401).json(errorResponse("Unauthorized"));
		if (!new_password) {
			return res.status(400).json(errorResponse("new_password is required"));
		}
		if (new_password !== confirm_password) {
			return res.status(400).json(errorResponse("Password confirmation does not match"));
		}
		if (new_password.length < 6) {
			return res.status(400).json(errorResponse("New password must be at least 6 characters"));
		}

		const user = await findUserPasswordById(req.db, userId);
		if (!user) return res.status(404).json(errorResponse("User not found"));

		if (!user.must_change_pwd) {
			if (!current_password) {
				return res.status(400).json(errorResponse("current_password is required"));
			}
			const currentMatches = await bcrypt.compare(
				current_password,
				user.password_hash,
			);
			if (!currentMatches) {
				return res.status(401).json(errorResponse("Current password is incorrect"));
			}
		}

		const newHash = await bcrypt.hash(new_password, 10);
		await updateUserPassword(req.db, userId, newHash);

		return res.json(
			successResponse({ must_change_pwd: false }, "Password updated successfully"),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update password"));
	}
}

export async function logout(req, res) {
	return res.json(successResponse(null, "Logged out successfully"));
}

export async function refreshToken(req, res) {
	return res.status(501).json(errorResponse("Token refresh scheduled for Phase 2"));
}

export async function resetPassword(req, res) {
	try {
		const requester = req.user;
		if (!requester || requester.role !== "admin") {
			return res.status(403).json(errorResponse("Forbidden"));
		}
		const userId = req.body?.userId;
		if (!userId) return res.status(400).json(errorResponse("userId required"));
		const target = await findUserById(req.db, userId);
		if (!target || String(target.company_id) !== String(requester.company_id)) {
			return res.status(404).json(errorResponse("User not found"));
		}
		const temp = Math.random().toString(36).slice(-10);
		const hash = await bcrypt.hash(temp, 10);
		await req.db.query(
			`UPDATE users SET password_hash = $1, must_change_pwd = TRUE, updated_at = NOW() WHERE id = $2`,
			[hash, userId],
		);
		return res.json(
			successResponse(
				{ tempPassword: temp },
				"Password reset. New credentials sent to employee email.",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to reset password"));
	}
}
