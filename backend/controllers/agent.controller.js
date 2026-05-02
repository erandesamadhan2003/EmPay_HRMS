import jwt from "jsonwebtoken";
import { errorResponse, successResponse } from "../utils/constant.js";
import {
	countUserAttendanceEntriesMonth,
	listUserAttendanceMonth,
} from "../models/Attendance.js";
import { countPayslipsGlobal, listPayslipsGlobal } from "../models/Payrun.js";
import {
	countEmployeesDirectory,
	deactivateUser,
	findUserById,
	listEmployeesDirectory,
} from "../models/User.js";
import { findDepartmentByIdForCompany } from "../models/Department.js";
import { parseListQuery, paginationMeta } from "../utils/pagination.js";
import { planAgentAction } from "../services/groqAgent.service.js";

const CONFIRM_TOKEN_TTL_SEC = 10 * 60;
const ROSTER_ROLES = new Set(["admin", "hr_officer", "payroll_officer"]);

function currentMonthLabel() {
	const d = new Date();
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function serializeAttendanceRows(rows) {
	return rows.map((r) => ({
		id: r.id,
		date: r.date,
		checkIn: r.check_in,
		checkOut: r.check_out,
		workHours: r.work_hours != null ? Number(r.work_hours) : null,
		extraHours: r.extra_hours != null ? Number(r.extra_hours) : null,
		status: r.status,
		notes: r.notes,
	}));
}

function serializePayslipRows(rows) {
	return rows.map((p) => ({
		id: p.id,
		payrunId: p.payrun_id,
		periodStart: p.period_start,
		periodEnd: p.period_end,
		payDate: p.pay_date,
		employeeName: p.employee_name,
		employeeCode: p.employee_code,
		grossSalary: Number(p.gross_salary),
		netSalary: Number(p.net_salary),
		status: p.status,
		pdfUrl: p.pdf_url,
	}));
}

function normalizePagination(args = {}) {
	const parsed = parseListQuery({
		page: args.page,
		limit: args.limit,
	});
	return parsed;
}

function isUuidLike(v) {
	return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function createConfirmToken(payload) {
	return jwt.sign(payload, process.env.JWT_SECRET || "PayrollJWTSecretKey", {
		expiresIn: CONFIRM_TOKEN_TTL_SEC,
	});
}

function verifyConfirmToken(token) {
	return jwt.verify(token, process.env.JWT_SECRET || "PayrollJWTSecretKey");
}

async function executeAction(req, plan) {
	const action = plan?.action;
	const args = plan?.arguments || {};
	const companyId = req.user?.company_id;
	if (!companyId) {
		throw Object.assign(new Error("Company context required"), { status: 400 });
	}

	if (action === "get_my_attendance_current_month") {
		const month = typeof args.month === "string" ? args.month : currentMonthLabel();
		const { page, limit } = normalizePagination(args);
		const total = await countUserAttendanceEntriesMonth(req.db, req.user.id, month);
		const rows = await listUserAttendanceMonth(req.db, req.user.id, month, page, limit);
		return {
			action,
			data: {
				month,
				items: serializeAttendanceRows(rows),
				pagination: paginationMeta({ page, limit, total }),
			},
		};
	}

	if (action === "get_my_payslips") {
		const { page, limit } = normalizePagination(args);
		const total = await countPayslipsGlobal(req.db, companyId, {}, req.user.id);
		const rows = await listPayslipsGlobal(req.db, companyId, page, limit, {}, req.user.id);
		return {
			action,
			data: {
				items: serializePayslipRows(rows),
				pagination: paginationMeta({ page, limit, total }),
			},
		};
	}

	if (action === "get_employee_attendance") {
		const userId = args.userId;
		if (!isUuidLike(userId)) {
			throw Object.assign(new Error("A valid employee userId is required"), { status: 400 });
		}
		const self = String(userId) === String(req.user.id);
		if (!self && !ROSTER_ROLES.has(req.user.role) && req.user.role !== "superadmin") {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}
		const target = await findUserById(req.db, userId);
		if (!target) throw Object.assign(new Error("Employee not found"), { status: 404 });
		if (req.user.role !== "superadmin" && String(target.company_id) !== String(companyId)) {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}

		const month = typeof args.month === "string" ? args.month : currentMonthLabel();
		const { page, limit } = normalizePagination(args);
		const total = await countUserAttendanceEntriesMonth(req.db, userId, month);
		const rows = await listUserAttendanceMonth(req.db, userId, month, page, limit);
		return {
			action,
			data: {
				userId,
				month,
				items: serializeAttendanceRows(rows),
				pagination: paginationMeta({ page, limit, total }),
			},
		};
	}

	if (action === "list_employees_by_department") {
		if (!ROSTER_ROLES.has(req.user.role) && req.user.role !== "superadmin") {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}
		const department = typeof args.department === "string" ? args.department.trim() : "";
		if (!department) {
			throw Object.assign(new Error("department is required"), { status: 400 });
		}
		const { page, limit } = normalizePagination(args);
		let departmentFilter = department;
		if (isUuidLike(department)) {
			const d = await findDepartmentByIdForCompany(req.db, department, companyId);
			if (!d) throw Object.assign(new Error("Department not found"), { status: 404 });
			departmentFilter = d.id;
		} else {
			const { rows } = await req.db.query(
				`SELECT id FROM departments
				 WHERE company_id = $1 AND name ILIKE $2
				 ORDER BY created_at DESC
				 LIMIT 1`,
				[companyId, department],
			);
			if (!rows.length) {
				throw Object.assign(new Error("Department not found"), { status: 404 });
			}
			departmentFilter = rows[0].id;
		}
		const filters = {
			department: departmentFilter,
			status: "active",
		};
		const total = await countEmployeesDirectory(req.db, companyId, filters);
		const rows = await listEmployeesDirectory(req.db, companyId, filters, limit, (page - 1) * limit);
		return {
			action,
			data: {
				items: rows.map((r) => ({
					id: r.id,
					loginId: r.login_id,
					name: r.name,
					email: r.email,
					role: r.role,
					department: r.department_name,
					designation: r.designation,
					location: r.location,
					isActive: r.is_active,
				})),
				pagination: paginationMeta({ page, limit, total }),
			},
		};
	}

	if (action === "deactivate_employee") {
		if (req.user.role !== "admin") {
			throw Object.assign(new Error("Only admin can deactivate employees"), { status: 403 });
		}
		const userId = args.userId;
		if (!isUuidLike(userId)) {
			throw Object.assign(new Error("A valid employee userId is required"), { status: 400 });
		}
		const target = await findUserById(req.db, userId);
		if (!target) throw Object.assign(new Error("Employee not found"), { status: 404 });
		if (String(target.company_id) !== String(companyId)) {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}
		if (target.role === "superadmin") {
			throw Object.assign(new Error("Cannot deactivate superadmin"), { status: 403 });
		}
		await deactivateUser(req.db, userId);
		return { action, data: { userId, status: "deactivated" } };
	}

	throw Object.assign(new Error("Unknown action"), { status: 400 });
}

function validatePlanShape(plan) {
	const allowed = new Set([
		"get_my_attendance_current_month",
		"get_my_payslips",
		"get_employee_attendance",
		"list_employees_by_department",
		"deactivate_employee",
		"ask_clarification",
	]);
	if (!plan || typeof plan !== "object" || !allowed.has(plan.action)) {
		return { ok: false, message: "Unable to infer request" };
	}
	return { ok: true };
}

export async function agentChat(req, res) {
	try {
		const message = req.body?.message;
		const confirmation = req.body?.confirmation;
		if (!message && !confirmation?.token) {
			return res.status(400).json(errorResponse("message is required"));
		}

		if (confirmation?.approved && confirmation?.token) {
			const decoded = verifyConfirmToken(confirmation.token);
			if (String(decoded.userId) !== String(req.user.id)) {
				return res.status(403).json(errorResponse("Confirmation token is not valid for this user"));
			}
			const out = await executeAction(req, {
				action: decoded.action,
				arguments: decoded.arguments || {},
			});
			return res.json(
				successResponse(
					{
						kind: "action_result",
						action: out.action,
						data: out.data,
					},
					"Action completed",
				),
			);
		}

		const plan = await planAgentAction({
			message,
			user: req.user,
		});

		const shape = validatePlanShape(plan);
		if (!shape.ok) return res.status(400).json(errorResponse(shape.message));

		if (plan.action === "ask_clarification") {
			return res.json(
				successResponse(
					{
						kind: "clarification",
						question: plan.clarification || "Please provide more details.",
					},
					"Need clarification",
				),
			);
		}

		const dangerous = Boolean(plan.dangerous) || plan.action === "deactivate_employee";
		if (dangerous) {
			const token = createConfirmToken({
				userId: req.user.id,
				action: plan.action,
				arguments: plan.arguments || {},
			});
			return res.json(
				successResponse(
					{
						kind: "confirmation_required",
						action: plan.action,
						warning: "This action is sensitive and needs explicit confirmation.",
						confirmationToken: token,
					},
					"Confirmation required",
				),
			);
		}

		const out = await executeAction(req, plan);
		return res.json(
			successResponse(
				{
					kind: "action_result",
					action: out.action,
					data: out.data,
				},
				"Action completed",
			),
		);
	} catch (err) {
		console.error(err);
		const status = Number(err?.status) || 500;
		const msg = status >= 500 ? "Agent request failed" : err.message;
		return res.status(status).json(errorResponse(msg));
	}
}
