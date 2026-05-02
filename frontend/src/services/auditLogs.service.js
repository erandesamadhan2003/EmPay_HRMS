import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const auditLogsService = {
	getAll: async (params) => {
		const response = await api.get(API_PATHS.auditLogs, { params });
		return response.data;
	},
};
