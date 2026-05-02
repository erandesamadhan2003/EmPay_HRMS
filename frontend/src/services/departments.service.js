import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const departmentsService = {
	getAll: async (params) => {
		const response = await api.get(API_PATHS.departments.root, { params });
		return response.data;
	},

	create: async (data) => {
		const response = await api.post(API_PATHS.departments.root, data);
		return response.data;
	},

	update: async (id, data) => {
		const response = await api.put(API_PATHS.departments.detail(id), data);
		return response.data;
	},

	remove: async (id) => {
		const response = await api.delete(API_PATHS.departments.detail(id));
		return response.data;
	},
};
