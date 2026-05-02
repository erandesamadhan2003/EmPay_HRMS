import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const timeOffService = {
	listAllocations: async (params) => {
		const response = await api.get(API_PATHS.timeOff.allocations, { params });
		return response.data;
	},

	createAllocation: async (data) => {
		const response = await api.post(API_PATHS.timeOff.allocations, data);
		return response.data;
	},

	getMyAllocations: async () => {
		const response = await api.get(API_PATHS.timeOff.allocationsMe);
		return response.data;
	},

	updateAllocation: async (id, data) => {
		const response = await api.put(API_PATHS.timeOff.allocationDetail(id), data);
		return response.data;
	},

	deleteAllocation: async (id) => {
		const response = await api.delete(API_PATHS.timeOff.allocationDetail(id));
		return response.data;
	},

	listRequests: async (params) => {
		const response = await api.get(API_PATHS.timeOff.requests, { params });
		return response.data;
	},

	createRequest: async (data) => {
		const response = await api.post(API_PATHS.timeOff.requests, data);
		return response.data;
	},

	getMyRequests: async (params) => {
		const response = await api.get(API_PATHS.timeOff.requestsMe, { params });
		return response.data;
	},

	getRequestById: async (id) => {
		const response = await api.get(API_PATHS.timeOff.requestDetail(id));
		return response.data;
	},

	approveRequest: async (id, data) => {
		const response = await api.put(API_PATHS.timeOff.approveRequest(id), data);
		return response.data;
	},

	rejectRequest: async (id, data) => {
		const response = await api.put(API_PATHS.timeOff.rejectRequest(id), data);
		return response.data;
	},

	cancelRequest: async (id) => {
		const response = await api.put(API_PATHS.timeOff.cancelRequest(id), {});
		return response.data;
	},
};
