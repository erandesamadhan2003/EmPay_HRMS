import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const reportsService = {
	getSalaryStatement: async (params) => {
		const response = await api.get(API_PATHS.reports.salaryStatement, { params });
		return response.data;
	},

	getPayrollSummary: async (params) => {
		const response = await api.get(API_PATHS.reports.payrollSummary, { params });
		return response.data;
	},

	getEmployeeCountReport: async (params) => {
		const response = await api.get(API_PATHS.reports.employeeCount, { params });
		return response.data;
	},
};
