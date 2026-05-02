export function paginationMeta({ page, limit, total }) {
	const safeLimit = Math.max(1, limit);
	const safePage = Math.max(1, page);
	const totalPages = Math.ceil(total / safeLimit) || 1;
	return {
		page: safePage,
		limit: safeLimit,
		total,
		totalPages,
		hasNextPage: safePage < totalPages,
		hasPrevPage: safePage > 1,
	};
}

/** Clamp list query params (routes ref: max 50). */
export function parseListQuery(q) {
	const page = Math.max(1, parseInt(q.page ?? "1", 10) || 1);
	const rawLimit = parseInt(q.limit ?? "10", 10) || 10;
	const limit = Math.min(50, Math.max(1, rawLimit));
	return { page, limit };
}
