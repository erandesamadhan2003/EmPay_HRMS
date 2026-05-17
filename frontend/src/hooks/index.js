export { standardQueryOptions, mutationRetryOptions } from "./queryDefaults";

export {
	useEmployees,
	useEmployeeProfile,
	useEmployeeSalary,
	useEmployeeMutations,
} from "./employees/useEmployee";

export {
	useMyAttendance,
	useAllAttendance,
	useAttendanceForUser,
	useAttendanceSummary,
	useCheckInPolicy,
	useAttendanceMutations,
} from "./attendance/useAttendance";

export {
	useDashboardStats,
	useDashboardEmployerCost,
	useDashboardEmployeeCount,
	useDashboardWarnings,
} from "./dashboard/useDashboard";

export {
	useDepartments,
	useDepartmentMutations,
} from "./departments/useDepartments";

export {
	useTimeOffAllocations,
	useMyTimeOffAllocations,
	useTimeOffAllocationMutations,
} from "./timeOff/useTimeOffAllocations";

export {
	useTimeOffRequests,
	useMyTimeOffRequests,
	useTimeOffRequest,
	useTimeOffRequestMutations,
} from "./timeOff/useTimeOffRequests";

export {
	useSalaryStructures,
	useSalaryStructure,
	useSalaryStructureMutations,
} from "./salaryStructures/useSalaryStructures";

export {
	usePayruns,
	usePayrunDetail,
	usePayrunMutations,
} from "./payruns/usePayruns";

export {
	usePayslips,
	useMyPayslips,
	usePayslip,
	usePayslipMutations,
} from "./payslips/usePayslips";

export {
	useSalaryStatementReport,
	usePayrollSummaryReport,
	useEmployeeCountReport,
} from "./reports/useReports";

export {
	useSettingsUsers,
	useSettingsCompany,
	useSettingsMutations,
} from "./settings/useSettings";

export { useAuditLogs } from "./auditLogs/useAuditLogs";

export { useCompanyRequests } from "./auth/useCompanyRequests";

export { useAuth } from "./auth/useAuth";

export {
	useSuperadminDashboardStats,
	useSuperadminDashboardGrowth,
	useSuperadminDashboardHealth,
	useSuperadminDashboardStatus,
	useSuperadminPlatformActivity,
	useSuperadminCompanies,
	useSuperadminCompanyDetail,
	useSuperadminCompaniesStats,
	useSuperadminCompanyMutations,
	useSuperadminCompanyRequests,
	useSuperadminCompanyRequestStats,
	useSuperadminCompanyRequestMutations,
	useSuperadminAuditLogs,
	useSuperadminAuditLogStats,
	useSuperadminProfile,
	useSuperadminProfileMutations,
} from "./superadmin";
