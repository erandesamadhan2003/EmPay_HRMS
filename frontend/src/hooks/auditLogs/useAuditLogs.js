import { useQuery } from "@tanstack/react-query";
import { auditLogsService } from "../../services/auditLogs.service";
import { standardQueryOptions } from "../queryDefaults";

export const useAuditLogs = (params = {}) => {
	return useQuery({
		queryKey: ["audit-logs", params],
		queryFn: () => auditLogsService.getAll(params),
		...standardQueryOptions,
	});
};
