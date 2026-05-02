export async function createDepartment(db, { companyId, name }) {
    const { rows } = await db.query(
        'INSERT INTO departments(company_id, name) VALUES($1,$2) RETURNING *',
        [companyId, name]
    );
    return rows[0];
}

export async function countDepartments(db, companyId, search) {
	const params = [companyId];
	let q = `SELECT COUNT(*)::int AS c FROM departments WHERE company_id = $1`;
	if (search) {
		params.push(`%${search}%`);
		q += ` AND name ILIKE $${params.length}`;
	}
	const { rows } = await db.query(q, params);
	return rows[0]?.c ?? 0;
}

export async function listDepartments(db, { companyId, page = 1, limit = 10, search } = {}) {
	const offset = (page - 1) * limit;
	let base =
		"SELECT id, company_id, name, created_at FROM departments WHERE company_id = $1";
	const params = [companyId];
	if (search) {
		params.push(`%${search}%`);
		base += ` AND name ILIKE $${params.length}`;
	}
	params.push(limit, offset);
	base += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
	const { rows } = await db.query(base, params);
	return rows;
}

export async function findDepartmentById(db, id) {
	const { rows } = await db.query(
		`SELECT id, company_id, name, created_at FROM departments WHERE id = $1`,
		[id],
	);
	return rows[0] || null;
}

export async function findDepartmentByIdForCompany(db, id, companyId) {
	const { rows } = await db.query(
		`SELECT id, company_id, name, created_at FROM departments WHERE id = $1 AND company_id = $2`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function updateDepartment(db, id, name) {
    const { rows } = await db.query('UPDATE departments SET name = $1, created_at = created_at WHERE id = $2 RETURNING *', [name, id]);
    return rows[0] || null;
}

export async function deleteDepartment(db, id) {
	const { rows } = await db.query(`DELETE FROM departments WHERE id = $1 RETURNING id`, [id]);
	return rows[0] || null;
}
