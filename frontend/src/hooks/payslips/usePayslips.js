import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payslipsService } from "../../services/payslips.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const usePayslips = (params = {}) => {
	return useQuery({
		queryKey: ["payslips", params],
		queryFn: () => payslipsService.getAll(params),
		...standardQueryOptions,
	});
};

export const useMyPayslips = (params = {}) => {
	return useQuery({
		queryKey: ["payslips", "me", params],
		queryFn: () => payslipsService.getMine(params),
		...standardQueryOptions,
	});
};

export const usePayslip = (id, options = {}) => {
	const { enabled = true } = options;
	return useQuery({
		queryKey: ["payslip", id],
		queryFn: () => payslipsService.getById(id),
		enabled: Boolean(id && enabled),
		...standardQueryOptions,
	});
};

export const usePayslipMutations = () => {
	const queryClient = useQueryClient();

	const regenerateMutation = useMutation({
		mutationFn: ({ payrunId, data }) =>
			payslipsService.regenerate(payrunId, data),
		...mutationRetryOptions,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payslips"], exact: false });
			queryClient.invalidateQueries({ queryKey: ["payruns"], exact: false });
		},
	});

	const downloadPdfMutation = useMutation({
		mutationFn: (id) => payslipsService.getPdfBlob(id),
		...mutationRetryOptions,
	});

	return {
		regeneratePayslip: regenerateMutation.mutateAsync,
		loadPayslipPdfBlob: downloadPdfMutation.mutateAsync,
		isRegenerating: regenerateMutation.isPending,
		isLoadingPdf: downloadPdfMutation.isPending,
	};
};
