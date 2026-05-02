import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../../services/dashboard.service";
import { standardQueryOptions } from "../queryDefaults";

export const useDashboardStats = () => {
	return useQuery({
		queryKey: ["dashboardStats"],
		queryFn: dashboardService.getStats,
		...standardQueryOptions,
	});
};

export const useDashboardEmployerCost = (params = {}) => {
	return useQuery({
		queryKey: ["dashboardEmployerCost", params],
		queryFn: () => dashboardService.getEmployerCost(params),
		...standardQueryOptions,
	});
};

export const useDashboardEmployeeCount = (params = {}) => {
	return useQuery({
		queryKey: ["dashboardEmployeeCount", params],
		queryFn: () => dashboardService.getEmployeeCount(params),
		...standardQueryOptions,
	});
};

export const useDashboardWarnings = () => {
	return useQuery({
		queryKey: ["dashboardWarnings"],
		queryFn: dashboardService.getWarnings,
		...standardQueryOptions,
	});
};
