import api from '../api/api';

export const authService = {
    createCompany: async (companyData) => {
        const response = await api.post('/companies', companyData);
        return response.data;
    },

    registerUser: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        
        if (response.data?.data?.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    reviewCompanyRequest: async (requestId, reviewData) => {
        const response = await api.post(`/company-requests/${requestId}/review`, reviewData);
        return response.data;
    }
};