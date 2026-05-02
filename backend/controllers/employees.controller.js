import bcrypt from "bcrypt";
import { successResponse, errorResponse } from "../utils/constant.js";
import {
	createUser,
	listEmployeesDirectory,
	countEmployeesDirectory,
	findUserFullProfile,
	updateUserSelfFields,
	updateUserStaffFields,
	deactivateUser,
	updateUserLoginId,
	findUserById,
} from "../models/User.js";
import {
	createEmployeeProfile,
	findEmployeeProfileByUserId,
	updateEmployeeProfilePartial,
} from "../models/EmployeeProfile.js";
import { generateLoginId } from "../utils/loginId.js";
import { findCompanyById } from "../models/Company.js";
import { findDepartmentByIdForCompany } from "../models/Department.js";
import {
	findEmployeeSalaryInfo,
	listSalaryComponentsForStructure,
	upsertEmployeeSalaryInfo,
	findSalaryStructureById,
} from "../models/Salary.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import {
	serializeEmployeeDirectoryItem,
	serializeUserProfile,
	serializePagination,
	normalizeProfilePATCH,
	normalizeSelfProfilePATCH,
} from "../utils/serializer.js";
import {
	cacheWrapper,
	getEmployeeDirectoryCacheKey,
	getUserProfileCacheKey,
	getUserCacheKey,
	invalidateEmployeeCache,
	invalidateUserCache,
	CACHE_EXPIRY,
} from "../utils/redisCache.js";

function requireCompany(req, res) {
	const cid = req.user?.company_id;
	if (!cid) {
		res.status(400).json(errorResponse("Company context required"));
		return null;
	}
	return cid;
}

export async function getEmployees(req, res) {
	try {
		const companyId = requireCompany(req, res);
		if (!companyId) return;

		const { page, limit } = parseListQuery(req.query);
		const filters = {
			search: req.query.search,
			department: req.query.department,
			role: req.query.role,
			status: req.query.status || "active",
		};

		const cacheKey = getEmployeeDirectoryCacheKey(companyId, page, limit, filters);
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const offset = (page - 1) * limit;
				const total = await countEmployeesDirectory(req.db, companyId, filters);
				const rows = await listEmployeesDirectory(
					req.db,
					companyId,
					filters,
					limit,
					offset,
				);

				return serializePagination(
					rows.map(serializeEmployeeDirectoryItem),
					paginationMeta({ page, limit, total }),
				);
			},
			CACHE_EXPIRY.EMPLOYEE,
		);

		return res.json(successResponse(cached, "Employees fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to list employees"));
	}
}

export async function createEmployee(req, res) {
	const client = await req.db.connect();
	try {
		const companyId = requireCompany(req, res);
		if (!companyId) return;

		const body = req.body;
		const {
			name,
			email,
			phone,
			firstName,
			first_name,
			lastName,
			last_name,
			dateOfJoining,
			date_of_joining,
			role,
			designation,
			departmentId,
			department_id,
			location,
			managerId,
			manager_id,
		} = body;
		if (!name || !email) {
			return res.status(400).json(errorResponse("name and email required"));
		}

		await client.query("BEGIN");

		const company = await findCompanyById(client, companyId);
		if (!company) {
			await client.query("ROLLBACK");
			return res.status(404).json(errorResponse("Company not found"));
		}

		const plain = "samadhan";
		const password_hash = await bcrypt.hash(plain, 10);

		const tempLogin = `TMP-${Date.now()}`;
		const normalizedRole =
			role === "payroll_officer" || role === "hr_officer" || role === "admin" ?
				role
				: "employee";

		const user = await createUser(client, {
			companyId,
			loginId: tempLogin,
			name,
			email,
			phone,
			passwordHash: password_hash,
			role: normalizedRole,
			isActive: true,
			mustChangePwd: true,
		});

		const deptId = department_id ?? departmentId ?? null;
		if (deptId) {
			const dept = await findDepartmentByIdForCompany(client, deptId, companyId);
			if (!dept) {
				await client.query("ROLLBACK");
				return res.status(404).json(errorResponse("Department not found"));
			}
		}

		const doj = date_of_joining || dateOfJoining || new Date().toISOString().slice(0, 10);
		await createEmployeeProfile(client, {
			userId: user.id,
			companyId,
			dateOfJoining: doj,
			designation,
			departmentId: deptId,
			location,
			managerId: manager_id ?? managerId,
		});

		const fname = first_name || firstName || name.split(" ")[0];
		const lname = last_name || lastName || name.split(" ")[1] || "";
		const loginId = await generateLoginId(
			client,
			companyId,
			company.name,
			fname,
			lname,
			doj,
		);
		await updateUserLoginId(client, user.id, loginId);

		await client.query("COMMIT");

		// Invalidate employee cache for this company
		await invalidateEmployeeCache(companyId);

		return res.status(201).json(
			successResponse(
				{
					id: user.id,
					loginId,
					name,
					email,
					role: normalizedRole,
					tempPassword: plain,
				},
				"Employee created",
			),
		);
	} catch (err) {
		await client.query("ROLLBACK");
		if (err.code === "23505") {
			return res.status(409).json(
				errorResponse("An employee with this email already exists"),
			);
		}
		console.error(err);
		return res.status(500).json(errorResponse("Unable to create employee"));
	} finally {
		client.release();
	}
}

