export async function countPayruns(db, companyId, filters = {}) {
	const params = [companyId];
	let where = `WHERE company_id = $1`;
	if (filters.status) {
		params.push(filters.status);
		where += ` AND status::text = $${params.length}`;
	}
	if (filters.year) {
		params.push(filters.year);
		where += ` AND EXTRACT(YEAR FROM period_start) = $${params.length}`;
	}
	const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM payruns ${where}`, params);
	return rows[0]?.c ?? 0;
}

export async function listPayruns(db, companyId, page, limit, filters = {}) {
	const params = [companyId];
	let where = `WHERE p.company_id = $1`;
	if (filters.status) {
		params.push(filters.status);
		where += ` AND p.status::text = $${params.length}`;
	}
	if (filters.year) {
		params.push(filters.year);
		where += ` AND EXTRACT(YEAR FROM p.period_start) = $${params.length}`;
	}
	const offset = (page - 1) * limit;
	params.push(limit, offset);
	const iLim = params.length - 1;
	const iOff = params.length;
	const q = `
		SELECT p.*, u.name AS generated_by_name
		FROM payruns p
		JOIN users u ON u.id = p.generated_by
		${where}
		ORDER BY p.created_at DESC
		LIMIT $${iLim} OFFSET $${iOff}
	`;
	const { rows } = await db.query(q, params);
	return rows;
}

export async function findPayrunById(db, id, companyId) {
	const { rows } = await db.query(
		`SELECT p.*, u.name AS generated_by_name, v.name AS validated_by_name
		 FROM payruns p
		 JOIN users u ON u.id = p.generated_by
		 LEFT JOIN users v ON v.id = p.validated_by
		 WHERE p.id = $1 AND p.company_id = $2`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function createPayrun(db, payload) {
	const { companyId, periodStart, periodEnd, generatedBy } = payload;
	const { rows } = await db.query(
		`INSERT INTO payruns(company_id, period_start, period_end, generated_by)
		 VALUES($1,$2,$3,$4) RETURNING *`,
		[companyId, periodStart, periodEnd, generatedBy],
	);
	return rows[0] || null;
}

export async function setPayrunStats(db, id, employeeCount, totalCost) {
	await db.query(
		`UPDATE payruns
		 SET employee_count = $1, total_cost = $2, updated_at = NOW()
		 WHERE id = $3`,
		[employeeCount, totalCost, id],
	);
}

export async function updatePayrunStatus(db, id, companyId, status, actorId, payDate = null) {
	let q = `UPDATE payruns SET status = $1::payrun_status, updated_at = NOW()`;
	const params = [status];
	if (status === "validated") {
		params.push(actorId);
		q += `, validated_by = $${params.length}, validated_at = NOW()`;
	}
	if (status === "paid") {
		params.push(payDate || new Date().toISOString().slice(0, 10));
		q += `, paid_at = $${params.length}::date`;
	}
	params.push(id, companyId);
	q += ` WHERE id = $${params.length - 1} AND company_id = $${params.length} RETURNING *`;
	const { rows } = await db.query(q, params);
	return rows[0] || null;
}

export async function countPayrunPayslips(db, payrunId, search) {
	const params = [payrunId];
	let where = `WHERE p.payrun_id = $1`;
	if (search) {
		params.push(`%${search}%`);
		where += ` AND (p.employee_name ILIKE $${params.length} OR p.employee_code ILIKE $${params.length})`;
	}
	const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM payslips p ${where}`, params);
	return rows[0]?.c ?? 0;
}

export async function listPayrunPayslips(db, payrunId, page, limit, search) {
	const params = [payrunId];
	let where = `WHERE p.payrun_id = $1`;
	if (search) {
		params.push(`%${search}%`);
		where += ` AND (p.employee_name ILIKE $${params.length} OR p.employee_code ILIKE $${params.length})`;
	}
	const offset = (page - 1) * limit;
	params.push(limit, offset);
	const iLim = params.length - 1;
	const iOff = params.length;
	const { rows } = await db.query(
		`SELECT * FROM payslips p ${where} ORDER BY p.employee_name ASC LIMIT $${iLim} OFFSET $${iOff}`,
		params,
	);
	return rows;
}

export async function countPayslipsGlobal(db, companyId, filters = {}, mineUserId = null) {
	const params = [companyId];
	let where = `WHERE company_id = $1`;
	if (mineUserId) {
		params.push(mineUserId);
		where += ` AND user_id = $${params.length}`;
	}
	if (filters.payrun_id) {
		params.push(filters.payrun_id);
		where += ` AND payrun_id = $${params.length}`;
	}
	if (filters.user_id) {
		params.push(filters.user_id);
		where += ` AND user_id = $${params.length}`;
	}
	if (filters.search) {
		params.push(`%${filters.search}%`);
		where += ` AND (employee_name ILIKE $${params.length} OR employee_code ILIKE $${params.length})`;
	}
	const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM payslips ${where}`, params);
	return rows[0]?.c ?? 0;
}

export async function listPayslipsGlobal(db, companyId, page, limit, filters = {}, mineUserId = null) {
	const params = [companyId];
	let where = `WHERE company_id = $1`;
	if (mineUserId) {
		params.push(mineUserId);
		where += ` AND user_id = $${params.length}`;
	}
	if (filters.payrun_id) {
		params.push(filters.payrun_id);
		where += ` AND payrun_id = $${params.length}`;
	}
	if (filters.user_id) {
		params.push(filters.user_id);
		where += ` AND user_id = $${params.length}`;
	}
	if (filters.search) {
		params.push(`%${filters.search}%`);
		where += ` AND (employee_name ILIKE $${params.length} OR employee_code ILIKE $${params.length})`;
	}
	const offset = (page - 1) * limit;
	params.push(limit, offset);
	const iLim = params.length - 1;
	const iOff = params.length;
	const { rows } = await db.query(
		`SELECT * FROM payslips ${where} ORDER BY created_at DESC LIMIT $${iLim} OFFSET $${iOff}`,
		params,
	);
	return rows;
}

export async function findPayslipById(db, id, companyId) {
	const { rows } = await db.query(
		`SELECT * FROM payslips WHERE id = $1 AND company_id = $2`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function insertPayslip(db, payload) {
	const cols = Object.keys(payload);
	const params = cols.map((_, i) => `$${i + 1}`);
	const vals = cols.map((k) => payload[k]);
	const { rows } = await db.query(
		`INSERT INTO payslips (${cols.join(", ")}) VALUES (${params.join(", ")}) RETURNING *`,
		vals,
	);
	return rows[0] || null;
}

export async function updatePayslipByPayrunUser(db, payrunId, userId, patch) {
	const entries = Object.entries(patch);
	if (!entries.length) return null;
	const sets = entries.map(([k], i) => `${k} = $${i + 1}`);
	const vals = entries.map(([, v]) => v);
	vals.push(payrunId, userId);
	const { rows } = await db.query(
		`UPDATE payslips SET ${sets.join(", ")}, updated_at = NOW()
		 WHERE payrun_id = $${vals.length - 1} AND user_id = $${vals.length}
		 RETURNING *`,
		vals,
	);
	return rows[0] || null;
}
