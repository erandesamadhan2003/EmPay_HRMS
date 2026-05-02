import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesService } from '../../services/employees.service';

export const useEmployees = (params = {}) => {
    return useQuery({
        queryKey: ['employees', params],
        queryFn: () => employeesService.getAll(params),
        keepPreviousData: true,
        staleTime: 60000,
    });
};

export const useEmployeeProfile = (id) => {
    return useQuery({
        queryKey: ['employee', id],
        queryFn: () => (id ? employeesService.getById(id) : employeesService.getMe()),
        staleTime: 60000,
    });
};

export const useEmployeeMutations = () => {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: employeesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => employeesService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: employeesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });

    return {
        createEmployee: createMutation.mutateAsync,
        updateEmployee: updateMutation.mutateAsync,
        deleteEmployee: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};