export async function getMe(req, res) {
	try {
		const row = await findUserFullProfile(req.db, req.user.id);
		if (!row) return res.status(404).json(errorResponse("User not found"));

		return res.json(successResponse(serializeUserProfile(row), "Profile fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch profile"));
	}
}

export async function updateMe(req, res) {
	try {
		const id = req.user.id;
		const snakeUser = {};

		if (req.body.phone !== undefined) snakeUser.phone = req.body.phone;
		if (req.body.avatarUrl !== undefined) snakeUser.avatar_url = req.body.avatarUrl;

		if (Object.keys(snakeUser).length) {
			await updateUserSelfFields(req.db, id, snakeUser);
		}

		const prof = normalizeSelfProfilePATCH(req.body.profile);
		if (Object.keys(prof).length) {
			const ep = await findEmployeeProfileByUserId(req.db, id);
			if (ep) await updateEmployeeProfilePartial(req.db, id, prof);
		}

		const fresh = await findUserFullProfile(req.db, id);
		return res.json(
			successResponse(
				serializeUserProfile(fresh),
				"Profile updated",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update profile"));
	}
}

async function resolveStaffAdminTarget(req, targetId) {
	const companyId = req.user?.company_id;
	if (!companyId) return null;
	const target = await findUserById(req.db, targetId);
	if (!target || String(target.company_id) !== String(companyId)) return null;
	if (target.role === "superadmin") return null;
	return target;
}

export async function getById(req, res) {
	try {
		const { id } = req.params;
		const row = await findUserFullProfile(req.db, id);
		if (!row) return res.status(404).json(errorResponse("Employee not found"));

		if (req.user.role === "superadmin") {
			return res.json(
				successResponse(serializeUserProfile(row), "Profile fetched"),
			);
		}

		const cid = req.user.company_id;
		const sameTenant =
			row.company_id &&
			cid &&
			row.company_id.toString() === cid.toString();

		if (!sameTenant) {
			return res.status(403).json(errorResponse("Forbidden"));
		}

		const self = req.user.id === row.id;
		const privileged = ["admin", "hr_officer"].includes(req.user.role);
		const payroll = req.user.role === "payroll_officer";

		if (!self && !privileged && !payroll) {
			return res.status(403).json(errorResponse("Forbidden"));
		}

		return res.json(
			successResponse(serializeUserProfile(row), "Profile fetched"),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch user"));
	}
}

export async function updateEmployee(req, res) {
	try {
		const companyId = requireCompany(req, res);
		if (!companyId) return;
		const { id } = req.params;

		const target = await resolveStaffAdminTarget(req, id);
		if (!target) return res.status(404).json(errorResponse("Employee not found"));

		const snakeUser = {};
		if (req.body.name !== undefined) snakeUser.name = req.body.name;
		if (req.body.phone !== undefined) snakeUser.phone = req.body.phone;
		if (req.body.avatarUrl !== undefined) snakeUser.avatar_url = req.body.avatarUrl;
		if (req.user.role === "admin" && req.body.role !== undefined) {
			snakeUser.role = req.body.role;
		}

		if (Object.keys(snakeUser).length) {
			await updateUserStaffFields(req.db, id, snakeUser);
		}

		const prof = normalizeProfilePATCH(req.body.profile);
		if (Object.keys(prof).length) {
			const ep = await findEmployeeProfileByUserId(req.db, id);
			if (!ep) {
				return res.status(422).json(errorResponse("Employee profile missing"));
			}
			await updateEmployeeProfilePartial(req.db, id, prof);
		}

		const fresh = await findUserFullProfile(req.db, id);
		return res.json(
			successResponse(
				{ id: fresh.id },
				"Employee updated",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update employee"));
	}
}

export async function deleteEmployee(req, res) {
	try {
		const { id } = req.params;

		const target = await resolveStaffAdminTarget(req, id);
		if (!target) return res.status(404).json(errorResponse("Employee not found"));

		// Cancel any pending/approved leave requests (cascade cleanup)
		await req.db.query(
			`UPDATE time_off_requests SET status = 'cancelled', updated_at = NOW()
			 WHERE user_id = $1 AND status IN ('pending', 'approved')`,
			[id],
		);

		await deactivateUser(req.db, id);
		return res.json(successResponse(null, "Employee deactivated and open leave requests cancelled"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to deactivate employee"));
	}
}

export async function getEmployeeSalary(req, res) {
	try {
		const companyId = req.user.company_id;
		const userId = req.params.id;
		const target = await resolveStaffAdminTarget(req, userId);
		if (!target && req.user.role !== "superadmin") {
			return res.status(404).json(errorResponse("Employee not found"));
		}
		const info = await findEmployeeSalaryInfo(req.db, userId, companyId);
		if (!info) return res.status(404).json(errorResponse("Salary info not found"));
		const components = await listSalaryComponentsForStructure(req.db, info.salary_structure_id);
		return res.json(
			successResponse(
				{
					userId,
					salaryStructure: {
						id: info.salary_structure_id,
						name: info.structure_name,
						wageType: info.wage_type,
						pfRate: Number(info.pf_rate),
						professionalTax: Number(info.professional_tax),
						components: components.map((c) => ({
							name: c.name,
							componentType: c.component_type,
							computationType: c.computation_type,
							value: Number(c.value),
						})),
					},
					monthlyWage: Number(info.monthly_wage),
					yearlyWage: Number(info.yearly_wage),
					workingHoursPerDay: Number(info.working_hours_per_day),
					workingDaysPerWeek: info.working_days_per_week,
					effectiveFrom: info.effective_from,
				},
				"Salary info fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch salary info"));
	}
}

export async function putEmployeeSalary(req, res) {
	try {
		const companyId = req.user.company_id;
		const userId = req.params.id;
		const target = await resolveStaffAdminTarget(req, userId);
		if (!target && req.user.role !== "superadmin") {
			return res.status(404).json(errorResponse("Employee not found"));
		}
		const salaryStructureId = req.body.salaryStructureId ?? req.body.salary_structure_id;
		const monthlyWage = req.body.monthlyWage ?? req.body.monthly_wage;
		const workingHoursPerDay = req.body.workingHoursPerDay ?? req.body.working_hours_per_day;
		const workingDaysPerWeek = req.body.workingDaysPerWeek ?? req.body.working_days_per_week;
		const effectiveFrom = req.body.effectiveFrom ?? req.body.effective_from;
		if (!salaryStructureId || monthlyWage === undefined || !effectiveFrom) {
			return res.status(400).json(errorResponse("salaryStructureId, monthlyWage, effectiveFrom required"));
		}
		const structure = await findSalaryStructureById(req.db, salaryStructureId, companyId);
		if (!structure) return res.status(404).json(errorResponse("Salary structure not found"));

		const info = await upsertEmployeeSalaryInfo(req.db, userId, companyId, {
			salaryStructureId,
			monthlyWage,
			workingHoursPerDay,
			workingDaysPerWeek,
			effectiveFrom,
		});

		return res.json(
			successResponse(
				{
					userId,
					monthlyWage: Number(info.monthly_wage),
					yearlyWage: Number(info.yearly_wage),
				},
				"Salary info updated",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update salary info"));
	}
}
