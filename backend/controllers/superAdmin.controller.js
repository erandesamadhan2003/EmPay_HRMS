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
import { generateAccountRejectedTemplate } from "../templates/accountRejectedEmail.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import { serializePagination } from "../utils/serializer.js";
import { cacheWrapper, CACHE_EXPIRY, deleteCachePattern } from "../utils/redisCache.js";
import { createAuditLog } from "../models/AuditLog.js";

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
			// Audit log: approve
			await createAuditLog(req.db, {
				companyId: requestRow.company_id,
				actorId: req.user.id,
				action: "APPROVE_COMPANY_REQUEST",
				entityType: "company_request",
				entityId: id,
				payloadJson: JSON.stringify({ companyId: requestRow.company_id, reviewerNotes: reviewer_notes }),
				ipAddress: req.ip || null,
			});
		} else if (action === "reject") {
			const rejectedUser = await findUserById(req.db, requestRow.admin_user_id);
			const company = await findCompanyById(req.db, requestRow.company_id);
			if (rejectedUser && company) {
				const emailTemplate = generateAccountRejectedTemplate({
					userName: rejectedUser.name,
					companyName: company.name,
					reviewerNotes: reviewer_notes,
				});

				await sendEmail({
					to: rejectedUser.email,
					subject: emailTemplate.subject,
					html: emailTemplate.html,
					text: emailTemplate.text,
				});
			}
			// Audit log: reject
			await createAuditLog(req.db, {
				companyId: requestRow.company_id,
				actorId: req.user.id,
				action: "REJECT_COMPANY_REQUEST",
				entityType: "company_request",
				entityId: id,
				payloadJson: JSON.stringify({ companyId: requestRow.company_id, reason: reviewer_notes }),
				ipAddress: req.ip || null,
			});
		}

		// Bust all superadmin caches so the UI reflects the change immediately
		await Promise.allSettled([
			deleteCachePattern('superadmin:requests:*'),
			deleteCachePattern('superadmin:dashboard:*'),
			deleteCachePattern('superadmin:analytics:*'),
			deleteCachePattern('superadmin:activity:*'),
		]);

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

		// Create cache key based on query parameters
		const cacheKey = `superadmin:requests:${status || 'pending'}:${limit}:${page}`;

		// Try to get from cache first
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
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

				return {
					items,
					meta: paginationMeta({ page, limit, total })
				};
			},
			120 // 2 minutes cache TTL
		);

		return res.json(
			successResponse(
				serializePagination(cached.items, cached.meta),
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
		// Try to get from cache first
		const cacheKey = 'superadmin:dashboard:stats';
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const { rows: stats } = await req.db.query(`
					SELECT 
						(SELECT COUNT(*) FROM companies)::int as total_companies,
						(SELECT COUNT(*) FROM users WHERE is_active = TRUE AND role = 'admin')::int as active_companies,
						(SELECT COUNT(*) FROM company_requests WHERE status = 'pending')::int as pending_requests,
						(SELECT COUNT(*) FROM users WHERE role::text <> 'superadmin')::int as total_users
				`);

				const data = {
					totalCompanies: parseInt(stats[0].total_companies),
					activeCompanies: parseInt(stats[0].active_companies),
					pendingRequests: parseInt(stats[0].pending_requests),
					totalUsers: parseInt(stats[0].total_users),
					trends: {
						companies: '+4% this month',
						active: '+2% this month',
						pending: '-5% from yesterday',
						users: '+12% this week'
					},
					trendUp: { companies: true, active: true, pending: false, users: true }
				};

				return data;
			},
			120 // 2 minutes TTL
		);

		return res.json(successResponse(cached, "Dashboard stats fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch platform stats"));
	}
}

export async function getGrowthAnalytics(req, res) {
	try {
		const cacheKey = 'superadmin:analytics:growth';
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				// Mocked growth data for now as we don't have historical snapshots
				const data = [
					{ month: 'Jan', newCompanies: 4, activeUsers: 120 },
					{ month: 'Feb', newCompanies: 7, activeUsers: 250 },
					{ month: 'Mar', newCompanies: 5, activeUsers: 310 },
					{ month: 'Apr', newCompanies: 12, activeUsers: 480 },
					{ month: 'May', newCompanies: 18, activeUsers: 720 },
					{ month: 'Jun', newCompanies: 15, activeUsers: 850 }
				];
				return data;
			},
			600 // 10 minutes TTL
		);
		return res.json(successResponse(cached, "Growth analytics fetched"));
	} catch (err) {
		return res.status(500).json(errorResponse("Unable to fetch growth data"));
	}
}

