import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const payslipsService = {
	getAll: async (params) => {
		const response = await api.get(API_PATHS.payslips.root, { params });
		return response.data;
	},

	getMine: async (params) => {
		const response = await api.get(API_PATHS.payslips.me, { params });
		return response.data;
	},

	getById: async (id) => {
		const response = await api.get(API_PATHS.payslips.detail(id));
		return response.data;
	},

	getPdfBlob: async (id) => {
		const response = await api.get(API_PATHS.payslips.pdf(id), {
			responseType: "blob",
		});
		return response.data;
	},

	regenerate: async (payrunId, data) => {
		const response = await api.post(API_PATHS.payslips.regenerate(payrunId), data);
		return response.data;
	},
};
