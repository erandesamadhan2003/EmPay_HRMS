import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const employeesService = {
	getAll: async (params) => {
		const response = await api.get(API_PATHS.employees.root, { params });
		return response.data;
	},

	getMe: async () => {
		const response = await api.get(API_PATHS.employees.me);
		return response.data;
	},

	getById: async (id) => {
		const response = await api.get(API_PATHS.employees.detail(id));
		return response.data;
	},

	create: async (data) => {
		const response = await api.post(API_PATHS.employees.root, data);
		return response.data;
	},

	update: async (id, data) => {
		const response = await api.put(API_PATHS.employees.detail(id), data);
		return response.data;
	},

	updateMe: async (data) => {
		const response = await api.put(API_PATHS.employees.me, data);
		return response.data;
	},

	delete: async (id) => {
		const response = await api.delete(API_PATHS.employees.detail(id));
		return response.data;
	},

	getSalary: async (userId) => {
		const response = await api.get(API_PATHS.employees.salary(userId));
		return response.data;
	},

	updateSalary: async (userId, data) => {
		const response = await api.put(API_PATHS.employees.salary(userId), data);
		return response.data;
	},
};
