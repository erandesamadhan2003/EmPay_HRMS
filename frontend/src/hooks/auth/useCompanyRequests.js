import { useQuery } from "@tanstack/react-query";
import { authService } from "../../services/auth.service";
import { standardQueryOptions } from "../queryDefaults";

/** Superadmin queue: `GET /company-requests` (see `API_PATHS.companyRequests`). */

export const useCompanyRequests = (params = {}) => {
	return useQuery({
		queryKey: ["company-requests", params],
		queryFn: () => authService.fetchCompanyRequests(params),
		...standardQueryOptions,
	});
};
