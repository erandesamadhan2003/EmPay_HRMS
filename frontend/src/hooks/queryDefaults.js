/** Shared TanStack Query options (documented UX for list/detail reads). */

export const standardQueryOptions = {
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
	refetchOnWindowFocus: true,
	refetchOnReconnect: true,
	refetchOnMount: false,
	retry: 2,
	retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
	placeholderData: (previousData) => previousData,
};

export const mutationRetryOptions = {
	retry: 2,
	retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
};
