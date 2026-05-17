import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superadminService } from "../../services/superadmin.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

const queryResult = (query) => ({
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
});

const serializeParams = (params) => {
    if (params instanceof URLSearchParams) return params.toString();
    if (typeof params === "string") return params;
    return JSON.stringify(params || {});
};

export const useSuperadminDashboardStats = () =>
    queryResult(
        useQuery({
            queryKey: ["superadminDashboardStats"],
            queryFn: superadminService.getDashboardStats,
            ...standardQueryOptions,
        }),
    );

export const useSuperadminDashboardGrowth = () =>
    queryResult(
        useQuery({
            queryKey: ["superadminDashboardGrowth"],
            queryFn: superadminService.getDashboardGrowth,
            ...standardQueryOptions,
        }),
    );

export const useSuperadminDashboardHealth = () =>
    queryResult(
        useQuery({
            queryKey: ["superadminDashboardHealth"],
            queryFn: superadminService.getDashboardHealth,
            ...standardQueryOptions,
        }),
    );

export const useSuperadminDashboardStatus = () =>
    queryResult(
        useQuery({
            queryKey: ["superadminDashboardStatus"],
            queryFn: superadminService.getDashboardStatus,
            ...standardQueryOptions,
        }),
    );

export const useSuperadminPlatformActivity = (limit = 6) =>
    queryResult(
        useQuery({
            queryKey: ["superadminPlatformActivity", limit],
            queryFn: () => superadminService.getPlatformActivity({ limit }),
            ...standardQueryOptions,
        }),
    );

export const useSuperadminCompanies = (params = {}) =>
    queryResult(
        useQuery({
            queryKey: ["superadminCompanies", serializeParams(params)],
            queryFn: () => superadminService.getCompanies(params),
            ...standardQueryOptions,
        }),
    );

export const useSuperadminCompanyDetail = (companyId) =>
    queryResult(
        useQuery({
            queryKey: ["superadminCompanyDetail", companyId],
            queryFn: () => superadminService.getCompanyDetail(companyId),
            enabled: Boolean(companyId),
            ...standardQueryOptions,
        }),
    );

export const useSuperadminCompaniesStats = () =>
    queryResult(
        useQuery({
            queryKey: ["superadminCompaniesStats"],
            queryFn: superadminService.getCompaniesStats,
            ...standardQueryOptions,
        }),
    );

export const useSuperadminCompanyMutations = () => {
    const queryClient = useQueryClient();

    const suspendMutation = useMutation({
        mutationFn: ({ id, reason }) => superadminService.suspendCompany(id, { reason }),
        ...mutationRetryOptions,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["superadminCompanies"] }),
    });

    const activateMutation = useMutation({
        mutationFn: (id) => superadminService.activateCompany(id),
        ...mutationRetryOptions,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["superadminCompanies"] }),
    });

    return {
        suspendCompany: suspendMutation.mutateAsync,
        activateCompany: activateMutation.mutateAsync,
        isSuspending: suspendMutation.isPending,
        isActivating: activateMutation.isPending,
    };
};

export const useSuperadminCompanyRequests = (params = {}) =>
    queryResult(
        useQuery({
            queryKey: ["superadminCompanyRequests", serializeParams(params)],
            queryFn: () => superadminService.getCompanyRequests(params),
            ...standardQueryOptions,
        }),
    );

export const useSuperadminCompanyRequestStats = () =>
    queryResult(
        useQuery({
            queryKey: ["superadminCompanyRequestStats"],
            queryFn: superadminService.getCompanyRequestsStats,
            ...standardQueryOptions,
        }),
    );

export const useSuperadminCompanyRequestMutations = () => {
    const queryClient = useQueryClient();

    const reviewMutation = useMutation({
        mutationFn: ({ id, data }) => superadminService.reviewCompanyRequest(id, data),
        ...mutationRetryOptions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["superadminCompanyRequests"] });
            queryClient.invalidateQueries({ queryKey: ["superadminDashboardStats"] });
            queryClient.invalidateQueries({ queryKey: ["superadminDashboardStatus"] });
        },
    });

    return {
        reviewRequest: reviewMutation.mutateAsync,
        isReviewing: reviewMutation.isPending,
    };
};

export const useSuperadminAuditLogs = (params = {}) =>
    queryResult(
        useQuery({
            queryKey: ["superadminAuditLogs", serializeParams(params)],
            queryFn: () => superadminService.getAuditLogs(params),
            ...standardQueryOptions,
        }),
    );

export const useSuperadminAuditLogStats = () =>
    queryResult(
        useQuery({
            queryKey: ["superadminAuditLogStats"],
            queryFn: superadminService.getAuditLogsStats,
            ...standardQueryOptions,
        }),
    );

export const useSuperadminProfile = () =>
    queryResult(
        useQuery({
            queryKey: ["superadminProfile"],
            queryFn: superadminService.getProfile,
            ...standardQueryOptions,
        }),
    );

export const useSuperadminProfileMutations = () => {
    const queryClient = useQueryClient();

    const profileMutation = useMutation({
        mutationFn: (data) => superadminService.updateProfile(data),
        ...mutationRetryOptions,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["superadminProfile"] }),
    });

    const passwordMutation = useMutation({
        mutationFn: (data) => superadminService.changePassword(data),
        ...mutationRetryOptions,
    });

    const uploadAvatar = async (file) => {
        const avatarUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Unable to read avatar file"));
            reader.readAsDataURL(file);
        });
        return profileMutation.mutateAsync({ avatarUrl });
    };

    return {
        updateProfile: profileMutation.mutateAsync,
        changePassword: passwordMutation.mutateAsync,
        uploadAvatar,
        isUpdating: profileMutation.isPending,
        isChangingPassword: passwordMutation.isPending,
    };
};