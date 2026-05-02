import { successResponse, errorResponse } from "../utils/constant.js";

async function todayStats(db, companyId) {
	const { rows } = await db.query(
		`SELECT
			COUNT(*) FILTER (WHERE u.role::text <> 'superadmin')::int AS total_employees,
			COUNT(*) FILTER (WHERE a.status = 'present')::int AS present_today,
			COUNT(*) FILTER (WHERE a.status = 'on_leave')::int AS on_leave_today,
			COUNT(*) FILTER (WHERE a.id IS NULL OR a.status = 'absent')::int AS absent_today
		 FROM users u
		 LEFT JOIN attendance a ON a.user_id = u.id AND a.date = CURRENT_DATE
		 WHERE u.company_id = $1 AND u.is_active = TRUE`,
		[companyId],
	);
	return rows[0];
}

export async function dashboardStats(req, res) {
	try {
		const companyId = req.user.company_id;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}
		const base = await todayStats(req.db, companyId);

		const { rows: pendingRows } = await req.db.query(
			`SELECT COUNT(*)::int AS c FROM time_off_requests WHERE company_id = $1 AND status = 'pending'`,
			[companyId],
		);
		const pendingLeaveRequests = pendingRows[0]?.c ?? 0;

		const data = {
			totalEmployees: base.total_employees || 0,
			presentToday: base.present_today || 0,
			onLeaveToday: base.on_leave_today || 0,
			absentToday: base.absent_today || 0,
			pendingLeaveRequests,
		};

		if (["admin", "payroll_officer"].includes(req.user.role)) {
			const { rows: extra } = await req.db.query(
				`SELECT
					COUNT(*) FILTER (WHERE ep.bank_account_number IS NULL OR ep.bank_account_number = '')::int AS employees_without_bank,
					COUNT(*) FILTER (WHERE ep.manager_id IS NULL)::int AS employees_without_manager
				 FROM users u
				 LEFT JOIN employee_profiles ep ON ep.user_id = u.id
				 WHERE u.company_id = $1 AND u.is_active = TRUE AND u.role::text <> 'superadmin'`,
				[companyId],
			);
			data.employeesWithoutBank = extra[0]?.employees_without_bank || 0;
			data.employeesWithoutManager = extra[0]?.employees_without_manager || 0;

			const { rows: lastPayrun } = await req.db.query(
				`SELECT status FROM payruns WHERE company_id = $1 ORDER BY period_end DESC LIMIT 1`,
				[companyId],
			);
			data.lastPayrunStatus = lastPayrun[0]?.status || null;
			data.upcomingPayrunDue = null;
		}

		return res.json(successResponse(data, "Dashboard stats fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch dashboard stats"));
	}
}

export async function dashboardEmployerCost(req, res) {
	try {
		const companyId = req.user.company_id;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}
		const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
		const { rows } = await req.db.query(
			`SELECT TO_CHAR(period_start, 'Mon') AS label, COALESCE(total_cost, 0)::float AS amount
			 FROM payruns
			 WHERE company_id = $1 AND EXTRACT(YEAR FROM period_start) = $2
			 ORDER BY period_start`,
			[companyId, year],
		);
		return res.json(
			successResponse(
				{ year, view: req.query.view || "monthly", dataPoints: rows.map((r) => ({ label: r.label, amount: Number(r.amount) })) },
				"Employer cost data fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch employer cost data"));
	}
}

export async function dashboardEmployeeCount(req, res) {
	try {
		const companyId = req.user.company_id;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}
		const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
		const { rows } = await req.db.query(
			`SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') AS label, COUNT(*)::int AS count
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
				{ year, view: req.query.view || "monthly", dataPoints: rows.map((r) => ({ label: r.label, count: r.count })) },
				"Employee count data fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch employee count data"));
	}
}

export async function dashboardWarnings(req, res) {
	try {
		const companyId = req.user.company_id;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}
		const q = `
			SELECT u.id, u.name, u.login_id,
			       ep.bank_account_number, ep.manager_id,
			       esi.id AS salary_info_id
			FROM users u
			LEFT JOIN employee_profiles ep ON ep.user_id = u.id
			LEFT JOIN employee_salary_info esi ON esi.user_id = u.id
			WHERE u.company_id = $1 AND u.is_active = TRUE AND u.role::text <> 'superadmin'
		`;
		const { rows } = await req.db.query(q, [companyId]);
		const mapLite = (r) => ({ id: r.id, name: r.name, loginId: r.login_id });
		return res.json(
			successResponse(
				{
					employeesWithoutBank: rows.filter((r) => !r.bank_account_number).map(mapLite),
					employeesWithoutManager: rows.filter((r) => !r.manager_id).map(mapLite),
					employeesWithoutSalaryInfo: rows.filter((r) => !r.salary_info_id).map(mapLite),
				},
				"Dashboard warnings fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch warnings"));
	}
}
