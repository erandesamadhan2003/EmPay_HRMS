import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const payrunsService = {
	getAll: async (params) => {
		const response = await api.get(API_PATHS.payruns.root, { params });
		return response.data;
	},

	getById: async (id, params) => {
		const response = await api.get(API_PATHS.payruns.detail(id), { params });
		return response.data;
	},

	create: async (data = {}) => {
		const body = {
			periodStart: data.periodStart ?? data.period_start,
			periodEnd: data.periodEnd ?? data.period_end,
		};
		const response = await api.post(API_PATHS.payruns.root, body);
		return response.data;
	},

	validate: async (id) => {
		const response = await api.post(API_PATHS.payruns.validate(id), {});
		return response.data;
	},

	markPaid: async (id, data) => {
		const response = await api.post(API_PATHS.payruns.pay(id), data);
		return response.data;
	},

	cancel: async (id) => {
		const response = await api.post(API_PATHS.payruns.cancel(id), {});
		return response.data;
	},
};
