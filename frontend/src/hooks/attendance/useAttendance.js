import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "../../services/attendance.service";
import { mutationRetryOptions, standardQueryOptions } from "../queryDefaults";

export const useCheckInPolicy = () => {
	return useQuery({
		queryKey: ["attendance", "policy"],
		queryFn: () => attendanceService.getCheckInPolicy(),
		...standardQueryOptions,
	});
};

export const useMyAttendance = (params = {}) => {
	return useQuery({
		queryKey: ["attendance", "me", params],
		queryFn: () => attendanceService.getMyAttendance(params),
		...standardQueryOptions,
	});
};

export const useAllAttendance = (params = {}) => {
	return useQuery({
		queryKey: ["attendance", "all", params],
		queryFn: () => attendanceService.getAllAttendance(params),
		...standardQueryOptions,
	});
};

export const useAttendanceForUser = (userId, params = {}) => {
	return useQuery({
		queryKey: ["attendance", "user", userId, params],
		queryFn: () => attendanceService.getUserAttendance(userId, params),
		enabled: Boolean(userId),
		...standardQueryOptions,
	});
};

export const useAttendanceSummary = (userId, params = {}) => {
	return useQuery({
		queryKey: ["attendance", "summary", userId, params],
		queryFn: () => attendanceService.getSummary(userId, params),
		enabled: Boolean(userId),
		...standardQueryOptions,
	});
};

export const useAttendanceMutations = () => {
	const queryClient = useQueryClient();

	const checkInMutation = useMutation({
		mutationFn: attendanceService.checkIn,
		...mutationRetryOptions,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["attendance"],
				exact: false,
			});
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
		},
	});

	const checkOutMutation = useMutation({
		mutationFn: attendanceService.checkOut,
		...mutationRetryOptions,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["attendance"],
				exact: false,
			});
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
		},
	});

	const updateRecordMutation = useMutation({
		mutationFn: ({ id, data }) =>
			attendanceService.updateRecord(id, data),
		...mutationRetryOptions,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["attendance"],
				exact: false,
			});
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
		},
	});

	return {
		checkIn: checkInMutation.mutateAsync,
		checkOut: checkOutMutation.mutateAsync,
		updateAttendanceRecord: updateRecordMutation.mutateAsync,
		isCheckingIn: checkInMutation.isPending,
		isCheckingOut: checkOutMutation.isPending,
		isUpdatingRecord: updateRecordMutation.isPending,
	};
};
