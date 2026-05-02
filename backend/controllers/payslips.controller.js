import { successResponse, errorResponse } from "../utils/constant.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import {
	countPayslipsGlobal,
	listPayslipsGlobal,
	findPayslipById,
} from "../models/Payrun.js";

function listItemDTO(p) {
	return {
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
	};
}

export async function getPayslipsController(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);
		const filters = {
			payrun_id: req.query.payrun_id,
			user_id: req.query.user_id,
			search: req.query.search,
		};
		const total = await countPayslipsGlobal(req.db, companyId, filters);
		const rows = await listPayslipsGlobal(req.db, companyId, page, limit, filters);
		return res.json(
			successResponse(
				{ items: rows.map(listItemDTO), pagination: paginationMeta({ page, limit, total }) },
				"Payslips fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payslips"));
	}
}

export async function getMyPayslipsController(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);
		const total = await countPayslipsGlobal(req.db, companyId, {}, req.user.id);
		const rows = await listPayslipsGlobal(req.db, companyId, page, limit, {}, req.user.id);
		return res.json(
			successResponse(
				{ items: rows.map(listItemDTO), pagination: paginationMeta({ page, limit, total }) },
				"Your payslips fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payslips"));
	}
}

export async function getPayslipByIdController(req, res) {
	try {
		const row = await findPayslipById(req.db, req.params.id, req.user.company_id);
		if (!row) return res.status(404).json(errorResponse("Payslip not found"));
		const self = String(row.user_id) === String(req.user.id);
		if (!self && !["admin", "payroll_officer", "superadmin"].includes(req.user.role)) {
			return res.status(403).json(errorResponse("Forbidden"));
		}
		return res.json(
			successResponse(
				{
					id: row.id,
					periodStart: row.period_start,
					periodEnd: row.period_end,
					payDate: row.pay_date,
					employeeName: row.employee_name,
					employeeCode: row.employee_code,
					department: row.department,
					designation: row.designation,
					location: row.location,
					dateOfJoining: row.date_of_joining,
					panNumber: row.pan_number,
					uanNumber: row.uan_number,
					bankAccount: row.bank_account,
					workedDays: {
						totalWorkingDays: row.total_working_days,
						attendanceDays: Number(row.attendance_days),
						paidLeaveDays: Number(row.paid_leave_days),
						unpaidLeaveDays: Number(row.unpaid_leave_days),
						payableDays: Number(row.payable_days),
					},
					earnings: {
						basicSalary: Number(row.basic_salary),
						hra: Number(row.hra),
						standardAllowance: Number(row.standard_allowance),
						performanceBonus: Number(row.performance_bonus),
						leaveTravelAllowance: Number(row.leave_travel_allowance),
						fixedAllowance: Number(row.fixed_allowance),
						grossSalary: Number(row.gross_salary),
					},
					deductions: {
						pfEmployee: Number(row.pf_employee),
						pfEmployer: Number(row.pf_employer),
						professionalTax: Number(row.professional_tax),
						tdsDeduction: Number(row.tds_deduction),
						totalDeductions: Number(row.total_deductions),
					},
					netSalary: Number(row.net_salary),
					employerCost: Number(row.employer_cost),
					status: row.status,
					pdfUrl: row.pdf_url,
				},
				"Payslip fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payslip"));
	}
}

export async function getPayslipPdfController(req, res) {
	try {
		const row = await findPayslipById(req.db, req.params.id, req.user.company_id);
		if (!row) return res.status(404).json(errorResponse("Payslip not found"));
		const self = String(row.user_id) === String(req.user.id);
		if (!self && !["admin", "payroll_officer", "superadmin"].includes(req.user.role)) {
			return res.status(403).json(errorResponse("Forbidden"));
		}
		if (!row.pdf_url) {
			return res.status(404).json(errorResponse("Payslip PDF not available"));
		}
		return res.json(successResponse({ pdfUrl: row.pdf_url }, "Payslip PDF ready"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payslip PDF"));
	}
}
