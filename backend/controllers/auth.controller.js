import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { successResponse, errorResponse } from '../utils/constant.js';
import { generateLoginId } from '../utils/loginId.js';

dotenv.config();

export async function createCompany(req, res) {
    try {
        const { name, logo_url } = req.body;
        if (!name) return res.status(400).json(errorResponse('Company name required'));
        const insert = 'INSERT INTO companies(name, logo_url) VALUES($1,$2) RETURNING *';
        const { rows } = await pool.query(insert, [name, logo_url || null]);
        return res.json(successResponse(rows[0], 'Company created'));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to create company'));
    }
}

export async function registerUser(req, res) {
    const client = await pool.connect();
    try {
        const { company_id, name, email, phone, first_name, last_name, date_of_joining } = req.body;
        if (!company_id || !name || !email) return res.status(400).json(errorResponse('company_id, name, email required'));

        await client.query('BEGIN');

        // default password for first-time
        const plain = 'samadhan';
        const password_hash = await bcrypt.hash(plain, 10);

        // generate login id
        // get company name
        const compRes = await client.query('SELECT name FROM companies WHERE id = $1', [company_id]);
        if (!compRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json(errorResponse('Company not found'));
        }
        const companyName = compRes.rows[0].name;

        // create a placeholder user first (without login_id) to get id for company_request
        const userInsert = 'INSERT INTO users(company_id, login_id, name, email, phone, password_hash, role, is_active, must_change_pwd) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *';
        // temporary login id - will be updated after profile created
        const tempLogin = `TMP-${Date.now()}`;
        const userRes = await client.query(userInsert, [company_id, tempLogin, name, email, phone || null, password_hash, 'admin', false, true]);
        const user = userRes.rows[0];

        // create employee profile with date_of_joining mandatory; if not provided, set today
        const doj = date_of_joining || new Date().toISOString().slice(0, 10);
        const profileInsert = `INSERT INTO employee_profiles(user_id, company_id, date_of_joining) VALUES($1,$2,$3) RETURNING *`;
        await client.query(profileInsert, [user.id, company_id, doj]);

        // generate real login id now
        const loginId = await generateLoginId(company_id, companyName, first_name || name.split(' ')[0], last_name || (name.split(' ')[1] || ''));
        await client.query('UPDATE users SET login_id = $1 WHERE id = $2', [loginId, user.id]);

        // create company request unless exists
        const reqCheck = await client.query('SELECT * FROM company_requests WHERE company_id = $1', [company_id]);
        if (!reqCheck.rows.length) {
            await client.query('INSERT INTO company_requests(company_id, admin_user_id) VALUES($1,$2)', [company_id, user.id]);
        }

        await client.query('COMMIT');

        return res.json(successResponse({ id: user.id, login_id: loginId }, 'User registered - pending approval'));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json(errorResponse('Registration failed'));
    } finally {
        client.release();
    }
}

export async function login(req, res) {
    try {
        const { login_id, password } = req.body;
        if (!login_id || !password) return res.status(400).json(errorResponse('login_id and password required'));
        const q = 'SELECT * FROM users WHERE login_id = $1';
        const { rows } = await pool.query(q, [login_id]);
        if (!rows.length) return res.status(404).json(errorResponse('User not found'));
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json(errorResponse('Invalid credentials'));
        if (!user.is_active) return res.status(403).json(errorResponse('Account not active yet'));

        const payload = { id: user.id, role: user.role, company_id: user.company_id };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'PayrollJWTSecretKey', { expiresIn: '7d' });
        return res.json(successResponse({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'Login successful'));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Login error'));
    }
}

export async function reviewCompanyRequest(req, res) {
    try {
        const { id } = req.params; // company_requests id
        const { action, reviewer_notes } = req.body; // action: 'approve' or 'reject'
        if (!['approve', 'reject'].includes(action)) return res.status(400).json(errorResponse('Invalid action'));

        // get request
        const qr = await pool.query('SELECT * FROM company_requests WHERE id = $1', [id]);
        if (!qr.rows.length) return res.status(404).json(errorResponse('Request not found'));
        const reqRow = qr.rows[0];

        const now = new Date();
        const status = action === 'approve' ? 'approved' : 'rejected';
        await pool.query('UPDATE company_requests SET status=$1, reviewed_by=$2, reviewed_at=$3, reviewer_notes=$4, updated_at=NOW() WHERE id=$5', [status, req.user.id, now, reviewer_notes || null, id]);

        if (action === 'approve') {
            // activate admin user for the company
            await pool.query('UPDATE users SET is_active = TRUE, updated_at=NOW() WHERE id = $1', [reqRow.admin_user_id]);
        }

        return res.json(successResponse(null, `Company request ${status}`));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Review failed'));
    }
}

