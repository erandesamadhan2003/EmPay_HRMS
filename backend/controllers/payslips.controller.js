import { successResponse, errorResponse } from "../utils/constant.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import {
	countPayslipsGlobal,
	listPayslipsGlobal,
	findPayslipById,
} from "../models/Payrun.js";
import {
	cacheWrapper,
	getPayslipsListCacheKey,
	getPayslipCacheKey,
	CACHE_EXPIRY,
} from "../utils/redisCache.js";

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

		const cacheKey = getPayslipsListCacheKey(companyId, page, limit, filters);
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const total = await countPayslipsGlobal(req.db, companyId, filters);
				const rows = await listPayslipsGlobal(req.db, companyId, page, limit, filters);
				return {
					items: rows.map(listItemDTO),
					pagination: paginationMeta({ page, limit, total }),
				};
			},
			CACHE_EXPIRY.PAYSLIP,
		);

		return res.json(successResponse(cached, "Payslips fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payslips"));
	}
}

export async function getMyPayslipsController(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);

		const cacheKey = getPayslipsListCacheKey(companyId, page, limit, { user_id: req.user.id });
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const total = await countPayslipsGlobal(req.db, companyId, {}, req.user.id);
				const rows = await listPayslipsGlobal(req.db, companyId, page, limit, {}, req.user.id);
				return {
					items: rows.map(listItemDTO),
					pagination: paginationMeta({ page, limit, total }),
				};
			},
			CACHE_EXPIRY.PAYSLIP,
		);

		return res.json(successResponse(cached, "Your payslips fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payslips"));
	}
}

export async function getPayslipByIdController(req, res) {
	try {
		const { id } = req.params;
		const companyId = req.user.company_id;

		console.log(`[PAYSLIP] Fetching payslip ${id} for company ${companyId}`);

		const cacheKey = getPayslipCacheKey(id);
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const row = await findPayslipById(req.db, id, companyId);
				if (!row) {
					console.log(`[PAYSLIP] Not found: ${id} in company ${companyId}`);
					return null;
				}
				console.log(`[PAYSLIP] Found ${id}, PDF URL: ${row.pdf_url}`);
				return row;
			},
			CACHE_EXPIRY.PAYSLIP,
		);

		if (!cached) {
			console.log(`[PAYSLIP] 404 - Payslip ${id} not found`);
			return res.status(404).json(errorResponse("Payslip not found"));
		}

		const self = String(cached.user_id) === String(req.user.id);
		if (!self && !["admin", "payroll_officer", "superadmin"].includes(req.user.role)) {
			console.log(`[PAYSLIP] 403 - User ${req.user.id} forbidden from accessing ${id}`);
			return res.status(403).json(errorResponse("Forbidden"));
		}

		return res.json(
			successResponse(
				{
					id: cached.id,
					periodStart: cached.period_start,
					periodEnd: cached.period_end,
					payDate: cached.pay_date,
					employeeName: cached.employee_name,
					employeeCode: cached.employee_code,
					department: cached.department,
					designation: cached.designation,
					location: cached.location,
					dateOfJoining: cached.date_of_joining,
					panNumber: cached.pan_number,
					uanNumber: cached.uan_number,
					bankAccount: cached.bank_account,
					workedDays: {
						totalWorkingDays: cached.total_working_days,
						attendanceDays: Number(cached.attendance_days),
						paidLeaveDays: Number(cached.paid_leave_days),
						unpaidLeaveDays: Number(cached.unpaid_leave_days),
						payableDays: Number(cached.payable_days),
					},
					earnings: {
						basicSalary: Number(cached.basic_salary),
						hra: Number(cached.hra),
						standardAllowance: Number(cached.standard_allowance),
						performanceBonus: Number(cached.performance_bonus),
						leaveTravelAllowance: Number(cached.leave_travel_allowance),
						fixedAllowance: Number(cached.fixed_allowance),
						grossSalary: Number(cached.gross_salary),
					},
					deductions: {
						pfEmployee: Number(cached.pf_employee),
						pfEmployer: Number(cached.pf_employer),
						professionalTax: Number(cached.professional_tax),
						tdsDeduction: Number(cached.tds_deduction),
						totalDeductions: Number(cached.total_deductions),
					},
					netSalary: Number(cached.net_salary),
					employerCost: Number(cached.employer_cost),
					status: cached.status,
					pdfUrl: cached.pdf_url,
				},
				"Payslip fetched",
			),
		);
	} catch (err) {
		console.error("[PAYSLIP] Error fetching payslip:", err);
		return res.status(500).json(errorResponse("Unable to fetch payslip"));
	}
}

export async function getPayslipPdfController(req, res) {
	try {
		const { id } = req.params;
		console.log(`[PDF] Fetching payslip PDF for ID: ${id}, Company: ${req.user.company_id}`);

		// Cache the PDF metadata for 1 hour (stable data)
		const cacheKey = `payslip:pdf:${id}`;
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const row = await findPayslipById(req.db, id, req.user.company_id);
				if (!row) {
					console.log(`[PDF] Payslip not found: ${id}`);
					return null;
				}
				if (!row.pdf_url) {
					console.log(`[PDF] No PDF URL for payslip ${id}. pdf_url is: ${row.pdf_url}`);
					return null;
				}
				return { pdfUrl: row.pdf_url, userId: row.user_id };
			},
			3600 // 1 hour TTL for PDF metadata
		);

		if (!cached) {
			console.log(`[PDF] 404 - Payslip PDF not available for ${id}`);
			return res.status(404).json(errorResponse("Payslip PDF not available"));
		}

		// Check authorization
		const self = String(cached.userId) === String(req.user.id);
		if (!self && !["admin", "payroll_officer", "superadmin"].includes(req.user.role)) {
			console.log(`[PDF] 403 Forbidden - user ${req.user.id} accessing PDF of ${cached.userId}`);
			return res.status(403).json(errorResponse("Forbidden"));
		}

		console.log(`[PDF] Redirecting to PDF URL: ${cached.pdfUrl}`);

		// Redirect to the actual PDF URL (usually S3 or file server)
		// If pdfUrl is a full URL (starts with http), redirect directly
		if (cached.pdfUrl.startsWith('http')) {
			return res.redirect(cached.pdfUrl);
		}

		// Otherwise return the URL so frontend can download it
		return res.json(successResponse({ pdfUrl: cached.pdfUrl }, "Payslip PDF ready"));
	} catch (err) {
		console.error("[PDF] Error fetching payslip PDF:", err);
		return res.status(500).json(errorResponse("Unable to fetch payslip PDF"));
	}
}
