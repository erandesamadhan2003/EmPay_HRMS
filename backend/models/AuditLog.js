export async function createAuditLog(db, payload) {
	const {
		companyId = null,
		actorId = null,
		action,
		entityType = null,
		entityId = null,
		payloadJson = null,
		ipAddress = null,
	} = payload;
	await db.query(
		`INSERT INTO audit_logs(company_id, actor_id, action, entity_type, entity_id, payload, ip_address)
		 VALUES($1,$2,$3,$4,$5,$6,$7)`,
		[companyId, actorId, action, entityType, entityId, payloadJson, ipAddress],
	);
}

export async function countAuditLogs(db, filters = {}, actorScope = {}) {
	const params = [];
	let where = `WHERE 1=1`;
	if (actorScope.companyId) {
		params.push(actorScope.companyId);
		where += ` AND company_id = $${params.length}`;
	}
	if (filters.companyId) {
		params.push(filters.companyId);
		where += ` AND company_id = $${params.length}`;
	}
	if (filters.actorId) {
		params.push(filters.actorId);
		where += ` AND actor_id = $${params.length}`;
	}
	if (filters.entityType) {
		params.push(filters.entityType);
		where += ` AND entity_type = $${params.length}`;
	}
	if (filters.from) {
		params.push(filters.from);
		where += ` AND created_at >= $${params.length}::timestamptz`;
	}
	if (filters.to) {
		params.push(filters.to);
		where += ` AND created_at <= $${params.length}::timestamptz`;
	}
	const { rows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM audit_logs ${where}`,
		params,
	);
	return rows[0]?.c ?? 0;
}

export async function listAuditLogs(db, page, limit, filters = {}, actorScope = {}) {
	const params = [];
	let where = `WHERE 1=1`;
	if (actorScope.companyId) {
		params.push(actorScope.companyId);
		where += ` AND company_id = $${params.length}`;
	}
	if (filters.companyId) {
		params.push(filters.companyId);
		where += ` AND company_id = $${params.length}`;
	}
	if (filters.actorId) {
		params.push(filters.actorId);
		where += ` AND actor_id = $${params.length}`;
	}
	if (filters.entityType) {
		params.push(filters.entityType);
		where += ` AND entity_type = $${params.length}`;
	}
	if (filters.from) {
		params.push(filters.from);
		where += ` AND created_at >= $${params.length}::timestamptz`;
	}
	if (filters.to) {
		params.push(filters.to);
		where += ` AND created_at <= $${params.length}::timestamptz`;
	}
	const offset = (page - 1) * limit;
	params.push(limit, offset);
	const iLim = params.length - 1;
	const iOff = params.length;
	const { rows } = await db.query(
		`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${iLim} OFFSET $${iOff}`,
		params,
	);
	return rows;
}
