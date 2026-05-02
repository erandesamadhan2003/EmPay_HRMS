import { successResponse, errorResponse } from "../utils/constant.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import { sendPayslipNotification } from "../services/email.service.js";
import {
	countPayruns,
	listPayruns,
	findPayrunById,
	createPayrun,
	setPayrunStats,
	updatePayrunStatus,
	countPayrunPayslips,
	listPayrunPayslips,
	insertPayslip,
	updatePayslipByPayrunUser,
} from "../models/Payrun.js";
import { findEmployeeSalaryInfo, listSalaryComponentsForStructure } from "../models/Salary.js";

function serializePayrun(r) {
	return {
		id: r.id,
		periodStart: r.period_start,
		periodEnd: r.period_end,
		status: r.status,
		employeeCount: r.employee_count,
		totalCost: r.total_cost != null ? Number(r.total_cost) : null,
		generatedBy: r.generated_by ? { id: r.generated_by, name: r.generated_by_name } : null,
		validatedBy: r.validated_by ? { id: r.validated_by, name: r.validated_by_name } : null,
		validatedAt: r.validated_at,
		paidAt: r.paid_at,
		createdAt: r.created_at,
	};
}

function serializePayrunPayslip(p) {
	return {
		id: p.id,
		employeeName: p.employee_name,
		employeeCode: p.employee_code,
		department: p.department,
		designation: p.designation,
		grossSalary: Number(p.gross_salary),
		netSalary: Number(p.net_salary),
		employerCost: Number(p.employer_cost),
		payableDays: Number(p.payable_days),
		status: p.status,
	};
}

function weekdaysBetween(start, end) {
	const s = new Date(`${start}T12:00:00Z`);
	const e = new Date(`${end}T12:00:00Z`);
	let n = 0;
	const d = new Date(s);
	while (d <= e) {
		const wd = d.getUTCDay();
		if (wd !== 0 && wd !== 6) n++;
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return n;
}

async function generatePayrunPayslips(db, payrun, companyId) {
	const q = `
		SELECT u.id AS user_id, u.name, u.login_id, ep.designation, ep.location, ep.date_of_joining,
		       ep.pan_number, ep.uan_number, ep.bank_account_number, d.name AS department_name,
		       esi.monthly_wage, esi.salary_structure_id, ss.pf_rate, ss.professional_tax
		FROM users u
		JOIN employee_profiles ep ON ep.user_id = u.id
		LEFT JOIN departments d ON d.id = ep.department_id
		JOIN employee_salary_info esi ON esi.user_id = u.id
		JOIN salary_structures ss ON ss.id = esi.salary_structure_id
		WHERE u.company_id = $1 AND u.is_active = TRUE AND u.role::text <> 'superadmin'
	`;
	const { rows } = await db.query(q, [companyId]);
	const totalWorkingDays = weekdaysBetween(payrun.period_start, payrun.period_end);
	let totalCost = 0;
	let count = 0;

	for (const r of rows) {
		const attQ = `
			SELECT
				COUNT(*) FILTER (WHERE status = 'present')::float AS present_days,
				COUNT(*) FILTER (WHERE status = 'on_leave')::float AS paid_leave_days
			FROM attendance
			WHERE user_id = $1 AND date BETWEEN $2::date AND $3::date
		`;
		const { rows: ar } = await db.query(attQ, [r.user_id, payrun.period_start, payrun.period_end]);
		const present = Number(ar[0]?.present_days || 0);
		const paidLeave = Number(ar[0]?.paid_leave_days || 0);
		const attendanceDays = present;
		const payableDays = Math.min(totalWorkingDays, present + paidLeave);
		const unpaidLeaveDays = Math.max(0, totalWorkingDays - payableDays);

		const monthly = Number(r.monthly_wage);
		const gross = (monthly * payableDays) / Math.max(1, totalWorkingDays);
		const pfEmployee = (gross * Number(r.pf_rate || 12)) / 100;
		const professionalTax = Number(r.professional_tax || 200);
		const totalDeductions = pfEmployee + professionalTax;
		const net = Math.max(0, gross - totalDeductions);
		const employerCost = gross + pfEmployee;

		const basicSalary = gross * 0.5;
		const hra = gross * 0.2;
		const standardAllowance = gross * 0.1;
		const performanceBonus = gross * 0.05;
		const leaveTravelAllowance = gross * 0.05;
		const fixedAllowance = Math.max(
			0,
			gross -
				(basicSalary +
					hra +
					standardAllowance +
					performanceBonus +
					leaveTravelAllowance),
		);

		await insertPayslip(db, {
			payrun_id: payrun.id,
			user_id: r.user_id,
			company_id: companyId,
			salary_structure_id: r.salary_structure_id,
			period_start: payrun.period_start,
			period_end: payrun.period_end,
			total_working_days: totalWorkingDays,
			attendance_days: attendanceDays,
			paid_leave_days: paidLeave,
			unpaid_leave_days: unpaidLeaveDays,
			payable_days: payableDays,
			basic_salary: basicSalary.toFixed(2),
			hra: hra.toFixed(2),
			standard_allowance: standardAllowance.toFixed(2),
			performance_bonus: performanceBonus.toFixed(2),
			leave_travel_allowance: leaveTravelAllowance.toFixed(2),
			fixed_allowance: fixedAllowance.toFixed(2),
			gross_salary: gross.toFixed(2),
			pf_employee: pfEmployee.toFixed(2),
			pf_employer: pfEmployee.toFixed(2),
			professional_tax: professionalTax.toFixed(2),
			tds_deduction: 0,
			total_deductions: totalDeductions.toFixed(2),
			net_salary: net.toFixed(2),
			employer_cost: employerCost.toFixed(2),
			employee_name: r.name,
			employee_code: r.login_id,
			department: r.department_name,
			designation: r.designation,
			location: r.location,
			date_of_joining: r.date_of_joining,
			pan_number: r.pan_number,
			uan_number: r.uan_number,
			bank_account: r.bank_account_number,
			status: "draft",
		});
		totalCost += employerCost;
		count++;
	}

	await setPayrunStats(db, payrun.id, count, Number(totalCost.toFixed(2)));
	return { employeeCount: count, totalCost: Number(totalCost.toFixed(2)) };
}

export async function getPayruns(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);
		const filters = { status: req.query.status, year: req.query.year };
		const total = await countPayruns(req.db, companyId, filters);
		const rows = await listPayruns(req.db, companyId, page, limit, filters);
		return res.json(
			successResponse(
				{ items: rows.map(serializePayrun), pagination: paginationMeta({ page, limit, total }) },
				"Payruns fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payruns"));
	}
}

