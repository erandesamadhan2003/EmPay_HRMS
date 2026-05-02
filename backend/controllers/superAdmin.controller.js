import { successResponse, errorResponse } from "../utils/constant.js";
import {
	findCompanyRequestById,
	reviewCompanyRequest as reviewCompanyRequestModel,
	listCompanyRequestsPaged,
} from "../models/CompanyRequest.js";
import { activateUser, findUserById } from "../models/User.js";
import { findCompanyById } from "../models/Company.js";
import { sendEmail } from "../utils/emailService.js";
import { generateAccountVerifiedTemplate } from "../templates/accountVerifiedEmail.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import { serializePagination } from "../utils/serializer.js";

export async function reviewCompanyRequest(req, res) {
	try {
		const { id } = req.params;
		const { action, reviewer_notes } = req.body;

		if (!["approve", "reject"].includes(action)) {
			return res.status(400).json(errorResponse("Invalid action"));
		}

		const requestRow = await findCompanyRequestById(req.db, id);
		if (!requestRow) return res.status(404).json(errorResponse("Request not found"));

		const status = action === "approve" ? "approved" : "rejected";
		const updatedRequest = await reviewCompanyRequestModel(req.db, {
			requestId: id,
			reviewerId: req.user.id,
			status,
			reviewerNotes: reviewer_notes,
		});

		if (action === "approve") {
			await activateUser(req.db, requestRow.admin_user_id);

			const verifiedUser = await findUserById(req.db, requestRow.admin_user_id);
			const company = await findCompanyById(req.db, requestRow.company_id);
			if (verifiedUser && company) {
				const emailTemplate = generateAccountVerifiedTemplate({
					userName: verifiedUser.name,
					userEmail: verifiedUser.email,
					loginId: verifiedUser.login_id,
					temporaryPassword: "samadhan",
					companyName: company.name,
				});

				await sendEmail({
					to: verifiedUser.email,
					subject: emailTemplate.subject,
					html: emailTemplate.html,
					text: emailTemplate.text,
				});
			}
		}

		return res.json(
			successResponse(
				{
					id: updatedRequest.id,
					status: updatedRequest.status,
					reviewedAt: updatedRequest.reviewed_at,
				},
				`Company request ${status}`,
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Review failed"));
	}
}

export async function listCompanyRequests(req, res) {
	try {
		const { page, limit } = parseListQuery(req.query);
		const { status } = req.query;
		const { rows, total } = await listCompanyRequestsPaged(req.db, {
			page,
			limit,
			status,
		});

		const items = rows.map((r) => ({
			id: r.id,
			companyId: r.company_id,
			status: r.status,
			reviewedBy: r.reviewed_by,
			reviewedAt: r.reviewed_at,
			reviewerNotes: r.reviewer_notes,
			companyName: r.company_name,
			employee: r.admin_login_id ?
				{
					id: r.admin_user_id,
					name: r.admin_name,
					email: r.admin_email,
					loginId: r.admin_login_id,
				}
				: { id: r.admin_user_id, name: r.admin_name, email: r.admin_email },
			createdAt: r.created_at,
		}));

		return res.json(
			successResponse(
				serializePagination(items, paginationMeta({ page, limit, total })),
				"Company requests fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to list company requests"));
	}
}

export async function getDashboardStats(req, res) {
	try {
		const { rows: stats } = await req.db.query(`
			SELECT 
				(SELECT COUNT(*) FROM companies) as total_companies,
				(SELECT COUNT(*) FROM companies WHERE id IN (SELECT DISTINCT company_id FROM users WHERE is_active = TRUE)) as active_companies,
				(SELECT COUNT(*) FROM company_requests WHERE status = 'pending') as pending_requests,
				(SELECT COUNT(*) FROM users WHERE role::text <> 'superadmin') as total_users
		`);
		
		const data = {
			totalCompanies: stats[0].total_companies,
			activeCompanies: stats[0].active_companies,
			pendingRequests: stats[0].pending_requests,
			totalUsers: stats[0].total_users,
			trends: {
				companies: '+4% this month',
				active: '+2% this month',
				pending: '-5% from yesterday',
				users: '+12% this week'
			},
			trendUp: { companies: true, active: true, pending: false, users: true }
		};
		
		return res.json(successResponse(data, "Dashboard stats fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch platform stats"));
	}
}

export async function getGrowthAnalytics(req, res) {
	try {
		// Mocked growth data for now as we don't have historical snapshots
		const data = [
			{ month: 'Jan', newCompanies: 4, activeUsers: 120 },
			{ month: 'Feb', newCompanies: 7, activeUsers: 250 },
			{ month: 'Mar', newCompanies: 5, activeUsers: 310 },
			{ month: 'Apr', newCompanies: 12, activeUsers: 480 },
			{ month: 'May', newCompanies: 18, activeUsers: 720 },
			{ month: 'Jun', newCompanies: 15, activeUsers: 850 }
		];
		return res.json(successResponse(data, "Growth analytics fetched"));
	} catch (err) {
		return res.status(500).json(errorResponse("Unable to fetch growth data"));
	}
}

export async function getHealthAnalytics(req, res) {
	try {
		const data = {
			uptime: '99.99%',
			avgResponseTime: '105ms',
			totalApiCalls: '1.4M',
			errorRate: '0.03%'
		};
		return res.json(successResponse(data, "Health analytics fetched"));
	} catch (err) {
		return res.status(500).json(errorResponse("Unable to fetch health data"));
	}
}

export async function getPlatformActivity(req, res) {
	try {
		const { rows } = await req.db.query(`
			SELECT a.id, a.action, a.created_at, u.name as actor_name, u.role as actor_role
			FROM audit_logs a
			JOIN users u ON a.actor_id = u.id
			ORDER BY a.created_at DESC
			LIMIT $1
		`, [req.query.limit || 6]);

		const activities = rows.map(r => ({
			id: r.id,
			action: r.action,
			by: r.actor_name,
			time: r.created_at,
			type: r.action.toLowerCase().includes('reject') ? 'rejected' : 
			      r.action.toLowerCase().includes('approve') ? 'approved' :
			      r.action.toLowerCase().includes('suspend') ? 'suspended' : 'registered'
		}));

		return res.json(successResponse(activities, "Platform activity fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch activity"));
	}
}

export async function getAnalyticsByStatus(req, res) {
	try {
		const { rows } = await req.db.query(`
			SELECT 
				COUNT(*) FILTER (WHERE status = 'active') as active,
				COUNT(*) FILTER (WHERE status = 'pending') as pending,
				COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
				COUNT(*) FILTER (WHERE status = 'rejected') as rejected
			FROM company_requests
		`);
		// Since companies table doesn't have status, we use requests as proxy or count active companies separately
		const { rows: activeCount } = await req.db.query("SELECT COUNT(*) FROM companies");
		
		const data = {
			active: parseInt(activeCount[0].count),
			pending: parseInt(rows[0].pending),
			suspended: parseInt(rows[0].suspended || 0),
			rejected: parseInt(rows[0].rejected || 0)
		};
		return res.json(successResponse(data, "Status analytics fetched"));
	} catch (err) {
		return res.status(500).json(errorResponse("Unable to fetch status data"));
	}
}

export async function getRequestsStats(req, res) {
	try {
		const { rows } = await req.db.query(`
			SELECT 
				COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
				COUNT(*) FILTER (WHERE status = 'approved')::int as approved,
				COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected,
				COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE))::int as total_this_month
			FROM company_requests
		`);
		return res.json(successResponse(rows[0], "Request stats fetched"));
	} catch (err) {
		return res.status(500).json(errorResponse("Unable to fetch request stats"));
	}
}

export async function getAuditLogsStats(req, res) {
	try {
		const { rows } = await req.db.query(`
			SELECT 
				COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int as total_today,
				COUNT(*) FILTER (WHERE action LIKE '%SUSPEND%' OR action LIKE '%REJECT%')::int as critical_today,
				COUNT(*) FILTER (WHERE action LIKE '%CHANGE%')::int as warning_today
			FROM audit_logs
		`);
		
		const { rows: actors } = await req.db.query(`
			SELECT u.name, COUNT(a.id)::int as count
			FROM audit_logs a
			JOIN users u ON a.actor_id = u.id
			WHERE a.created_at >= CURRENT_DATE
			GROUP BY u.id, u.name
			ORDER BY count DESC
			LIMIT 5
		`);

		return res.json(successResponse({
			totalToday: rows[0].total_today,
			criticalToday: rows[0].critical_today,
			warningToday: rows[0].warning_today,
			topActors: actors
		}, "Audit stats fetched"));
	} catch (err) {
		return res.status(500).json(errorResponse("Unable to fetch audit stats"));
	}
}

export async function getAuditLogs(req, res) {
	try {
		const { page, limit } = parseListQuery(req.query);
		const { search, action, severity, company } = req.query;
		const offset = (page - 1) * limit;
		
		let where = "WHERE 1=1";
		const params = [];
		
		if (search) {
			params.push(`%${search}%`);
			where += ` AND (u.name ILIKE $${params.length} OR a.action ILIKE $${params.length})`;
		}
		
		const { rows } = await req.db.query(`
			SELECT a.*, u.name as actor_name, u.email as actor_email, u.role as actor_role
			FROM audit_logs a
			JOIN users u ON a.actor_id = u.id
			${where}
			ORDER BY a.created_at DESC
			LIMIT $${params.length + 1} OFFSET $${params.length + 2}
		`, [...params, limit, offset]);
		
		const { rows: countRows } = await req.db.query(`SELECT COUNT(*) FROM audit_logs a JOIN users u ON a.actor_id = u.id ${where}`, params);
		const total = parseInt(countRows[0].count);
		
		const items = rows.map(r => ({
			id: r.id,
			timestamp: r.created_at,
			actor: { id: r.actor_id, name: r.actor_name, role: r.actor_role, email: r.actor_email },
			action: r.action,
			severity: r.action.includes('SUSPEND') ? 'critical' : 'info',
			ip: r.ip_address,
			userAgent: 'System'
		}));
		
		return res.json(successResponse(
			serializePagination(items, paginationMeta({ page, limit, total })),
			"Audit logs fetched"
		));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch logs"));
	}
}

export async function getCompaniesStats(req, res) {
	try {
		const { rows: stats } = await req.db.query(`
			SELECT 
				COUNT(*)::int as total,
				COUNT(*) FILTER (WHERE id IN (SELECT DISTINCT company_id FROM users WHERE is_active = TRUE))::int as active,
				0 as suspended,
				(SELECT COUNT(*) FROM company_requests WHERE status = 'pending')::int as pending
		`);
		
		const byIndustry = [
			{ industry: 'Technology', count: 45 },
			{ industry: 'Retail', count: 28 },
			{ industry: 'Healthcare', count: 22 },
			{ industry: 'Finance', count: 18 },
			{ industry: 'Education', count: 15 }
		];
		
		return res.json(successResponse({ ...stats[0], byIndustry }, "Companies stats fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch companies stats"));
	}
}

export async function suspendCompany(req, res) {
	try {
		const { id } = req.params;
		await req.db.query("UPDATE users SET is_active = FALSE WHERE company_id = $1", [id]);
		return res.json(successResponse(null, "Company suspended (all users deactivated)"));
	} catch (err) {
		return res.status(500).json(errorResponse("Suspend failed"));
	}
}

export async function activateCompany(req, res) {
	try {
		const { id } = req.params;
		await req.db.query("UPDATE users SET is_active = TRUE WHERE company_id = $1 AND role = 'admin'", [id]);
		return res.json(successResponse(null, "Company activated (admin user activated)"));
	} catch (err) {
		return res.status(500).json(errorResponse("Activation failed"));
	}
}

export async function listCompanies(req, res) {
	try {
		const { page, limit } = parseListQuery(req.query);
		const { search } = req.query;
		const offset = (page - 1) * limit;
		
		let where = "WHERE 1=1";
		const params = [];
		
		if (search) {
			params.push(`%${search}%`);
			where += ` AND (c.name ILIKE $${params.length})`;
		}
		
		const { rows } = await req.db.query(`
			SELECT c.*, 
				(SELECT COUNT(*) FROM users WHERE company_id = c.id) as employee_count,
				(SELECT name FROM users WHERE company_id = c.id AND role = 'admin' LIMIT 1) as admin_name,
				(SELECT email FROM users WHERE company_id = c.id AND role = 'admin' LIMIT 1) as admin_email
			FROM companies c
			${where}
			ORDER BY c.created_at DESC
			LIMIT $${params.length + 1} OFFSET $${params.length + 2}
		`, [...params, limit, offset]);
		
		const { rows: countRows } = await req.db.query(`SELECT COUNT(*) FROM companies c ${where}`, params);
		const total = parseInt(countRows[0].count);
		
		const items = rows.map(r => ({
			id: r.id,
			name: r.name,
			logo: r.logo_url,
			adminName: r.admin_name || 'N/A',
			adminEmail: r.admin_email || 'N/A',
			employeeCount: parseInt(r.employee_count),
			status: 'active',
			approvedOn: r.created_at,
			industry: 'Technology',
			city: 'Mumbai',
			plan: 'enterprise'
		}));
		
		return res.json(successResponse(
			serializePagination(items, paginationMeta({ page, limit, total })),
			"Companies fetched"
		));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch companies"));
	}
}
