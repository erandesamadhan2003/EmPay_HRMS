import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';

export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboardStats'],
        queryFn: dashboardService.getStats,
        refetchInterval: 300000, 
    });
};

export const useDashboardWarnings = () => {
    return useQuery({
        queryKey: ['dashboardWarnings'],
        queryFn: dashboardService.getWarnings,
    });
};