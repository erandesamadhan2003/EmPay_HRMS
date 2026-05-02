import pool from '../config/db.js';

export async function findUserById(id) {
    const { rows } = await pool.query('SELECT id, name, email, role, company_id, is_active FROM users WHERE id = $1', [id]);
    return rows[0] || null;
}

export async function findUserByLogin(login_id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE login_id = $1', [login_id]);
    return rows[0] || null;
}

export async function createUser(db, payload) {
    const { companyId, loginId, name, email, phone, passwordHash, role, isActive, mustChangePwd } = payload;
    const { rows } = await db.query(
        'INSERT INTO users(company_id, login_id, name, email, phone, password_hash, role, is_active, must_change_pwd) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
        [companyId, loginId, name, email, phone || null, passwordHash, role, isActive, mustChangePwd]
    );
    return rows[0];
}

export async function updateUserLoginId(db, userId, loginId) {
    const { rows } = await db.query('UPDATE users SET login_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [loginId, userId]);
    return rows[0] || null;
}

export async function findUserAuthByLogin(db, loginId) {
    const { rows } = await db.query('SELECT * FROM users WHERE login_id = $1', [loginId]);
    return rows[0] || null;
}

export async function findUserPasswordById(db, userId) {
    const { rows } = await db.query('SELECT id, password_hash, must_change_pwd FROM users WHERE id = $1', [userId]);
    return rows[0] || null;
}

export async function updateUserPassword(db, userId, passwordHash) {
    const { rows } = await db.query(
        'UPDATE users SET password_hash = $1, must_change_pwd = FALSE, updated_at = NOW() WHERE id = $2 RETURNING id, must_change_pwd',
        [passwordHash, userId]
    );
    return rows[0] || null;
}

export async function activateUser(db, userId) {
    const { rows } = await db.query('UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, is_active', [userId]);
    return rows[0] || null;
}

export async function listEmployees(db, { companyId, page = 1, limit = 10, search, department, role, status } = {}) {
    const offset = (page - 1) * limit;
    const params = [companyId];
    let where = 'WHERE u.company_id = $1';
    if (search) {
        params.push(`%${search}%`);
        where += ` AND (u.name ILIKE $${params.length} OR u.login_id ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }
    if (department) {
        params.push(department);
        where += ` AND e.department_id = $${params.length}`;
    }
    if (role) {
        params.push(role);
        where += ` AND u.role = $${params.length}`;
    }
    if (status) {
        const isActive = status === 'active';
        params.push(isActive);
        where += ` AND u.is_active = $${params.length}`;
    }

    params.push(limit, offset);
    const q = `SELECT u.id, u.login_id, u.name, u.email, u.role, u.is_active, e.department_id FROM users u LEFT JOIN employee_profiles e ON u.id = e.user_id ${where} ORDER BY u.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await db.query(q, params);
    return rows;
}

export async function updateUser(db, userId, data) {
    const fields = [];
    const params = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
        fields.push(`${k} = $${idx}`);
        params.push(v);
        idx++;
    }
    if (!fields.length) return null;
    params.push(userId);
    const q = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING id, name, email, role, is_active, login_id`;
    const { rows } = await db.query(q, params);
    return rows[0] || null;
}

export async function deactivateUser(db, userId) {
    const { rows } = await db.query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id, is_active', [userId]);
    return rows[0] || null;
}
