import api from '../api/api';

export const dashboardService = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
    getWarnings: async () => {
        const response = await api.get('/dashboard/warnings');
        return response.data;
    }
};