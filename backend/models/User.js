import pool from '../config/db.js';

export async function findUserById(id) {
    const { rows } = await pool.query('SELECT id, name, email, role, company_id, is_active FROM users WHERE id = $1', [id]);
    return rows[0] || null;
}

export async function findUserByLogin(login_id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE login_id = $1', [login_id]);
    return rows[0] || null;
}
