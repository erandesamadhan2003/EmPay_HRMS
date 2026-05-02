export async function createCompanyRequest(db, { companyId, adminUserId }) {
	const { rows } = await db.query(
		`INSERT INTO company_requests(company_id, admin_user_id) VALUES($1,$2) RETURNING *`,
		[companyId, adminUserId],
	);
	return rows[0];
}

export async function findCompanyRequestByCompanyId(db, companyId) {
	const { rows } = await db.query(
		`SELECT * FROM company_requests WHERE company_id = $1`,
		[companyId],
	);
	return rows[0] || null;
}

export async function listCompanyRequestsPaged(db, { page, limit, status } = {}) {
	const offset = (page - 1) * limit;
	const baseParams = [];
	let where = "";
	if (status) {
		baseParams.push(status);
		where = "WHERE cr.status = $1";
	}
	const { rows: countRows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM company_requests cr ${where}`,
		baseParams,
	);
	const total = countRows[0]?.c ?? 0;

	const lp = [...baseParams, limit, offset];
	const li = lp.length - 1;
	const oi = lp.length;
	const { rows } = await db.query(
		`SELECT cr.id, cr.company_id, cr.admin_user_id, cr.status, cr.reviewed_by, cr.reviewed_at,
			cr.reviewer_notes, cr.created_at, cr.updated_at,
			c.name AS company_name,
			u.name AS admin_name, u.email AS admin_email, u.login_id AS admin_login_id
		 FROM company_requests cr
		 JOIN companies c ON c.id = cr.company_id
		 JOIN users u ON u.id = cr.admin_user_id
		 ${where}
		 ORDER BY cr.created_at DESC
		 LIMIT $${li} OFFSET $${oi}`,
		lp,
	);
	return { rows, total };
}

export async function findCompanyRequestById(db, requestId) {
	const { rows } = await db.query(`SELECT * FROM company_requests WHERE id = $1`, [requestId]);
	return rows[0] || null;
}

export async function reviewCompanyRequest(db, { requestId, reviewerId, status, reviewerNotes }) {
	const { rows } = await db.query(
		`UPDATE company_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW(), reviewer_notes = $3, updated_at = NOW()
		 WHERE id = $4 RETURNING *`,
		[status, reviewerId, reviewerNotes || null, requestId],
	);
	return rows[0] || null;
}