export async function createPayrunController(req, res) {
	const client = await req.db.connect();
	try {
		const companyId = req.user.company_id;
		const periodStart = req.body.periodStart ?? req.body.period_start;
		const periodEnd = req.body.periodEnd ?? req.body.period_end;
		if (!periodStart || !periodEnd) {
			return res.status(400).json(errorResponse("periodStart and periodEnd required"));
		}
		await client.query("BEGIN");
		const payrun = await createPayrun(client, {
			companyId,
			periodStart,
			periodEnd,
			generatedBy: req.user.id,
		});
		const stats = await generatePayrunPayslips(client, payrun, companyId);
		await client.query("COMMIT");
		return res.status(201).json(
			successResponse(
				{
					id: payrun.id,
					periodStart: payrun.period_start,
					periodEnd: payrun.period_end,
					status: payrun.status,
					employeeCount: stats.employeeCount,
					totalCost: stats.totalCost,
				},
				`Payrun generated with ${stats.employeeCount} payslips`,
			),
		);
	} catch (err) {
		await client.query("ROLLBACK");
		if (err.code === "23505") {
			return res.status(409).json(errorResponse("A payrun for this period already exists"));
		}
		console.error(err);
		return res.status(500).json(errorResponse("Unable to generate payrun"));
	} finally {
		client.release();
	}
}

export async function getPayrunByIdController(req, res) {
	try {
		const companyId = req.user.company_id;
		const payrun = await findPayrunById(req.db, req.params.id, companyId);
		if (!payrun) return res.status(404).json(errorResponse("Payrun not found"));

		const { page, limit } = parseListQuery(req.query);
		const search = req.query.search;
		const total = await countPayrunPayslips(req.db, payrun.id, search);
		const slips = await listPayrunPayslips(req.db, payrun.id, page, limit, search);
		return res.json(
			successResponse(
				{
					payrun: serializePayrun(payrun),
					payslips: {
						items: slips.map(serializePayrunPayslip),
						pagination: paginationMeta({ page, limit, total }),
					},
				},
				"Payrun fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payrun"));
	}
}

