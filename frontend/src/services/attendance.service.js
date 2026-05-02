import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const attendanceService = {
	getCheckInPolicy: async () => {
		const response = await api.get(API_PATHS.attendance.checkInPolicy);
		return response.data;
	},

	checkIn: async (coords) => {
		const response = await api.post(API_PATHS.attendance.checkIn, coords || {});
		return response.data;
	},

	checkOut: async () => {
		const response = await api.post(API_PATHS.attendance.checkOut);
		return response.data;
	},

	getMyAttendance: async (params) => {
		const response = await api.get(API_PATHS.attendance.me, { params });
		return response.data;
	},

	getAllAttendance: async (params) => {
		const response = await api.get(API_PATHS.attendance.root, { params });
		return response.data;
	},

	getUserAttendance: async (userId, params) => {
		const response = await api.get(API_PATHS.attendance.user(userId), { params });
		return response.data;
	},

	getSummary: async (userId, params) => {
		const response = await api.get(API_PATHS.attendance.summary(userId), { params });
		return response.data;
	},

	updateRecord: async (id, data) => {
		const response = await api.put(API_PATHS.attendance.record(id), data);
		return response.data;
	},
};