export async function getHealthAnalytics(req, res) {
	try {
		const cacheKey = 'superadmin:analytics:health';
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const data = {
					uptime: '99.99%',
					avgResponseTime: '105ms',
					totalApiCalls: '1.4M',
					errorRate: '0.03%'
				};
				return data;
			},
			300 // 5 minutes TTL
		);
		return res.json(successResponse(cached, "Health analytics fetched"));
	} catch (err) {
		return res.status(500).json(errorResponse("Unable to fetch health data"));
	}
}

export async function getPlatformActivity(req, res) {
	try {
		const limit = req.query.limit || 6;
		const cacheKey = `superadmin:activity:limit:${limit}`;

		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const { rows } = await req.db.query(`
					SELECT a.id, a.action, a.created_at, u.name as actor_name, u.role as actor_role
					FROM audit_logs a
					JOIN users u ON a.actor_id = u.id
					ORDER BY a.created_at DESC
					LIMIT $1
				`, [limit]);

				const activities = rows.map(r => ({
					id: r.id,
					action: r.action,
					by: r.actor_name,
					time: r.created_at,
					type: r.action.toLowerCase().includes('reject') ? 'rejected' :
						r.action.toLowerCase().includes('approve') ? 'approved' :
							r.action.toLowerCase().includes('suspend') ? 'suspended' : 'registered'
				}));

				return activities;
			},
			300 // 5 minutes TTL
		);

		return res.json(successResponse(cached, "Platform activity fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch activity"));
	}
}

export async function getAnalyticsByStatus(req, res) {
	try {
		const cacheKey = 'superadmin:analytics:status';
		const cached = await cacheWrapper(
			cacheKey,
			async () => {
				const { rows } = await req.db.query(`
					SELECT 
						(SELECT COUNT(*) FROM company_requests WHERE status = 'approved')::int as approved,
						(SELECT COUNT(*) FROM company_requests WHERE status = 'pending')::int as pending,
						(SELECT COUNT(*) FROM company_requests WHERE status = 'rejected')::int as rejected
				`);

				const data = {
					active: parseInt(rows[0].approved || 0),      // 'approved' requests shown as 'active'
					pending: parseInt(rows[0].pending || 0),
					suspended: 0,                                  // No 'suspended' status in enum, default to 0
					rejected: parseInt(rows[0].rejected || 0)
				};
				return data;
			},
			120 // 2 minutes TTL
		);

		return res.json(successResponse(cached, "Status analytics fetched"));
	} catch (err) {
		console.error("[ERROR] getAnalyticsByStatus:", err.message);
		return res.status(500).json(errorResponse("Unable to fetch status data"));
	}
}

export async function getRequestsStats(req, res) {
	try {
		console.log("Fetching request stats...");
		const { rows } = await req.db.query(`
			SELECT 
				(SELECT COUNT(*) FROM company_requests WHERE status = 'pending')::int as pending,
				(SELECT COUNT(*) FROM company_requests WHERE status = 'approved')::int as approved,
				(SELECT COUNT(*) FROM company_requests WHERE status = 'rejected')::int as rejected,
				(SELECT COUNT(*) FROM company_requests WHERE created_at >= date_trunc('month', CURRENT_DATE))::int as total_this_month
		`);
		console.log("Stats result:", rows[0]);
		return res.json(successResponse(rows[0] || { pending: 0, approved: 0, rejected: 0, total_this_month: 0 }, "Request stats fetched"));
	} catch (err) {
		console.error("Error fetching request stats:", err);
		return res.status(500).json(errorResponse("Unable to fetch request stats"));
	}
}

export async function getAuditLogsStats(req, res) {
	try {
		const { rows } = await req.db.query(`
			SELECT 
				(SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE)::int as total_today,
				(SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%SUSPEND%' OR action LIKE '%REJECT%')::int as critical_today,
				(SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%CHANGE%')::int as warning_today
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
			totalToday: parseInt(rows[0]?.total_today || 0),
			criticalToday: parseInt(rows[0]?.critical_today || 0),
			warningToday: parseInt(rows[0]?.warning_today || 0),
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
		console.log("Fetching companies stats...");
		const { rows: stats } = await req.db.query(`
			SELECT 
				(SELECT COUNT(*) FROM companies)::int as total,
				(SELECT COUNT(*) FROM users WHERE is_active = TRUE AND role = 'admin')::int as active,
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

		console.log("Companies stats result:", stats[0]);
		return res.json(successResponse({ ...stats[0], byIndustry }, "Companies stats fetched"));
	} catch (err) {
		console.error("Error fetching companies stats:", err);
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
