import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const superadminService = {
    getDashboardStats: async () => {
        const response = await api.get(API_PATHS.superadmin.dashboardStats);
        return response.data;
    },

    getDashboardGrowth: async () => {
        const response = await api.get(API_PATHS.superadmin.analyticsGrowth);
        return response.data;
    },

    getDashboardHealth: async () => {
        const response = await api.get(API_PATHS.superadmin.analyticsHealth);
        return response.data;
    },

    getDashboardStatus: async () => {
        const response = await api.get(API_PATHS.superadmin.analyticsByStatus);
        return response.data;
    },

    getPlatformActivity: async (params = {}) => {
        const response = await api.get(API_PATHS.superadmin.activity, { params });
        return response.data;
    },

    getCompanies: async (params = {}) => {
        const response = await api.get(API_PATHS.superadmin.companies, { params });
        return response.data;
    },

    getCompanyDetail: async (id) => {
        const response = await api.get(API_PATHS.superadmin.companyDetail(id));
        return response.data;
    },

    getCompaniesStats: async () => {
        const response = await api.get(API_PATHS.superadmin.companiesStats);
        return response.data;
    },

    suspendCompany: async (id, data = {}) => {
        const response = await api.put(API_PATHS.superadmin.companySuspend(id), data);
        return response.data;
    },

    activateCompany: async (id) => {
        const response = await api.put(API_PATHS.superadmin.companyActivate(id));
        return response.data;
    },

    exportCompanies: async (params = {}) => {
        const response = await api.get(API_PATHS.superadmin.companiesExport, {
            params,
            responseType: "blob",
        });
        return response;
    },

    getAuditLogs: async (params = {}) => {
        const response = await api.get(API_PATHS.superadmin.auditLogs, { params });
        return response.data;
    },

    getAuditLogsStats: async () => {
        const response = await api.get(API_PATHS.superadmin.auditLogsStats);
        return response.data;
    },

    exportAuditLogs: async (params = {}) => {
        const response = await api.get(API_PATHS.superadmin.auditLogsExport, {
            params,
            responseType: "blob",
        });
        return response;
    },

    getCompanyRequests: async (params = {}) => {
        const response = await api.get(API_PATHS.companyRequests.list, { params });
        return response.data;
    },

    getCompanyRequestsStats: async () => {
        const response = await api.get(`${API_PATHS.companyRequests.list}/stats`);
        return response.data;
    },

    reviewCompanyRequest: async (id, data = {}) => {
        const response = await api.post(API_PATHS.companyRequests.review(id), {
            action: data.action,
            reviewer_notes: data.reviewer_notes ?? data.reviewerNotes ?? null,
        });
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get(API_PATHS.auth.me);
        return response.data;
    },

    updateProfile: async (data = {}) => {
        const response = await api.put(API_PATHS.auth.me, data);
        return response.data;
    },

    changePassword: async (data = {}) => {
        const response = await api.post(API_PATHS.auth.changePassword, data);
        return response.data;
    },
};