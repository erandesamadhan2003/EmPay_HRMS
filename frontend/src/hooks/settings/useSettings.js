import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../../services/settings.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const useSettingsUsers = (params = {}) => {
	return useQuery({
		queryKey: ["settings", "users", params],
		queryFn: () => settingsService.getUsers(params),
		...standardQueryOptions,
	});
};

export const useSettingsCompany = () => {
	return useQuery({
		queryKey: ["settings", "company"],
		queryFn: () => settingsService.getCompany(),
		...standardQueryOptions,
	});
};

export const useSettingsMutations = () => {
	const queryClient = useQueryClient();

	const updateRoleMutation = useMutation({
		mutationFn: ({ userId, data }) =>
			settingsService.updateUserRole(userId, data),
		...mutationRetryOptions,
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["settings", "users"],
				exact: false,
			}),
	});

	const updateCompanyMutation = useMutation({
		mutationFn: (formData) => settingsService.updateCompany(formData),
		...mutationRetryOptions,
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["settings", "company"],
			}),
	});

	return {
		updateUserRole: updateRoleMutation.mutateAsync,
		updateCompany: updateCompanyMutation.mutateAsync,
		isUpdatingRole: updateRoleMutation.isPending,
		isUpdatingCompany: updateCompanyMutation.isPending,
	};
};
