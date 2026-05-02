const USER_SELF_FIELDS = ["name", "phone", "avatar_url"];

export async function findUserById(db, id) {
	const { rows } = await db.query(
		`SELECT id, company_id, login_id, name, email, phone, role, is_active, avatar_url, must_change_pwd, created_at
		 FROM users WHERE id = $1`,
		[id],
	);
	return rows[0] || null;
}

export async function findUserFullProfile(db, userId) {
	const { rows } = await db.query(
		`SELECT u.id, u.company_id, u.login_id, u.name, u.email, u.phone, u.role, u.is_active, u.avatar_url,
			u.must_change_pwd, u.created_at,
			e.designation, e.department_id, e.location, e.date_of_birth, e.date_of_joining, e.gender,
			e.nationality, e.personal_email, e.marital_status, e.manager_id,
			e.bank_account_number, e.bank_name, e.ifsc_code, e.pan_number, e.uan_number, e.esic_number,
			e.about, e.skills, e.certifications,
			d.name AS department_name,
			m.name AS manager_name
		 FROM users u
		 LEFT JOIN employee_profiles e ON e.user_id = u.id
		 LEFT JOIN departments d ON d.id = e.department_id
		 LEFT JOIN users m ON m.id = e.manager_id
		 WHERE u.id = $1`,
		[userId],
	);
	return rows[0] || null;
}

function buildEmployeeDirectoryWhere(companyId, { search, department, role, status }) {
	const params = [companyId];
	let where = `WHERE u.company_id = $1 AND u.role::text <> 'superadmin'`;

	if (search) {
		params.push(`%${search}%`);
		const s = `$${params.length}`;
		where += ` AND (u.name ILIKE ${s} OR u.login_id ILIKE ${s} OR u.email ILIKE ${s} OR e.designation ILIKE ${s})`;
	}
	if (department) {
		params.push(department);
		where += ` AND e.department_id = $${params.length}`;
	}
	if (role) {
		params.push(role);
		where += ` AND u.role::text = $${params.length}`;
	}
	if (status) {
		const active = status === "active";
		params.push(active);
		where += ` AND u.is_active = $${params.length}`;
	}
	return { where, params };
}

export async function countEmployeesDirectory(db, companyId, filters) {
	const { where, params } = buildEmployeeDirectoryWhere(companyId, filters);
	const q = `
		SELECT COUNT(*)::int AS c
		FROM users u
		INNER JOIN employee_profiles e ON e.user_id = u.id AND e.company_id = u.company_id
		${where}
	`;
	const { rows } = await db.query(q, params);
	return rows[0]?.c ?? 0;
}

export async function listEmployeesDirectory(db, companyId, filters, limit, offset) {
	const { where, params } = buildEmployeeDirectoryWhere(companyId, filters);
	params.push(limit, offset);
	const iLim = params.length - 1;
	const iOff = params.length;
	const q = `
		SELECT u.id, u.login_id, u.name, u.email, u.role, u.is_active, u.avatar_url,
			e.designation, e.location, e.date_of_joining, e.department_id,
			d.name AS department_name,
			m.id AS manager_id, m.name AS manager_name,
			a.status AS today_attendance_status
		FROM users u
		INNER JOIN employee_profiles e ON e.user_id = u.id AND e.company_id = u.company_id
		LEFT JOIN departments d ON d.id = e.department_id
		LEFT JOIN users m ON m.id = e.manager_id
		LEFT JOIN attendance a ON a.user_id = u.id AND a.company_id = u.company_id AND a.date = CURRENT_DATE
		${where}
		ORDER BY u.name ASC
		LIMIT $${iLim} OFFSET $${iOff}
	`;
	const { rows } = await db.query(q, params);
	return rows;
}

export async function createUser(db, payload) {
	const { companyId, loginId, name, email, phone, passwordHash, role, isActive, mustChangePwd } = payload;
	const { rows } = await db.query(
		`INSERT INTO users(company_id, login_id, name, email, phone, password_hash, role, is_active, must_change_pwd)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
		[companyId, loginId, name, email, phone || null, passwordHash, role, isActive, mustChangePwd],
	);
	return rows[0];
}

export async function updateUserLoginId(db, userId, loginId) {
	const { rows } = await db.query(
		`UPDATE users SET login_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
		[loginId, userId],
	);
	return rows[0] || null;
}

export async function findUserAuthByLogin(db, loginId) {
	const { rows } = await db.query(
		`SELECT * FROM users WHERE login_id = $1 OR LOWER(email) = LOWER($1)`,
		[loginId],
	);
	return rows[0] || null;
}

export async function findUserPasswordById(db, userId) {
	const { rows } = await db.query(
		`SELECT id, password_hash, must_change_pwd FROM users WHERE id = $1`,
		[userId],
	);
	return rows[0] || null;
}

export async function updateUserPassword(db, userId, passwordHash) {
	const { rows } = await db.query(
		`UPDATE users SET password_hash = $1, must_change_pwd = FALSE, updated_at = NOW() WHERE id = $2 RETURNING id, must_change_pwd`,
		[passwordHash, userId],
	);
	return rows[0] || null;
}

export async function activateUser(db, userId) {
	const { rows } = await db.query(
		`UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, is_active`,
		[userId],
	);
	return rows[0] || null;
}

export async function updateUserSelfFields(db, userId, data) {
	const patch = {};
	for (const k of USER_SELF_FIELDS) {
		if (data[k] !== undefined) patch[k] = data[k];
	}
	const fields = Object.keys(patch);
	if (!fields.length) return findUserById(db, userId);

	const sets = fields.map((f, i) => `${f} = $${i + 1}`);
	const params = fields.map((f) => patch[f]);
	params.push(userId);
	const { rows } = await db.query(
		`UPDATE users SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING id, name, phone, avatar_url`,
		params,
	);
	return rows[0] || null;
}

/** HR/admin user table patches (whitelist). `role` only if caller validated as admin beforehand. */
export async function updateUserStaffFields(db, userId, data) {
	const allowed = ["name", "phone", "avatar_url", "role", "email"];
	const patch = {};
	for (const k of allowed) {
		if (data[k] !== undefined) patch[k] = data[k];
	}
	if (!Object.keys(patch).length) return findUserById(db, userId);

	const entries = Object.entries(patch);
	const sets = entries.map(([col], idx) => `${col} = $${idx + 1}`);
	const params = entries.map(([, v]) => v);
	params.push(userId);
	const { rows } = await db.query(
		`UPDATE users SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${params.length}
		 RETURNING id, name, email, phone, role, is_active, login_id, avatar_url`,
		params,
	);
	return rows[0] || null;
}

export async function deactivateUser(db, userId) {
	const { rows } = await db.query(
		`UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id, is_active`,
		[userId],
	);
	return rows[0] || null;
}
