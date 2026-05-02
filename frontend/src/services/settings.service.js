import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const settingsService = {
	getUsers: async (params) => {
		const response = await api.get(API_PATHS.settings.users, { params });
		return response.data;
	},

	updateUserRole: async (userId, data) => {
		const response = await api.put(API_PATHS.settings.userRole(userId), data);
		return response.data;
	},

	getCompany: async () => {
		const response = await api.get(API_PATHS.settings.company);
		return response.data;
	},

	updateCompany: async (formData) => {
		const response = await api.put(API_PATHS.settings.company, formData);
		return response.data;
	},
};
