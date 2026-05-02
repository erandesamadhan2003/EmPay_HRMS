import api from '../api/api';

export const attendanceService = {
    checkIn: async () => {
        const response = await api.post('/attendance/check-in');
        return response.data;
    },
    checkOut: async () => {
        const response = await api.post('/attendance/check-out');
        return response.data;
    },
    getMyAttendance: async (params) => {
        const response = await api.get('/attendance/me', { params });
        return response.data;
    },
    getAllAttendance: async (params) => {
        const response = await api.get('/attendance', { params });
        return response.data;
    },
    getSummary: async (userId, params) => {
        const response = await api.get(`/attendance/summary/${userId}`, { params });
        return response.data;
    }
};