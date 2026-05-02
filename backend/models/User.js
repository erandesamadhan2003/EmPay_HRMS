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
