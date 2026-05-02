import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const dashboardService = {
	getStats: async () => {
		const response = await api.get(API_PATHS.dashboard.stats);
		return response.data;
	},

	getEmployerCost: async (params) => {
		const response = await api.get(API_PATHS.dashboard.employerCost, { params });
		return response.data;
	},

	getEmployeeCount: async (params) => {
		const response = await api.get(API_PATHS.dashboard.employeeCount, { params });
		return response.data;
	},

	getWarnings: async () => {
		const response = await api.get(API_PATHS.dashboard.warnings);
		return response.data;
	},
};
