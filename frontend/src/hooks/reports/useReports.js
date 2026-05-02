import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../../services/reports.service";
import { standardQueryOptions } from "../queryDefaults";

export const useSalaryStatementReport = (
	employeeId,
	year,
	options = {},
) => {
	const { enabled = true } = options;
	const yearNum =
		typeof year === "string" ? Number.parseInt(year, 10) : year;

	return useQuery({
		queryKey: ["reports", "salary-statement", employeeId, yearNum],
		queryFn: () =>
			reportsService.getSalaryStatement({
				employee_id: employeeId,
				year: yearNum,
			}),
		enabled:
			Boolean(enabled && employeeId) &&
			Boolean(Number.isFinite(yearNum)),
		...standardQueryOptions,
	});
};

export const usePayrollSummaryReport = (params = {}) => {
	return useQuery({
		queryKey: ["reports", "payroll-summary", params],
		queryFn: () => reportsService.getPayrollSummary(params),
		...standardQueryOptions,
	});
};

export const useEmployeeCountReport = (params = {}) => {
	return useQuery({
		queryKey: ["reports", "employee-count", params],
		queryFn: () => reportsService.getEmployeeCountReport(params),
		...standardQueryOptions,
	});
};
