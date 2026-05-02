import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timeOffService } from "../../services/timeOff.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const useTimeOffAllocations = (params = {}) => {
	return useQuery({
		queryKey: ["time-off", "allocations", params],
		queryFn: () => timeOffService.listAllocations(params),
		...standardQueryOptions,
	});
};

export const useMyTimeOffAllocations = () => {
	return useQuery({
		queryKey: ["time-off", "allocations", "me"],
		queryFn: () => timeOffService.getMyAllocations(),
		...standardQueryOptions,
	});
};

export const useTimeOffAllocationMutations = () => {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (data) => timeOffService.createAllocation(data),
		...mutationRetryOptions,
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["time-off", "allocations"],
				exact: false,
			}),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }) => timeOffService.updateAllocation(id, data),
		...mutationRetryOptions,
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["time-off", "allocations"],
				exact: false,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => timeOffService.deleteAllocation(id),
		...mutationRetryOptions,
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["time-off", "allocations"],
				exact: false,
			}),
	});

	return {
		createAllocation: createMutation.mutateAsync,
		updateAllocation: updateMutation.mutateAsync,
		deleteAllocation: deleteMutation.mutateAsync,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
};
