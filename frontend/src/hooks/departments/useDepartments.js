import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsService } from "../../services/departments.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const useDepartments = (params = {}) => {
	return useQuery({
		queryKey: ["departments", params],
		queryFn: () => departmentsService.getAll(params),
		...standardQueryOptions,
	});
};

export const useDepartmentMutations = () => {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (data) => departmentsService.create(data),
		...mutationRetryOptions,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }) => departmentsService.update(id, data),
		...mutationRetryOptions,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => departmentsService.remove(id),
		...mutationRetryOptions,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
	});

	return {
		createDepartment: createMutation.mutateAsync,
		updateDepartment: updateMutation.mutateAsync,
		deleteDepartment: deleteMutation.mutateAsync,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
};
