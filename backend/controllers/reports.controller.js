import { successResponse, errorResponse } from "../utils/constant.js";

export async function salaryStatementReport(req, res) {
	try {
		const companyId = req.user.company_id;
		const employeeId = req.query.employee_id;
		const year = parseInt(req.query.year, 10);
		if (!employeeId || !year) return res.status(400).json(errorResponse("employee_id and year required"));

		const empQ = `
			SELECT u.name, u.login_id, ep.designation, ep.date_of_joining
			FROM users u
			LEFT JOIN employee_profiles ep ON ep.user_id = u.id
			WHERE u.id = $1 AND u.company_id = $2
		`;
		const { rows: empRows } = await req.db.query(empQ, [employeeId, companyId]);
		if (!empRows.length) return res.status(404).json(errorResponse("Employee not found"));
		const emp = empRows[0];

		const { rows } = await req.db.query(
			`SELECT period_start, period_end, payable_days, gross_salary, net_salary, status
			 FROM payslips
			 WHERE user_id = $1 AND company_id = $2 AND EXTRACT(YEAR FROM period_start) = $3
			 ORDER BY period_start ASC`,
			[employeeId, companyId, year],
		);
		const months = rows.map((r) => ({
			month: new Date(r.period_start).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
			periodStart: r.period_start,
			periodEnd: r.period_end,
			payableDays: Number(r.payable_days),
			grossSalary: Number(r.gross_salary),
			netSalary: Number(r.net_salary),
			status: r.status,
		}));
		const totals = months.reduce(
			(acc, m) => {
				acc.grossSalary += m.grossSalary;
				acc.netSalary += m.netSalary;
				return acc;
			},
			{ grossSalary: 0, netSalary: 0, pfEmployee: 0, professionalTax: 0 },
		);
		return res.json(
			successResponse(
				{
					employee: {
						name: emp.name,
						loginId: emp.login_id,
						designation: emp.designation,
						dateOfJoining: emp.date_of_joining,
					},
					salaryStructure: { name: null, effectiveFrom: null },
					year,
					months,
					totals,
				},
				"Salary statement generated",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to generate salary statement"));
	}
}

export async function payrollSummaryReport(req, res) {
	try {
		const companyId = req.user.company_id;
		const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
		const { rows } = await req.db.query(
			`SELECT TO_CHAR(period_start, 'Mon') AS month,
			        COALESCE(total_cost, 0)::float AS total_employer_cost,
			        COALESCE(employee_count, 0) AS employee_count,
			        status
			 FROM payruns
			 WHERE company_id = $1 AND EXTRACT(YEAR FROM period_start) = $2
			 ORDER BY period_start`,
			[companyId, year],
		);
		return res.json(
			successResponse(
				{
					year,
					months: rows.map((r) => ({
						month: r.month,
						totalEmployerCost: Number(r.total_employer_cost),
						employeeCount: r.employee_count,
						status: r.status,
					})),
				},
				"Payroll summary fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch payroll summary"));
	}
}

export async function employeeCountReport(req, res) {
	try {
		const companyId = req.user.company_id;
		const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
		const { rows } = await req.db.query(
			`SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') AS month,
			        COUNT(*)::int AS count
			 FROM users
			 WHERE company_id = $1
			   AND role::text <> 'superadmin'
			   AND EXTRACT(YEAR FROM created_at) = $2
			 GROUP BY 1, date_trunc('month', created_at)
			 ORDER BY date_trunc('month', created_at)`,
			[companyId, year],
		);
		return res.json(
			successResponse(
				{
					year,
					months: rows.map((r) => ({ month: r.month, count: r.count })),
				},
				"Employee count report fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch employee count report"));
	}
}
