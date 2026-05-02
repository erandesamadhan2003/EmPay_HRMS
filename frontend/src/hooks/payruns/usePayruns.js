import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payrunsService } from "../../services/payruns.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const usePayruns = (params = {}) => {
	return useQuery({
		queryKey: ["payruns", params],
		queryFn: () => payrunsService.getAll(params),
		...standardQueryOptions,
	});
};

export const usePayrunDetail = (payrunId, params = {}) => {
	return useQuery({
		queryKey: ["payruns", payrunId, params],
		queryFn: () => payrunsService.getById(payrunId, params),
		enabled: Boolean(payrunId),
		...standardQueryOptions,
	});
};

export const usePayrunMutations = () => {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ["payruns"], exact: false });

	const createMutation = useMutation({
		mutationFn: (data) => payrunsService.create(data),
		...mutationRetryOptions,
		onSuccess: invalidate,
	});

	const validateMutation = useMutation({
		mutationFn: (payrunId) => payrunsService.validate(payrunId),
		...mutationRetryOptions,
		onSuccess: (_, payrunId) => {
			invalidate();
			queryClient.invalidateQueries({ queryKey: ["payruns", payrunId] });
			queryClient.invalidateQueries({ queryKey: ["payslips"], exact: false });
			queryClient.invalidateQueries({ queryKey: ["reports"], exact: false });
		},
	});

	const markPaidMutation = useMutation({
		mutationFn: ({ payrunId, data }) => payrunsService.markPaid(payrunId, data),
		...mutationRetryOptions,
		onSuccess: (_, variables) => {
			invalidate();
			queryClient.invalidateQueries({ queryKey: ["payruns", variables.payrunId] });
			queryClient.invalidateQueries({ queryKey: ["payslips"], exact: false });
		},
	});

	const cancelMutation = useMutation({
		mutationFn: (payrunId) => payrunsService.cancel(payrunId),
		...mutationRetryOptions,
		onSuccess: invalidate,
	});

	return {
		createPayrun: createMutation.mutateAsync,
		validatePayrun: validateMutation.mutateAsync,
		markPayrunPaid: markPaidMutation.mutateAsync,
		cancelPayrun: cancelMutation.mutateAsync,
		isCreating: createMutation.isPending,
		isValidating: validateMutation.isPending,
		isMarkingPaid: markPaidMutation.isPending,
		isCancelling: cancelMutation.isPending,
	};
};
