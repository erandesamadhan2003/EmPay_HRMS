import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendance.service';

export const useMyAttendance = (params = {}) => {
    return useQuery({
        queryKey: ['attendance', 'me', params],
        queryFn: () => attendanceService.getMyAttendance(params),
        keepPreviousData: true,
    });
};

export const useAllAttendance = (params = {}) => {
    return useQuery({
        queryKey: ['attendance', 'all', params],
        queryFn: () => attendanceService.getAllAttendance(params),
        keepPreviousData: true,
    });
};

export const useAttendanceMutations = () => {
    const queryClient = useQueryClient();

    const checkInMutation = useMutation({
        mutationFn: attendanceService.checkIn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: attendanceService.checkOut,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    return {
        checkIn: checkInMutation.mutateAsync,
        checkOut: checkOutMutation.mutateAsync,
        isCheckingIn: checkInMutation.isPending,
        isCheckingOut: checkOutMutation.isPending,
    };
};