export async function validatePayrunController(req, res) {
	try {
		const row = await findPayrunById(req.db, req.params.id, req.user.company_id);
		if (!row) return res.status(404).json(errorResponse("Payrun not found"));
		if (row.status !== "draft") {
			return res.status(422).json(errorResponse("Only draft payruns can be validated"));
		}
		const updated = await updatePayrunStatus(req.db, row.id, req.user.company_id, "validated", req.user.id);
		await req.db.query(
			`UPDATE payslips SET status = 'validated', updated_at = NOW() WHERE payrun_id = $1`,
			[row.id],
		);
		return res.json(successResponse({ id: updated.id, status: updated.status, validatedAt: updated.validated_at }, "Payrun validated and locked"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to validate payrun"));
	}
}

export async function payPayrunController(req, res) {
	try {
		const row = await findPayrunById(req.db, req.params.id, req.user.company_id);
		if (!row) return res.status(404).json(errorResponse("Payrun not found"));
		if (row.status === "cancelled") return res.status(422).json(errorResponse("Cancelled payrun cannot be paid"));
		if (row.status === "paid") return res.json(successResponse({ id: row.id, status: row.status, paidAt: row.paid_at }, "Payrun already paid"));
		const payDate = req.body?.payDate ?? req.body?.pay_date ?? new Date().toISOString().slice(0, 10);
		const updated = await updatePayrunStatus(req.db, row.id, req.user.company_id, "paid", req.user.id, payDate);
		await req.db.query(
			`UPDATE payslips SET status = 'paid', pay_date = $2::date, updated_at = NOW() WHERE payrun_id = $1`,
			[row.id, payDate],
		);

		// Send payslip notification emails (non-blocking)
		try {
			const { rows: slipRows } = await req.db.query(
				`SELECT ps.net_salary, ps.period_start, ps.period_end, u.name, u.email
				 FROM payslips ps
				 JOIN users u ON u.id = ps.user_id
				 WHERE ps.payrun_id = $1 AND u.email IS NOT NULL`,
				[row.id],
			);
			const periodStr = new Date(row.period_start).toLocaleString("en-IN", { month: "long", year: "numeric" });
			const payDateStr = new Date(payDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
			for (const slip of slipRows) {
				sendPayslipNotification({
					to: slip.email,
					name: slip.name,
					period: periodStr,
					netSalary: slip.net_salary,
					payDate: payDateStr,
				}).catch(e => console.error("[email] Payslip email error:", e.message));
			}
		} catch (emailErr) {
			console.error("[email] Error fetching payslip data for emails:", emailErr.message);
		}

		return res.json(
			successResponse(
				{ id: updated.id, status: updated.status, paidAt: updated.paid_at },
				"Payrun marked as paid. Employees will be notified by email.",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to mark payrun paid"));
	}
}

export async function cancelPayrunController(req, res) {
	try {
		const row = await findPayrunById(req.db, req.params.id, req.user.company_id);
		if (!row) return res.status(404).json(errorResponse("Payrun not found"));
		if (row.status === "paid") return res.status(422).json(errorResponse("Paid payruns cannot be cancelled"));
		const updated = await updatePayrunStatus(req.db, row.id, req.user.company_id, "cancelled", req.user.id);
		return res.json(successResponse({ id: updated.id, status: updated.status }, "Payrun cancelled"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to cancel payrun"));
	}
}

export async function regeneratePayslipForPayrun(req, res) {
	try {
		const payrun = await findPayrunById(req.db, req.params.payrunId, req.user.company_id);
		if (!payrun) return res.status(404).json(errorResponse("Payrun not found"));
		if (payrun.status !== "draft") {
			return res.status(422).json(errorResponse("Cannot regenerate payslip for a validated or paid payrun"));
		}
		const userId = req.body.userId ?? req.body.user_id;
		if (!userId) return res.status(400).json(errorResponse("userId required"));

		const salaryInfo = await findEmployeeSalaryInfo(req.db, userId, req.user.company_id);
		if (!salaryInfo) return res.status(404).json(errorResponse("Employee salary info not found"));

		const row = await updatePayslipByPayrunUser(req.db, payrun.id, userId, {
			net_salary: Number(salaryInfo.monthly_wage).toFixed(2),
		});
		if (!row) return res.status(404).json(errorResponse("Payslip not found"));
		return res.json(successResponse({ id: row.id, netSalary: Number(row.net_salary) }, "Payslip regenerated"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to regenerate payslip"));
	}
}
