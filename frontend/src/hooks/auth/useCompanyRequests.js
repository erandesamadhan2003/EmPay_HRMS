import { useQuery } from "@tanstack/react-query";
import { authService } from "../../services/auth.service";
import { standardQueryOptions } from "../queryDefaults";

/** Superadmin queue for `company_requests` (when `GET /company-requests` is implemented). */

export const useCompanyRequests = (params = {}) => {
	return useQuery({
		queryKey: ["company-requests", params],
		queryFn: () => authService.fetchCompanyRequests(params),
		...standardQueryOptions,
	});
};
