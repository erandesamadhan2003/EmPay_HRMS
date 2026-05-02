import { successResponse, errorResponse } from '../utils/constant.js';
import { createDepartment, listDepartments, findDepartmentById, updateDepartment, deleteDepartment } from '../models/Department.js';

export async function getDepartments(req, res) {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const companyId = req.user?.company_id;
        if (!companyId) return res.status(400).json(errorResponse('Company context required'));
        const rows = await listDepartments(req.db, { companyId, page: parseInt(page, 10), limit: parseInt(limit, 10), search });
        return res.json(successResponse(rows));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to list departments'));
    }
}

export async function createDept(req, res) {
    try {
        const companyId = req.user?.company_id;
        const { name } = req.body;
        if (!name) return res.status(400).json(errorResponse('Department name required'));
        const row = await createDepartment(req.db, { companyId, name });
        return res.status(201).json(successResponse(row, 'Department created'));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to create department'));
    }
}

export async function updateDept(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json(errorResponse('Name required'));
        const updated = await updateDepartment(req.db, id, name);
        if (!updated) return res.status(404).json(errorResponse('Department not found'));
        return res.json(successResponse(updated, 'Department updated'));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to update department'));
    }
}

export async function deleteDept(req, res) {
    try {
        const { id } = req.params;
        const d = await deleteDepartment(req.db, id);
        if (!d) return res.status(404).json(errorResponse('Department not found'));
        return res.json(successResponse(null, 'Department deleted'));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Unable to delete department'));
    }
}
