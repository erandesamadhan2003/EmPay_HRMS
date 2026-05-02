import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salaryStructuresService } from "../../services/salaryStructures.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const useSalaryStructures = (params = {}) => {
	return useQuery({
		queryKey: ["salary-structures", params],
		queryFn: () => salaryStructuresService.getAll(params),
		...standardQueryOptions,
	});
};

export const useSalaryStructure = (structureId, options = {}) => {
	const { enabled = true } = options;
	return useQuery({
		queryKey: ["salary-structure", structureId],
		queryFn: () => salaryStructuresService.getById(structureId),
		enabled: Boolean(structureId && enabled),
		...standardQueryOptions,
	});
};

export const useSalaryStructureMutations = () => {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ["salary-structures"], exact: false });

	const createMutation = useMutation({
		mutationFn: (data) => salaryStructuresService.create(data),
		...mutationRetryOptions,
		onSuccess: invalidate,
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }) => salaryStructuresService.update(id, data),
		...mutationRetryOptions,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["salary-structure", variables.id],
			});
			invalidate();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => salaryStructuresService.remove(id),
		...mutationRetryOptions,
		onSuccess: invalidate,
	});

	return {
		createSalaryStructure: createMutation.mutateAsync,
		updateSalaryStructure: updateMutation.mutateAsync,
		deleteSalaryStructure: deleteMutation.mutateAsync,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
};
