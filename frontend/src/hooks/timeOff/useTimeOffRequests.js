import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timeOffService } from "../../services/timeOff.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const useTimeOffRequests = (params = {}) => {
	return useQuery({
		queryKey: ["time-off", "requests", params],
		queryFn: () => timeOffService.listRequests(params),
		...standardQueryOptions,
	});
};

export const useMyTimeOffRequests = (params = {}) => {
	return useQuery({
		queryKey: ["time-off", "requests", "me", params],
		queryFn: () => timeOffService.getMyRequests(params),
		...standardQueryOptions,
	});
};

export const useTimeOffRequest = (requestId, options = {}) => {
	const { enabled = true } = options;
	return useQuery({
		queryKey: ["time-off", "requests", "detail", requestId],
		queryFn: () => timeOffService.getRequestById(requestId),
		enabled: Boolean(requestId && enabled),
		...standardQueryOptions,
	});
};

export const useTimeOffRequestMutations = () => {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ["time-off", "requests"], exact: false });

	const createMutation = useMutation({
		mutationFn: (data) => timeOffService.createRequest(data),
		...mutationRetryOptions,
		onSuccess: invalidate,
	});

	const approveMutation = useMutation({
		mutationFn: ({ id, data }) => timeOffService.approveRequest(id, data),
		...mutationRetryOptions,
		onSuccess: () => {
			invalidate();
			queryClient.invalidateQueries({ queryKey: ["attendance"], exact: false });
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
			queryClient.invalidateQueries({ queryKey: ["time-off", "allocations"], exact: false });
		},
	});

	const rejectMutation = useMutation({
		mutationFn: ({ id, data }) => timeOffService.rejectRequest(id, data),
		...mutationRetryOptions,
		onSuccess: invalidate,
	});

	const cancelMutation = useMutation({
		mutationFn: (id) => timeOffService.cancelRequest(id),
		...mutationRetryOptions,
		onSuccess: invalidate,
	});

	return {
		createRequest: createMutation.mutateAsync,
		approveRequest: approveMutation.mutateAsync,
		rejectRequest: rejectMutation.mutateAsync,
		cancelRequest: cancelMutation.mutateAsync,
		isCreating: createMutation.isPending,
		isApproving: approveMutation.isPending,
		isRejecting: rejectMutation.isPending,
		isCancelling: cancelMutation.isPending,
	};
};
