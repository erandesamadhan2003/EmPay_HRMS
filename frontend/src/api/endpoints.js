/**
 * Path segments appended to axios `baseURL` (e.g. http://localhost:3000/api/).
 * Mirrors Phase 1 EmPay REST surface (see backend/PHASE_PLAN.md).
 */

export const API_PATHS = {
	auth: {
		login: "/auth/login",
		register: "/auth/register",
		refresh: "/auth/refresh",
		logout: "/auth/logout",
		changePassword: "/auth/change-password",
		resetPassword: "/auth/reset-password",
	},
	companies: {
		root: "/companies",
	},
	companyRequests: {
		list: "/company-requests",
		review: (id) => `/company-requests/${id}/review`,
	},
	departments: {
		root: "/departments",
		detail: (id) => `/departments/${id}`,
	},
	employees: {
		root: "/employees",
		me: "/employees/me",
		detail: (id) => `/employees/${id}`,
		salary: (userId) => `/employees/${userId}/salary`,
	},
	attendance: {
		checkInPolicy: "/attendance/check-in-policy",
		checkIn: "/attendance/check-in",
		checkOut: "/attendance/check-out",
		me: "/attendance/me",
		root: "/attendance",
		user: (userId) => `/attendance/${userId}`,
		record: (id) => `/attendance/${id}`,
		summary: (userId) => `/attendance/summary/${userId}`,
	},
	timeOff: {
		allocations: "/time-off/allocations",
		allocationsMe: "/time-off/allocations/me",
		allocationDetail: (id) => `/time-off/allocations/${id}`,
		requests: "/time-off/requests",
		requestsMe: "/time-off/requests/me",
		requestDetail: (id) => `/time-off/requests/${id}`,
		approveRequest: (id) => `/time-off/requests/${id}/approve`,
		rejectRequest: (id) => `/time-off/requests/${id}/reject`,
		cancelRequest: (id) => `/time-off/requests/${id}/cancel`,
	},
	salaryStructures: {
		root: "/salary-structures",
		detail: (id) => `/salary-structures/${id}`,
	},
	payruns: {
		root: "/payruns",
		detail: (id) => `/payruns/${id}`,
		validate: (id) => `/payruns/${id}/validate`,
		pay: (id) => `/payruns/${id}/pay`,
		cancel: (id) => `/payruns/${id}/cancel`,
	},
	payslips: {
		root: "/payslips",
		me: "/payslips/me",
		detail: (id) => `/payslips/${id}`,
		pdf: (id) => `/payslips/${id}/pdf`,
		regenerate: (payrunId) => `/payslips/${payrunId}/regenerate`,
	},
	reports: {
		salaryStatement: "/reports/salary-statement",
		payrollSummary: "/reports/payroll-summary",
		employeeCount: "/reports/employee-count",
	},
	settings: {
		users: "/settings/users",
		userRole: (id) => `/settings/users/${id}/role`,
		company: "/settings/company",
	},
	dashboard: {
		stats: "/dashboard/stats",
		employerCost: "/dashboard/employer-cost",
		employeeCount: "/dashboard/employee-count",
		warnings: "/dashboard/warnings",
	},
	auditLogs: "/audit-logs",
	agent: {
		chat: "/agent/chat",
	},
};
