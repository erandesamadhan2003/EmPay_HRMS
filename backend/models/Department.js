export async function createDepartment(db, { companyId, name, description, managerId }) {
    const { rows } = await db.query(
        'INSERT INTO departments(company_id, name, description, manager_id) VALUES($1,$2,$3,$4) RETURNING *',
        [companyId, name, description, managerId || null]
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
	let base = `
		SELECT 
			d.id, d.company_id, d.name, d.description, d.manager_id, d.created_at,
			u.name AS head_name,
			(SELECT COUNT(*)::int FROM employee_profiles ep JOIN users eu ON eu.id = ep.user_id WHERE ep.department_id = d.id AND eu.is_active = TRUE) AS employee_count
		FROM departments d
		LEFT JOIN users u ON u.id = d.manager_id
		WHERE d.company_id = $1
	`;
	const params = [companyId];
	if (search) {
		params.push(`%${search}%`);
		base += ` AND d.name ILIKE $${params.length}`;
	}
	params.push(limit, offset);
	base += ` ORDER BY d.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
	const { rows } = await db.query(base, params);
	return rows;
}

export async function findDepartmentById(db, id) {
	const { rows } = await db.query(
		`SELECT id, company_id, name, description, manager_id, created_at FROM departments WHERE id = $1`,
		[id],
	);
	return rows[0] || null;
}

export async function findDepartmentByIdForCompany(db, id, companyId) {
	const { rows } = await db.query(
		`SELECT id, company_id, name, description, manager_id, created_at FROM departments WHERE id = $1 AND company_id = $2`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function updateDepartment(db, id, { name, description, managerId }) {
    const { rows } = await db.query(
		'UPDATE departments SET name = $1, description = $2, manager_id = $3 WHERE id = $4 RETURNING *', 
		[name, description, managerId || null, id]
	);
    return rows[0] || null;
}

export async function deleteDepartment(db, id) {
	const { rows } = await db.query(`DELETE FROM departments WHERE id = $1 RETURNING id`, [id]);
	return rows[0] || null;
}
