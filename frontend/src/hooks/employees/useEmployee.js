import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesService } from "../../services/employees.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const useEmployees = (params = {}) => {
	return useQuery({
		queryKey: ["employees", params],
		queryFn: () => employeesService.getAll(params),
		...standardQueryOptions,
	});
};

export const useEmployeeProfile = (id) => {
	return useQuery({
		queryKey: ["employee", id ?? "me"],
		queryFn: () => (id ? employeesService.getById(id) : employeesService.getMe()),
		...standardQueryOptions,
	});
};

export const useEmployeeSalary = (userId, options = {}) => {
	const { enabled = true } = options;

	return useQuery({
		queryKey: ["employee", userId, "salary"],
		queryFn: () => employeesService.getSalary(userId),
		enabled: Boolean(userId && enabled),
		...standardQueryOptions,
	});
};

export const useEmployeeMutations = () => {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: employeesService.create,
		...mutationRetryOptions,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["employees"] });
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }) => employeesService.update(id, data),
		...mutationRetryOptions,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["employees"] });
			queryClient.invalidateQueries({
				queryKey: ["employee", variables.id],
				exact: false,
			});
		},
	});

	const updateMeMutation = useMutation({
		mutationFn: (data) => employeesService.updateMe(data),
		...mutationRetryOptions,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["employee"],
				exact: false,
			});
		},
	});

	const updateSalaryMutation = useMutation({
		mutationFn: ({ userId, data }) =>
			employeesService.updateSalary(userId, data),
		...mutationRetryOptions,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["employees"] });
			queryClient.invalidateQueries({
				queryKey: ["employee", variables.userId, "salary"],
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: employeesService.delete,
		...mutationRetryOptions,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["employees"] });
		},
	});

	return {
		createEmployee: createMutation.mutateAsync,
		updateEmployee: updateMutation.mutateAsync,
		updateEmployeeMe: updateMeMutation.mutateAsync,
		updateEmployeeSalary: updateSalaryMutation.mutateAsync,
		deleteEmployee: deleteMutation.mutateAsync,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isUpdatingMe: updateMeMutation.isPending,
		isUpdatingSalary: updateSalaryMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
};
