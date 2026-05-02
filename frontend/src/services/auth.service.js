import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

/** Normalized auth + onboarding calls; returns `{ success, message, data }` envelopes from the backend. */

export const authService = {
	createCompany: async (companyData) => {
		const body = {
			name: companyData?.name,
			logo_url: companyData.logo_url ?? companyData.logoUrl ?? null,
		};
		const response = await api.post(API_PATHS.companies.root, body);
		return response.data;
	},

	registerUser: async (userData) => {
		const payload = userData.company_id ? userData : { ...userData, company_id: userData.companyId };
		const body = {
			company_id: payload.company_id,
			name: payload.name,
			email: payload.email,
			phone: payload.phone ?? null,
			first_name: payload.first_name ?? payload.firstName ?? null,
			last_name: payload.last_name ?? payload.lastName ?? null,
			date_of_joining: payload.date_of_joining ?? payload.dateOfJoining ?? undefined,
		};
		const response = await api.post(API_PATHS.auth.register, body);
		return response.data;
	},

	login: async (credentials) => {
		const body = {
			login_id: credentials.login_id ?? credentials.loginId ?? credentials.email,
			password: credentials.password,
		};
		const response = await api.post(API_PATHS.auth.login, body);

		const token = response.data?.data?.token;
		const user = response.data?.data?.user;
		if (token) {
			localStorage.setItem("token", token);
			if (user) localStorage.setItem("user", JSON.stringify(user));
		}

		return response.data;
	},

	refresh: async () => {
		const response = await api.post(API_PATHS.auth.refresh);
		const token = response.data?.data?.token;
		if (token) localStorage.setItem("token", token);
		return response.data;
	},

	logout: async () => {
		try {
			await api.post(API_PATHS.auth.logout);
		} catch {
			/* non-blocking */
		} finally {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
		}
	},

	changePassword: async (payload = {}) => {
		const body = {
			current_password:
				payload.current_password ?? payload.currentPassword ?? undefined,
			new_password: payload.new_password ?? payload.newPassword ?? undefined,
			confirm_password:
				payload.confirm_password ?? payload.confirmPassword ?? undefined,
		};
		const response = await api.post(API_PATHS.auth.changePassword, body);
		return response.data;
	},

	resetPassword: async (payload) => {
		const response = await api.post(API_PATHS.auth.resetPassword, payload);
		return response.data;
	},

	fetchCompanyRequests: async (params) => {
		const response = await api.get(API_PATHS.companyRequests.list, { params });
		return response.data;
	},

	reviewCompanyRequest: async (requestId, reviewData) => {
		const body = {
			action: reviewData.action,
			reviewer_notes:
				reviewData.reviewer_notes ??
				reviewData.reviewerNotes ??
				reviewData.reviewerNote ??
				null,
		};
		const response = await api.post(API_PATHS.companyRequests.review(requestId), body);
		return response.data;
	},
};
