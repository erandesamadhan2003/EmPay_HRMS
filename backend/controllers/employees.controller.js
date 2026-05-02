import bcrypt from 'bcrypt';
import { successResponse, errorResponse } from '../utils/constant.js';
import { createUser, listEmployees, findUserById, updateUser, deactivateUser, updateUserLoginId } from '../models/User.js';
import { createEmployeeProfile } from '../models/EmployeeProfile.js';
import { generateLoginId } from '../utils/loginId.js';
import { findCompanyById } from '../models/Company.js';

export async function getEmployees(req, res) {
    try {
        const companyId = req.user?.company_id;
        if (!companyId) return res.status(400).json(errorResponse('Company context required'));
        const params = { ...req.query, companyId };
        const rows = await listEmployees(req.db, params);
        return res.json(successResponse(rows));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to list employees'));
    }
}

export async function createEmployee(req, res) {
    const client = await req.db.connect();
    try {
        const companyId = req.user?.company_id;
        const { name, email, phone, firstName, lastName, dateOfJoining, role } = req.body;
        if (!companyId || !name || !email) return res.status(400).json(errorResponse('company context, name and email required'));

        await client.query('BEGIN');

        const company = await findCompanyById(client, companyId);
        if (!company) {
            await client.query('ROLLBACK');
            return res.status(404).json(errorResponse('Company not found'));
        }

        const plain = Math.random().toString(36).slice(-8);
        const password_hash = await bcrypt.hash(plain, 10);

        const tempLogin = `TMP-${Date.now()}`;
        const user = await createUser(client, {
            companyId,
            loginId: tempLogin,
            name,
            email,
            phone,
            passwordHash: password_hash,
            role: role || 'employee',
            isActive: true,
            mustChangePwd: true,
        });

        const doj = dateOfJoining || new Date().toISOString().slice(0, 10);
        await createEmployeeProfile(client, { userId: user.id, companyId, dateOfJoining: doj });

        const loginId = await generateLoginId(companyId, company.name, firstName || name.split(' ')[0], lastName || (name.split(' ')[1] || ''), doj);
        await updateUserLoginId(client, user.id, loginId);

        await client.query('COMMIT');

        return res.status(201).json(successResponse({ id: user.id, loginId, tempPassword: plain }, 'Employee created'));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json(errorResponse('Unable to create employee'));
    } finally {
        client.release();
    }
}

export async function getMe(req, res) {
    try {
        const id = req.user?.id;
        const user = await findUserById(id);
        if (!user) return res.status(404).json(errorResponse('User not found'));
        return res.json(successResponse(user));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to fetch profile'));
    }
}

export async function updateMe(req, res) {
    try {
        const id = req.user?.id;
        const allowed = ['name', 'phone'];
        const payload = {};
        for (const k of allowed) if (req.body[k] !== undefined) payload[k] = req.body[k];
        const updated = await updateUser(req.db, id, payload);
        if (!updated) return res.status(404).json(errorResponse('User not found'));
        return res.json(successResponse(updated, 'Profile updated'));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to update profile'));
    }
}

export async function getById(req, res) {
    try {
        const { id } = req.params;
        const user = await findUserById(id);
        if (!user) return res.status(404).json(errorResponse('User not found'));
        return res.json(successResponse(user));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to fetch user'));
    }
}

export async function updateEmployee(req, res) {
    try {
        const { id } = req.params;
        const payload = req.body;
        const updated = await updateUser(req.db, id, payload);
        if (!updated) return res.status(404).json(errorResponse('User not found'));
        return res.json(successResponse(updated, 'User updated'));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to update user'));
    }
}

export async function deleteEmployee(req, res) {
    try {
        const { id } = req.params;
        const d = await deactivateUser(req.db, id);
        if (!d) return res.status(404).json(errorResponse('User not found'));
        return res.json(successResponse(null, 'User deactivated'));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to deactivate user'));
    }
}
